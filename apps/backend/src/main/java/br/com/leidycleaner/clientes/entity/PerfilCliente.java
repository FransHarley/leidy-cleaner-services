package br.com.leidycleaner.clientes.entity;

import java.time.OffsetDateTime;

import br.com.leidycleaner.usuarios.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "perfis_cliente")
public class PerfilCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "observacoes_internas")
    private String observacoesInternas;

    @Column(name = "asaas_customer_id", length = 120, unique = true)
    private String asaasCustomerId;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    protected PerfilCliente() {
    }

    public PerfilCliente(Usuario usuario, String observacoesInternas) {
        this.usuario = usuario;
        this.observacoesInternas = observacoesInternas;
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

    public Usuario getUsuario() {
        return usuario;
    }

    public String getObservacoesInternas() {
        return observacoesInternas;
    }

    public String getAsaasCustomerId() {
        return asaasCustomerId;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void registrarAsaasCustomerId(String asaasCustomerId) {
        if (asaasCustomerId == null || asaasCustomerId.isBlank()) {
            throw new IllegalArgumentException("asaasCustomerId nao pode ser vazio");
        }
        this.asaasCustomerId = asaasCustomerId.trim();
    }
}
