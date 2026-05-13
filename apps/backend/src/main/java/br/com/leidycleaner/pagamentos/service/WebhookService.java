package br.com.leidycleaner.pagamentos.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.service.ConviteProfissionalService;
import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.gateway.AsaasProperties;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.pagamentos.repository.WebhookEventRepository;

@Service
public class WebhookService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WebhookService.class);
    private static final Set<String> EVENTOS_SUPORTADOS = Set.of(
            "PAYMENT_CREATED",
            "PAYMENT_RECEIVED",
            "PAYMENT_CONFIRMED",
            "PAYMENT_RECEIVED_IN_CASH",
            "CHECKOUT_PAID",
            "PAYMENT_OVERDUE",
            "PAYMENT_DELETED",
            "PAYMENT_REFUNDED",
            "PAYMENT_PARTIALLY_REFUNDED",
            "PAYMENT_CHARGEBACK_REQUESTED",
            "PAYMENT_CHARGEBACK_DISPUTE",
            "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
    );

    private final PagamentoRepository pagamentoRepository;
    private final WebhookEventRepository webhookEventRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final ConviteProfissionalService conviteProfissionalService;
    private final ObjectMapper objectMapper;
    private final AsaasProperties asaasProperties;

    public WebhookService(
            PagamentoRepository pagamentoRepository,
            WebhookEventRepository webhookEventRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            ConviteProfissionalService conviteProfissionalService,
            ObjectMapper objectMapper,
            AsaasProperties asaasProperties
    ) {
        this.pagamentoRepository = pagamentoRepository;
        this.webhookEventRepository = webhookEventRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.conviteProfissionalService = conviteProfissionalService;
        this.objectMapper = objectMapper;
        this.asaasProperties = asaasProperties;
    }

    @Transactional
    public void processarWebhookAsaas(String accessToken, String payload) {
        validarAccessTokenAsaas(accessToken);
        try {
            JsonNode jsonNode = objectMapper.readTree(payload);
            String event = texto(jsonNode.path("event"));
            if (event == null) {
                LOGGER.warn("asaas_webhook_payload_invalid reason=missing_event");
                throw new BusinessException(
                        "WEBHOOK_PAYLOAD_INVALIDO",
                        "Payload de webhook invalido: campo event ausente",
                        HttpStatus.BAD_REQUEST
                );
            }
            if (!EVENTOS_SUPORTADOS.contains(event)) {
                LOGGER.info("asaas_webhook_event_ignored reason=unsupported_event event={}", event);
                return;
            }

            AsaasWebhookIdentifiers identifiers = extrairIdentificadores(jsonNode);
            if (!identifiers.temIdentificador()) {
                LOGGER.warn(
                        "asaas_webhook_payload_ignored reason=missing_payment_identifiers event={} paymentId={} checkoutSession={} checkoutId={} externalReference={}",
                        event,
                        identifiers.paymentId(),
                        identifiers.checkoutSessionId(),
                        identifiers.checkoutId(),
                        identifiers.externalReference()
                );
                return;
            }

            String paymentId = identifiers.paymentId();
            if (paymentId == null) {
                LOGGER.warn(
                        "asaas_webhook_payload_ignored reason=missing_payment_id event={} checkoutSession={} checkoutId={} externalReference={}",
                        event,
                        identifiers.checkoutSessionId(),
                        identifiers.checkoutId(),
                        identifiers.externalReference()
                );
                return;
            }

            Optional<PagamentoLocalizado> pagamentoLocalizadoOptional = localizarPagamento(identifiers);
            if (pagamentoLocalizadoOptional.isEmpty()) {
                LOGGER.warn(
                        "Webhook received before local payment exists: {} event={} checkoutSession={} checkoutId={} externalReference={}",
                        paymentId,
                        event,
                        identifiers.checkoutSessionId(),
                        identifiers.checkoutId(),
                        identifiers.externalReference()
                );
                LOGGER.info("Webhook event: paymentId={}, event={}, processed={}", paymentId, event, false);
                return;
            }

            boolean eventoNovo = webhookEventRepository.registrarSeNovo(paymentId, event, payload);
            LOGGER.info("Webhook event: paymentId={}, event={}, processed={}", paymentId, event, eventoNovo);
            if (!eventoNovo) {
                LOGGER.info(
                        "asaas_webhook_event_skipped reason=duplicate paymentId={} event={}",
                        paymentId,
                        event
                );
                return;
            }
            StatusPagamento statusDestino = mapearStatusPagamento(jsonNode, event);
            PagamentoLocalizado pagamentoLocalizado = pagamentoLocalizadoOptional.get();
            Pagamento pagamento = pagamentoLocalizado.pagamento();
            String identificadorLog = pagamentoLocalizado.identificador();
            StatusPagamento statusAnterior = pagamento.getStatus();
            boolean webhookProcessadoAnterior = pagamento.isWebhookProcessado();
            boolean mudou = pagamento.aplicarStatusWebhook(statusDestino, payload);
            if (!mudou) {
                LOGGER.info(
                        "asaas_webhook_idempotent event={} gatewayPaymentId={} pagamentoId={} statusAtual={} webhookProcessado={}",
                        event,
                        identificadorLog,
                        pagamento.getId(),
                        pagamento.getStatus(),
                        pagamento.isWebhookProcessado()
                );
                return;
            }

            boolean pagamentoConfirmadoPorEsteEvento = pagamento.getStatus() == StatusPagamento.PAGO
                    && (statusAnterior != StatusPagamento.PAGO || !webhookProcessadoAnterior);
            LOGGER.info(
                    "asaas_webhook_pagamento_updated event={} gatewayPaymentId={} pagamentoId={} statusAnterior={} statusAtual={} webhookProcessado={}",
                    event,
                    identificadorLog,
                    pagamento.getId(),
                    statusAnterior,
                    pagamento.getStatus(),
                    pagamento.isWebhookProcessado()
            );
            if (pagamentoConfirmadoPorEsteEvento && deveConfirmarAtendimento(event)) {
                LOGGER.info(
                        "asaas_webhook_pagamento_confirmed event={} paymentId={} gatewayPaymentId={} pagamentoId={}",
                        event,
                        paymentId,
                        identificadorLog,
                        pagamento.getId()
                );
                atualizarStatusAtendimento(pagamento, paymentId, identificadorLog, event);
            } else if (pagamentoConfirmadoPorEsteEvento) {
                LOGGER.warn(
                        "asaas_webhook_pagamento_pago_sem_confirmar_atendimento reason=event_not_allowed event={} paymentId={} pagamentoId={}",
                        event,
                        paymentId,
                        pagamento.getId()
                );
            }
        } catch (BusinessException exception) {
            throw exception;
        } catch (JsonProcessingException exception) {
            LOGGER.warn("asaas_webhook_payload_invalid reason=malformed_json");
            throw new BusinessException(
                    "WEBHOOK_PAYLOAD_INVALIDO",
                    "Payload de webhook invalido",
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            LOGGER.error("asaas_webhook_processing_error errorType={}", e.getClass().getSimpleName());
            throw new BusinessException(
                    "WEBHOOK_PROCESSAMENTO_ERRO",
                    "Erro ao processar webhook: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void validarAccessTokenAsaas(String accessToken) {
        String webhookToken = asaasProperties.getWebhookToken();
        if (webhookToken == null || webhookToken.isBlank()) {
            LOGGER.error("asaas_webhook_auth_failed reason=missing_config");
            throw new BusinessException(
                    "ASAAS_WEBHOOK_TOKEN_NAO_CONFIGURADO",
                    "Token do webhook Asaas nao configurado",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
        if (accessToken == null || accessToken.isBlank()) {
            LOGGER.warn("asaas_webhook_auth_failed reason=missing_token");
            throw new BusinessException(
                    "ASAAS_WEBHOOK_TOKEN_INVALIDO",
                    "Token do webhook Asaas ausente ou invalido",
                    HttpStatus.UNAUTHORIZED
            );
        }
        if (!tokensIguais(accessToken, webhookToken)) {
            LOGGER.warn("asaas_webhook_auth_failed reason=invalid_token");
            throw new BusinessException(
                    "ASAAS_WEBHOOK_TOKEN_INVALIDO",
                    "Token do webhook Asaas ausente ou invalido",
                    HttpStatus.UNAUTHORIZED
            );
        }
    }

    private boolean tokensIguais(String accessToken, String webhookToken) {
        return MessageDigest.isEqual(
                accessToken.getBytes(StandardCharsets.UTF_8),
                webhookToken.getBytes(StandardCharsets.UTF_8)
        );
    }

    private void atualizarStatusAtendimento(Pagamento pagamento, String paymentId, String gatewayPaymentId, String event) {
        if (pagamento.getStatus() != StatusPagamento.PAGO || !pagamento.isWebhookProcessado()) {
            throw new BusinessException(
                    "PAGAMENTO_NAO_CONFIRMADO_POR_WEBHOOK",
                    "Atendimento so pode ser confirmado por pagamento pago via webhook",
                    HttpStatus.CONFLICT
            );
        }

        AtendimentoFaxina atendimento = pagamento.getAtendimento();
        if (atendimento == null) {
            criarConviteParaPagamentoConfirmadoDaSolicitacao(pagamento, paymentId, gatewayPaymentId, event);
            return;
        }
        if (atendimento.getStatus() == StatusAtendimento.CANCELADO) {
            atendimento.enviarParaAnalise();
            atendimentoFaxinaRepository.save(atendimento);
            LOGGER.warn(
                    "asaas_webhook_pagamento_confirmed_atendimento_cancelado_em_analise event={} paymentId={} gatewayPaymentId={} pagamentoId={} atendimentoId={} status={}",
                    event,
                    paymentId,
                    gatewayPaymentId,
                    pagamento.getId(),
                    atendimento.getId(),
                    atendimento.getStatus()
            );
            return;
        }
        atendimento.confirmarPagamento();
        atendimentoFaxinaRepository.save(atendimento);
        LOGGER.info(
                "asaas_webhook_atendimento_confirmed event={} paymentId={} gatewayPaymentId={} pagamentoId={} atendimentoId={} status={}",
                event,
                paymentId,
                gatewayPaymentId,
                pagamento.getId(),
                atendimento.getId(),
                atendimento.getStatus()
        );
    }

    private void criarConviteParaPagamentoConfirmadoDaSolicitacao(
            Pagamento pagamento,
            String paymentId,
            String gatewayPaymentId,
            String event
    ) {
        if (pagamento.getSolicitacao() == null) {
            throw new BusinessException(
                    "PAGAMENTO_SEM_REFERENCIA_OPERACIONAL",
                    "Pagamento confirmado nao esta vinculado a atendimento nem a solicitacao",
                    HttpStatus.CONFLICT
            );
        }

        ConviteProfissional convite = conviteProfissionalService
                .criarConviteParaSolicitacaoPaga(pagamento.getSolicitacao());
        LOGGER.info(
                "asaas_webhook_convite_criado_para_solicitacao_paga event={} paymentId={} gatewayPaymentId={} pagamentoId={} solicitacaoId={} conviteId={} profissionalId={} solicitacaoStatus={}",
                event,
                paymentId,
                gatewayPaymentId,
                pagamento.getId(),
                pagamento.getSolicitacao().getId(),
                convite.getId(),
                convite.getProfissional().getId(),
                pagamento.getSolicitacao().getStatus()
        );
    }

    private Optional<PagamentoLocalizado> localizarPagamento(AsaasWebhookIdentifiers identifiers) {
        if (identifiers.paymentId() != null) {
            Optional<Pagamento> pagamento = pagamentoRepository.findByGatewayPaymentIdForUpdate(identifiers.paymentId());
            if (pagamento.isPresent()) {
                return Optional.of(new PagamentoLocalizado(pagamento.get(), identifiers.paymentId()));
            }
        }
        if (identifiers.checkoutSessionId() != null) {
            Optional<Pagamento> pagamento = pagamentoRepository.findByGatewayPaymentIdForUpdate(identifiers.checkoutSessionId());
            if (pagamento.isPresent()) {
                return Optional.of(new PagamentoLocalizado(pagamento.get(), identifiers.checkoutSessionId()));
            }
        }
        if (identifiers.checkoutId() != null) {
            Optional<Pagamento> pagamento = pagamentoRepository.findByGatewayPaymentIdForUpdate(identifiers.checkoutId());
            if (pagamento.isPresent()) {
                return Optional.of(new PagamentoLocalizado(pagamento.get(), identifiers.checkoutId()));
            }
        }
        Long atendimentoId = extrairAtendimentoId(identifiers.externalReference());
        if (atendimentoId != null) {
            return pagamentoRepository.findByAtendimentoIdForUpdate(atendimentoId)
                    .map(pagamento -> new PagamentoLocalizado(pagamento, identifiers.externalReference()));
        }
        Long solicitacaoId = extrairSolicitacaoId(identifiers.externalReference());
        if (solicitacaoId != null) {
            return pagamentoRepository.findBySolicitacaoIdForUpdate(solicitacaoId)
                    .map(pagamento -> new PagamentoLocalizado(pagamento, identifiers.externalReference()));
        }
        return Optional.empty();
    }

    private AsaasWebhookIdentifiers extrairIdentificadores(JsonNode jsonNode) {
        return new AsaasWebhookIdentifiers(
                texto(jsonNode.path("checkout").path("id")),
                primeiroTexto(
                        jsonNode.path("payment").path("checkoutSession"),
                        jsonNode.path("checkoutSession")
                ),
                texto(jsonNode.path("payment").path("id")),
                primeiroTexto(
                        jsonNode.path("externalReference"),
                        jsonNode.path("checkout").path("externalReference"),
                        jsonNode.path("payment").path("externalReference")
                )
        );
    }

    private Long extrairAtendimentoId(String externalReference) {
        return extrairIdComPrefixo(externalReference, "atendimento-");
    }

    private Long extrairSolicitacaoId(String externalReference) {
        return extrairIdComPrefixo(externalReference, "solicitacao-");
    }

    private Long extrairIdComPrefixo(String externalReference, String prefixo) {
        if (externalReference == null || !externalReference.startsWith(prefixo)) {
            return null;
        }
        String valor = externalReference.substring(prefixo.length());
        if (valor.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(valor);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String primeiroTexto(JsonNode... nodes) {
        for (JsonNode node : nodes) {
            String valor = texto(node);
            if (valor != null) {
                return valor;
            }
        }
        return null;
    }

    private StatusPagamento mapearStatusPagamento(JsonNode jsonNode, String event) {
        String statusGateway = texto(jsonNode.path("payment").path("status"));
        return switch (event) {
            case "PAYMENT_CREATED" -> StatusPagamento.PENDENTE;
            case "PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "CHECKOUT_PAID" ->
                    statusComFallback(statusGateway, StatusPagamento.PAGO);
            case "PAYMENT_RECEIVED_IN_CASH" -> StatusPagamento.AGUARDANDO_CONFIRMACAO;
            case "PAYMENT_OVERDUE" -> StatusPagamento.FALHOU;
            case "PAYMENT_DELETED" -> StatusPagamento.CANCELADO;
            case "PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED",
                    "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL" -> StatusPagamento.ESTORNADO;
            default -> throw new IllegalStateException("Evento suportado sem mapeamento de status");
        };
    }

    private boolean deveConfirmarAtendimento(String event) {
        return "PAYMENT_CONFIRMED".equals(event)
                || "PAYMENT_RECEIVED".equals(event)
                || "CHECKOUT_PAID".equals(event);
    }

    private StatusPagamento mapearStatusGateway(String statusGateway) {
        return switch (statusGateway) {
            case "RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH" -> StatusPagamento.PAGO;
            case "OVERDUE" -> StatusPagamento.FALHOU;
            case "DELETED" -> StatusPagamento.CANCELADO;
            case "REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE",
                    "AWAITING_CHARGEBACK_REVERSAL" -> StatusPagamento.ESTORNADO;
            case "PENDING", "AWAITING_RISK_ANALYSIS" -> StatusPagamento.PENDENTE;
            default -> null;
        };
    }

    private StatusPagamento statusComFallback(String statusGateway, StatusPagamento padrao) {
        StatusPagamento statusMapeado = statusGateway == null ? null : mapearStatusGateway(statusGateway);
        return statusMapeado == null ? padrao : statusMapeado;
    }

    private String texto(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String valor = node.asText();
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor;
    }

    private record AsaasWebhookIdentifiers(
            String checkoutId,
            String checkoutSessionId,
            String paymentId,
            String externalReference
    ) {

        boolean temIdentificador() {
            return checkoutId != null || checkoutSessionId != null || paymentId != null || externalReference != null;
        }
    }

    private record PagamentoLocalizado(
            Pagamento pagamento,
            String identificador
    ) {
    }
}
