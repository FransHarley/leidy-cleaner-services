package br.com.leidycleaner.atendimentos.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.profissionais.entity.PerfilProfissional;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "atendimentos_faxina")
public class AtendimentoFaxina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitacao_id", nullable = false, unique = true)
    private SolicitacaoFaxina solicitacao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private PerfilCliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profissional_id", nullable = false)
    private PerfilProfissional profissional;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusAtendimento status;

    @Column(name = "valor_servico", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorServico;

    @Column(name = "percentual_comissao_agencia", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentualComissaoAgencia;

    @Column(name = "valor_estimado_profissional", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorEstimadoProfissional;

    @Column(name = "inicio_previsto_em", nullable = false)
    private OffsetDateTime inicioPrevistoEm;

    @Column(name = "inicio_real_em")
    private OffsetDateTime inicioRealEm;

    @Column(name = "fim_real_em")
    private OffsetDateTime fimRealEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    protected AtendimentoFaxina() {
    }

    public AtendimentoFaxina(SolicitacaoFaxina solicitacao, PerfilProfissional profissional) {
        this(solicitacao, profissional, StatusAtendimento.AGUARDANDO_PAGAMENTO);
    }

    private AtendimentoFaxina(
            SolicitacaoFaxina solicitacao,
            PerfilProfissional profissional,
            StatusAtendimento status
    ) {
        this.solicitacao = solicitacao;
        this.cliente = solicitacao.getCliente();
        this.profissional = profissional;
        this.status = status;
        this.valorServico = solicitacao.getValorServico();
        this.percentualComissaoAgencia = solicitacao.getPercentualComissaoAgencia();
        this.valorEstimadoProfissional = solicitacao.getValorEstimadoProfissional();
        this.inicioPrevistoEm = solicitacao.getDataHoraDesejada();
    }

    public static AtendimentoFaxina criarConfirmadoParaSolicitacaoPaga(
            SolicitacaoFaxina solicitacao,
            PerfilProfissional profissional
    ) {
        return new AtendimentoFaxina(solicitacao, profissional, StatusAtendimento.CONFIRMADO);
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

    public Long getId() {
        return id;
    }

    public SolicitacaoFaxina getSolicitacao() {
        return solicitacao;
    }

    public PerfilCliente getCliente() {
        return cliente;
    }

    public PerfilProfissional getProfissional() {
        return profissional;
    }

    public StatusAtendimento getStatus() {
        return status;
    }

    public BigDecimal getValorServico() {
        return valorServico;
    }

    public BigDecimal getPercentualComissaoAgencia() {
        return percentualComissaoAgencia;
    }

    public BigDecimal getValorEstimadoProfissional() {
        return valorEstimadoProfissional;
    }

    public OffsetDateTime getInicioPrevistoEm() {
        return inicioPrevistoEm;
    }

    public OffsetDateTime getInicioRealEm() {
        return inicioRealEm;
    }

    public OffsetDateTime getFimRealEm() {
        return fimRealEm;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void confirmarPagamento() {
        if (status == StatusAtendimento.AGUARDANDO_PAGAMENTO) {
            status = StatusAtendimento.CONFIRMADO;
        }
    }

    public void cancelar() {
        status = StatusAtendimento.CANCELADO;
    }

    public void enviarParaAnalise() {
        status = StatusAtendimento.EM_ANALISE;
    }

    public void iniciarServico(OffsetDateTime inicioRealEm) {
        this.status = StatusAtendimento.EM_EXECUCAO;
        this.inicioRealEm = inicioRealEm;
    }

    public void finalizarServico(OffsetDateTime fimRealEm) {
        this.status = StatusAtendimento.FINALIZADO;
        this.fimRealEm = fimRealEm;
    }
}
