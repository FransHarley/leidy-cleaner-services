package br.com.leidycleaner.pagamentos.gateway;

import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.StreamSupport;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;

@Service
public class AsaasHttpGatewayClient implements AsaasGatewayClient {

    private static final String CUSTOMER_ENDPOINT = "/customers";
    private static final String PAYMENT_ENDPOINT = "/payments";
    private static final String PIX_QR_CODE_ENDPOINT = "/payments/{id}/pixQrCode";
    private static final List<String> MVP_PAYMENT_BILLING_TYPES = List.of("CREDIT_CARD", "PIX");
    private static final int ASAAS_ERROR_TEXT_MAX_LENGTH = 240;
    private static final Logger LOGGER = LoggerFactory.getLogger(AsaasHttpGatewayClient.class);

    private final AsaasProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public AsaasHttpGatewayClient(AsaasProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.objectMapper = new ObjectMapper();
        this.clock = Clock.systemDefaultZone();
    }

    @Override
    public AsaasCustomerGatewayResponse criarCliente(AsaasCustomerRequest request) {
        validarConfiguracaoApi();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", request.name());
        body.put("email", request.email());
        adicionarSePresente(body, "phone", request.phone());
        adicionarSePresente(body, "mobilePhone", request.mobilePhone());
        adicionarSePresente(body, "cpfCnpj", request.cpfCnpj());
        LOGGER.info(
                "asaas_customer_create_request endpoint={} hasEmail={} hasPhone={} hasMobilePhone={} hasCpfCnpj={}",
                CUSTOMER_ENDPOINT,
                request.email() != null && !request.email().isBlank(),
                request.phone() != null && !request.phone().isBlank(),
                request.mobilePhone() != null && !request.mobilePhone().isBlank(),
                request.cpfCnpj() != null && !request.cpfCnpj().isBlank()
        );

        JsonNode response = executarRequisicaoAsaas(
                () -> restClient.post()
                        .uri(CUSTOMER_ENDPOINT)
                        .header("access_token", properties.getApiKey())
                        .body(body)
                        .retrieve()
                        .body(JsonNode.class),
                "Nao foi possivel criar cliente no Asaas",
                CUSTOMER_ENDPOINT
        );
        return paraCustomerResponse(response);
    }

    @Override
    public AsaasPagamentoGatewayResponse criarCobranca(AsaasCobrancaRequest request) {
        validarConfiguracaoCobranca();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("customer", resolverCustomerId(request.customerId()));
        body.put("billingType", paraBillingType(request.metodoPagamento()));
        body.put("value", request.valor());
        body.put("dueDate", LocalDate.now(clock).plusDays(1).toString());
        body.put("description", request.descricao());
        body.put("externalReference", request.externalReference());
        Map<String, Object> callback = callbackPagamento(request.callbackParametroNome(), request.callbackReferenciaId());
        if (callback != null) {
            body.put("callback", callback);
        }
        LOGGER.info(
                "asaas_payment_create_request endpoint={} atendimentoId={} solicitacaoId={} billingType={} value={} dueDate={} externalReference={} callbackEnabled={}",
                PAYMENT_ENDPOINT,
                "atendimentoId".equals(request.callbackParametroNome()) ? request.callbackReferenciaId() : null,
                "solicitacaoId".equals(request.callbackParametroNome()) ? request.callbackReferenciaId() : null,
                body.get("billingType"),
                body.get("value"),
                body.get("dueDate"),
                body.get("externalReference"),
                callback != null
        );

        JsonNode response = executarRequisicaoAsaas(
                () -> restClient.post()
                        .uri(PAYMENT_ENDPOINT)
                        .header("access_token", properties.getApiKey())
                        .body(body)
                        .retrieve()
                        .body(JsonNode.class),
                "Nao foi possivel criar pagamento no Asaas",
                PAYMENT_ENDPOINT
        );
        AsaasPagamentoGatewayResponse gatewayResponse = paraGatewayResponse(response);
        validarUrlPagamentoRetornada(gatewayResponse.urlPagamento());
        return gatewayResponse;
    }

