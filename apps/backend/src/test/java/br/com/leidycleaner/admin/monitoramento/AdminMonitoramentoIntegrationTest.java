package br.com.leidycleaner.admin.monitoramento;

import static br.com.leidycleaner.support.TestAceites.camposAceiteJson;
import static br.com.leidycleaner.support.TestCpf.cpfComPrefixo;
import static br.com.leidycleaner.support.TestCpf.proximoCpf;
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

import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.clientes.entity.PerfilCliente;
import br.com.leidycleaner.clientes.repository.PerfilClienteRepository;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
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
import br.com.leidycleaner.verificacao.entity.DocumentoVerificacao;
import br.com.leidycleaner.verificacao.entity.StatusVerificacao;
import br.com.leidycleaner.verificacao.repository.DocumentoVerificacaoRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminMonitoramentoIntegrationTest {

    private static final AtomicLong CPF_SEQUENCE = new AtomicLong(89000000000L);

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final UsuarioRepository usuarioRepository;
    private final PerfilClienteRepository perfilClienteRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;
    private final DocumentoVerificacaoRepository documentoVerificacaoRepository;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;
    private final EnderecoRepository enderecoRepository;
    private final SolicitacaoFaxinaRepository solicitacaoFaxinaRepository;
    private final PagamentoRepository pagamentoRepository;
    private final CreditoSolicitacaoRepository creditoSolicitacaoRepository;
    private final ConviteProfissionalRepository conviteProfissionalRepository;

    @Autowired
    AdminMonitoramentoIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            UsuarioRepository usuarioRepository,
            PerfilClienteRepository perfilClienteRepository,
            PerfilProfissionalRepository perfilProfissionalRepository,
            DocumentoVerificacaoRepository documentoVerificacaoRepository,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository,
            EnderecoRepository enderecoRepository,
            SolicitacaoFaxinaRepository solicitacaoFaxinaRepository,
            PagamentoRepository pagamentoRepository,
            CreditoSolicitacaoRepository creditoSolicitacaoRepository,
            ConviteProfissionalRepository conviteProfissionalRepository
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
        this.pagamentoRepository = pagamentoRepository;
        this.creditoSolicitacaoRepository = creditoSolicitacaoRepository;
        this.conviteProfissionalRepository = conviteProfissionalRepository;
    }

    @Test
    void adminConsegueListarCreditosSolicitacaoComFiltros() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        RegiaoAtendimento regiao = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().getFirst();
        PerfilCliente cliente = criarPerfilCliente("monitoramento-creditos-cliente");
        Endereco endereco = criarEndereco(cliente.getUsuario());

        SolicitacaoFaxina origemDisponivel = criarSolicitacao(StatusSolicitacao.NAO_ACEITA_CREDITO_GERADO, cliente, endereco, regiao);
        Pagamento pagamentoDisponivel = criarPagamentoExternoPago(origemDisponivel, MetodoPagamento.PIX);
        CreditoSolicitacao creditoDisponivel = creditoSolicitacaoRepository.saveAndFlush(
                CreditoSolicitacao.criarDisponivel(origemDisponivel, pagamentoDisponivel, "Credito disponivel de teste")
        );

        SolicitacaoFaxina origemUtilizado = criarSolicitacao(StatusSolicitacao.NAO_ACEITA_CREDITO_GERADO, cliente, endereco, regiao);
        Pagamento pagamentoUtilizado = criarPagamentoExternoPago(origemUtilizado, MetodoPagamento.CARTAO_CREDITO);
        CreditoSolicitacao creditoUtilizado = creditoSolicitacaoRepository.saveAndFlush(
                CreditoSolicitacao.criarDisponivel(origemUtilizado, pagamentoUtilizado, "Credito utilizado de teste")
        );
        SolicitacaoFaxina solicitacaoUso = criarSolicitacao(StatusSolicitacao.PAGA_AGUARDANDO_ACEITE, cliente, endereco, regiao);
        creditoUtilizado.marcarUtilizado(solicitacaoUso, OffsetDateTime.now().minusHours(1));
        creditoSolicitacaoRepository.saveAndFlush(creditoUtilizado);

        String response = mockMvc.perform(get("/api/v1/admin/creditos-solicitacao")
                        .queryParam("status", "DISPONIVEL")
                        .queryParam("clienteId", cliente.getId().toString())
                        .queryParam("regiaoId", regiao.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(creditoDisponivel.getId()))
                .andExpect(jsonPath("$.data[0].status").value("DISPONIVEL"))
                .andExpect(jsonPath("$.data[0].clienteId").value(cliente.getId()))
                .andExpect(jsonPath("$.data[0].clienteNome").value(cliente.getUsuario().getNomeCompleto()))
                .andExpect(jsonPath("$.data[0].solicitacaoOrigemId").value(origemDisponivel.getId()))
                .andExpect(jsonPath("$.data[0].pagamentoOrigemId").value(pagamentoDisponivel.getId()))
                .andExpect(jsonPath("$.data[0].solicitacaoUsoId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data[0].tipoServico").value(origemDisponivel.getTipoServico().name()))
                .andExpect(jsonPath("$.data[0].duracaoEstimadaHoras").value(origemDisponivel.getDuracaoEstimadaHoras()))
                .andExpect(jsonPath("$.data[0].regiaoId").value(regiao.getId()))
                .andExpect(jsonPath("$.data[0].regiaoNome").value(regiao.getNome()))
                .andExpect(jsonPath("$.data[0].valorReferencia").value(origemDisponivel.getValorServico().doubleValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        org.assertj.core.api.Assertions.assertThat(response)
                .doesNotContain("senhaHash")
                .doesNotContain("payloadResumo")
                .doesNotContain("pixCopiaECola")
                .doesNotContain("saldo");

        OffsetDateTime criadoDe = creditoDisponivel.getCriadoEm().minusMinutes(1).withNano(0);
        OffsetDateTime criadoAte = creditoDisponivel.getCriadoEm().plusMinutes(1).withNano(0);

        mockMvc.perform(get("/api/v1/admin/creditos-solicitacao")
                        .queryParam("status", "DISPONIVEL")
                        .queryParam("clienteId", cliente.getId().toString())
                        .queryParam("criadoDe", criadoDe.toString())
                        .queryParam("criadoAte", criadoAte.toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(creditoDisponivel.getId()));
    }

    @Test
    void adminConsegueVerDetalheCreditoSolicitacao() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        RegiaoAtendimento regiao = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().getFirst();
        PerfilCliente cliente = criarPerfilCliente("monitoramento-detalhe-cliente");
        Endereco endereco = criarEndereco(cliente.getUsuario());

        SolicitacaoFaxina origem = criarSolicitacao(StatusSolicitacao.NAO_ACEITA_CREDITO_GERADO, cliente, endereco, regiao);
        Pagamento pagamentoOrigem = criarPagamentoExternoPago(origem, MetodoPagamento.PIX);
        CreditoSolicitacao credito = creditoSolicitacaoRepository.saveAndFlush(
                CreditoSolicitacao.criarDisponivel(origem, pagamentoOrigem, "Credito detalhado")
        );
        SolicitacaoFaxina uso = criarSolicitacao(StatusSolicitacao.PAGA_AGUARDANDO_ACEITE, cliente, endereco, regiao);
        credito.marcarUtilizado(uso, OffsetDateTime.now().minusMinutes(30));
        creditoSolicitacaoRepository.saveAndFlush(credito);

        String response = mockMvc.perform(get("/api/v1/admin/creditos-solicitacao/{id}", credito.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(credito.getId()))
                .andExpect(jsonPath("$.data.status").value("UTILIZADO"))
                .andExpect(jsonPath("$.data.solicitacaoOrigem.id").value(origem.getId()))
                .andExpect(jsonPath("$.data.solicitacaoOrigem.status").value(origem.getStatus().name()))
                .andExpect(jsonPath("$.data.pagamentoOrigem.id").value(pagamentoOrigem.getId()))
                .andExpect(jsonPath("$.data.pagamentoOrigem.gateway").value("ASAAS"))
                .andExpect(jsonPath("$.data.pagamentoOrigem.gatewayPaymentId").value(pagamentoOrigem.getGatewayPaymentId()))
                .andExpect(jsonPath("$.data.pagamentoOrigem.solicitacaoId").value(origem.getId()))
                .andExpect(jsonPath("$.data.pagamentoOrigem.atendimentoId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data.solicitacaoUso.id").value(uso.getId()))
                .andExpect(jsonPath("$.data.observacao").value("Credito detalhado"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        org.assertj.core.api.Assertions.assertThat(response)
                .doesNotContain("senhaHash")
                .doesNotContain("payloadResumo")
                .doesNotContain("pixCopiaECola")
                .doesNotContain("urlPagamento");
    }

    @Test
    void clienteEProfissionalNaoAcessamMonitoramentoAdmin() throws Exception {
        String tokenCliente = criarClienteELogar("monitoramento.cliente@example.com");
        String tokenProfissional = criarProfissionalELogar("monitoramento.profissional@example.com", "89100000000");

        mockMvc.perform(get("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/admin/creditos-solicitacao")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/admin/convites/monitoramento")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/admin/creditos-solicitacao")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/v1/admin/convites/monitoramento")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void endpointsAdminExigemAutenticacao() throws Exception {
        mockMvc.perform(get("/api/v1/pagamentos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/admin/convites/monitoramento"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/admin/creditos-solicitacao"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void mesmoJwtAdminAcessaAuthMeEPaginasAdminMonitoramento() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("admin@leidycleaner.local"))
                .andExpect(jsonPath("$.data.tipoUsuario").value("ADMIN"))
                .andExpect(jsonPath("$.data.roles[0]").value("ROLE_ADMIN"));

        mockMvc.perform(get("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/v1/admin/convites/monitoramento")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/v1/admin/creditos-solicitacao")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void adminConsegueListarMonitoramentoDeConvitesComFiltros() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        RegiaoAtendimento regiao = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().getFirst();
        PerfilCliente cliente = criarPerfilCliente("monitoramento-convite-cliente");
        Endereco endereco = criarEndereco(cliente.getUsuario());
        PerfilProfissional profissional = criarPerfilProfissional("monitoramento-convite-prof");
        OffsetDateTime agora = OffsetDateTime.now().withNano(0);

        SolicitacaoFaxina solicitacaoPendente = criarSolicitacao(StatusSolicitacao.PAGA_AGUARDANDO_ACEITE, cliente, endereco, regiao);
        Pagamento pagamentoPendente = criarPagamentoExternoPago(solicitacaoPendente, MetodoPagamento.PIX);
        ConviteProfissional convitePendente = conviteProfissionalRepository.saveAndFlush(new ConviteProfissional(
                solicitacaoPendente,
                profissional,
                agora.minusHours(2),
                agora.plusHours(6)
        ));

        SolicitacaoFaxina solicitacaoExpirada = criarSolicitacao(StatusSolicitacao.NAO_ACEITA_CREDITO_GERADO, cliente, endereco, regiao);
        Pagamento pagamentoExpirado = criarPagamentoExternoPago(solicitacaoExpirada, MetodoPagamento.CARTAO_CREDITO);
        ConviteProfissional conviteExpirado = new ConviteProfissional(
                solicitacaoExpirada,
                profissional,
                agora.minusDays(1),
                agora.minusHours(2)
        );
        conviteExpirado.expirar(agora.minusHours(1));
        conviteExpirado = conviteProfissionalRepository.saveAndFlush(conviteExpirado);
        CreditoSolicitacao creditoGerado = creditoSolicitacaoRepository.saveAndFlush(
                CreditoSolicitacao.criarDisponivel(solicitacaoExpirada, pagamentoExpirado, "Credito gerado por expiracao")
        );

        mockMvc.perform(get("/api/v1/admin/convites/monitoramento")
                        .queryParam("status", "ENVIADO")
                        .queryParam("solicitacaoId", solicitacaoPendente.getId().toString())
                        .queryParam("clienteId", cliente.getId().toString())
                        .queryParam("profissionalId", profissional.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].conviteId").value(convitePendente.getId()))
                .andExpect(jsonPath("$.data[0].statusConvite").value("ENVIADO"))
                .andExpect(jsonPath("$.data[0].solicitacaoId").value(solicitacaoPendente.getId()))
                .andExpect(jsonPath("$.data[0].solicitacaoStatus").value("PAGA_AGUARDANDO_ACEITE"))
                .andExpect(jsonPath("$.data[0].clienteId").value(cliente.getId()))
                .andExpect(jsonPath("$.data[0].clienteNome").value(cliente.getUsuario().getNomeCompleto()))
                .andExpect(jsonPath("$.data[0].profissionalId").value(profissional.getId()))
                .andExpect(jsonPath("$.data[0].profissionalNome").value(profissional.getUsuario().getNomeCompleto()))
                .andExpect(jsonPath("$.data[0].pagamentoId").value(pagamentoPendente.getId()))
                .andExpect(jsonPath("$.data[0].pagamentoStatus").value("PAGO"))
                .andExpect(jsonPath("$.data[0].creditoSolicitacaoId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data[0].expirado").value(false));

        String response = mockMvc.perform(get("/api/v1/admin/convites/monitoramento")
                        .queryParam("somenteVencidos", "true")
                        .queryParam("clienteId", cliente.getId().toString())
                        .queryParam("profissionalId", profissional.getId().toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].conviteId").value(conviteExpirado.getId()))
                .andExpect(jsonPath("$.data[0].statusConvite").value("EXPIRADO"))
                .andExpect(jsonPath("$.data[0].solicitacaoId").value(solicitacaoExpirada.getId()))
                .andExpect(jsonPath("$.data[0].solicitacaoStatus").value("NAO_ACEITA_CREDITO_GERADO"))
                .andExpect(jsonPath("$.data[0].pagamentoId").value(pagamentoExpirado.getId()))
                .andExpect(jsonPath("$.data[0].pagamentoStatus").value("PAGO"))
                .andExpect(jsonPath("$.data[0].creditoSolicitacaoId").value(creditoGerado.getId()))
                .andExpect(jsonPath("$.data[0].expirado").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        org.assertj.core.api.Assertions.assertThat(response)
                .doesNotContain("senhaHash")
                .doesNotContain("payloadResumo")
                .doesNotContain("pixCopiaECola");

        mockMvc.perform(get("/api/v1/admin/convites/monitoramento")
                        .queryParam("clienteId", cliente.getId().toString())
                        .queryParam("profissionalId", profissional.getId().toString())
                        .queryParam("expiraDepoisDe", agora.plusHours(1).toString())
                        .queryParam("expiraAntesDe", agora.plusHours(7).toString())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].conviteId").value(convitePendente.getId()))
                .andExpect(jsonPath("$.data[0].statusConvite").value("ENVIADO"));
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
                LocalDate.of(1991, 3, 12),
                "Perfil operacional para monitoramento",
                null,
                4,
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
                "Rua Monitoramento",
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
                OffsetDateTime.now().plusDays(3),
                4,
                TipoServico.FAXINA_RESIDENCIAL,
                "Solicitacao para monitoramento admin",
                BigDecimal.valueOf(220),
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(176)
        );
        ReflectionTestUtils.setField(solicitacao, "status", status);
        return solicitacaoFaxinaRepository.saveAndFlush(solicitacao);
    }

    private Pagamento criarPagamentoExternoPago(SolicitacaoFaxina solicitacao, MetodoPagamento metodoPagamento) {
        Pagamento pagamento = new Pagamento(
                solicitacao,
                GatewayPagamento.ASAAS,
                "pay-admin-monitoramento-" + suffix(),
                metodoPagamento,
                StatusPagamento.PAGO,
                solicitacao.getValorServico(),
                null,
                null,
                "resumo-operacional"
        );
        ReflectionTestUtils.setField(pagamento, "recebidoEm", OffsetDateTime.now().minusHours(1));
        ReflectionTestUtils.setField(pagamento, "valorLiquidoRecebido", solicitacao.getValorServico());
        return pagamentoRepository.saveAndFlush(pagamento);
    }

    private String criarClienteELogar(String email) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Monitoramento",
                                  "email": "%s",
                                  "telefone": "+5551998887777",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  %s
                                }
                                """.formatted(email, proximoCpf(), camposAceiteJson())))
                .andExpect(status().isCreated());

        return login(email, "senha-segura-123");
    }

    private String criarProfissionalELogar(String email, String cpf) throws Exception {
        String cpfNormalizado = cpfComPrefixo(cpf);
        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Profissional Monitoramento",
                                  "email": "%s",
                                  "telefone": "+5551988887777",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional Monitoramento",
                                  "cpf": "%s",
                                  "dataNascimento": "1990-01-20",
                                  %s
                                }
                                """.formatted(email, cpfNormalizado, camposAceiteJson())))
                .andExpect(status().isCreated());

        liberarProfissionalParaLogin(cpfNormalizado);
        return login(email, "senha-segura-123");
    }

    private void liberarProfissionalParaLogin(String cpf) {
        Usuario admin = usuarioRepository.findByEmail("admin@leidycleaner.local").orElseThrow();
        PerfilProfissional perfil = perfilProfissionalRepository.findByCpf(cpf).orElseThrow();
        perfil.alterarStatusAprovacao(StatusAprovacaoProfissional.APROVADO);
        perfil.getUsuario().alterarStatusConta(StatusConta.ATIVA);
        usuarioRepository.saveAndFlush(perfil.getUsuario());
        DocumentoVerificacao documento = new DocumentoVerificacao(
                perfil.getUsuario(),
                "CPF",
                cpf,
                "local/documentos/frente.png",
                "local/documentos/verso.png",
                "local/documentos/selfie.png",
                "local/documentos/comprovante.png"
        );
        documento.analisar(StatusVerificacao.APROVADO, "Liberado para teste", admin);
        documentoVerificacaoRepository.saveAndFlush(documento);
        perfilProfissionalRepository.saveAndFlush(perfil);
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
