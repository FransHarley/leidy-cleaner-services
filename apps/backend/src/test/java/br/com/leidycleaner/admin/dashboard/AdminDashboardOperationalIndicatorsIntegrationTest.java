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

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.creditos.repository.CreditoSolicitacaoRepository;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.enderecos.repository.EnderecoRepository;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminDashboardOperationalIndicatorsIntegrationTest {

    private static final AtomicLong CPF_SEQUENCE = new AtomicLong(89200000000L);

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final UsuarioRepository usuarioRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;
    private final EnderecoRepository enderecoRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ConviteProfissionalRepository conviteProfissionalRepository;
    private final CreditoSolicitacaoRepository creditoSolicitacaoRepository;

    @Autowired
    AdminDashboardOperationalIndicatorsIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            UsuarioRepository usuarioRepository,
            PerfilClienteRepository perfilClienteRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository,
            EnderecoRepository enderecoRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            PagamentoRepository pagamentoRepository,
            ConviteProfissionalRepository conviteProfissionalRepository,
            CreditoSolicitacaoRepository creditoSolicitacaoRepository
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.usuarioRepository = usuarioRepository;
        this.perfilClienteRepository = perfilClienteRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
        this.regiaoAtendimentoRepository = regiaoAtendimentoRepository;
        this.enderecoRepository = enderecoRepository;
        this.solicitacaoFaxinaRepository = solicitacaoFaxinaRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.conviteProfissionalRepository = conviteProfissionalRepository;
        this.creditoSolicitacaoRepository = creditoSolicitacaoRepository;
    }

    @Test
    void indicadoresIncluemContagensOperacionaisDoFluxoPrePago() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        JsonNode antes = buscarIndicadores(tokenAdmin);

        RegiaoAtendimento regiao = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().getFirst();
        PerfilCliente cliente = criarPerfilCliente("dashboard-operacional-cliente");
        Endereco endereco = criarEndereco(cliente.getUsuario());
        PerfilProfissional profissional = criarPerfilProfissional("dashboard-operacional-prof");

        criarSolicitacao(StatusSolicitacao.AGUARDANDO_PAGAMENTO, cliente, endereco, regiao);

        SolicitacaoFaxina solicitacaoPagaAguardandoAceite = criarSolicitacao(
                StatusSolicitacao.PAGA_AGUARDANDO_ACEITE,
                cliente,
                endereco,
                regiao
        );
        Pagamento pagamentoPendenteAceite = criarPagamentoExternoPago(solicitacaoPagaAguardandoAceite, MetodoPagamento.PIX);

        ConviteProfissional conviteVencido = new ConviteProfissional(
                solicitacaoPagaAguardandoAceite,
                profissional,
                OffsetDateTime.now().minusDays(1),
                OffsetDateTime.now().minusMinutes(10)
        );
        conviteProfissionalRepository.saveAndFlush(conviteVencido);

        SolicitacaoFaxina solicitacaoCreditoDisponivel = criarSolicitacao(
                StatusSolicitacao.NAO_ACEITA_CREDITO_GERADO,
                cliente,
                endereco,
                regiao
        );
        Pagamento pagamentoCreditoDisponivel = criarPagamentoExternoPago(solicitacaoCreditoDisponivel, MetodoPagamento.CARTAO_CREDITO);
        creditoSolicitacaoRepository.saveAndFlush(
                CreditoSolicitacao.criarDisponivel(solicitacaoCreditoDisponivel, pagamentoCreditoDisponivel, "Credito disponivel dashboard")
        );

        SolicitacaoFaxina solicitacaoCreditoUtilizadoOrigem = criarSolicitacao(
                StatusSolicitacao.NAO_ACEITA_CREDITO_GERADO,
                cliente,
                endereco,
                regiao
        );
        Pagamento pagamentoCreditoUtilizadoOrigem = criarPagamentoExternoPago(solicitacaoCreditoUtilizadoOrigem, MetodoPagamento.PIX);
        CreditoSolicitacao creditoUtilizado = creditoSolicitacaoRepository.saveAndFlush(
                CreditoSolicitacao.criarDisponivel(
                        solicitacaoCreditoUtilizadoOrigem,
                        pagamentoCreditoUtilizadoOrigem,
                        "Credito utilizado dashboard"
                )
        );
        SolicitacaoFaxina solicitacaoUso = criarSolicitacao(StatusSolicitacao.PAGA_AGUARDANDO_ACEITE, cliente, endereco, regiao);
        creditoUtilizado.marcarUtilizado(solicitacaoUso, OffsetDateTime.now().minusMinutes(5));
        creditoSolicitacaoRepository.saveAndFlush(creditoUtilizado);
        pagamentoRepository.saveAndFlush(Pagamento.criarPagoComCreditoSolicitacao(
                solicitacaoUso,
                creditoUtilizado.getId(),
                OffsetDateTime.now().minusMinutes(5)
        ));

        JsonNode depois = buscarIndicadores(tokenAdmin);

        assertIncremento(antes, depois, "solicitacoesAguardandoPagamento", 1);
        assertIncremento(antes, depois, "solicitacoesPagasAguardandoAceite", 2);
        assertIncremento(antes, depois, "convitesVencidosPendentesProcessamento", 1);
        assertIncremento(antes, depois, "creditosSolicitacaoDisponiveis", 1);
        assertIncremento(antes, depois, "creditosSolicitacaoUtilizados", 1);
        assertIncremento(antes, depois, "pagamentosInternosCreditoSolicitacao", 1);

        org.assertj.core.api.Assertions.assertThat(indicador(depois, "solicitacoesAbertas"))
                .isGreaterThanOrEqualTo(indicador(antes, "solicitacoesAbertas") + 3);
        org.assertj.core.api.Assertions.assertThat(indicador(depois, "pagamentosPendentes"))
                .isGreaterThanOrEqualTo(indicador(antes, "pagamentosPendentes"));
        org.assertj.core.api.Assertions.assertThat(pagamentoPendenteAceite.getStatus())
                .isEqualTo(StatusPagamento.PAGO);
    }

    @Test
    void respostaDoDashboardExposeNovosIndicadores() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/admin/dashboard/indicadores")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.solicitacoesAguardandoPagamento").isNumber())
                .andExpect(jsonPath("$.data.solicitacoesPagasAguardandoAceite").isNumber())
                .andExpect(jsonPath("$.data.convitesVencidosPendentesProcessamento").isNumber())
                .andExpect(jsonPath("$.data.creditosSolicitacaoDisponiveis").isNumber())
                .andExpect(jsonPath("$.data.creditosSolicitacaoUtilizados").isNumber())
                .andExpect(jsonPath("$.data.pagamentosInternosCreditoSolicitacao").isNumber());
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

    private long indicador(JsonNode response, String campo) {
        return response.path("data").path(campo).asLong();
    }

    private void assertIncremento(JsonNode antes, JsonNode depois, String campo, long incremento) {
        org.assertj.core.api.Assertions.assertThat(indicador(depois, campo))
                .isEqualTo(indicador(antes, campo) + incremento);
    }

    private PerfilCliente criarPerfilCliente(String prefixo) {
        Usuario usuario = criarUsuario(prefixo, TipoUsuario.CLIENTE, StatusConta.ATIVA);
        return perfilClienteRepository.saveAndFlush(new PerfilCliente(usuario, null));
    }

    private PerfilProfissional criarPerfilProfissional(String prefixo) {
        Usuario usuario = criarUsuario(prefixo, TipoUsuario.PROFISSIONAL, StatusConta.ATIVA);
        return perfilProfissionalRepository.saveAndFlush(new PerfilProfissional(
                usuario,
                "Profissional " + prefixo,
                String.valueOf(CPF_SEQUENCE.getAndIncrement()),
                LocalDate.of(1992, 4, 18),
                "Perfil para dashboard operacional",
                null,
                5,
                true,
                StatusAprovacaoProfissional.APROVADO
        ));
    }

    private Usuario criarUsuario(String prefixo, TipoUsuario tipoUsuario, StatusConta statusConta) {
        return usuarioRepository.saveAndFlush(new Usuario(
                "Usuario " + prefixo,
                "%s-%s@example.com".formatted(prefixo, suffix()),
                "+5551999" + CPF_SEQUENCE.getAndIncrement(),
                "$2a$10$abcdefghijklmnopqrstuv",
                tipoUsuario,
                statusConta
        ));
    }

    private Endereco criarEndereco(Usuario usuario) {
        return enderecoRepository.saveAndFlush(new Endereco(
                usuario,
                "90000-000",
                "Rua Dashboard Operacional",
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
                OffsetDateTime.now().plusDays(4),
                4,
                TipoServico.FAXINA_RESIDENCIAL,
                "Solicitacao de dashboard operacional",
                BigDecimal.valueOf(210),
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(168)
        );
        ReflectionTestUtils.setField(solicitacao, "status", status);
        return solicitacaoFaxinaRepository.saveAndFlush(solicitacao);
    }

    private Pagamento criarPagamentoExternoPago(SolicitacaoFaxina solicitacao, MetodoPagamento metodoPagamento) {
        Pagamento pagamento = new Pagamento(
                solicitacao,
                GatewayPagamento.ASAAS,
                "pay-dashboard-operacional-" + suffix(),
                metodoPagamento,
                StatusPagamento.PAGO,
                solicitacao.getValorServico(),
                null,
                null,
                "resumo-dashboard"
        );
        ReflectionTestUtils.setField(pagamento, "recebidoEm", OffsetDateTime.now().minusMinutes(15));
        ReflectionTestUtils.setField(pagamento, "valorLiquidoRecebido", solicitacao.getValorServico());
        return pagamentoRepository.saveAndFlush(pagamento);
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
