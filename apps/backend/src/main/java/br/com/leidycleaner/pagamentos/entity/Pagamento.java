package br.com.leidycleaner.pagamentos.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pagamentos")
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "atendimento_id", nullable = false, unique = true)
    private AtendimentoFaxina atendimento;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway", nullable = false, length = 30)
    private GatewayPagamento gateway;

    @Column(name = "gateway_payment_id", nullable = false, length = 120)
    private String gatewayPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pagamento", nullable = false, length = 40)
    private MetodoPagamento metodoPagamento;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusPagamento status;

    @Column(name = "valor_bruto", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorBruto;

    @Column(name = "valor_taxa_gateway", precision = 10, scale = 2)
    private BigDecimal valorTaxaGateway;

    @Column(name = "valor_liquido_recebido", precision = 10, scale = 2)
    private BigDecimal valorLiquidoRecebido;

    @Column(name = "recebido_em")
    private OffsetDateTime recebidoEm;

    @Column(name = "url_pagamento", length = 500)
    private String urlPagamento;

    @Column(name = "pix_copia_e_cola")
    private String pixCopiaECola;

    @Column(name = "payload_resumo")
    private String payloadResumo;

    @Column(name = "webhook_processado", nullable = false)
    private boolean webhookProcessado;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    protected Pagamento() {
    }

    public Pagamento(
            AtendimentoFaxina atendimento,
            GatewayPagamento gateway,
            String gatewayPaymentId,
            MetodoPagamento metodoPagamento,
            StatusPagamento status,
            BigDecimal valorBruto,
            String urlPagamento,
            String pixCopiaECola,
            String payloadResumo
    ) {
        this.atendimento = atendimento;
        this.gateway = gateway;
        this.gatewayPaymentId = gatewayPaymentId;
        this.metodoPagamento = metodoPagamento;
        this.status = status;
        this.valorBruto = valorBruto;
        this.urlPagamento = limparOpcional(urlPagamento);
        this.pixCopiaECola = limparOpcional(pixCopiaECola);
        this.payloadResumo = limparOpcional(payloadResumo);
        this.webhookProcessado = false;
    }

    @PrePersist
    void aoCriar() {
        OffsetDateTime agora = OffsetDateTime.now();
        criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    void aoAtualizar() {
        atualizadoEm = OffsetDateTime.now();
    }

    public void atualizarConsultaGateway(
            StatusPagamento status,
            BigDecimal valorTaxaGateway,
            BigDecimal valorLiquidoRecebido,
            String urlPagamento,
            String pixCopiaECola,
            String payloadResumo
    ) {
        this.status = status;
        this.valorTaxaGateway = valorTaxaGateway;
        this.valorLiquidoRecebido = valorLiquidoRecebido;
        this.urlPagamento = limparOpcional(urlPagamento);
        this.pixCopiaECola = limparOpcional(pixCopiaECola);
        this.payloadResumo = limparOpcional(payloadResumo);
    }

    public boolean aplicarStatusWebhook(StatusPagamento novoStatus, String payloadResumo) {
        if (novoStatus == null) {
            return false;
        }
        if (novoStatus == StatusPagamento.PAGO) {
            return confirmarViaWebhook(payloadResumo);
        }
        if (status == novoStatus) {
            return false;
        }
        if (status == StatusPagamento.ESTORNADO) {
            return false;
        }
        if (status == StatusPagamento.PAGO && novoStatus != StatusPagamento.ESTORNADO) {
            return false;
        }
        this.status = novoStatus;
        this.payloadResumo = limparOpcional(payloadResumo);
        return true;
    }

    public boolean cancelarSeAguardandoConfirmacao() {
        if (status != StatusPagamento.PENDENTE && status != StatusPagamento.AGUARDANDO_CONFIRMACAO) {
            return false;
        }
        status = StatusPagamento.CANCELADO;
        return true;
    }

    private boolean confirmarViaWebhook(String payloadResumo) {
        if (status == StatusPagamento.PAGO && webhookProcessado) {
            return false;
        }
        if (status == StatusPagamento.ESTORNADO) {
            return false;
        }
        this.status = StatusPagamento.PAGO;
        this.webhookProcessado = true;
        if (recebidoEm == null) {
            this.recebidoEm = OffsetDateTime.now();
        }
        this.payloadResumo = limparOpcional(payloadResumo);
        return true;
    }

    public Long getId() {
        return id;
    }

    public AtendimentoFaxina getAtendimento() {
        return atendimento;
    }

    public GatewayPagamento getGateway() {
        return gateway;
    }

    public String getGatewayPaymentId() {
        return gatewayPaymentId;
    }

    public MetodoPagamento getMetodoPagamento() {
        return metodoPagamento;
    }

    public StatusPagamento getStatus() {
        return status;
    }

    public BigDecimal getValorBruto() {
        return valorBruto;
    }

    public BigDecimal getValorTaxaGateway() {
        return valorTaxaGateway;
    }

    public BigDecimal getValorLiquidoRecebido() {
        return valorLiquidoRecebido;
    }

    public OffsetDateTime getRecebidoEm() {
        return recebidoEm;
    }

    public String getUrlPagamento() {
        return urlPagamento;
    }

    public String getPixCopiaECola() {
        return pixCopiaECola;
    }

    public String getPayloadResumo() {
        return payloadResumo;
    }

    public boolean isWebhookProcessado() {
        return webhookProcessado;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    private String limparOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
