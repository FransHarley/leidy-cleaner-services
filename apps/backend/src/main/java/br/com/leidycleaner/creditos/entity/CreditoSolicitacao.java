package br.com.leidycleaner.creditos.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Objects;

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.regioes.entity.RegiaoAtendimento;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "creditos_solicitacao")
public class CreditoSolicitacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private PerfilCliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitacao_origem_id", nullable = false)
    private SolicitacaoFaxina solicitacaoOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pagamento_origem_id", nullable = false)
    private Pagamento pagamentoOrigem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitacao_uso_id")
    private SolicitacaoFaxina solicitacaoUso;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_servico", nullable = false, length = 80)
    private TipoServico tipoServico;

    @Column(name = "duracao_estimada_horas", nullable = false)
    private int duracaoEstimadaHoras;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "regiao_id", nullable = false)
    private RegiaoAtendimento regiao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endereco_origem_id")
    private Endereco enderecoOrigem;

    @Column(name = "valor_referencia", precision = 12, scale = 2)
    private BigDecimal valorReferencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusCreditoSolicitacao status;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "reservado_em")
    private OffsetDateTime reservadoEm;

    @Column(name = "utilizado_em")
    private OffsetDateTime utilizadoEm;

    @Column(name = "cancelado_em")
    private OffsetDateTime canceladoEm;

    @Column(name = "observacao")
    private String observacao;

    protected CreditoSolicitacao() {
    }

    public CreditoSolicitacao(
            PerfilCliente cliente,
            SolicitacaoFaxina solicitacaoOrigem,
            Pagamento pagamentoOrigem,
            SolicitacaoFaxina solicitacaoUso,
            TipoServico tipoServico,
            int duracaoEstimadaHoras,
            RegiaoAtendimento regiao,
            Endereco enderecoOrigem,
            BigDecimal valorReferencia,
            StatusCreditoSolicitacao status,
            String observacao
    ) {
        this.cliente = Objects.requireNonNull(cliente, "cliente");
        this.solicitacaoOrigem = Objects.requireNonNull(solicitacaoOrigem, "solicitacaoOrigem");
        this.pagamentoOrigem = Objects.requireNonNull(pagamentoOrigem, "pagamentoOrigem");
        this.solicitacaoUso = solicitacaoUso;
        this.tipoServico = Objects.requireNonNull(tipoServico, "tipoServico");
        this.duracaoEstimadaHoras = duracaoEstimadaHoras;
        this.regiao = Objects.requireNonNull(regiao, "regiao");
        this.enderecoOrigem = enderecoOrigem;
        this.valorReferencia = valorReferencia;
        this.status = Objects.requireNonNull(status, "status");
        this.observacao = limparOpcional(observacao);
    }

    public static CreditoSolicitacao criarDisponivel(
            SolicitacaoFaxina solicitacao,
            Pagamento pagamento,
            String observacao
    ) {
        return new CreditoSolicitacao(
                solicitacao.getCliente(),
                solicitacao,
                pagamento,
                null,
                solicitacao.getTipoServico(),
                solicitacao.getDuracaoEstimadaHoras(),
                solicitacao.getRegiao(),
                solicitacao.getEndereco(),
                solicitacao.getValorServico(),
                StatusCreditoSolicitacao.DISPONIVEL,
                observacao
        );
    }

    @PrePersist
    void aoCriar() {
        if (criadoEm == null) {
            criadoEm = OffsetDateTime.now();
        }
    }

    public boolean equivaleASolicitacao(SolicitacaoFaxina solicitacao) {
        return solicitacao != null
                && tipoServico == solicitacao.getTipoServico()
                && duracaoEstimadaHoras == solicitacao.getDuracaoEstimadaHoras()
                && regiao.getId().equals(solicitacao.getRegiao().getId());
    }

    public Long getId() {
        return id;
    }

    public PerfilCliente getCliente() {
        return cliente;
    }

    public SolicitacaoFaxina getSolicitacaoOrigem() {
        return solicitacaoOrigem;
    }

    public Pagamento getPagamentoOrigem() {
        return pagamentoOrigem;
    }

    public SolicitacaoFaxina getSolicitacaoUso() {
        return solicitacaoUso;
    }

    public TipoServico getTipoServico() {
        return tipoServico;
    }

    public int getDuracaoEstimadaHoras() {
        return duracaoEstimadaHoras;
    }

    public RegiaoAtendimento getRegiao() {
        return regiao;
    }

    public Endereco getEnderecoOrigem() {
        return enderecoOrigem;
    }

    public BigDecimal getValorReferencia() {
        return valorReferencia;
    }

    public StatusCreditoSolicitacao getStatus() {
        return status;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getReservadoEm() {
        return reservadoEm;
    }

    public OffsetDateTime getUtilizadoEm() {
        return utilizadoEm;
    }

    public OffsetDateTime getCanceladoEm() {
        return canceladoEm;
    }

    public String getObservacao() {
        return observacao;
    }

    private String limparOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
