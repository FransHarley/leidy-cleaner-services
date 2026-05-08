package br.com.leidycleaner.usuarios.entity;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

import br.com.leidycleaner.auth.entity.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_completo", nullable = false, length = 160)
    private String nomeCompleto;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "telefone", nullable = false, length = 30)
    private String telefone;

    @Column(name = "cpf", length = 11, unique = true)
    private String cpf;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", nullable = false, length = 30)
    private TipoUsuario tipoUsuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_conta", nullable = false, length = 30)
    private StatusConta statusConta;

    @Column(name = "email_verificado", nullable = false)
    private boolean emailVerificado;

    @Column(name = "telefone_verificado", nullable = false)
    private boolean telefoneVerificado;

    @Column(name = "ultimo_login_em")
    private OffsetDateTime ultimoLoginEm;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "usuario_roles",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    protected Usuario() {
    }

    public Usuario(
            String nomeCompleto,
            String email,
            String telefone,
            String senhaHash,
            TipoUsuario tipoUsuario,
            StatusConta statusConta
    ) {
        this(nomeCompleto, email, telefone, null, senhaHash, tipoUsuario, statusConta);
    }

    public Usuario(
            String nomeCompleto,
            String email,
            String telefone,
            String cpf,
            String senhaHash,
            TipoUsuario tipoUsuario,
            StatusConta statusConta
    ) {
        this.nomeCompleto = nomeCompleto;
        this.email = email;
        this.telefone = telefone;
        this.cpf = cpf;
        this.senhaHash = senhaHash;
        this.tipoUsuario = tipoUsuario;
        this.statusConta = statusConta;
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

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getCpf() {
        return cpf;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public TipoUsuario getTipoUsuario() {
        return tipoUsuario;
    }

    public StatusConta getStatusConta() {
        return statusConta;
    }

    public boolean isEmailVerificado() {
        return emailVerificado;
    }

    public boolean isTelefoneVerificado() {
        return telefoneVerificado;
    }

    public OffsetDateTime getUltimoLoginEm() {
        return ultimoLoginEm;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }

    public OffsetDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public Set<Role> getRoles() {
        return roles;
    }

    public void adicionarRole(Role role) {
        roles.add(role);
    }

    public void registrarLogin(OffsetDateTime momento) {
        ultimoLoginEm = momento;
    }

    public void alterarStatusConta(StatusConta statusConta) {
        this.statusConta = statusConta;
    }
}
