package br.com.leidycleaner.admin.dashboard;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.enderecos.repository.EnderecoRepository;
import br.com.leidycleaner.ocorrencias.entity.OcorrenciaAtendimento;
import br.com.leidycleaner.ocorrencias.entity.StatusOcorrencia;
import br.com.leidycleaner.ocorrencias.entity.TipoOcorrencia;
import br.com.leidycleaner.ocorrencias.repository.OcorrenciaAtendimentoRepository;
import br.com.leidycleaner.pagamentos.entity.GatewayPagamento;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.profissionais.entity.PerfilProfissional;
import br.com.leidycleaner.profissionais.entity.StatusAprovacaoProfissional;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.regioes.entity.RegiaoAtendimento;
import br.com.leidycleaner.regioes.repository.RegiaoAtendimentoRepository;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoFaxinaRepository;
import br.com.leidycleaner.usuarios.entity.StatusConta;
import br.com.leidycleaner.usuarios.entity.TipoUsuario;
import br.com.leidycleaner.usuarios.entity.Usuario;
import br.com.leidycleaner.usuarios.repository.UsuarioRepository;
import br.com.leidycleaner.verificacao.entity.DocumentoVerificacao;
import br.com.leidycleaner.verificacao.entity.StatusVerificacao;
import br.com.leidycleaner.verificacao.repository.DocumentoVerificacaoRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminDashboardIntegrationTest {

    private static final AtomicLong CPF_SEQUENCE = new AtomicLong(88000000000L);

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final UsuarioRepository usuarioRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final DocumentoVerificacaoRepository documentoVerificacaoRepository;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;
    private final EnderecoRepository enderecoRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final OcorrenciaAtendimentoRepository ocorrenciaAtendimentoRepository;

    @Autowired
    AdminDashboardIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            UsuarioRepository usuarioRepository,
            PerfilClienteRepository perfilClienteRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            DocumentoVerificacaoRepository documentoVerificacaoRepository,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository,
            EnderecoRepository enderecoRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            PagamentoRepository pagamentoRepository,
            OcorrenciaAtendimentoRepository ocorrenciaAtendimentoRepository
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.usuarioRepository = usuarioRepository;
        this.perfilClienteRepository = perfilClienteRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.documentoVerificacaoRepository = documentoVerificacaoRepository;
        this.regiaoAtendimentoRepository = regiaoAtendimentoRepository;
        this.enderecoRepository = enderecoRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.ocorrenciaAtendimentoRepository = ocorrenciaAtendimentoRepository;
    }

    @Test
    void adminConsegueConsultarIndicadores() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/admin/dashboard/indicadores")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.verificacoesPendentes").isNumber())
                .andExpect(jsonPath("$.data.profissionaisPendentes").isNumber())
                .andExpect(jsonPath("$.data.ocorrenciasAbertas").isNumber())
                .andExpect(jsonPath("$.data.ocorrenciasEmAnalise").isNumber())
                .andExpect(jsonPath("$.data.pagamentosPendentes").isNumber())
                .andExpect(jsonPath("$.data.pagamentosAguardandoConfirmacao").isNumber())
                .andExpect(jsonPath("$.data.pagamentosFalhos").isNumber())
                .andExpect(jsonPath("$.data.atendimentosEmAnalise").isNumber())
                .andExpect(jsonPath("$.data.solicitacoesAbertas").isNumber())
                .andExpect(jsonPath("$.data.usuariosTotal").isNumber());
    }

    @Test
    void usuarioNaoAdminNaoConsegueConsultarIndicadores() throws Exception {
        String tokenCliente = criarClienteELogar("admin.dashboard.cliente@example.com");
        String tokenProfissional = criarProfissionalELogar("admin.dashboard.profissional@example.com", "88100000000");

        mockMvc.perform(get("/api/v1/admin/dashboard/indicadores")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/admin/dashboard/indicadores")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void indicadoresContamSomenteStatusOperacionaisPendentes() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        JsonNode antes = buscarIndicadores(tokenAdmin);

        Usuario admin = usuarioRepository.findByEmail("admin@leidycleaner.local").orElseThrow();
        PerfilCliente cliente = criarPerfilCliente("dashboard-counter-cliente");
        Endereco endereco = criarEndereco(cliente.getUsuario());
        RegiaoAtendimento regiao = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().getFirst();

        criarDocumento(StatusVerificacao.PENDENTE, admin);
        criarDocumento(StatusVerificacao.EM_ANALISE, admin);
        criarDocumento(StatusVerificacao.APROVADO, admin);
        criarDocumento(StatusVerificacao.REJEITADO, admin);

        criarPerfilProfissional("dashboard-counter-prof-pendente", StatusAprovacaoProfissional.PENDENTE);
        criarPerfilProfissional("dashboard-counter-prof-analise", StatusAprovacaoProfissional.EM_ANALISE);
        PerfilProfissional profissionalAprovada = criarPerfilProfissional("dashboard-counter-prof-aprovada", StatusAprovacaoProfissional.APROVADO);
        criarPerfilProfissional("dashboard-counter-prof-rejeitada", StatusAprovacaoProfissional.REJEITADO);

        criarOcorrencia(StatusOcorrencia.ABERTA, cliente, profissionalAprovada, endereco, regiao, admin);
        criarOcorrencia(StatusOcorrencia.EM_ANALISE, cliente, profissionalAprovada, endereco, regiao, admin);
        criarOcorrencia(StatusOcorrencia.RESOLVIDA, cliente, profissionalAprovada, endereco, regiao, admin);
        criarOcorrencia(StatusOcorrencia.CANCELADA, cliente, profissionalAprovada, endereco, regiao, admin);

        criarPagamento(StatusPagamento.PENDENTE, cliente, profissionalAprovada, endereco, regiao);
        criarPagamento(StatusPagamento.AGUARDANDO_CONFIRMACAO, cliente, profissionalAprovada, endereco, regiao);
        criarPagamento(StatusPagamento.FALHOU, cliente, profissionalAprovada, endereco, regiao);
        criarPagamento(StatusPagamento.PAGO, cliente, profissionalAprovada, endereco, regiao);
        criarPagamento(StatusPagamento.CANCELADO, cliente, profissionalAprovada, endereco, regiao);
        criarPagamento(StatusPagamento.ESTORNADO, cliente, profissionalAprovada, endereco, regiao);

        criarAtendimento(StatusAtendimento.EM_ANALISE, cliente, profissionalAprovada, endereco, regiao);
        criarAtendimento(StatusAtendimento.FINALIZADO, cliente, profissionalAprovada, endereco, regiao);
        criarAtendimento(StatusAtendimento.CANCELADO, cliente, profissionalAprovada, endereco, regiao);

        criarSolicitacao(StatusSolicitacao.CRIADA, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.AGUARDANDO_SELECAO, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.CONVITES_ENVIADOS, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.AGUARDANDO_ACEITE, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.ACEITA, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.PAGA, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.EM_EXECUCAO, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.FINALIZADA, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.CANCELADA, cliente, endereco, regiao);
        criarSolicitacao(StatusSolicitacao.EXPIRADA, cliente, endereco, regiao);

        JsonNode depois = buscarIndicadores(tokenAdmin);

        assertIncremento(antes, depois, "verificacoesPendentes", 2);
        assertIncremento(antes, depois, "profissionaisPendentes", 2);
        assertIncremento(antes, depois, "ocorrenciasAbertas", 1);
        assertIncremento(antes, depois, "ocorrenciasEmAnalise", 1);
        assertIncremento(antes, depois, "pagamentosPendentes", 1);
        assertIncremento(antes, depois, "pagamentosAguardandoConfirmacao", 1);
        assertIncremento(antes, depois, "pagamentosFalhos", 1);
        assertIncremento(antes, depois, "atendimentosEmAnalise", 1);
        assertIncremento(antes, depois, "solicitacoesAbertas", 5);
        assertIncremento(antes, depois, "usuariosTotal", 9);
    }

    private void assertIncremento(JsonNode antes, JsonNode depois, String campo, long incremento) {
        org.assertj.core.api.Assertions.assertThat(indicador(depois, campo))
                .isEqualTo(indicador(antes, campo) + incremento);
    }

    private long indicador(JsonNode response, String campo) {
        return response.path("data").path(campo).asLong();
    }

    private JsonNode buscarIndicadores(String tokenAdmin) throws Exception {
        String response = mockMvc.perform(get("/api/v1/admin/dashboard/indicadores")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response);
    }

    private DocumentoVerificacao criarDocumento(StatusVerificacao status, Usuario admin) {
        Usuario usuario = criarUsuario("dashboard-doc", TipoUsuario.PROFISSIONAL, StatusConta.PENDENTE_VERIFICACAO);
        DocumentoVerificacao documento = new DocumentoVerificacao(
                usuario,
                "RG",
                "DOC-" + suffix(),
                "https://example.com/frente.jpg",
                null,
                "https://example.com/selfie.jpg",
                null
        );

        if (status != StatusVerificacao.PENDENTE) {
            documento.analisar(status, "Analise teste", admin);
        }

        return documentoVerificacaoRepository.save(documento);
    }

    private PerfilCliente criarPerfilCliente(String prefixo) {
        Usuario usuario = criarUsuario(prefixo, TipoUsuario.CLIENTE, StatusConta.ATIVA);
        return perfilClienteRepository.save(new PerfilCliente(usuario, null));
    }

    private PerfilProfissional criarPerfilProfissional(String prefixo, StatusAprovacaoProfissional status) {
        Usuario usuario = criarUsuario(prefixo, TipoUsuario.PROFISSIONAL, StatusConta.ATIVA);
        return perfilProfissionalRepository.save(new PerfilProfissional(
                usuario,
                "Profissional " + prefixo,
                String.valueOf(CPF_SEQUENCE.getAndIncrement()),
                LocalDate.of(1990, 1, 10),
                "Perfil para teste de dashboard",
                null,
                3,
                status == StatusAprovacaoProfissional.APROVADO,
                status
        ));
    }

    private Usuario criarUsuario(String prefixo, TipoUsuario tipoUsuario, StatusConta statusConta) {
        return usuarioRepository.save(new Usuario(
                "Usuario " + prefixo,
                "%s-%s@example.com".formatted(prefixo, suffix()),
                "+5551999" + CPF_SEQUENCE.getAndIncrement(),
                "$2a$10$abcdefghijklmnopqrstuv",
                tipoUsuario,
                statusConta
        ));
    }

    private Endereco criarEndereco(Usuario usuario) {
        return enderecoRepository.save(new Endereco(
                usuario,
                "90000-000",
                "Rua Dashboard",
                suffix(),
                null,
                "Centro Historico",
                "Porto Alegre",
                "RS",
                null,
                null,
                true
        ));
    }

    private OcorrenciaAtendimento criarOcorrencia(
            StatusOcorrencia status,
            PerfilCliente cliente,
            PerfilProfissional profissional,
            Endereco endereco,
            RegiaoAtendimento regiao,
            Usuario admin
    ) {
        AtendimentoFaxina atendimento = criarAtendimento(StatusAtendimento.CANCELADO, cliente, profissional, endereco, regiao);
        OcorrenciaAtendimento ocorrencia = new OcorrenciaAtendimento(atendimento, cliente.getUsuario(), TipoOcorrencia.OUTRO, "Ocorrencia teste");

        if (status != StatusOcorrencia.ABERTA) {
            ocorrencia.alterarStatus(status, admin, OffsetDateTime.now());
        }

        return ocorrenciaAtendimentoRepository.save(ocorrencia);
    }

    private Pagamento criarPagamento(
            StatusPagamento status,
            PerfilCliente cliente,
            PerfilProfissional profissional,
            Endereco endereco,
            RegiaoAtendimento regiao
    ) {
        AtendimentoFaxina atendimento = criarAtendimento(StatusAtendimento.CANCELADO, cliente, profissional, endereco, regiao);
        return pagamentoRepository.save(new Pagamento(
                atendimento,
                GatewayPagamento.ASAAS,
                "pay-dashboard-" + suffix(),
                MetodoPagamento.PIX,
                status,
                BigDecimal.valueOf(180),
                null,
                null,
                null
        ));
    }

    private AtendimentoFaxina criarAtendimento(
            StatusAtendimento status,
            PerfilCliente cliente,
            PerfilProfissional profissional,
            Endereco endereco,
            RegiaoAtendimento regiao
    ) {
        SolicitacaoFaxina solicitacao = criarSolicitacao(StatusSolicitacao.FINALIZADA, cliente, endereco, regiao);
        AtendimentoFaxina atendimento = new AtendimentoFaxina(solicitacao, profissional);
        ReflectionTestUtils.setField(atendimento, "status", status);
        return atendimentoFaxinaRepository.save(atendimento);
    }

    private SolicitacaoFaxina criarSolicitacao(
            StatusSolicitacao status,
            PerfilCliente cliente,
            Endereco endereco,
            RegiaoAtendimento regiao
    ) {
        SolicitacaoFaxina solicitacao = new SolicitacaoFaxina(
                cliente,
                endereco,
                regiao,
                OffsetDateTime.now().plusDays(5),
                4,
                TipoServico.FAXINA_RESIDENCIAL,
                null,
                BigDecimal.valueOf(180),
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(144)
        );
        ReflectionTestUtils.setField(solicitacao, "status", status);
        return solicitacaoFaxinaRepository.save(solicitacao);
    }

    private String criarClienteELogar(String email) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Dashboard",
                                  "email": "%s",
                                  "telefone": "+5551998887777",
                                  "senha": "senha-segura-123"
                                }
                                """.formatted(email)))
                .andExpect(status().isCreated());

        return login(email, "senha-segura-123");
    }

    private String criarProfissionalELogar(String email, String cpf) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Profissional Dashboard",
                                  "email": "%s",
                                  "telefone": "+5551988887777",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional Dashboard",
                                  "cpf": "%s",
                                  "dataNascimento": "1990-01-20"
                                }
                                """.formatted(email, cpf)))
                .andExpect(status().isCreated());

        return login(email, "senha-segura-123");
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

        return objectMapper.readTree(response).path("data").path("accessToken").asText();
    }

    private String suffix() {
        return String.valueOf(System.nanoTime());
    }
}
