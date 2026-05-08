package br.com.leidycleaner.pagamentos.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;

@ExtendWith(OutputCaptureExtension.class)
class AsaasHttpGatewayClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private HttpServer server;
    private CapturedRequest capturedRequest;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void criarCheckoutCartaoCriaCobrancaEmPaymentsSemCallbackQuandoSuccessUrlNaoConfigurada() throws Exception {
        iniciarServidor(200, """
                {
                  "id": "pay_test_123",
                  "status": "PENDING",
                  "invoiceUrl": "https://sandbox.asaas.com/i/pay_test_123"
                }
                """);
        AsaasProperties properties = properties();
        properties.setPaymentBillingType("CREDIT_CARD");
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties);
        String descricaoCompleta = "Leidy Cleaner Services - atendimento #123 com descricao longa";

        AsaasCheckoutGatewayResponse response = client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                descricaoCompleta
        ));

        assertThat(response.checkoutId()).isEqualTo("pay_test_123");
        assertThat(response.checkoutUrl()).isEqualTo("https://sandbox.asaas.com/i/pay_test_123");
        assertThat(response.metodoPagamento()).isEqualTo(MetodoPagamento.CARTAO_CREDITO);
        assertThat(capturedRequest.method()).isEqualTo("POST");
        assertThat(capturedRequest.path()).isEqualTo("/payments");
        assertThat(capturedRequest.accessToken()).isEqualTo("test-api-key");

        JsonNode body = capturedRequest.body();
        assertThat(body.path("customer").asText()).isEqualTo("cus_test_123");
        assertThat(body.path("billingType").asText()).isEqualTo("CREDIT_CARD");
        assertThat(body.path("value").decimalValue()).isEqualByComparingTo("180.00");
        assertThat(body.path("dueDate").asText()).isNotBlank();
        assertThat(body.path("description").asText()).isEqualTo(descricaoCompleta);
        assertThat(body.path("externalReference").asText()).isEqualTo("atendimento-123");
        assertThat(body.has("billingTypes")).isFalse();
        assertThat(body.has("chargeTypes")).isFalse();
        assertThat(body.has("items")).isFalse();
        assertThat(body.has("successUrl")).isFalse();
        assertThat(body.has("cancelUrl")).isFalse();
        assertThat(body.has("expiredUrl")).isFalse();
        assertThat(body.has("callback")).isFalse();
    }

    @Test
    void criarCheckoutPixCriaCobrancaComBillingTypePix() throws Exception {
        iniciarServidor(200, """
                {
                  "id": "pay_test_pix",
                  "status": "PENDING",
                  "invoiceUrl": "https://sandbox.asaas.com/i/pay_test_pix"
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        AsaasCheckoutGatewayResponse response = client.criarCheckout(new AsaasCheckoutRequest(
                321L,
                MetodoPagamento.PIX,
                new BigDecimal("210.00"),
                "Pagamento via Pix"
        ));

        assertThat(response.checkoutId()).isEqualTo("pay_test_pix");
        assertThat(response.checkoutUrl()).isEqualTo("https://sandbox.asaas.com/i/pay_test_pix");
        assertThat(response.metodoPagamento()).isEqualTo(MetodoPagamento.PIX);
        assertThat(capturedRequest.path()).isEqualTo("/payments");
        assertThat(capturedRequest.body().path("billingType").asText()).isEqualTo("PIX");
    }

    @Test
    void criarCheckoutPixRegistraPayloadSeguroSemToken(CapturedOutput output) throws Exception {
        iniciarServidor(200, """
                {
                  "id": "pay_test_pix_logged",
                  "status": "PENDING",
                  "invoiceUrl": "https://sandbox.asaas.com/i/pay_test_pix_logged"
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        client.criarCheckout(new AsaasCheckoutRequest(
                654L,
                MetodoPagamento.PIX,
                new BigDecimal("199.90"),
                "Pagamento Pix com log"
        ));

        assertThat(output)
                .contains("asaas_payment_create_request")
                .contains("endpoint=/payments")
                .contains("atendimentoId=654")
                .contains("billingType=PIX")
                .contains("externalReference=atendimento-654")
                .doesNotContain("test-api-key")
                .doesNotContain("access_token");
    }

    @Test
    void consultarPixQrCodeBuscaDadosNoEndpointCorreto() throws Exception {
        iniciarServidor(200, """
                {
                  "encodedImage": "base64-image",
                  "payload": "pix-copia-e-cola",
                  "expirationDate": "2026-05-09T10:00:00-03:00"
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        AsaasPixQrCodeGatewayResponse response = client.consultarPixQrCode("pay_test_pix_qrcode");

        assertThat(response.encodedImage()).isEqualTo("base64-image");
        assertThat(response.payload()).isEqualTo("pix-copia-e-cola");
        assertThat(response.expirationDate()).isEqualTo("2026-05-09T10:00:00-03:00");
        assertThat(capturedRequest.method()).isEqualTo("GET");
        assertThat(capturedRequest.path()).isEqualTo("/payments/pay_test_pix_qrcode/pixQrCode");
        assertThat(capturedRequest.accessToken()).isEqualTo("test-api-key");
    }

    @Test
    void consultarPixQrCodeComPixNaoHabilitadoRetornaMensagemMaisClara() throws Exception {
        iniciarServidor(400, """
                {
                  "errors": [
                    {
                      "description": "Esta cobrança não permite pagamentos via Pix."
                    }
                  ]
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        assertThatThrownBy(() -> client.consultarPixQrCode("pay_test_pix_qrcode"))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("ASAAS_REQUEST_FAILED");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(exception.getMessage()).isEqualTo(
                            "Nao foi possivel consultar QR Code Pix no Asaas: Esta cobrança não permite pagamentos via Pix. "
                                    + "A cobranca foi criada, mas a conta/sandbox do Asaas nao esta habilitada para Pix nessa cobranca."
                    );
                });
    }

    @Test
    void criarCheckoutNaoEnviaCallbackQuandoCallbackDesabilitadoMesmoComSuccessUrlConfigurada() throws Exception {
        iniciarServidor(200, """
                {
                  "id": "pay_test_callback_disabled",
                  "status": "PENDING",
                  "invoiceUrl": "https://sandbox.asaas.com/i/pay_test_callback_disabled"
                }
                """);
        AsaasProperties properties = properties();
        properties.setCheckoutSuccessUrl("http://localhost/sucesso");
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties);

        client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        ));

        JsonNode body = capturedRequest.body();
        assertThat(capturedRequest.path()).isEqualTo("/payments");
        assertThat(body.has("callback")).isFalse();
    }

    @Test
    void criarCheckoutCriaCobrancaPadraoEmPaymentsComCallbackQuandoHabilitadoESuccessUrlConfigurada() throws Exception {
        iniciarServidor(200, """
                {
                  "id": "pay_test_callback",
                  "status": "PENDING",
                  "invoiceUrl": "https://sandbox.asaas.com/i/pay_test_callback"
                }
                """);
        AsaasProperties properties = properties();
        properties.setPaymentCallbackEnabled(true);
        properties.setCheckoutSuccessUrl("http://localhost/sucesso?origem=asaas");
        properties.setPaymentAutoRedirect(false);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties);

        AsaasCheckoutGatewayResponse response = client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        ));

        assertThat(response.checkoutId()).isEqualTo("pay_test_callback");
        assertThat(response.checkoutUrl()).isEqualTo("https://sandbox.asaas.com/i/pay_test_callback");

        JsonNode body = capturedRequest.body();
        assertThat(capturedRequest.path()).isEqualTo("/payments");
        assertThat(body.has("callback")).isTrue();
        assertThat(body.path("callback").path("successUrl").asText())
                .isEqualTo("http://localhost/sucesso?origem=asaas&atendimentoId=123");
        assertThat(body.path("callback").path("autoRedirect").asBoolean()).isFalse();
    }

    @Test
    void criarCheckoutConverteResposta400DoAsaasEmErroControladoERegistraDiagnosticoSeguro(CapturedOutput output) throws Exception {
        iniciarServidor(400, """
                {
                  "errors": [
                    {
                      "code": "invalid_object",
                      "description": "O campo billingType e invalido."
                    }
                  ]
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        assertThatThrownBy(() -> client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        )))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("ASAAS_REQUEST_FAILED");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(exception.getMessage()).isEqualTo("Nao foi possivel criar pagamento no Asaas: O campo billingType e invalido.");
                });
        assertThat(capturedRequest.path()).isEqualTo("/payments");
        assertThat(output)
                .contains("asaas_request_failed")
                .contains("status=400")
                .contains("endpoint=/payments")
                .contains("invalid_object")
                .contains("O campo billingType e invalido.")
                .doesNotContain("test-api-key")
                .doesNotContain("access_token");
    }

    @Test
    void criarCheckoutConverteResposta404DoAsaasEmErroControlado() throws Exception {
        iniciarServidor(404, """
                {
                  "errors": [
                    {
                      "description": "Recurso nao encontrado."
                    }
                  ]
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        assertThatThrownBy(() -> client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        )))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("ASAAS_REQUEST_FAILED");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(exception.getMessage()).isEqualTo("Nao foi possivel criar pagamento no Asaas: Recurso nao encontrado.");
                });
        assertThat(capturedRequest.path()).isEqualTo("/payments");
    }

    @Test
    void criarCheckoutSemInvoiceUrlFalhaSemSalvarUrlSintetica() throws Exception {
        iniciarServidor(200, """
                {
                  "id": "pay_sem_invoice",
                  "status": "PENDING"
                }
                """);
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        assertThatThrownBy(() -> client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        )))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("ASAAS_PAYMENT_URL_NOT_RETURNED");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(exception.getMessage()).isEqualTo("URL de pagamento nao retornada pelo Asaas");
                });
        assertThat(capturedRequest.path()).isEqualTo("/payments");
    }

    @Test
    void criarCheckoutSemApiKeyFalhaAntesDeChamarAsaas() throws Exception {
        iniciarServidor(200, "{}");
        AsaasProperties properties = properties();
        properties.setApiKey(" ");
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties);

        assertThatThrownBy(() -> client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        )))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("ASAAS_CONFIG_INVALIDA");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getMessage()).isEqualTo("Configuracao do Asaas incompleta");
                });
        assertThat(capturedRequest).isNull();
    }

    @Test
    void criarCheckoutSemDefaultCustomerIdFalhaAntesDeChamarAsaas() throws Exception {
        iniciarServidor(200, "{}");
        AsaasProperties properties = properties();
        properties.setDefaultCustomerId("");
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties);

        assertThatThrownBy(() -> client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                MetodoPagamento.CARTAO_CREDITO,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        )))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("ASAAS_CONFIG_INVALIDA");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getMessage()).isEqualTo("ASAAS_DEFAULT_CUSTOMER_ID nao configurado");
                });
        assertThat(capturedRequest).isNull();
    }

    @Test
    void criarCheckoutSemMetodoFalhaAntesDeChamarAsaas() throws Exception {
        iniciarServidor(200, "{}");
        AsaasHttpGatewayClient client = new AsaasHttpGatewayClient(properties());

        assertThatThrownBy(() -> client.criarCheckout(new AsaasCheckoutRequest(
                123L,
                null,
                new BigDecimal("180.00"),
                "Descricao do atendimento"
        )))
                .isInstanceOfSatisfying(BusinessException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo("VALIDATION_ERROR");
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(exception.getMessage()).isEqualTo("Metodo de pagamento e obrigatorio para criar o checkout");
                });
        assertThat(capturedRequest).isNull();
    }

    private void iniciarServidor(int status, String responseBody) throws IOException {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/", exchange -> responder(exchange, status, responseBody));
        server.start();
    }

    private void responder(HttpExchange exchange, int status, String responseBody) throws IOException {
        capturedRequest = new CapturedRequest(
                exchange.getRequestMethod(),
                exchange.getRequestURI().getPath(),
                exchange.getRequestHeaders().getFirst("access_token"),
                parseRequestBody(exchange)
        );

        byte[] responseBytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }

    private JsonNode parseRequestBody(HttpExchange exchange) throws IOException {
        byte[] requestBytes = exchange.getRequestBody().readAllBytes();
        if (requestBytes.length == 0) {
            return objectMapper.nullNode();
        }
        return objectMapper.readTree(requestBytes);
    }

    private AsaasProperties properties() {
        AsaasProperties properties = new AsaasProperties();
        properties.setBaseUrl("http://localhost:" + server.getAddress().getPort());
        properties.setApiKey("test-api-key");
        properties.setDefaultCustomerId("cus_test_123");
        properties.setPaymentBillingType("CREDIT_CARD");
        properties.setCheckoutBillingTypes(List.of("CREDIT_CARD"));
        properties.setCheckoutSuccessUrl("");
        properties.setCheckoutCancelUrl("http://localhost/cancelado");
        properties.setCheckoutExpiredUrl("http://localhost/expirado");
        return properties;
    }

    private record CapturedRequest(
            String method,
            String path,
            String accessToken,
            JsonNode body
    ) {
    }
}
