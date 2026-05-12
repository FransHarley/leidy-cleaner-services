package br.com.leidycleaner.solicitacoes.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.regioes.entity.RegiaoAtendimento;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "solicitacoes_faxina")
public class SolicitacaoFaxina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private PerfilCliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "endereco_id", nullable = false)
    private Endereco endereco;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "regiao_id", nullable = false)
    private RegiaoAtendimento regiao;

    @Column(name = "data_hora_desejada", nullable = false)
    private OffsetDateTime dataHoraDesejada;

    @Column(name = "duracao_estimada_horas", nullable = false)
    private int duracaoEstimadaHoras;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_servico", nullable = false, length = 40)
    private TipoServico tipoServico;

    @Column(name = "observacoes")
    private String observacoes;

    @Column(name = "valor_servico", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorServico;

    @Column(name = "percentual_comissao_agencia", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentualComissaoAgencia;

    @Column(name = "valor_estimado_profissional", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorEstimadoProfissional;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private StatusSolicitacao status;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    protected SolicitacaoFaxina() {
    }

    public SolicitacaoFaxina(
            PerfilCliente cliente,
            Endereco endereco,
            RegiaoAtendimento regiao,
            OffsetDateTime dataHoraDesejada,
            int duracaoEstimadaHoras,
            TipoServico tipoServico,
            String observacoes,
            BigDecimal valorServico,
            BigDecimal percentualComissaoAgencia,
            BigDecimal valorEstimadoProfissional
    ) {
        this.cliente = cliente;
        this.endereco = endereco;
        this.regiao = regiao;
        this.dataHoraDesejada = dataHoraDesejada;
        this.duracaoEstimadaHoras = duracaoEstimadaHoras;
        this.tipoServico = tipoServico;
        this.observacoes = limparOpcional(observacoes);
        this.valorServico = valorServico;
        this.percentualComissaoAgencia = percentualComissaoAgencia;
        this.valorEstimadoProfissional = valorEstimadoProfissional;
        this.status = StatusSolicitacao.CRIADA;
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

    public boolean podeCancelar() {
        return status == StatusSolicitacao.CRIADA
                || status == StatusSolicitacao.AGUARDANDO_SELECAO
                || status == StatusSolicitacao.AGUARDANDO_PAGAMENTO;
    }

    public void cancelar() {
        status = StatusSolicitacao.CANCELADA;
    }

    public void expirar() {
        status = StatusSolicitacao.EXPIRADA;
    }

    public void marcarConvitesEnviados() {
        status = StatusSolicitacao.CONVITES_ENVIADOS;
    }

    public void marcarAguardandoPagamento() {
        status = StatusSolicitacao.AGUARDANDO_PAGAMENTO;
    }

    public void marcarAceita() {
        status = StatusSolicitacao.ACEITA;
    }

    public Long getId() {
        return id;
    }

    public PerfilCliente getCliente() {
        return cliente;
    }

    public Endereco getEndereco() {
        return endereco;
    }

    public RegiaoAtendimento getRegiao() {
        return regiao;
    }

    public OffsetDateTime getDataHoraDesejada() {
        return dataHoraDesejada;
    }

    public int getDuracaoEstimadaHoras() {
        return duracaoEstimadaHoras;
    }

    public TipoServico getTipoServico() {
        return tipoServico;
    }

    public String getObservacoes() {
        return observacoes;
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

    public StatusSolicitacao getStatus() {
        return status;
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