    @Override
    public AsaasCheckoutGatewayResponse criarCheckout(AsaasCheckoutRequest request) {
        MetodoPagamento metodoPagamento = validarMetodoPagamentoCheckout(request.metodoPagamento());
        AsaasPagamentoGatewayResponse response = criarCobranca(new AsaasCobrancaRequest(
                request.customerId(),
                request.atendimentoId(),
                metodoPagamento,
                request.valor(),
                request.descricao()
        ));
        return new AsaasCheckoutGatewayResponse(
                response.gatewayPaymentId(),
                response.urlPagamento(),
                metodoPagamento,
                response.payloadResumo()
        );
    }

    @Override
    public AsaasPagamentoGatewayResponse consultarPagamento(String gatewayPaymentId) {
        validarConfiguracaoApi();
        JsonNode response = executarRequisicaoAsaas(
                () -> restClient.get()
                        .uri("/payments/{id}", gatewayPaymentId)
                        .header("access_token", properties.getApiKey())
                        .retrieve()
                        .body(JsonNode.class),
                "Nao foi possivel consultar pagamento no Asaas",
                "/payments/{id}"
        );
        return paraGatewayResponse(response);
    }

    @Override
    public AsaasPixQrCodeGatewayResponse consultarPixQrCode(String gatewayPaymentId) {
        validarConfiguracaoApi();
        JsonNode response = executarRequisicaoAsaas(
                () -> restClient.get()
                        .uri(PIX_QR_CODE_ENDPOINT, gatewayPaymentId)
                        .header("access_token", properties.getApiKey())
                        .retrieve()
                        .body(JsonNode.class),
                "Nao foi possivel consultar QR Code Pix no Asaas",
                PIX_QR_CODE_ENDPOINT
        );
        return paraPixQrCodeResponse(response);
    }

    private void validarConfiguracaoCobranca() {
        validarConfiguracaoApi();
    }

