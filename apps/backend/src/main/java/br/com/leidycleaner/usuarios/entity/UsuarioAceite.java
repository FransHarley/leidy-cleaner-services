package br.com.leidycleaner.usuarios.entity;

import java.time.OffsetDateTime;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "usuario_aceites",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_usuario_aceites_usuario_tipo_versao",
                columnNames = {"usuario_id", "tipo_documento", "versao"}
        )
)
public class UsuarioAceite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", nullable = false, length = 40)
    private TipoDocumentoAceite tipoDocumento;

    @Column(name = "versao", nullable = false, length = 40)
    private String versao;

    @Column(name = "aceito_em", nullable = false)
    private OffsetDateTime aceitoEm;

    @Column(name = "ip_origem", length = 80)
    private String ipOrigem;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    protected UsuarioAceite() {
    }

    public UsuarioAceite(
            Usuario usuario,
            TipoDocumentoAceite tipoDocumento,
            String versao,
            OffsetDateTime aceitoEm,
            String ipOrigem,
            String userAgent
    ) {
        this.usuario = usuario;
        this.tipoDocumento = tipoDocumento;
        this.versao = versao;
        this.aceitoEm = aceitoEm;
        this.ipOrigem = ipOrigem;
        this.userAgent = userAgent;
    }

    @PrePersist
    void aoCriar() {
        criadoEm = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public TipoDocumentoAceite getTipoDocumento() {
        return tipoDocumento;
    }

    public String getVersao() {
        return versao;
    }

    public OffsetDateTime getAceitoEm() {
        return aceitoEm;
    }

    public String getIpOrigem() {
        return ipOrigem;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
