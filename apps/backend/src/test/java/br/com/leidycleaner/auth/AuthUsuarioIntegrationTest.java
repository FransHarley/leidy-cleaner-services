package br.com.leidycleaner.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static br.com.leidycleaner.support.TestAceites.camposAceiteJson;
import static br.com.leidycleaner.support.TestCpf.cpfComPrefixo;
import static br.com.leidycleaner.support.TestCpf.proximoCpf;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.profissionais.entity.StatusAprovacaoProfissional;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.repository.UsuarioAceiteRepository;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;
import br.com.leidycleaner.verificacao.entity.DocumentoVerificacao;
import br.com.leidycleaner.verificacao.entity.StatusVerificacao;
import br.com.leidycleaner.verificacao.repository.DocumentoVerificacaoRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthUsuarioIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final UsuarioRepository usuarioRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final UsuarioAceiteRepository usuarioAceiteRepository;
    private final DocumentoVerificacaoRepository documentoVerificacaoRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    AuthUsuarioIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            UsuarioRepository usuarioRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            UsuarioAceiteRepository usuarioAceiteRepository,
            DocumentoVerificacaoRepository documentoVerificacaoRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.usuarioRepository = usuarioRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.usuarioAceiteRepository = usuarioAceiteRepository;
        this.documentoVerificacaoRepository = documentoVerificacaoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Test
    void cadastroClienteCriaUsuarioPerfilRoleESenhaHash() throws Exception {
        String email = "cliente.m1b.1@example.com";
        String cpfNormalizado = proximoCpf();
        String cpf = formatarCpf(cpfNormalizado);

        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente M1B",
                                  "email": "%s",
                                  "telefone": "+5551999991111",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  "observacoesInternas": "teste",
                                  %s
                                }
                                """.formatted(email, cpf, camposAceiteJson())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.usuario.email").value(email))
                .andExpect(jsonPath("$.data.usuario.tipoUsuario").value("CLIENTE"))
                .andExpect(jsonPath("$.data.usuario.roles[0]").value("ROLE_CLIENTE"))
                .andExpect(jsonPath("$.data.usuario.senhaHash").doesNotExist())
                .andExpect(jsonPath("$.data.perfilId").isNumber());

        var usuario = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(usuario.getCpf()).isEqualTo(cpfNormalizado);
        assertThat(usuario.getSenhaHash()).isNotEqualTo("senha-segura-123");
        assertThat(passwordEncoder.matches("senha-segura-123", usuario.getSenhaHash())).isTrue();
        var aceites = usuarioAceiteRepository.findByUsuarioIdOrderByAceitoEmAsc(usuario.getId());
        assertThat(aceites)
                .hasSize(3)
                .extracting(aceite -> aceite.getTipoDocumento().name())
                .containsExactlyInAnyOrder("TERMOS_USO", "POLITICA_PRIVACIDADE", "CODIGO_CONDUTA");
        assertThat(aceites)
                .allSatisfy(aceite -> {
                    assertThat(aceite.getUsuario().getId()).isEqualTo(usuario.getId());
                    assertThat(aceite.getVersao()).isEqualTo("2026-05-01");
                    assertThat(aceite.getAceitoEm()).isNotNull();
                });
    }

    @Test
    void cadastroProfissionalCriaUsuarioPerfilRoleEEstadosIniciais() throws Exception {
        String email = "profissional.m1b.1@example.com";
        String cpf = proximoCpf();

        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Profissional M1B",
                                  "email": "%s",
                                  "telefone": "+5551988881111",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional M1B",
                                  "cpf": "%s",
                                  "dataNascimento": "1990-01-20",
                                  "descricao": "Atendimento residencial",
                                  "experienciaAnos": 2,
                                  %s
                                }
                                """.formatted(email, cpf, camposAceiteJson())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.usuario.email").value(email))
                .andExpect(jsonPath("$.data.usuario.tipoUsuario").value("PROFISSIONAL"))
                .andExpect(jsonPath("$.data.usuario.statusConta").value("PENDENTE_VERIFICACAO"))
                .andExpect(jsonPath("$.data.usuario.roles[0]").value("ROLE_PROFISSIONAL"))
                .andExpect(jsonPath("$.data.usuario.senhaHash").doesNotExist())
                .andExpect(jsonPath("$.data.perfilId").isNumber());

        var usuario = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(usuario.getCpf()).isEqualTo(cpf);
        var perfil = perfilProfissionalRepository.findByCpf(cpf).orElseThrow();
        assertThat(perfil.getStatusAprovacao().name()).isEqualTo("PENDENTE");
        assertThat(perfil.isAtivoParaReceberChamados()).isFalse();
    }

    @Test
    void cadastroClienteRejeitaCpfInvalido() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente CPF Invalido",
                                  "email": "cliente.m1b.cpf-invalido@example.com",
                                  "telefone": "+5551999991212",
                                  "cpf": "111.111.111-11",
                                  "senha": "senha-segura-123",
                                  %s
                                }
                                """.formatted(camposAceiteJson())))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CPF_INVALIDO"))
                .andExpect(jsonPath("$.message").value("CPF inválido."));
    }

    @Test
    void cadastroProfissionalRejeitaCpfInvalido() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Profissional CPF Invalido",
                                  "email": "profissional.m1b.cpf-invalido@example.com",
                                  "telefone": "+5551988881212",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional CPF Invalido",
                                  "cpf": "123.456.789-00",
                                  "dataNascimento": "1990-01-20",
                                  %s
                                }
                                """.formatted(camposAceiteJson())))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CPF_INVALIDO"))
                .andExpect(jsonPath("$.message").value("CPF inválido."));
    }

    @Test
    void cadastroClienteRejeitaCpfDuplicado() throws Exception {
        String cpf = proximoCpf();
        cadastrarCliente("cliente.m1b.cpf1@example.com", "senha-segura-123", cpf);

        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Outra Cliente",
                                  "email": "cliente.m1b.cpf2@example.com",
                                  "telefone": "+5551999992323",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  %s
                                }
                                """.formatted(formatarCpf(cpf), camposAceiteJson())))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CPF_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("Já existe uma conta cadastrada com este CPF."));
    }

    @Test
    void cadastroRejeitaCpfDuplicadoEntreClienteEProfissionalNosDoisSentidos() throws Exception {
        String cpfCliente = proximoCpf();
        cadastrarCliente("cliente.m1b.cpf-global@example.com", "senha-segura-123", cpfCliente);

        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Profissional CPF Global",
                                  "email": "profissional.m1b.cpf-global@example.com",
                                  "telefone": "+5551988882323",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional CPF Global",
                                  "cpf": "%s",
                                  "dataNascimento": "1990-01-20",
                                  %s
                                }
                                """.formatted(cpfCliente, camposAceiteJson())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CPF_ALREADY_EXISTS"));

        String cpfProfissional = proximoCpf();
        cadastrarProfissional("profissional.m1b.cpf-global-origem@example.com", cpfProfissional);

        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente CPF Global",
                                  "email": "cliente.m1b.cpf-global-destino@example.com",
                                  "telefone": "+5551999992424",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  %s
                                }
                                """.formatted(cpfProfissional, camposAceiteJson())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CPF_ALREADY_EXISTS"));
    }

    @Test
    void cadastroSemAceiteDeTermosERejeitado() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Sem Termos",
                                  "email": "cliente.m1b.sem-termos@example.com",
                                  "telefone": "+5551999992525",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  "aceitarPoliticaPrivacidade": true,
                                  "aceitarCodigoConduta": true
                                }
                                """.formatted(proximoCpf())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[0]").value("aceitarTermosUso: aceitarTermosUso e obrigatorio"));
    }

    @Test
    void cadastroSemAceiteDePrivacidadeERejeitado() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Sem Privacidade",
                                  "email": "cliente.m1b.sem-privacidade@example.com",
                                  "telefone": "+5551999992626",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  "aceitarTermosUso": true,
                                  "aceitarCodigoConduta": true
                                }
                                """.formatted(proximoCpf())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[0]").value("aceitarPoliticaPrivacidade: aceitarPoliticaPrivacidade e obrigatorio"));
    }

    @Test
    void cadastroSemAceiteDeCondutaERejeitado() throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Sem Conduta",
                                  "email": "cliente.m1b.sem-conduta@example.com",
                                  "telefone": "+5551999992727",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  "aceitarTermosUso": true,
                                  "aceitarPoliticaPrivacidade": true
                                }
                                """.formatted(proximoCpf())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors[0]").value("aceitarCodigoConduta: aceitarCodigoConduta e obrigatorio"));
    }

    @Test
    void cadastroRejeitaEmailDuplicado() throws Exception {
        String email = "cliente.m1b.duplicado@example.com";
        cadastrarCliente(email, "senha-segura-123");

        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Duplicado",
                                  "email": "%s",
                                  "telefone": "+5551999992222",
                                  "cpf": "%s",
                                  "senha": "senha-segura-456",
                                  %s
                                }
                                """.formatted(email, proximoCpf(), camposAceiteJson())))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("Email ja cadastrado"))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void cadastroProfissionalRejeitaCpfDuplicado() throws Exception {
        String cpf = proximoCpf();
        cadastrarProfissional("profissional.m1b.cpf1@example.com", cpf);

        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Outra Profissional",
                                  "email": "profissional.m1b.cpf2@example.com",
                                  "telefone": "+5551988882222",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Outra Profissional",
                                  "cpf": "%s",
                                  "dataNascimento": "1992-04-10",
                                  %s
                                }
                                """.formatted(cpf, camposAceiteJson())))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CPF_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("Já existe uma conta cadastrada com este CPF."))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void loginRetornaTokenComCredenciaisValidas() throws Exception {
        String email = "cliente.m1b.login@example.com";
        cadastrarCliente(email, "senha-segura-123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "senha-segura-123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.usuario.email").value(email))
                .andExpect(jsonPath("$.data.usuario.senhaHash").doesNotExist());
    }

    @Test
    void loginRejeitaCredenciaisInvalidas() throws Exception {
        String email = "cliente.m1b.login-invalido@example.com";
        cadastrarCliente(email, "senha-segura-123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "senha-errada"
                                }
                                """.formatted(email)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void loginProfissionalPendenteERejeitadoEnquantoNaoAprovado() throws Exception {
        String email = "profissional.m1b.login-pendente@example.com";
        cadastrarProfissional(email, proximoCpf());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "senha-segura-123"
                                }
                                """.formatted(email)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("PROFESSIONAL_REGISTRATION_PENDING"))
                .andExpect(jsonPath("$.message").value("Seu cadastro profissional ainda está em análise e não foi liberado para acesso."));
    }

    @Test
    void loginProfissionalEmAnaliseERejeitadoEnquantoNaoAprovado() throws Exception {
        String email = "profissional.m1b.login-analise@example.com";
        String cpf = proximoCpf();
        cadastrarProfissional(email, cpf);
        alterarStatusProfissional(cpf, StatusAprovacaoProfissional.EM_ANALISE, StatusConta.PENDENTE_VERIFICACAO);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "senha-segura-123"
                                }
                                """.formatted(email)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("PROFESSIONAL_REGISTRATION_PENDING"));
    }

    @Test
    void loginProfissionalRejeitadaERejeitadoComMensagemClara() throws Exception {
        String email = "profissional.m1b.login-rejeitada@example.com";
        String cpf = proximoCpf();
        cadastrarProfissional(email, cpf);
        alterarStatusProfissional(cpf, StatusAprovacaoProfissional.REJEITADO, StatusConta.PENDENTE_VERIFICACAO);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "senha-segura-123"
                                }
                                """.formatted(email)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("PROFESSIONAL_REGISTRATION_REJECTED"))
                .andExpect(jsonPath("$.message").value("Seu cadastro profissional foi rejeitado. Entre em contato com o suporte."));
    }

    @Test
    void loginProfissionalAprovadaComVerificacaoAprovadaFunciona() throws Exception {
        String email = "profissional.m1b.login-aprovada@example.com";
        String cpf = proximoCpf();
        cadastrarProfissional(email, cpf);
        aprovarProfissionalParaLogin(cpf);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "senha-segura-123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.usuario.email").value(email))
                .andExpect(jsonPath("$.data.usuario.tipoUsuario").value("PROFISSIONAL"));
    }

    @Test
    void authMeExigeJwt() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void authMeRetornaUsuarioAutenticadoComJwt() throws Exception {
        String email = "cliente.m1b.me@example.com";
        cadastrarCliente(email, "senha-segura-123");
        String token = login(email, "senha-segura-123");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.tipoUsuario").value("CLIENTE"))
                .andExpect(jsonPath("$.data.senhaHash").doesNotExist());
    }

    @Test
    void alterarStatusSemTokenRetorna401() throws Exception {
        mockMvc.perform(patch("/api/v1/usuarios/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusConta": "BLOQUEADA"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void alterarStatusComTokenClienteRetorna403() throws Exception {
        String email = "cliente.m1b.status-403@example.com";
        cadastrarCliente(email, "senha-segura-123");
        String tokenCliente = login(email, "senha-segura-123");

        mockMvc.perform(patch("/api/v1/usuarios/1/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusConta": "BLOQUEADA"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void alterarStatusComTokenAdminRetorna200() throws Exception {
        String email = "cliente.m1b.status-admin@example.com";
        cadastrarCliente(email, "senha-segura-123");
        Long usuarioId = usuarioRepository.findByEmail(email).orElseThrow().getId();
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(patch("/api/v1/usuarios/{id}/status", usuarioId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusConta": "BLOQUEADA"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(usuarioId))
                .andExpect(jsonPath("$.data.statusConta").value("BLOQUEADA"))
                .andExpect(jsonPath("$.data.senhaHash").doesNotExist());

        assertThat(usuarioRepository.findByEmail(email).orElseThrow().getStatusConta().name())
                .isEqualTo("BLOQUEADA");
    }

    @Test
    void adminListaUsuariosComFiltrosSemExporSenha() throws Exception {
        String emailCliente = "cliente.m1b.admin-lista@example.com";
        String emailProfissional = "profissional.m1b.admin-lista@example.com";
        cadastrarCliente(emailCliente, "senha-segura-123");
        cadastrarProfissional(emailProfissional, "333.444.555-66");
        Long clienteId = usuarioRepository.findByEmail(emailCliente).orElseThrow().getId();
        Long profissionalId = usuarioRepository.findByEmail(emailProfissional).orElseThrow().getId();
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(patch("/api/v1/usuarios/{id}/status", clienteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusConta": "BLOQUEADA"
                                }
                                """))
                .andExpect(status().isOk());

        String response = mockMvc.perform(get("/api/v1/usuarios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].senhaHash").doesNotExist())
                .andExpect(jsonPath("$.data[0].senha").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(response).doesNotContain("senhaHash", "password");
        JsonNode cliente = encontrarUsuarioNaLista(response, clienteId);
        assertThat(cliente.path("usuarioId").asLong()).isEqualTo(clienteId);
        assertThat(cliente.path("perfilClienteId").isNumber()).isTrue();
        assertThat(cliente.path("nomeCompleto").asText()).isEqualTo("Cliente Auxiliar");
        assertThat(cliente.path("email").asText()).isEqualTo(emailCliente);
        assertThat(cliente.path("tipoUsuario").asText()).isEqualTo("CLIENTE");
        assertThat(cliente.path("statusConta").asText()).isEqualTo("BLOQUEADA");

        String filtroTipo = mockMvc.perform(get("/api/v1/usuarios")
                        .param("tipoUsuario", "CLIENTE")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemUsuario(filtroTipo, clienteId)).isTrue();
        assertThat(listaContemUsuario(filtroTipo, profissionalId)).isFalse();

        String filtroStatus = mockMvc.perform(get("/api/v1/usuarios")
                        .param("statusConta", "BLOQUEADA")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemUsuario(filtroStatus, clienteId)).isTrue();
        assertThat(listaContemUsuario(filtroStatus, profissionalId)).isFalse();

        String filtroBusca = mockMvc.perform(get("/api/v1/usuarios")
                        .param("search", emailProfissional)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemUsuario(filtroBusca, profissionalId)).isTrue();
        assertThat(listaContemUsuario(filtroBusca, clienteId)).isFalse();
    }

    @Test
    void naoAdminNaoListaUsuarios() throws Exception {
        String email = "cliente.m1b.admin-lista-403@example.com";
        cadastrarCliente(email, "senha-segura-123");
        String tokenCliente = login(email, "senha-segura-123");

        mockMvc.perform(get("/api/v1/usuarios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void adminVisualizaDetalheUsuarioSemExporSenha() throws Exception {
        String email = "cliente.m1b.admin-detalhe@example.com";
        cadastrarCliente(email, "senha-segura-123");
        Long usuarioId = usuarioRepository.findByEmail(email).orElseThrow().getId();
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        String response = mockMvc.perform(get("/api/v1/usuarios/{id}", usuarioId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.usuarioId").value(usuarioId))
                .andExpect(jsonPath("$.data.perfilClienteId").isNumber())
                .andExpect(jsonPath("$.data.nomeCompleto").value("Cliente Auxiliar"))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.tipoUsuario").value("CLIENTE"))
                .andExpect(jsonPath("$.data.senhaHash").doesNotExist())
                .andExpect(jsonPath("$.data.senha").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(response).doesNotContain("senhaHash", "password");
    }

    @Test
    void naoAdminNaoVisualizaDetalheArbitrarioDeUsuario() throws Exception {
        String emailDona = "cliente.m1b.admin-detalhe-dona@example.com";
        String emailOutra = "cliente.m1b.admin-detalhe-outra@example.com";
        cadastrarCliente(emailDona, "senha-segura-123");
        cadastrarCliente(emailOutra, "senha-segura-123");
        Long usuarioId = usuarioRepository.findByEmail(emailDona).orElseThrow().getId();
        String tokenOutraCliente = login(emailOutra, "senha-segura-123");

        mockMvc.perform(get("/api/v1/usuarios/{id}", usuarioId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void endpointsPublicosContinuamPublicos() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "nao-existe@example.com",
                                  "senha": "senha-segura-123"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Publico Cliente",
                                  "email": "cliente.m1b.publico@example.com",
                                  "telefone": "+5551999993333",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  %s
                                }
                                """.formatted(proximoCpf(), camposAceiteJson())))
                .andExpect(status().isCreated());
    }

    private void cadastrarCliente(String email, String senha) throws Exception {
        cadastrarCliente(email, senha, proximoCpf());
    }

    private void cadastrarCliente(String email, String senha, String cpf) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Auxiliar",
                                  "email": "%s",
                                  "telefone": "+5551999994444",
                                  "cpf": "%s",
                                  "senha": "%s",
                                  %s
                                }
                                """.formatted(email, cpf, senha, camposAceiteJson())))
                .andExpect(status().isCreated());
    }

    private void cadastrarProfissional(String email, String cpf) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Profissional Auxiliar",
                                  "email": "%s",
                                  "telefone": "+5551988884444",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional Auxiliar",
                                  "cpf": "%s",
                                  "dataNascimento": "1991-02-15",
                                  %s
                                }
                                """.formatted(email, cpfComPrefixo(cpf), camposAceiteJson())))
                .andExpect(status().isCreated());
    }

    private void alterarStatusProfissional(
            String cpf,
            StatusAprovacaoProfissional statusAprovacao,
            StatusConta statusConta
    ) {
        var perfil = perfilProfissionalRepository.findByCpf(cpfComPrefixo(cpf)).orElseThrow();
        perfil.alterarStatusAprovacao(statusAprovacao);
        perfil.getUsuario().alterarStatusConta(statusConta);
        usuarioRepository.saveAndFlush(perfil.getUsuario());
        perfilProfissionalRepository.saveAndFlush(perfil);
    }

    private void aprovarProfissionalParaLogin(String cpf) {
        Usuario admin = usuarioRepository.findByEmail("admin@leidycleaner.local").orElseThrow();
        var perfil = perfilProfissionalRepository.findByCpf(cpfComPrefixo(cpf)).orElseThrow();
        perfil.alterarStatusAprovacao(StatusAprovacaoProfissional.APROVADO);
        perfil.getUsuario().alterarStatusConta(StatusConta.ATIVA);
        usuarioRepository.saveAndFlush(perfil.getUsuario());

        DocumentoVerificacao documento = new DocumentoVerificacao(
                perfil.getUsuario(),
                "CPF",
                perfil.getCpf(),
                "local/documentos/frente.png",
                "local/documentos/verso.png",
                "local/documentos/selfie.png",
                "local/documentos/comprovante.png"
        );
        documento.analisar(StatusVerificacao.APROVADO, "Liberado para teste", admin);
        documentoVerificacaoRepository.saveAndFlush(documento);
        perfilProfissionalRepository.saveAndFlush(perfil);
    }

    private String formatarCpf(String cpf) {
        return "%s.%s.%s-%s".formatted(
                cpf.substring(0, 3),
                cpf.substring(3, 6),
                cpf.substring(6, 9),
                cpf.substring(9)
        );
    }

    private String login(String email, String senha) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "%s"
                                }
                                """.formatted(email, senha)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode root = objectMapper.readTree(response);
        return root.path("data").path("accessToken").asText();
    }

    private JsonNode encontrarUsuarioNaLista(String response, Long usuarioId) throws Exception {
        JsonNode data = objectMapper.readTree(response).path("data");
        for (JsonNode usuario : data) {
            if (usuario.path("usuarioId").asLong() == usuarioId) {
                return usuario;
            }
        }

        throw new AssertionError("Usuario nao encontrado na lista: " + usuarioId);
    }

    private boolean listaContemUsuario(String response, Long usuarioId) throws Exception {
        JsonNode data = objectMapper.readTree(response).path("data");
        for (JsonNode usuario : data) {
            if (usuario.path("usuarioId").asLong() == usuarioId) {
                return true;
            }
        }

        return false;
    }
}