    private void validarConfiguracaoApi() {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new BusinessException(
                    "ASAAS_CONFIG_INVALIDA",
                    "Configuracao do Asaas incompleta",
                    HttpStatus.CONFLICT
            );
        }
    }

    private MetodoPagamento validarMetodoPagamentoCheckout(MetodoPagamento metodoPagamento) {
        if (metodoPagamento == null) {
            throw new BusinessException(
                    "VALIDATION_ERROR",
                    "Metodo de pagamento e obrigatorio para criar o checkout",
                    HttpStatus.BAD_REQUEST
            );
        }
        if (!MVP_PAYMENT_BILLING_TYPES.contains(paraBillingType(metodoPagamento))) {
            throw new BusinessException(
                    "METODO_PAGAMENTO_NAO_SUPORTADO",
                    "Metodo de pagamento nao suportado para checkout",
                    HttpStatus.BAD_REQUEST
            );
        }
        return metodoPagamento;
    }

    private Map<String, Object> callbackPagamento(Long atendimentoId) {
        return callbackPagamento("atendimentoId", atendimentoId);
    }

    private Map<String, Object> callbackPagamento(String parametroNome, Long referenciaId) {
        if (!deveEnviarCallbackPagamento()) {
            return null;
        }
        String successUrl = limparTexto(properties.getCheckoutSuccessUrl());
        Map<String, Object> callback = new LinkedHashMap<>();
        callback.put("successUrl", urlRetorno(successUrl, parametroNome, referenciaId));
        callback.put("autoRedirect", properties.isPaymentAutoRedirect());
        return callback;
    }

    private boolean deveEnviarCallbackPagamento() {
        return properties.isPaymentCallbackEnabled()
                && limparTexto(properties.getCheckoutSuccessUrl()) != null;
    }

    private void validarUrlPagamentoRetornada(String urlPagamento) {
        if (urlPagamento == null || urlPagamento.isBlank()) {
            throw new BusinessException(
                    "ASAAS_PAYMENT_URL_NOT_RETURNED",
                    "URL de pagamento nao retornada pelo Asaas",
                    HttpStatus.BAD_GATEWAY
            );
        }
    }

    private String paraBillingType(MetodoPagamento metodoPagamento) {
        return switch (metodoPagamento) {
            case PIX -> "PIX";
            case BOLETO -> "BOLETO";
            case CARTAO_CREDITO -> "CREDIT_CARD";
            case CREDITO_SOLICITACAO -> throw new BusinessException(
                    "METODO_PAGAMENTO_NAO_SUPORTADO",
                    "Credito de solicitacao nao deve ser enviado ao Asaas",
                    HttpStatus.BAD_REQUEST
            );
        };
    }

    private AsaasCustomerGatewayResponse paraCustomerResponse(JsonNode response) {
        if (response == null || response.path("id").asText(null) == null) {
            throw new BusinessException(
                    "ASAAS_RESPONSE_INVALIDA",
                    "Resposta invalida do Asaas",
                    HttpStatus.BAD_GATEWAY
            );
        }
        return new AsaasCustomerGatewayResponse(response.path("id").asText());
    }

    private AsaasPagamentoGatewayResponse paraGatewayResponse(JsonNode response) {
        if (response == null || response.path("id").asText(null) == null) {
            throw new BusinessException(
                    "ASAAS_RESPONSE_INVALIDA",
                    "Resposta invalida do Asaas",
                    HttpStatus.BAD_GATEWAY
            );
        }
        return new AsaasPagamentoGatewayResponse(
                response.path("id").asText(),
                response.path("status").asText(null),
                decimalOuNull(response.path("paymentFee")),
                decimalOuNull(response.path("netValue")),
                textoOuNull(response.path("invoiceUrl")),
                textoOuNull(response.path("pixTransaction").path("payload")),
                response.toString()
        );
    }

    private AsaasPixQrCodeGatewayResponse paraPixQrCodeResponse(JsonNode response) {
        if (response == null) {
            throw new BusinessException(
                    "ASAAS_RESPONSE_INVALIDA",
                    "Resposta invalida do Asaas para QR Code Pix",
                    HttpStatus.BAD_GATEWAY
            );
        }
        String encodedImage = textoOuNull(response.path("encodedImage"));
        String payload = textoOuNull(response.path("payload"));
        if (encodedImage == null && payload == null) {
            throw new BusinessException(
                    "ASAAS_RESPONSE_INVALIDA",
                    "QR Code Pix nao retornado pelo Asaas",
                    HttpStatus.BAD_GATEWAY
            );
        }
        return new AsaasPixQrCodeGatewayResponse(
                encodedImage,
                payload,
                textoOuNull(response.path("expirationDate"))
        );
    }

    private JsonNode executarRequisicaoAsaas(Supplier<JsonNode> requisicao, String mensagemErro) {
        return executarRequisicaoAsaas(requisicao, mensagemErro, null);
    }

    private JsonNode executarRequisicaoAsaas(
            Supplier<JsonNode> requisicao,
            String mensagemErro,
            String endpointPath
    ) {
        try {
            return requisicao.get();
        } catch (RestClientResponseException exception) {
            List<AsaasErrorDiagnostic> erros = extrairErrosAsaas(exception);
            LOGGER.warn(
                    "asaas_request_failed status={} endpoint={} errors={}",
                    exception.getStatusCode().value(),
                    endpointPath,
                    erros
            );
            throw new BusinessException(
                    "ASAAS_REQUEST_FAILED",
                    mensagemComDetalhesSeguros(mensagemErro, erros),
                    HttpStatus.BAD_GATEWAY
            );
        } catch (RestClientException exception) {
            LOGGER.warn(
                    "asaas_request_unavailable endpoint={} exceptionType={}",
                    endpointPath,
                    exception.getClass().getSimpleName()
            );
            throw new BusinessException(
                    "ASAAS_REQUEST_FAILED",
                    "Asaas indisponivel no momento",
                    HttpStatus.BAD_GATEWAY
            );
        }
    }

    private java.math.BigDecimal decimalOuNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        return node.decimalValue();
    }

    private String textoOuNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String valor = node.asText();
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor;
    }

    private String limparTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private void adicionarSePresente(Map<String, Object> body, String chave, String valor) {
        String valorLimpo = limparTexto(valor);
        if (valorLimpo != null) {
            body.put(chave, valorLimpo);
        }
    }

    private String resolverCustomerId(String customerId) {
        String customerIdExplicito = limparTexto(customerId);
        if (customerIdExplicito != null) {
            return customerIdExplicito;
        }
        if (properties.isDefaultCustomerFallbackEnabled()) {
            String customerPadrao = limparTexto(properties.getDefaultCustomerId());
            if (customerPadrao != null) {
                return customerPadrao;
            }
            throw new BusinessException(
                    "ASAAS_CONFIG_INVALIDA",
                    "ASAAS_DEFAULT_CUSTOMER_ID nao configurado",
                    HttpStatus.CONFLICT
            );
        }
        throw new BusinessException(
                "ASAAS_CUSTOMER_REQUIRED",
                "Cliente do Asaas obrigatorio para criar pagamento",
                HttpStatus.CONFLICT
        );
    }

    private String urlRetorno(String urlBase, Long atendimentoId) {
        return urlRetorno(urlBase, "atendimentoId", atendimentoId);
    }

    private String urlRetorno(String urlBase, String parametroNome, Long referenciaId) {
        String separador = urlBase.contains("?") ? "&" : "?";
        return urlBase + separador + parametroNome + "=" + referenciaId;
    }

    private List<AsaasErrorDiagnostic> extrairErrosAsaas(RestClientResponseException exception) {
        String responseBody = exception.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return List.of(new AsaasErrorDiagnostic(null, "Resposta do Asaas sem corpo"));
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errors = root.path("errors");
            if (errors.isArray() && !errors.isEmpty()) {
                return StreamSupport.stream(errors.spliterator(), false)
                        .map(error -> new AsaasErrorDiagnostic(
                                textoOuNull(error.path("code")),
                                limitarErroAsaas(textoOuNull(error.path("description")))
                        ))
                        .toList();
            }

            String message = textoOuNull(root.path("message"));
            if (message != null) {
                return List.of(new AsaasErrorDiagnostic(null, limitarErroAsaas(message)));
            }
        } catch (Exception parseException) {
            return List.of(new AsaasErrorDiagnostic(null, "Resposta de erro do Asaas nao estava em JSON valido"));
        }

        return List.of(new AsaasErrorDiagnostic(null, "Resposta de erro do Asaas sem detalhes reconhecidos"));
    }

    private String mensagemComDetalhesSeguros(String mensagemErro, List<AsaasErrorDiagnostic> erros) {
        String detalhes = erros.stream()
                .map(AsaasErrorDiagnostic::description)
                .filter(descricao -> descricao != null && !descricao.isBlank())
                .findFirst()
                .orElse(null);
        if (detalhes == null) {
            return mensagemErro;
        }
        if (isErroPixNaoHabilitado(detalhes)) {
            return mensagemErro + ": " + removerPontuacaoFinal(detalhes)
                    + ". A cobranca foi criada, mas a conta/sandbox do Asaas nao esta habilitada para Pix nessa cobranca.";
        }
        return mensagemErro + ": " + detalhes;
    }

    private boolean isErroPixNaoHabilitado(String detalhes) {
        String normalizado = detalhes == null ? "" : detalhes.toLowerCase();
        return normalizado.contains("nao permite pagamentos via pix")
                || normalizado.contains("não permite pagamentos via pix");
    }

    private String removerPontuacaoFinal(String texto) {
        if (texto == null) {
            return "";
        }
        return texto.replaceFirst("[.!?]+$", "");
    }

    private String limitarErroAsaas(String texto) {
        if (texto == null || texto.isBlank()) {
            return "sem descricao";
        }
        String limpo = texto.replaceAll("\\s+", " ").trim();
        if (limpo.length() <= ASAAS_ERROR_TEXT_MAX_LENGTH) {
            return limpo;
        }
        return limpo.substring(0, ASAAS_ERROR_TEXT_MAX_LENGTH);
    }

    private record AsaasErrorDiagnostic(
            String code,
            String description
    ) {
    }
}
