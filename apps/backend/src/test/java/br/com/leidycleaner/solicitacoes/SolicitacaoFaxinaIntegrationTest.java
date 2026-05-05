package br.com.leidycleaner.solicitacoes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.atendimentos.repository.AtendimentoFaxinaRepository;
import br.com.leidycleaner.atendimentos.repository.CheckpointServicoRepository;
import br.com.leidycleaner.avaliacoes.repository.AvaliacaoProfissionalRepository;
import br.com.leidycleaner.convites.repository.ConviteProfissionalRepository;
import br.com.leidycleaner.enderecos.repository.EnderecoRepository;
import br.com.leidycleaner.pagamentos.gateway.AsaasCheckoutGatewayResponse;
import br.com.leidycleaner.pagamentos.gateway.AsaasGatewayClient;
import br.com.leidycleaner.pagamentos.gateway.AsaasPagamentoGatewayResponse;
import br.com.leidycleaner.pagamentos.repository.PagamentoRepository;
import br.com.leidycleaner.ocorrencias.repository.OcorrenciaAtendimentoRepository;
import br.com.leidycleaner.profissionais.repository.PerfilProfissionalRepository;
import br.com.leidycleaner.regioes.repository.RegiaoAtendimentoRepository;
import br.com.leidycleaner.solicitacoes.repository.SolicitacaoProfissionalSelecionadoRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SolicitacaoFaxinaIntegrationTest {

    private static final String ASAAS_WEBHOOK_TOKEN = "test-webhook-token";

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;
    private final EnderecoRepository enderecoRepository;
    private final SolicitacaoProfissionalSelecionadoRepository solicitacaoProfissionalSelecionadoRepository;
    private final ConviteProfissionalRepository conviteProfissionalRepository;
    private final AtendimentoFaxinaRepository atendimentoFaxinaRepository;
    private final CheckpointServicoRepository checkpointServicoRepository;
    private final AvaliacaoProfissionalRepository avaliacaoProfissionalRepository;
    private final OcorrenciaAtendimentoRepository ocorrenciaAtendimentoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final PerfilProfissionalRepository perfilProfissionalRepository;

    @MockBean
    private AsaasGatewayClient asaasGatewayClient;

    private record ProfissionalConfigurada(Long perfilId, String tokenProfissional) {
    }

    private record AtendimentoCriado(String tokenCliente, String tokenProfissional, Long solicitacaoId, Long atendimentoId) {
    }

    @Autowired
    SolicitacaoFaxinaIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository,
            EnderecoRepository enderecoRepository,
            SolicitacaoProfissionalSelecionadoRepository solicitacaoProfissionalSelecionadoRepository,
            ConviteProfissionalRepository conviteProfissionalRepository,
            AtendimentoFaxinaRepository atendimentoFaxinaRepository,
            CheckpointServicoRepository checkpointServicoRepository,
            AvaliacaoProfissionalRepository avaliacaoProfissionalRepository,
            OcorrenciaAtendimentoRepository ocorrenciaAtendimentoRepository,
            PagamentoRepository pagamentoRepository,
            PerfilProfissionalRepository perfilProfissionalRepository
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.regiaoAtendimentoRepository = regiaoAtendimentoRepository;
        this.enderecoRepository = enderecoRepository;
        this.solicitacaoProfissionalSelecionadoRepository = solicitacaoProfissionalSelecionadoRepository;
        this.conviteProfissionalRepository = conviteProfissionalRepository;
        this.atendimentoFaxinaRepository = atendimentoFaxinaRepository;
        this.checkpointServicoRepository = checkpointServicoRepository;
        this.avaliacaoProfissionalRepository = avaliacaoProfissionalRepository;
        this.ocorrenciaAtendimentoRepository = ocorrenciaAtendimentoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.perfilProfissionalRepository = perfilProfissionalRepository;
    }

    @Test
    void clienteAutenticadaCriaListaVisualizaECancelaSolicitacao() throws Exception {
        String token = criarClienteELogar("m3a.crud@example.com");
        Long enderecoId = criarEndereco(token);
        Long regiaoId = primeiraRegiaoId();

        Long solicitacaoId = criarSolicitacao(token, enderecoId, regiaoId, "FAXINA_RESIDENCIAL");

        mockMvc.perform(get("/api/v1/solicitacoes/minhas")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(solicitacaoId))
                .andExpect(jsonPath("$.data[0].status").value("CRIADA"));

        mockMvc.perform(get("/api/v1/solicitacoes/{id}", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(solicitacaoId))
                .andExpect(jsonPath("$.data.enderecoId").value(enderecoId))
                .andExpect(jsonPath("$.data.regiaoId").value(regiaoId))
                .andExpect(jsonPath("$.data.tipoServico").value("FAXINA_RESIDENCIAL"));

        mockMvc.perform(patch("/api/v1/solicitacoes/{id}/cancelar", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(solicitacaoId))
                .andExpect(jsonPath("$.data.status").value("CANCELADA"));
    }

    @Test
    void clientePodeCriarSolicitacaoComTodosOsTiposDeServicoDocumentados() throws Exception {
        String token = criarClienteELogar("m3a.tipos@example.com");
        Long enderecoId = criarEndereco(token);
        Long regiaoId = primeiraRegiaoId();

        criarSolicitacao(token, enderecoId, regiaoId, "FAXINA_RESIDENCIAL");
        criarSolicitacao(token, enderecoId, regiaoId, "FAXINA_COMERCIAL");
        criarSolicitacao(token, enderecoId, regiaoId, "FAXINA_CONDOMINIO");
        criarSolicitacao(token, enderecoId, regiaoId, "FAXINA_EVENTO");

        mockMvc.perform(get("/api/v1/solicitacoes/minhas")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(4));
    }

    @Test
    void usuarioNaoVisualizaNemCancelaSolicitacaoDeOutraCliente() throws Exception {
        String tokenDona = criarClienteELogar("m3a.dona@example.com");
        String tokenOutra = criarClienteELogar("m3a.outra@example.com");
        Long solicitacaoId = criarSolicitacao(tokenDona, criarEndereco(tokenDona), primeiraRegiaoId(), "FAXINA_RESIDENCIAL");

        mockMvc.perform(get("/api/v1/solicitacoes/{id}", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutra))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("SOLICITACAO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(patch("/api/v1/solicitacoes/{id}/cancelar", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutra))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("SOLICITACAO_NOT_FOUND"));
    }

    @Test
    void adminListaSolicitacoesComFiltros() throws Exception {
        String tokenClienteA = criarClienteELogar("m3b.admin-lista-a@example.com");
        Long regiaoA = primeiraRegiaoId();
        Long solicitacaoA = criarSolicitacao(tokenClienteA, criarEndereco(tokenClienteA), regiaoA, "FAXINA_RESIDENCIAL");

        String tokenClienteB = criarClienteELogar("m3b.admin-lista-b@example.com");
        Long regiaoB = segundaRegiaoId();
        Long solicitacaoB = criarSolicitacao(tokenClienteB, criarEndereco(tokenClienteB), regiaoB, "FAXINA_COMERCIAL");
        mockMvc.perform(patch("/api/v1/solicitacoes/{id}/cancelar", solicitacaoB)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenClienteB))
                .andExpect(status().isOk());

        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        String response = mockMvc.perform(get("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].senhaHash").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode solicitacaoAdmin = encontrarSolicitacaoNaLista(response, solicitacaoA);
        assertThat(solicitacaoAdmin).isNotNull();
        assertThat(solicitacaoAdmin.path("status").asText()).isEqualTo("CRIADA");
        assertThat(solicitacaoAdmin.path("tipoServico").asText()).isEqualTo("FAXINA_RESIDENCIAL");
        assertThat(solicitacaoAdmin.path("regiaoId").asLong()).isEqualTo(regiaoA);

        Long clienteAId = solicitacaoAdmin.path("clienteId").asLong();

        String responseStatus = mockMvc.perform(get("/api/v1/solicitacoes")
                        .param("status", "CRIADA")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemSolicitacao(responseStatus, solicitacaoA)).isTrue();
        assertThat(listaContemSolicitacao(responseStatus, solicitacaoB)).isFalse();

        String responseCliente = mockMvc.perform(get("/api/v1/solicitacoes")
                        .param("clienteId", String.valueOf(clienteAId))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemSolicitacao(responseCliente, solicitacaoA)).isTrue();
        assertThat(listaContemSolicitacao(responseCliente, solicitacaoB)).isFalse();

        String responseRegiao = mockMvc.perform(get("/api/v1/solicitacoes")
                        .param("regiaoId", String.valueOf(regiaoB))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemSolicitacao(responseRegiao, solicitacaoB)).isTrue();
        assertThat(listaContemSolicitacao(responseRegiao, solicitacaoA)).isFalse();

        String responseTipo = mockMvc.perform(get("/api/v1/solicitacoes")
                        .param("tipoServico", "FAXINA_COMERCIAL")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemSolicitacao(responseTipo, solicitacaoB)).isTrue();
        assertThat(listaContemSolicitacao(responseTipo, solicitacaoA)).isFalse();
    }

    @Test
    void naoAdminNaoListaTodasSolicitacoes() throws Exception {
        String tokenCliente = criarClienteELogar("m3b.admin-lista-negado@example.com");

        mockMvc.perform(get("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void adminVisualizaDetalheMasNaoExecutaAcoesDeClienteNaSolicitacao() throws Exception {
        String tokenCliente = criarClienteELogar("m3b.admin-detalhe@example.com");
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), primeiraRegiaoId(), "FAXINA_RESIDENCIAL");
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/solicitacoes/{id}", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(solicitacaoId))
                .andExpect(jsonPath("$.data.status").value("CRIADA"))
                .andExpect(jsonPath("$.data.senhaHash").doesNotExist());

        mockMvc.perform(patch("/api/v1/solicitacoes/{id}/cancelar", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "profissionalIds": [1]
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void profissionalNaoCriaSolicitacaoComoCliente() throws Exception {
        String tokenProfissional = criarProfissionalELogar("m3a.profissional@example.com", "60122233344");
        Long enderecoId = criarEndereco(tokenProfissional);

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacaoJson(enderecoId, primeiraRegiaoId(), "FAXINA_RESIDENCIAL")))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void enderecoSelecionadoDevePertencerAClienteAutenticada() throws Exception {
        String tokenDonaEndereco = criarClienteELogar("m3a.endereco-dona@example.com");
        String tokenOutra = criarClienteELogar("m3a.endereco-outra@example.com");
        Long enderecoDeOutraCliente = criarEndereco(tokenDonaEndereco);

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutra)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacaoJson(enderecoDeOutraCliente, primeiraRegiaoId(), "FAXINA_RESIDENCIAL")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ENDERECO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void criacaoDerivaRegiaoDoBairroDoEnderecoMesmoSemRegiaoEnviada() throws Exception {
        String token = criarClienteELogar("m3a.regiao-derivada@example.com");
        Long enderecoId = criarEnderecoComBairro(token, "Centro Historico");
        Long regiaoCentroHistoricoId = regiaoIdPorNome("Centro Histórico");

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacaoJsonSemRegiao(enderecoId, "FAXINA_RESIDENCIAL")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.enderecoId").value(enderecoId))
                .andExpect(jsonPath("$.data.regiaoId").value(regiaoCentroHistoricoId))
                .andExpect(jsonPath("$.data.regiaoNome").value("Centro Histórico"))
                .andExpect(jsonPath("$.data.bairro").value("Centro Historico"));
    }

    @Test
    void criacaoRejeitaRegiaoEnviadaDiferenteDoBairroDoEndereco() throws Exception {
        String token = criarClienteELogar("m3a.regiao-forjada@example.com");
        Long enderecoId = criarEnderecoComBairro(token, "Centro Histórico");
        Long regiaoCidadeBaixaId = regiaoIdPorNome("Cidade Baixa");

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacaoJson(enderecoId, regiaoCidadeBaixaId, "FAXINA_RESIDENCIAL")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("REGIAO_ENDERECO_INCOMPATIVEL"));
    }

    @Test
    void criacaoRejeitaBairroSemRegiaoAtiva() throws Exception {
        String token = criarClienteELogar("m3a.bairro-sem-atendimento@example.com");
        Long enderecoId = criarEnderecoComBairro(token, "Bairro Fora da Cobertura");

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacaoJsonSemRegiao(enderecoId, "FAXINA_RESIDENCIAL")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("REGIAO_BAIRRO_NAO_ATENDIDA"))
                .andExpect(jsonPath("$.message").value("Ainda nao atendemos este bairro."));
    }

    @Test
    void clienteNaoControlaCamposFinanceirosDaSolicitacao() throws Exception {
        String token = criarClienteELogar("m3a.financeiro-interno@example.com");
        Long enderecoId = criarEnderecoComBairro(token, "Centro Histórico");
        Long regiaoId = regiaoIdPorNome("Centro Histórico");

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "enderecoId": %d,
                                  "regiaoId": %d,
                                  "dataHoraDesejada": "2035-05-10T10:00:00-03:00",
                                  "duracaoEstimadaHoras": 4,
                                  "tipoServico": "FAXINA_RESIDENCIAL",
                                  "observacoes": "Tentativa de controlar valores internos",
                                  "valorServico": 1.00,
                                  "percentualComissaoAgencia": 0.00,
                                  "valorEstimadoProfissional": 1.00
                                }
                                """.formatted(enderecoId, regiaoId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valorServico").value(180.00))
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").value(20.00))
                .andExpect(jsonPath("$.data.valorEstimadoProfissional").value(144.00));
    }

    @Test
    void endpointsDeSolicitacaoExigemJwt() throws Exception {
        mockMvc.perform(get("/api/v1/solicitacoes/minhas"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/solicitacoes"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void validacaoMantemContratoDeErroJson() throws Exception {
        String token = criarClienteELogar("m3a.validacao@example.com");

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "enderecoId": null,
                                  "regiaoId": null,
                                  "dataHoraDesejada": "2020-01-01T10:00:00-03:00",
                                  "duracaoEstimadaHoras": 0,
                                  "tipoServico": null,
                                  "valorServico": null,
                                  "percentualComissaoAgencia": null,
                                  "valorEstimadoProfissional": null
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void clienteDonaListaSomenteProfissionaisElegiveisParaSolicitacao() throws Exception {
        String tokenCliente = criarClienteELogar("m3b.dona@example.com");
        Long regiaoSolicitacaoId = primeiraRegiaoId();
        Long outraRegiaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoSolicitacaoId, "FAXINA_RESIDENCIAL");

        Long elegivelId = criarProfissionalConfigurada(
                "m3b.elegivel@example.com",
                "70122233344",
                "Profissional Elegivel",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        criarProfissionalConfigurada(
                "m3b.conta-inativa@example.com",
                "70222233344",
                "Profissional Conta Inativa",
                "INATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        criarProfissionalConfigurada(
                "m3b.perfil-pendente@example.com",
                "70322233344",
                "Profissional Perfil Pendente",
                "ATIVA",
                "PENDENTE",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        criarProfissionalConfigurada(
                "m3b.verificacao-pendente@example.com",
                "70422233344",
                "Profissional Verificacao Pendente",
                "ATIVA",
                "APROVADO",
                true,
                "PENDENTE",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        criarProfissionalConfigurada(
                "m3b.fora-regiao@example.com",
                "70522233344",
                "Profissional Fora Regiao",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(outraRegiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        criarProfissionalConfigurada(
                "m3b.inativa-chamados@example.com",
                "70622233344",
                "Profissional Chamados Inativos",
                "ATIVA",
                "APROVADO",
                false,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        criarProfissionalConfigurada(
                "m3b.sem-disponibilidade@example.com",
                "70722233344",
                "Profissional Sem Disponibilidade",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "12:30",
                "16:00"
        );

        mockMvc.perform(get("/api/v1/solicitacoes/{id}/profissionais-disponiveis", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].profissionalId").value(elegivelId))
                .andExpect(jsonPath("$.data[0].nomeExibicao").value("Profissional Elegivel"))
                .andExpect(jsonPath("$.data[0].fotoPerfilUrl").doesNotExist())
                .andExpect(jsonPath("$.data[0].experienciaAnos").value(3))
                .andExpect(jsonPath("$.data[0].notaMedia").value(0))
                .andExpect(jsonPath("$.data[0].totalAvaliacoes").value(0));
    }

    @Test
    void clienteDonaListaProfissionaisElegiveisOrdenadasPorNotaTotalENome() throws Exception {
        String tokenCliente = criarClienteELogar("m3b.ordenacao-avaliacoes-cliente@example.com");
        Long regiaoSolicitacaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoSolicitacaoId, "FAXINA_RESIDENCIAL");

        Long melhorNotaId = criarProfissionalConfigurada(
                "m3b.ordenacao-melhor-nota@example.com",
                "76022233344",
                "Zelia Melhor Nota",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        Long maiorTotalId = criarProfissionalConfigurada(
                "m3b.ordenacao-maior-total@example.com",
                "76122233344",
                "Zelia Maior Total",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        Long empateNomeAId = criarProfissionalConfigurada(
                "m3b.ordenacao-ana@example.com",
                "76222233344",
                "Ana Empate Nome",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        Long empateNomeBId = criarProfissionalConfigurada(
                "m3b.ordenacao-bruna@example.com",
                "76322233344",
                "Bruna Empate Nome",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        Long semAvaliacoesId = criarProfissionalConfigurada(
                "m3b.ordenacao-sem-avaliacoes@example.com",
                "76422233344",
                "Carla Sem Avaliacoes",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );

        atualizarAgregadosProfissional(melhorNotaId, "4.90", 2);
        atualizarAgregadosProfissional(maiorTotalId, "4.50", 20);
        atualizarAgregadosProfissional(empateNomeAId, "4.50", 3);
        atualizarAgregadosProfissional(empateNomeBId, "4.50", 3);

        String response = mockMvc.perform(get("/api/v1/solicitacoes/{id}/profissionais-disponiveis", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        List<Long> idsDoTeste = List.of(melhorNotaId, maiorTotalId, empateNomeAId, empateNomeBId, semAvaliacoesId);
        List<Long> idsOrdenadosDoTeste = objectMapper.readTree(response)
                .path("data")
                .findValues("profissionalId")
                .stream()
                .map(JsonNode::asLong)
                .filter(idsDoTeste::contains)
                .toList();

        assertThat(idsOrdenadosDoTeste)
                .containsExactly(melhorNotaId, maiorTotalId, empateNomeAId, empateNomeBId, semAvaliacoesId);
    }

    @Test
    void clienteDonaListaProfissionaisConsiderandoVerificacaoEfetivaMaisRecente() throws Exception {
        String tokenCliente = criarClienteELogar("m3b.verificacao-efetiva-cliente@example.com");
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        Long regiaoSolicitacaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoSolicitacaoId, "FAXINA_RESIDENCIAL");

        ProfissionalConfigurada aprovadaAtual = criarProfissionalConfiguradaComToken(
                "m3b.verificacao-atual-aprovada@example.com",
                "71322233344",
                "Profissional Aprovada Atual",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        ProfissionalConfigurada aprovadaDepoisRejeitada = criarProfissionalConfiguradaComToken(
                "m3b.verificacao-rejeitada@example.com",
                "71422233344",
                "Profissional Rejeitada Atual",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        adicionarDocumentoVerificacaoAnalisado(aprovadaDepoisRejeitada.tokenProfissional(), tokenAdmin, "REJEITADO");

        ProfissionalConfigurada aprovadaDepoisEmAnalise = criarProfissionalConfiguradaComToken(
                "m3b.verificacao-em-analise@example.com",
                "71522233344",
                "Profissional Em Analise Atual",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        adicionarDocumentoVerificacaoAnalisado(aprovadaDepoisEmAnalise.tokenProfissional(), tokenAdmin, "EM_ANALISE");

        ProfissionalConfigurada semAprovacaoEfetiva = criarProfissionalConfiguradaComToken(
                "m3b.verificacao-sem-aprovacao@example.com",
                "71622233344",
                "Profissional Sem Aprovacao Efetiva",
                "ATIVA",
                "APROVADO",
                true,
                "PENDENTE",
                List.of(regiaoSolicitacaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );

        String response = mockMvc.perform(get("/api/v1/solicitacoes/{id}/profissionais-disponiveis", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        List<Long> idsRetornados = objectMapper.readTree(response)
                .path("data")
                .findValues("profissionalId")
                .stream()
                .map(JsonNode::asLong)
                .toList();

        assertThat(idsRetornados)
                .contains(aprovadaAtual.perfilId())
                .doesNotContain(
                        aprovadaDepoisRejeitada.perfilId(),
                        aprovadaDepoisEmAnalise.perfilId(),
                        semAprovacaoEfetiva.perfilId()
                );
    }

    @Test
    void clienteNaoListaProfissionaisDisponiveisDeSolicitacaoDeOutraCliente() throws Exception {
        String tokenDona = criarClienteELogar("m3b.dona-listagem@example.com");
        String tokenOutra = criarClienteELogar("m3b.outra-listagem@example.com");
        Long solicitacaoId = criarSolicitacao(tokenDona, criarEndereco(tokenDona), primeiraRegiaoId(), "FAXINA_RESIDENCIAL");

        mockMvc.perform(get("/api/v1/solicitacoes/{id}/profissionais-disponiveis", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutra))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("SOLICITACAO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void profissionalNaoUsaFluxoClienteParaListarElegiveis() throws Exception {
        String tokenCliente = criarClienteELogar("m3b.cliente-fluxo@example.com");
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), primeiraRegiaoId(), "FAXINA_RESIDENCIAL");
        String tokenProfissional = criarProfissionalELogar("m3b.profissional-fluxo@example.com", "70822233344");

        mockMvc.perform(get("/api/v1/solicitacoes/{id}/profissionais-disponiveis", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void endpointDeProfissionaisDisponiveisExigeJwt() throws Exception {
        mockMvc.perform(get("/api/v1/solicitacoes/1/profissionais-disponiveis"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void clienteDonaPersisteSelecaoValidaDeUmaProfissional() throws Exception {
        String tokenCliente = criarClienteELogar("m3c.selecao-uma-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        Long profissionalId = criarProfissionalConfigurada(
                "m3c.selecao-uma-profissional@example.com",
                "72122233344",
                "Profissional Selecao Uma",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(profissionalId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.solicitacaoId").value(solicitacaoId))
                .andExpect(jsonPath("$.data.selecionados.length()").value(1))
                .andExpect(jsonPath("$.data.selecionados[0].profissionalId").value(profissionalId))
                .andExpect(jsonPath("$.data.selecionados[0].ordemEscolha").value(1));

        mockMvc.perform(get("/api/v1/solicitacoes/{id}", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONVITES_ENVIADOS"));
    }

    @Test
    void clienteDonaPersisteSelecaoValidaDeTresProfissionaisNaOrdemInformada() throws Exception {
        String tokenCliente = criarClienteELogar("m3c.selecao-tres-cliente@example.com");
        Long regiaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        Long primeira = criarProfissionalConfigurada("m3c.ordem-primeira@example.com", "72222233344", "Profissional Ordem Primeira", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        Long segunda = criarProfissionalConfigurada("m3c.ordem-segunda@example.com", "72322233344", "Profissional Ordem Segunda", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        Long terceira = criarProfissionalConfigurada("m3c.ordem-terceira@example.com", "72422233344", "Profissional Ordem Terceira", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(segunda, terceira, primeira))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.selecionados.length()").value(3))
                .andExpect(jsonPath("$.data.selecionados[0].profissionalId").value(segunda))
                .andExpect(jsonPath("$.data.selecionados[0].ordemEscolha").value(1))
                .andExpect(jsonPath("$.data.selecionados[1].profissionalId").value(terceira))
                .andExpect(jsonPath("$.data.selecionados[1].ordemEscolha").value(2))
                .andExpect(jsonPath("$.data.selecionados[2].profissionalId").value(primeira))
                .andExpect(jsonPath("$.data.selecionados[2].ordemEscolha").value(3));

        var persistidos = solicitacaoProfissionalSelecionadoRepository.findBySolicitacaoIdOrderByOrdemEscolhaAsc(solicitacaoId);
        assertThat(persistidos)
                .extracting(selecionado -> selecionado.getProfissional().getId())
                .containsExactly(segunda, terceira, primeira);
        assertThat(persistidos)
                .extracting("ordemEscolha")
                .containsExactly(1, 2, 3);
    }

    @Test
    void clienteDonaSubstituiSelecaoAnteriorAoEnviarNovaSelecao() throws Exception {
        String tokenCliente = criarClienteELogar("m3c.substitui-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        Long primeira = criarProfissionalConfigurada("m3c.substitui-primeira@example.com", "72522233344", "Profissional Substitui Primeira", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        Long segunda = criarProfissionalConfigurada("m3c.substitui-segunda@example.com", "72622233344", "Profissional Substitui Segunda", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        Long terceira = criarProfissionalConfigurada("m3c.substitui-terceira@example.com", "72722233344", "Profissional Substitui Terceira", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");

        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(primeira, segunda));
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(terceira));

        var persistidos = solicitacaoProfissionalSelecionadoRepository.findBySolicitacaoIdOrderByOrdemEscolhaAsc(solicitacaoId);
        assertThat(persistidos).hasSize(1);
        assertThat(persistidos.getFirst().getProfissional().getId()).isEqualTo(terceira);
        assertThat(persistidos.getFirst().getOrdemEscolha()).isEqualTo(1);
    }

    @Test
    void selecaoValidaGeraConvitesEnviadosSemDuplicarAoRegerar() throws Exception {
        String tokenCliente = criarClienteELogar("m4a.gera-convite-cliente@example.com");
        Long regiaoId = regiaoIdPorNome("Centro Histórico");
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada profissional = criarProfissionalConfiguradaComToken(
                "m4a.gera-convite-profissional@example.com",
                "73122233344",
                "Profissional Convite Gerado",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );

        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(profissional.perfilId()));
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(profissional.perfilId()));

        mockMvc.perform(get("/api/v1/convites/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].solicitacaoId").value(solicitacaoId))
                .andExpect(jsonPath("$.data[0].status").value("ENVIADO"))
                .andExpect(jsonPath("$.data[0].tipoServico").value("FAXINA_RESIDENCIAL"))
                .andExpect(jsonPath("$.data[0].bairro").value("Centro Histórico"))
                .andExpect(jsonPath("$.data[0].valorEstimadoProfissional").value(144.00))
                .andExpect(jsonPath("$.data[0].valorServico").doesNotExist())
                .andExpect(jsonPath("$.data[0].percentualComissaoAgencia").doesNotExist())
                .andExpect(jsonPath("$.data[0].expiraEm").exists());

        mockMvc.perform(get("/api/v1/solicitacoes/{id}", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONVITES_ENVIADOS"));
    }

    @Test
    void profissionalConvidadaListaEConsultaApenasSeuConvite() throws Exception {
        String tokenCliente = criarClienteELogar("m4a.detalhe-convite-cliente@example.com");
        Long regiaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada convidada = criarProfissionalConfiguradaComToken(
                "m4a.convidada@example.com",
                "73222233344",
                "Profissional Convidada",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        ProfissionalConfigurada outra = criarProfissionalConfiguradaComToken(
                "m4a.outra-profissional@example.com",
                "73322233344",
                "Profissional Outra",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(convidada.perfilId()));

        Long conviteId = primeiroConviteId(convidada.tokenProfissional());

        mockMvc.perform(get("/api/v1/convites/{id}", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + convidada.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.conviteId").value(conviteId))
                .andExpect(jsonPath("$.data.solicitacaoId").value(solicitacaoId))
                .andExpect(jsonPath("$.data.status").value("ENVIADO"))
                .andExpect(jsonPath("$.data.dataHoraDesejada").exists())
                .andExpect(jsonPath("$.data.valorEstimadoProfissional").value(144.00))
                .andExpect(jsonPath("$.data.valorServico").doesNotExist())
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").doesNotExist());

        mockMvc.perform(get("/api/v1/convites/{id}", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + outra.tokenProfissional()))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CONVITE_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void profissionalConvidadaRecusaProprioConviteSemCriarAtendimento() throws Exception {
        String tokenCliente = criarClienteELogar("m4b.recusa-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada profissional = criarProfissionalConfiguradaComToken(
                "m4b.recusa-profissional@example.com",
                "74122233344",
                "Profissional Recusa",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(profissional.perfilId()));
        Long conviteId = primeiroConviteId(profissional.tokenProfissional());

        mockMvc.perform(post("/api/v1/convites/{id}/recusar", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.conviteId").value(conviteId))
                .andExpect(jsonPath("$.data.conviteStatus").value("RECUSADO"))
                .andExpect(jsonPath("$.data.solicitacaoId").value(solicitacaoId))
                .andExpect(jsonPath("$.data.solicitacaoStatus").value("CONVITES_ENVIADOS"))
                .andExpect(jsonPath("$.data.atendimentoId").doesNotExist());

        assertThat(atendimentoFaxinaRepository.findBySolicitacaoId(solicitacaoId)).isEmpty();
    }

    @Test
    void profissionalNaoRecusaConviteDeOutraProfissional() throws Exception {
        String tokenCliente = criarClienteELogar("m4b.recusa-outra-cliente@example.com");
        Long regiaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada convidada = criarProfissionalConfiguradaComToken("m4b.recusa-dona@example.com", "74222233344", "Profissional Dona Convite", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        ProfissionalConfigurada outra = criarProfissionalConfiguradaComToken("m4b.recusa-outra@example.com", "74322233344", "Profissional Outra Recusa", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(convidada.perfilId()));
        Long conviteId = primeiroConviteId(convidada.tokenProfissional());

        mockMvc.perform(post("/api/v1/convites/{id}/recusar", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + outra.tokenProfissional()))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CONVITE_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void profissionalConvidadaAceitaConviteCriaAtendimentoECancelaConcorrentes() throws Exception {
        String tokenCliente = criarClienteELogar("m4c.aceite-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada vencedora = criarProfissionalConfiguradaComToken("m4c.vencedora@example.com", "74422233344", "Profissional Vencedora", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        ProfissionalConfigurada concorrente = criarProfissionalConfiguradaComToken("m4c.concorrente@example.com", "74522233344", "Profissional Concorrente", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(vencedora.perfilId(), concorrente.perfilId()));
        Long conviteVencedorId = primeiroConviteId(vencedora.tokenProfissional());
        Long conviteConcorrenteId = primeiroConviteId(concorrente.tokenProfissional());

        String response = mockMvc.perform(post("/api/v1/convites/{id}/aceitar", conviteVencedorId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + vencedora.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.conviteId").value(conviteVencedorId))
                .andExpect(jsonPath("$.data.conviteStatus").value("ACEITO"))
                .andExpect(jsonPath("$.data.solicitacaoId").value(solicitacaoId))
                .andExpect(jsonPath("$.data.solicitacaoStatus").value("ACEITA"))
                .andExpect(jsonPath("$.data.atendimentoId").exists())
                .andExpect(jsonPath("$.data.atendimentoStatus").value("AGUARDANDO_PAGAMENTO"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long atendimentoId = objectMapper.readTree(response).path("data").path("atendimentoId").asLong();
        assertThat(atendimentoFaxinaRepository.findBySolicitacaoId(solicitacaoId))
                .isPresent()
                .get()
                .satisfies(atendimento -> {
                    assertThat(atendimento.getId()).isEqualTo(atendimentoId);
                    assertThat(atendimento.getProfissional().getId()).isEqualTo(vencedora.perfilId());
                    assertThat(atendimento.getStatus().name()).isEqualTo("AGUARDANDO_PAGAMENTO");
                });

        mockMvc.perform(get("/api/v1/convites/{id}", conviteConcorrenteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + concorrente.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELADO"));

        mockMvc.perform(get("/api/v1/solicitacoes/{id}", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACEITA"));
    }

    @Test
    void segundaAceitacaoConcorrenteFalhaDepoisQueUmaProfissionalVence() throws Exception {
        String tokenCliente = criarClienteELogar("m4c.segundo-aceite-cliente@example.com");
        Long regiaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada primeira = criarProfissionalConfiguradaComToken("m4c.primeira-aceite@example.com", "74622233344", "Profissional Primeira Aceite", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        ProfissionalConfigurada segunda = criarProfissionalConfiguradaComToken("m4c.segunda-aceite@example.com", "74722233344", "Profissional Segunda Aceite", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(primeira.perfilId(), segunda.perfilId()));

        mockMvc.perform(post("/api/v1/convites/{id}/aceitar", primeiroConviteId(primeira.tokenProfissional()))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primeira.tokenProfissional()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/convites/{id}/aceitar", primeiroConviteId(segunda.tokenProfissional()))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + segunda.tokenProfissional()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CONVITE_STATUS_INCOMPATIVEL"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void conviteExpiradoNaoPodeSerAceito() throws Exception {
        String tokenCliente = criarClienteELogar("m4c.expirado-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada profissional = criarProfissionalConfiguradaComToken("m4c.expirado-profissional@example.com", "74822233344", "Profissional Convite Expirado", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(profissional.perfilId()));
        Long conviteId = primeiroConviteId(profissional.tokenProfissional());
        var convite = conviteProfissionalRepository.findById(conviteId).orElseThrow();
        ReflectionTestUtils.setField(convite, "enviadoEm", OffsetDateTime.now().minusDays(2));
        ReflectionTestUtils.setField(convite, "expiraEm", OffsetDateTime.now().minusDays(1));
        conviteProfissionalRepository.saveAndFlush(convite);

        mockMvc.perform(post("/api/v1/convites/{id}/aceitar", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("CONVITE_EXPIRADO"))
                .andExpect(jsonPath("$.errors").isArray());

        assertThat(atendimentoFaxinaRepository.findBySolicitacaoId(solicitacaoId)).isEmpty();
    }

    @Test
    void endpointsDeRespostaDeConvitesExigemJwt() throws Exception {
        mockMvc.perform(post("/api/v1/convites/1/aceitar"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(post("/api/v1/convites/1/recusar"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void clienteCriaPagamentoParaProprioAtendimentoAguardandoPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.cria-pagamento", "75122233344");
        mockarCriacaoAsaas("pay_m5a_cria", "PENDING", "https://asaas.local/pay_m5a_cria", null);

        String response = mockMvc.perform(post("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pagamentoJson(atendimento.atendimentoId(), "PIX")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.gateway").value("ASAAS"))
                .andExpect(jsonPath("$.data.gatewayPaymentId").value("pay_m5a_cria"))
                .andExpect(jsonPath("$.data.metodoPagamento").value("PIX"))
                .andExpect(jsonPath("$.data.status").value("PENDENTE"))
                .andExpect(jsonPath("$.data.valorBruto").value(180.00))
                .andExpect(jsonPath("$.data.urlPagamento").value("https://asaas.local/pay_m5a_cria"))
                .andExpect(jsonPath("$.data.webhookProcessado").value(false))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long pagamentoId = objectMapper.readTree(response).path("data").path("id").asLong();
        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getId()).isEqualTo(pagamentoId);
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo("pay_m5a_cria");
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                });
    }

    @Test
    void clienteCriaCheckoutParaProprioAtendimentoAguardandoPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.cria-checkout", "75132233344");
        mockarCheckoutAsaas("chk_m5a_cria", "https://asaas.local/checkout/chk_m5a_cria");

        mockMvc.perform(post("/api/v1/pagamentos/checkout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutJson(atendimento.atendimentoId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.checkoutUrl").value("https://asaas.local/checkout/chk_m5a_cria"))
                .andExpect(jsonPath("$.data.valor").value(180.00))
                .andExpect(jsonPath("$.data.descricao").value("Leidy Cleaner Services - atendimento #" + atendimento.atendimentoId()));

        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo("chk_m5a_cria");
                    assertThat(pagamento.getMetodoPagamento().name()).isEqualTo("CARTAO_CREDITO");
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getUrlPagamento()).isEqualTo("https://asaas.local/checkout/chk_m5a_cria");
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
    }

    @Test
    void clienteNaoCriaCheckoutParaAtendimentoDeOutraCliente() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.checkout-nao-dona", "75142233344");
        String tokenOutraCliente = criarClienteELogar("m5a.checkout-outra-cliente@example.com");

        mockMvc.perform(post("/api/v1/pagamentos/checkout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutJson(atendimento.atendimentoId())))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void webhookAsaasSemTokenFalhaEmJson() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CONFIRMED",
                                  "payment": {
                                    "id": "pay_sem_token",
                                    "status": "CONFIRMED"
                                  }
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ASAAS_WEBHOOK_TOKEN_INVALIDO"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void webhookAsaasComTokenInvalidoFalhaAntesDeProcessarPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-token-invalido", "75148233344");
        mockarCriacaoAsaas("pay_m5a_token_invalido", "PENDING", "https://asaas.local/pay_m5a_token_invalido", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", "token-incorreto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ payload-malformado"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ASAAS_WEBHOOK_TOKEN_INVALIDO"))
                .andExpect(jsonPath("$.errors").isArray());

        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void webhookAsaasComEventoNaoSuportadoRetornaOkENaoAlteraPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-evento-ignorado", "75149233344");
        mockarCriacaoAsaas("pay_m5a_evento_ignorado", "PENDING", "https://asaas.local/pay_m5a_evento_ignorado", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CREATED",
                                  "payment": {
                                    "id": "pay_m5a_evento_ignorado",
                                    "status": "PENDING"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void webhookAsaasSemEventRetornaErroControladoENaoAlteraPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-sem-event", "75150233344");
        mockarCriacaoAsaas("pay_m5a_sem_event", "PENDING", "https://asaas.local/pay_m5a_sem_event", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "payment": {
                                    "id": "pay_m5a_sem_event",
                                    "status": "CONFIRMED"
                                  }
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("WEBHOOK_PAYLOAD_INVALIDO"))
                .andExpect(jsonPath("$.errors").isArray());

        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
    }

    @Test
    void webhookAsaasSemPaymentIdRetornaOkENaoAlteraPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-sem-payment-id", "75151233344");
        mockarCriacaoAsaas("pay_m5a_sem_payment_id", "PENDING", "https://asaas.local/pay_m5a_sem_payment_id", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CONFIRMED",
                                  "payment": {
                                    "status": "CONFIRMED"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void webhookCheckoutPagoConfirmaPagamentoEAtendimentoComIdempotencia() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-checkout", "75152233344");
        mockarCheckoutAsaas("chk_m5a_webhook", "https://asaas.local/checkout/chk_m5a_webhook");
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());

        String payload = """
                {
                  "event": "CHECKOUT_PAID",
                  "checkout": {
                    "id": "chk_m5a_webhook"
                  }
                }
                """;

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo("chk_m5a_webhook");
                    assertThat(pagamento.getStatus().name()).isEqualTo("PAGO");
                    assertThat(pagamento.getRecebidoEm()).isNotNull();
                    assertThat(pagamento.isWebhookProcessado()).isTrue();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("CONFIRMADO");
    }

    @Test
    void webhookPaymentConfirmedSemVinculoNaoConfirmaPagamentoCriadoPorCheckout() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-payment-sem-checkout", "75154233344");
        mockarCheckoutAsaas("chk_m5a_payment_sem_checkout", "https://asaas.local/checkout/chk_m5a_payment_sem_checkout");
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CONFIRMED",
                                  "payment": {
                                    "id": "pay_m5a_sem_checkout",
                                    "status": "CONFIRMED"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo("chk_m5a_payment_sem_checkout");
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void webhookPaymentConfirmedComCheckoutSessionConfirmaPagamentoCriadoPorCheckout() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-payment-checkout-session", "75155233344");
        String checkoutId = "57b3b176-9a57-4211-954f-checkout-session";
        mockarCheckoutAsaas(checkoutId, "https://asaas.local/checkout/" + checkoutId);
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());

        String payload = """
                {
                  "event": "PAYMENT_CONFIRMED",
                  "payment": {
                    "id": "pay_7jcmkarih4a3yw5e",
                    "status": "CONFIRMED",
                    "checkoutSession": "%s"
                  }
                }
                """.formatted(checkoutId);

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo(checkoutId);
                    assertThat(pagamento.getStatus().name()).isEqualTo("PAGO");
                    assertThat(pagamento.getRecebidoEm()).isNotNull();
                    assertThat(pagamento.getPayloadResumo()).contains("pay_7jcmkarih4a3yw5e");
                    assertThat(pagamento.getPayloadResumo()).contains(checkoutId);
                    assertThat(pagamento.isWebhookProcessado()).isTrue();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("CONFIRMADO");
    }

    @Test
    void webhookPaymentCreatedComCheckoutSessionNaoConfirmaPagamentoCriadoPorCheckout() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-payment-created-checkout", "75156233344");
        String checkoutId = "chk_m5a_payment_created_checkout";
        mockarCheckoutAsaas(checkoutId, "https://asaas.local/checkout/" + checkoutId);
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CREATED",
                                  "payment": {
                                    "id": "pay_m5a_created_checkout",
                                    "status": "PENDING",
                                    "checkoutSession": "%s"
                                  }
                                }
                                """.formatted(checkoutId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo(checkoutId);
                    assertThat(pagamento.getStatus().name()).isEqualTo("PENDENTE");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void webhookPaymentConfirmedDeCheckoutLocalizaPagamentoPorExternalReferenceComIdempotencia() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-checkout-payment", "75153233344");
        mockarCheckoutAsaas("chk_m5a_payment_confirmed", "https://asaas.local/checkout/chk_m5a_payment_confirmed");
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());

        String payload = """
                {
                  "event": "PAYMENT_CONFIRMED",
                  "payment": {
                    "id": "pay_m5a_payment_confirmed",
                    "status": "CONFIRMED",
                    "externalReference": "atendimento-%d"
                  }
                }
                """.formatted(atendimento.atendimentoId());

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findByAtendimentoId(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getGatewayPaymentId()).isEqualTo("chk_m5a_payment_confirmed");
                    assertThat(pagamento.getStatus().name()).isEqualTo("PAGO");
                    assertThat(pagamento.getRecebidoEm()).isNotNull();
                    assertThat(pagamento.getPayloadResumo()).contains("pay_m5a_payment_confirmed");
                    assertThat(pagamento.isWebhookProcessado()).isTrue();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("CONFIRMADO");
    }

    @Test
    void webhookPaymentConfirmedPorPaymentIdConfirmaPagamentoEAtendimentoSemJwt() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5b.webhook-payment", "75157233344");
        mockarCriacaoAsaas("pay_m5b_confirmado", "PENDING", "https://asaas.local/pay_m5b_confirmado", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CONFIRMED",
                                  "payment": {
                                    "id": "pay_m5b_confirmado",
                                    "status": "CONFIRMED"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("PAGO");
                    assertThat(pagamento.getRecebidoEm()).isNotNull();
                    assertThat(pagamento.isWebhookProcessado()).isTrue();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("CONFIRMADO");
    }

    @Test
    void webhookComPagamentoEExternalReferenceDesconhecidosEhIgnoradoComRespostaEstavel() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_CONFIRMED",
                                  "payment": {
                                    "id": "pay_m5b_inexistente",
                                    "status": "CONFIRMED",
                                    "externalReference": "atendimento-999999999"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void webhookPaymentOverdueMarcaFalhaSemConfirmarAtendimento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.webhook-overdue", "75162233344");
        mockarCriacaoAsaas("pay_m5a_overdue", "PENDING", "https://asaas.local/pay_m5a_overdue", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "PAYMENT_OVERDUE",
                                  "payment": {
                                    "id": "pay_m5a_overdue"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("FALHOU");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void profissionalDesignadaIniciaAtendimentoConfirmadoECriaCheckpointInicio() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.iniciar", "76152233344", "chk_m6a_iniciar");

        mockMvc.perform(post("/api/v1/atendimentos/{id}/iniciar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/inicio.png", "Inicio registrado pela profissional")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.status").value("EM_EXECUCAO"))
                .andExpect(jsonPath("$.data.valorEstimadoProfissional").value(144.00))
                .andExpect(jsonPath("$.data.valorServico").doesNotExist())
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").doesNotExist())
                .andExpect(jsonPath("$.data.inicioRealEm").isNotEmpty());

        assertThat(checkpointServicoRepository.findByAtendimentoIdOrderByRegistradoEmAscIdAsc(atendimento.atendimentoId()))
                .hasSize(1)
                .first()
                .satisfies(checkpoint -> {
                    assertThat(checkpoint.getTipo().name()).isEqualTo("INICIO");
                    assertThat(checkpoint.getFotoComprovacaoUrl()).isEqualTo("local/checkpoints/inicio.png");
                    assertThat(checkpoint.getObservacao()).isEqualTo("Inicio registrado pela profissional");
                    assertThat(checkpoint.getRegistradoPor().getId()).isNotNull();
                });
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(atendimentoPersistido -> {
                    assertThat(atendimentoPersistido.getStatus().name()).isEqualTo("EM_EXECUCAO");
                    assertThat(atendimentoPersistido.getInicioRealEm()).isNotNull();
                    assertThat(atendimentoPersistido.getFimRealEm()).isNull();
                });
    }

    @Test
    void profissionalDesignadaNaoIniciaAtendimentoDuasVezes() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.iniciar-duas-vezes", "76153233344", "chk_m6a_iniciar_duas");
        iniciarAtendimento(atendimento);

        mockMvc.perform(post("/api/v1/atendimentos/{id}/iniciar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/inicio-duplicado.png", "Inicio duplicado")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_JA_INICIADO"))
                .andExpect(jsonPath("$.errors").isArray());

        assertThat(checkpointServicoRepository.findByAtendimentoIdOrderByRegistradoEmAscIdAsc(atendimento.atendimentoId()))
                .hasSize(1)
                .first()
                .extracting(checkpoint -> checkpoint.getTipo().name())
                .isEqualTo("INICIO");
    }

    @Test
    void profissionalDesignadaNaoFinalizaAntesDeIniciar() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.finalizar-sem-inicio", "76154233344", "chk_m6a_finalizar_sem_inicio");

        mockMvc.perform(post("/api/v1/atendimentos/{id}/finalizar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/fim.png", "Fim antecipado")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NAO_INICIADO"))
                .andExpect(jsonPath("$.errors").isArray());

        assertThat(checkpointServicoRepository.findByAtendimentoIdOrderByRegistradoEmAscIdAsc(atendimento.atendimentoId()))
                .isEmpty();
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("CONFIRMADO");
    }

    @Test
    void profissionalDesignadaFinalizaAtendimentoEmExecucaoECriaCheckpointFim() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.finalizar", "76155233344", "chk_m6a_finalizar");
        iniciarAtendimento(atendimento);

        mockMvc.perform(post("/api/v1/atendimentos/{id}/finalizar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/fim.png", "Servico finalizado")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.status").value("FINALIZADO"))
                .andExpect(jsonPath("$.data.valorEstimadoProfissional").value(144.00))
                .andExpect(jsonPath("$.data.valorServico").doesNotExist())
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").doesNotExist())
                .andExpect(jsonPath("$.data.fimRealEm").isNotEmpty());

        assertThat(checkpointServicoRepository.findByAtendimentoIdOrderByRegistradoEmAscIdAsc(atendimento.atendimentoId()))
                .hasSize(2)
                .extracting(checkpoint -> checkpoint.getTipo().name())
                .containsExactly("INICIO", "FIM");
        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .satisfies(atendimentoPersistido -> {
                    assertThat(atendimentoPersistido.getStatus().name()).isEqualTo("FINALIZADO");
                    assertThat(atendimentoPersistido.getInicioRealEm()).isNotNull();
                    assertThat(atendimentoPersistido.getFimRealEm()).isNotNull();
                });
    }

    @Test
    void profissionalDesignadaNaoFinalizaAtendimentoDuasVezes() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.finalizar-duas-vezes", "76156233344", "chk_m6a_finalizar_duas");
        iniciarAtendimento(atendimento);
        finalizarAtendimento(atendimento);

        mockMvc.perform(post("/api/v1/atendimentos/{id}/finalizar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/fim-duplicado.png", "Fim duplicado")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_JA_FINALIZADO"))
                .andExpect(jsonPath("$.errors").isArray());

        assertThat(checkpointServicoRepository.findByAtendimentoIdOrderByRegistradoEmAscIdAsc(atendimento.atendimentoId()))
                .hasSize(2)
                .extracting(checkpoint -> checkpoint.getTipo().name())
                .containsExactly("INICIO", "FIM");
    }

    @Test
    void profissionalNaoRelacionadaNaoIniciaNemFinalizaAtendimentoDeOutraProfissional() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.profissional-nao-relacionada", "76157233344", "chk_m6a_profissional_nao_relacionada");
        String tokenOutraProfissional = criarProfissionalELogar("m6a.outra-profissional@example.com", "76158233344");

        mockMvc.perform(post("/api/v1/atendimentos/{id}/iniciar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/inicio.png", "Tentativa indevida")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());

        iniciarAtendimento(atendimento);

        mockMvc.perform(post("/api/v1/atendimentos/{id}/finalizar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/fim.png", "Tentativa indevida")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void clienteListaEVisualizaProprioAtendimento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.cliente-lista", "76159233344", "chk_m6a_cliente_lista");

        mockMvc.perform(get("/api/v1/atendimentos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data[0].status").value("CONFIRMADO"));

        mockMvc.perform(get("/api/v1/atendimentos/{id}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.status").value("CONFIRMADO"));
    }

    @Test
    void profissionalListaEVisualizaAtendimentoAtribuido() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.profissional-lista", "76160233344", "chk_m6a_profissional_lista");

        mockMvc.perform(get("/api/v1/atendimentos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data[0].status").value("CONFIRMADO"))
                .andExpect(jsonPath("$.data[0].valorEstimadoProfissional").value(144.00))
                .andExpect(jsonPath("$.data[0].valorServico").doesNotExist())
                .andExpect(jsonPath("$.data[0].percentualComissaoAgencia").doesNotExist());

        mockMvc.perform(get("/api/v1/atendimentos/{id}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.status").value("CONFIRMADO"))
                .andExpect(jsonPath("$.data.valorEstimadoProfissional").value(144.00))
                .andExpect(jsonPath("$.data.valorServico").doesNotExist())
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").doesNotExist());
    }

    @Test
    void usuarioNaoRelacionadoNaoVisualizaAtendimentoNemCheckpoints() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6a.nao-relacionado", "76161233344", "chk_m6a_nao_relacionado");
        iniciarAtendimento(atendimento);
        String tokenOutroCliente = criarClienteELogar("m6a.outro-cliente@example.com");

        mockMvc.perform(get("/api/v1/atendimentos/{id}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutroCliente))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(get("/api/v1/atendimentos/{id}/checkpoints", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutroCliente))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void adminListaAtendimentosComFiltros() throws Exception {
        AtendimentoCriado atendimentoConfirmado = criarAtendimentoConfirmado(
                "m6b.admin-lista-confirmado",
                "76211233344",
                "chk_m6b_admin_lista_confirmado"
        );
        AtendimentoCriado atendimentoFinalizado = criarAtendimentoFinalizado(
                "m6b.admin-lista-finalizado",
                "76212233344",
                "chk_m6b_admin_lista_finalizado"
        );
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        String listaResponse = mockMvc.perform(get("/api/v1/atendimentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode atendimentoNode = encontrarAtendimentoNaLista(listaResponse, atendimentoConfirmado.atendimentoId());
        assertThat(atendimentoNode).isNotNull();
        assertThat(atendimentoNode.path("status").asText()).isEqualTo("CONFIRMADO");
        assertThat(atendimentoNode.path("percentualComissaoAgencia").asText()).isNotBlank();
        assertThat(listaContemAtendimento(listaResponse, atendimentoFinalizado.atendimentoId())).isTrue();

        Long clienteId = atendimentoNode.path("clienteId").asLong();
        Long profissionalId = atendimentoNode.path("profissionalId").asLong();

        String listaPorStatus = mockMvc.perform(get("/api/v1/atendimentos")
                        .param("status", "CONFIRMADO")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemAtendimento(listaPorStatus, atendimentoConfirmado.atendimentoId())).isTrue();
        assertThat(listaContemAtendimento(listaPorStatus, atendimentoFinalizado.atendimentoId())).isFalse();

        String listaPorCliente = mockMvc.perform(get("/api/v1/atendimentos")
                        .param("clienteId", String.valueOf(clienteId))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemAtendimento(listaPorCliente, atendimentoConfirmado.atendimentoId())).isTrue();

        String listaPorProfissional = mockMvc.perform(get("/api/v1/atendimentos")
                        .param("profissionalId", String.valueOf(profissionalId))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemAtendimento(listaPorProfissional, atendimentoConfirmado.atendimentoId())).isTrue();
    }

    @Test
    void naoAdminNaoListaTodosAtendimentos() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6b.admin-lista-negado", "76213233344", "chk_m6b_admin_lista_negado");

        mockMvc.perform(get("/api/v1/atendimentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void adminVisualizaDetalheECheckpointsDoAtendimento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m6b.admin-detalhe", "76214233344", "chk_m6b_admin_detalhe");
        iniciarAtendimento(atendimento);
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/atendimentos/{id}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.status").value("EM_EXECUCAO"))
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").isNotEmpty());

        mockMvc.perform(get("/api/v1/atendimentos/{id}/checkpoints", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data[0].tipo").value("INICIO"));
    }

    @Test
    void endpointsDeAtendimentoExigemJwt() throws Exception {
        mockMvc.perform(get("/api/v1/atendimentos/meus"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/atendimentos/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/atendimentos/1/checkpoints"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/atendimentos"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(post("/api/v1/atendimentos/1/iniciar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson(null, null)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(post("/api/v1/atendimentos/1/finalizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson(null, null)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void clienteAvaliaAtendimentoFinalizadoEAtualizaAgregados() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoFinalizado("m8.avalia", "77152233344", "chk_m8_avalia");
        Long profissionalId = buscarMeuPerfilProfissionalId(atendimento.tokenProfissional());

        String response = mockMvc.perform(post("/api/v1/avaliacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(atendimento.atendimentoId(), 5, "Atendimento excelente")))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.profissionalId").value(profissionalId))
                .andExpect(jsonPath("$.data.nota").value(5))
                .andExpect(jsonPath("$.data.comentario").value("Atendimento excelente"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long avaliacaoId = objectMapper.readTree(response).path("data").path("avaliacaoId").asLong();
        assertThat(avaliacaoProfissionalRepository.findById(avaliacaoId)).isPresent();
        assertThat(avaliacaoProfissionalRepository.countByProfissionalId(profissionalId)).isEqualTo(1);

        String perfilResponse = mockMvc.perform(get("/api/v1/profissionais/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAvaliacoes").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(objectMapper.readTree(perfilResponse).path("data").path("notaMedia").decimalValue())
                .isEqualByComparingTo("5.00");

        mockMvc.perform(get("/api/v1/profissionais/{id}/avaliacoes", profissionalId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].avaliacaoId").value(avaliacaoId))
                .andExpect(jsonPath("$.data[0].atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data[0].nota").value(5));
    }

    @Test
    void clienteNaoAvaliaAtendimentoAntesDeFinalizar() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m8.nao-finalizado", "77153233344", "chk_m8_nao_finalizado");

        mockMvc.perform(post("/api/v1/avaliacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(atendimento.atendimentoId(), 5, "Ainda nao finalizado")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NAO_FINALIZADO"))
                .andExpect(jsonPath("$.errors").isArray());

        Long profissionalId = buscarMeuPerfilProfissionalId(atendimento.tokenProfissional());
        assertThat(avaliacaoProfissionalRepository.countByProfissionalId(profissionalId)).isZero();
    }

    @Test
    void clienteNaoAvaliaAtendimentoDeOutraCliente() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoFinalizado("m8.outra-cliente", "77154233344", "chk_m8_outra_cliente");
        String tokenOutraCliente = criarClienteELogar("m8.outra-cliente-nao-dona@example.com");

        mockMvc.perform(post("/api/v1/avaliacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(atendimento.atendimentoId(), 5, "Tentativa indevida")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void avaliacaoDuplicadaDoMesmoAtendimentoERejeitada() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoFinalizado("m8.duplicada", "77155233344", "chk_m8_duplicada");
        criarAvaliacao(atendimento.tokenCliente(), atendimento.atendimentoId(), 5, "Primeira avaliacao");

        mockMvc.perform(post("/api/v1/avaliacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(atendimento.atendimentoId(), 4, "Segunda avaliacao")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("AVALIACAO_JA_EXISTE"))
                .andExpect(jsonPath("$.errors").isArray());

        Long profissionalId = buscarMeuPerfilProfissionalId(atendimento.tokenProfissional());
        assertThat(avaliacaoProfissionalRepository.countByProfissionalId(profissionalId)).isEqualTo(1);
    }

    @Test
    void notaForaDoIntervaloERejeitadaEmJson() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoFinalizado("m8.nota-invalida", "77156233344", "chk_m8_nota_invalida");

        mockMvc.perform(post("/api/v1/avaliacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(atendimento.atendimentoId(), 6, "Nota invalida")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());

        Long profissionalId = buscarMeuPerfilProfissionalId(atendimento.tokenProfissional());
        assertThat(avaliacaoProfissionalRepository.countByProfissionalId(profissionalId)).isZero();
    }

    @Test
    void avaliacoesRecalculamMediaTotalEListamPorProfissional() throws Exception {
        Long regiaoId = ultimaRegiaoId();
        ProfissionalConfigurada profissional = criarProfissionalConfiguradaComToken(
                "m8.agregados-profissional@example.com",
                "77157233344",
                "Profissional Agregados",
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        AtendimentoCriado primeiro = criarAtendimentoFinalizadoComProfissional(
                "m8.agregados-primeiro",
                regiaoId,
                profissional,
                "chk_m8_agregados_primeiro"
        );
        AtendimentoCriado segundo = criarAtendimentoFinalizadoComProfissional(
                "m8.agregados-segundo",
                regiaoId,
                profissional,
                "chk_m8_agregados_segundo"
        );

        criarAvaliacao(primeiro.tokenCliente(), primeiro.atendimentoId(), 5, "Excelente");
        criarAvaliacao(segundo.tokenCliente(), segundo.atendimentoId(), 3, "Regular");

        String perfilResponse = mockMvc.perform(get("/api/v1/profissionais/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAvaliacoes").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(objectMapper.readTree(perfilResponse).path("data").path("notaMedia").decimalValue())
                .isEqualByComparingTo("4.00");

        mockMvc.perform(get("/api/v1/profissionais/{id}/avaliacoes", profissional.perfilId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + primeiro.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].atendimentoId").value(segundo.atendimentoId()))
                .andExpect(jsonPath("$.data[0].nota").value(3))
                .andExpect(jsonPath("$.data[1].atendimentoId").value(primeiro.atendimentoId()))
                .andExpect(jsonPath("$.data[1].nota").value(5));
    }

    @Test
    void endpointsDeAvaliacaoExigemJwt() throws Exception {
        mockMvc.perform(post("/api/v1/avaliacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(1L, 5, "Sem jwt")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/profissionais/1/avaliacoes"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void clienteRelacionadaAbreOcorrenciaParaProprioAtendimento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-cliente", "78152233344", "chk_m9_ocorrencia_cliente");
        Long usuarioClienteId = buscarUsuarioAutenticadoId(atendimento.tokenCliente());

        String response = mockMvc.perform(post("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ocorrenciaJson(atendimento.atendimentoId(), "ATRASO", "Profissional atrasou para o atendimento")))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.abertoPorUsuarioId").value(usuarioClienteId))
                .andExpect(jsonPath("$.data.tipo").value("ATRASO"))
                .andExpect(jsonPath("$.data.status").value("ABERTA"))
                .andExpect(jsonPath("$.data.resolvidoEm").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long ocorrenciaId = objectMapper.readTree(response).path("data").path("id").asLong();
        assertThat(ocorrenciaAtendimentoRepository.findById(ocorrenciaId))
                .isPresent()
                .get()
                .satisfies(ocorrencia -> {
                    assertThat(ocorrencia.getAtendimento().getId()).isEqualTo(atendimento.atendimentoId());
                    assertThat(ocorrencia.getAbertoPor().getId()).isEqualTo(usuarioClienteId);
                    assertThat(ocorrencia.getStatus().name()).isEqualTo("ABERTA");
                });
    }

    @Test
    void profissionalRelacionadaAbreOcorrenciaParaAtendimentoAtribuido() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-profissional", "78153233344", "chk_m9_ocorrencia_profissional");
        Long usuarioProfissionalId = buscarUsuarioAutenticadoId(atendimento.tokenProfissional());

        mockMvc.perform(post("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ocorrenciaJson(atendimento.atendimentoId(), "CONDUTA", "Cliente nao permitiu acesso ao local")))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.abertoPorUsuarioId").value(usuarioProfissionalId))
                .andExpect(jsonPath("$.data.tipo").value("CONDUTA"))
                .andExpect(jsonPath("$.data.status").value("ABERTA"));
    }

    @Test
    void usuarioNaoRelacionadoNaoAbreOcorrencia() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-nao-relacionada", "78154233344", "chk_m9_ocorrencia_nao_relacionada");
        String tokenOutraCliente = criarClienteELogar("m9.ocorrencia-outra-cliente@example.com");

        mockMvc.perform(post("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ocorrenciaJson(atendimento.atendimentoId(), "OUTRO", "Tentativa sem relacao")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void usuarioListaSomenteOcorrenciasAbertasPorEle() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-meus", "78155233344", "chk_m9_ocorrencia_meus");
        Long ocorrenciaClienteId = criarOcorrencia(
                atendimento.tokenCliente(),
                atendimento.atendimentoId(),
                "QUALIDADE_SERVICO",
                "Cliente abriu ocorrencia de qualidade"
        );
        Long ocorrenciaProfissionalId = criarOcorrencia(
                atendimento.tokenProfissional(),
                atendimento.atendimentoId(),
                "OUTRO",
                "Profissional abriu outra ocorrencia"
        );

        mockMvc.perform(get("/api/v1/ocorrencias/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(ocorrenciaClienteId))
                .andExpect(jsonPath("$.data[0].id").value(org.hamcrest.Matchers.not(ocorrenciaProfissionalId)));
    }

    @Test
    void usuarioRelacionadoVisualizaDetalheDaOcorrencia() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-detalhe", "78156233344", "chk_m9_ocorrencia_detalhe");
        Long ocorrenciaId = criarOcorrencia(
                atendimento.tokenCliente(),
                atendimento.atendimentoId(),
                "PAGAMENTO",
                "Cliente abriu ocorrencia de pagamento"
        );

        mockMvc.perform(get("/api/v1/ocorrencias/{id}", ocorrenciaId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(ocorrenciaId))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.tipo").value("PAGAMENTO"));
    }

    @Test
    void usuarioNaoRelacionadoNaoVisualizaDetalheDaOcorrencia() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-detalhe-negado", "78157233344", "chk_m9_ocorrencia_detalhe_negado");
        Long ocorrenciaId = criarOcorrencia(
                atendimento.tokenCliente(),
                atendimento.atendimentoId(),
                "OUTRO",
                "Ocorrencia restrita aos relacionados"
        );
        String tokenOutroCliente = criarClienteELogar("m9.ocorrencia-detalhe-outra@example.com");

        mockMvc.perform(get("/api/v1/ocorrencias/{id}", ocorrenciaId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutroCliente))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("OCORRENCIA_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void adminListaEAlteraStatusDaOcorrencia() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-admin", "78158233344", "chk_m9_ocorrencia_admin");
        Long ocorrenciaId = criarOcorrencia(
                atendimento.tokenCliente(),
                atendimento.atendimentoId(),
                "AUSENCIA",
                "Profissional nao compareceu"
        );
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        Long adminUsuarioId = buscarUsuarioAutenticadoId(tokenAdmin);

        String listaResponse = mockMvc.perform(get("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        List<Long> idsRetornados = objectMapper.readTree(listaResponse)
                .path("data")
                .findValues("id")
                .stream()
                .map(JsonNode::asLong)
                .toList();
        assertThat(idsRetornados).contains(ocorrenciaId);

        mockMvc.perform(patch("/api/v1/ocorrencias/{id}/status", ocorrenciaId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusOcorrenciaJson("RESOLVIDA")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(ocorrenciaId))
                .andExpect(jsonPath("$.data.status").value("RESOLVIDA"))
                .andExpect(jsonPath("$.data.resolvidoEm").isNotEmpty())
                .andExpect(jsonPath("$.data.resolvidoPorUsuarioId").value(adminUsuarioId));

        assertThat(ocorrenciaAtendimentoRepository.findById(ocorrenciaId))
                .isPresent()
                .get()
                .satisfies(ocorrencia -> {
                    assertThat(ocorrencia.getStatus().name()).isEqualTo("RESOLVIDA");
                    assertThat(ocorrencia.getResolvidoEm()).isNotNull();
                    assertThat(ocorrencia.getResolvidoPor().getId()).isEqualTo(adminUsuarioId);
                });
    }

    @Test
    void rotasAdminDeOcorrenciaExigemPerfilAdmin() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado("m9.ocorrencia-admin-negado", "78159233344", "chk_m9_ocorrencia_admin_negado");
        Long ocorrenciaId = criarOcorrencia(
                atendimento.tokenCliente(),
                atendimento.atendimentoId(),
                "OUTRO",
                "Ocorrencia para teste de admin"
        );

        mockMvc.perform(get("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(patch("/api/v1/ocorrencias/{id}/status", ocorrenciaId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusOcorrenciaJson("EM_ANALISE")))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void validacaoDeOcorrenciaMantemContratoJson() throws Exception {
        String tokenCliente = criarClienteELogar("m9.ocorrencia-validacao@example.com");

        mockMvc.perform(post("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "atendimentoId": null,
                                  "tipo": null,
                                  "descricao": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void endpointsDeOcorrenciaExigemJwt() throws Exception {
        mockMvc.perform(post("/api/v1/ocorrencias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ocorrenciaJson(1L, "OUTRO", "Sem jwt")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/ocorrencias/meus"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/ocorrencias/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/ocorrencias"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(patch("/api/v1/ocorrencias/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusOcorrenciaJson("EM_ANALISE")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void criacaoDuplicadaDePagamentoParaMesmoAtendimentoERejeitada() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.duplicado", "75222233344");
        mockarCriacaoAsaas("pay_m5a_duplicado", "PENDING", "https://asaas.local/pay_m5a_duplicado", null);
        criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(post("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pagamentoJson(atendimento.atendimentoId(), "PIX")))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("PAGAMENTO_JA_EXISTE"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void clienteNaoCriaPagamentoParaAtendimentoDeOutraCliente() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.nao-dona", "75322233344");
        String tokenOutraCliente = criarClienteELogar("m5a.outra-cliente@example.com");

        mockMvc.perform(post("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pagamentoJson(atendimento.atendimentoId(), "PIX")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ATENDIMENTO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void clienteConsultaPagamentoPorIdEPeloAtendimento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.consulta", "75422233344");
        mockarCriacaoAsaas("pay_m5a_consulta", "PENDING", "https://asaas.local/pay_m5a_consulta", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "BOLETO");

        mockMvc.perform(get("/api/v1/pagamentos/{id}", pagamentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(pagamentoId))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.metodoPagamento").value("BOLETO"));

        mockMvc.perform(get("/api/v1/pagamentos/atendimento/{atendimentoId}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(pagamentoId))
                .andExpect(jsonPath("$.data.gatewayPaymentId").value("pay_m5a_consulta"));
    }

    @Test
    void clienteNaoConsultaPagamentoDeOutroCliente() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.consulta-outra", "75522233344");
        String tokenOutraCliente = criarClienteELogar("m5a.consulta-outra-nao-dona@example.com");
        mockarCriacaoAsaas("pay_m5a_consulta_outra", "PENDING", "https://asaas.local/pay_m5a_consulta_outra", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");

        mockMvc.perform(get("/api/v1/pagamentos/{id}", pagamentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(get("/api/v1/pagamentos/atendimento/{atendimentoId}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutraCliente))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void adminListaPagamentosComFiltros() throws Exception {
        AtendimentoCriado atendimentoPix = criarAtendimentoAguardandoPagamento("m7.admin-lista-pix", "78222233344");
        mockarCriacaoAsaas("pay_m7_admin_lista_pix", "PENDING", "https://asaas.local/pay_m7_admin_lista_pix", "pix-admin");
        Long pagamentoPixId = criarPagamento(atendimentoPix.tokenCliente(), atendimentoPix.atendimentoId(), "PIX");

        AtendimentoCriado atendimentoBoleto = criarAtendimentoAguardandoPagamento("m7.admin-lista-boleto", "78223233344");
        mockarCriacaoAsaas("pay_m7_admin_lista_boleto", "RECEIVED", "https://asaas.local/pay_m7_admin_lista_boleto", null);
        Long pagamentoBoletoId = criarPagamento(atendimentoBoleto.tokenCliente(), atendimentoBoleto.atendimentoId(), "BOLETO");

        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        String response = mockMvc.perform(get("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].payloadResumo").doesNotExist())
                .andExpect(jsonPath("$.data[0].senhaHash").doesNotExist())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode pagamentoPix = encontrarPagamentoNaLista(response, pagamentoPixId);
        assertThat(pagamentoPix).isNotNull();
        assertThat(pagamentoPix.path("atendimentoId").asLong()).isEqualTo(atendimentoPix.atendimentoId());
        assertThat(pagamentoPix.path("metodoPagamento").asText()).isEqualTo("PIX");
        assertThat(pagamentoPix.path("status").asText()).isEqualTo("PENDENTE");
        assertThat(pagamentoPix.path("pixCopiaECola").asText()).isEqualTo("pix-admin");

        String responseStatus = mockMvc.perform(get("/api/v1/pagamentos")
                        .param("status", "AGUARDANDO_CONFIRMACAO")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemPagamento(responseStatus, pagamentoBoletoId)).isTrue();
        assertThat(listaContemPagamento(responseStatus, pagamentoPixId)).isFalse();

        String responseMetodo = mockMvc.perform(get("/api/v1/pagamentos")
                        .param("metodoPagamento", "PIX")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemPagamento(responseMetodo, pagamentoPixId)).isTrue();
        assertThat(listaContemPagamento(responseMetodo, pagamentoBoletoId)).isFalse();

        String responseAtendimento = mockMvc.perform(get("/api/v1/pagamentos")
                        .param("atendimentoId", String.valueOf(atendimentoPix.atendimentoId()))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertThat(listaContemPagamento(responseAtendimento, pagamentoPixId)).isTrue();
        assertThat(listaContemPagamento(responseAtendimento, pagamentoBoletoId)).isFalse();
    }

    @Test
    void naoAdminNaoListaTodosPagamentos() throws Exception {
        String tokenCliente = criarClienteELogar("m7.admin-pagamentos-negado@example.com");

        mockMvc.perform(get("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void adminConsultaPagamentoPorIdEPeloAtendimento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m7.admin-consulta", "78224233344");
        mockarCriacaoAsaas("pay_m7_admin_consulta", "PENDING", "https://asaas.local/pay_m7_admin_consulta", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/pagamentos/{id}", pagamentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(pagamentoId))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()))
                .andExpect(jsonPath("$.data.gatewayPaymentId").value("pay_m7_admin_consulta"))
                .andExpect(jsonPath("$.data.payloadResumo").doesNotExist());

        mockMvc.perform(get("/api/v1/pagamentos/atendimento/{atendimentoId}", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(pagamentoId))
                .andExpect(jsonPath("$.data.atendimentoId").value(atendimento.atendimentoId()));
    }

    @Test
    void adminNaoReconsultaStatusPagamento() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m7.admin-sem-reconsulta", "78225233344");
        mockarCriacaoAsaas("pay_m7_admin_sem_reconsulta", "PENDING", "https://asaas.local/pay_m7_admin_sem_reconsulta", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(post("/api/v1/pagamentos/{id}/consultar-status", pagamentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void consultarStatusReconsultaGatewaySemConfirmarPagamentoDefinitivamente() throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento("m5a.reconsulta", "75622233344");
        mockarCriacaoAsaas("pay_m5a_reconsulta", "PENDING", "https://asaas.local/pay_m5a_reconsulta", null);
        Long pagamentoId = criarPagamento(atendimento.tokenCliente(), atendimento.atendimentoId(), "PIX");
        given(asaasGatewayClient.consultarPagamento("pay_m5a_reconsulta"))
                .willReturn(new AsaasPagamentoGatewayResponse(
                        "pay_m5a_reconsulta",
                        "RECEIVED",
                        new BigDecimal("4.50"),
                        new BigDecimal("175.50"),
                        "https://asaas.local/pay_m5a_reconsulta",
                        "pix-copia-e-cola",
                        "{\"id\":\"pay_m5a_reconsulta\",\"status\":\"RECEIVED\"}"
                ));

        mockMvc.perform(post("/api/v1/pagamentos/{id}/consultar-status", pagamentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("AGUARDANDO_CONFIRMACAO"))
                .andExpect(jsonPath("$.data.valorTaxaGateway").value(4.50))
                .andExpect(jsonPath("$.data.valorLiquidoRecebido").value(175.50))
                .andExpect(jsonPath("$.data.pixCopiaECola").value("pix-copia-e-cola"))
                .andExpect(jsonPath("$.data.webhookProcessado").value(false));

        assertThat(atendimentoFaxinaRepository.findById(atendimento.atendimentoId()))
                .isPresent()
                .get()
                .extracting(atendimentoPersistido -> atendimentoPersistido.getStatus().name())
                .isEqualTo("AGUARDANDO_PAGAMENTO");
        assertThat(pagamentoRepository.findById(pagamentoId))
                .isPresent()
                .get()
                .satisfies(pagamento -> {
                    assertThat(pagamento.getStatus().name()).isEqualTo("AGUARDANDO_CONFIRMACAO");
                    assertThat(pagamento.getRecebidoEm()).isNull();
                    assertThat(pagamento.isWebhookProcessado()).isFalse();
                });
    }

    @Test
    void endpointsDePagamentoExigemJwtEContratoJson() throws Exception {
        mockMvc.perform(post("/api/v1/pagamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pagamentoJson(1L, "PIX")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(post("/api/v1/pagamentos/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutJson(1L)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/pagamentos/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/pagamentos"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(post("/api/v1/pagamentos/1/consultar-status"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void metodoPagamentoInvalidoMantemContratoDeErroJson() throws Exception {
        String token = criarClienteELogar("m5a.metodo-invalido@example.com");

        mockMvc.perform(post("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pagamentoJson(1L, "DINHEIRO")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void selecaoSemProfissionaisOuComMaisDeTresMantemContratoDeErroJson() throws Exception {
        String tokenCliente = criarClienteELogar("m3c.validacao-cliente@example.com");
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), primeiraRegiaoId(), "FAXINA_RESIDENCIAL");

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of())))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(1L, 2L, 3L, 4L))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void selecaoComProfissionaisDuplicadosERejeitada() throws Exception {
        String tokenCliente = criarClienteELogar("m3c.duplicada-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        Long profissionalId = criarProfissionalConfigurada("m3c.duplicada-profissional@example.com", "72822233344", "Profissional Duplicada", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(profissionalId, profissionalId))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("SELECAO_DUPLICADA"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void selecaoComProfissionalNaoElegivelOuNaoEncontradaERejeitada() throws Exception {
        String tokenCliente = criarClienteELogar("m3c.nao-elegivel-cliente@example.com");
        Long regiaoId = primeiraRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        Long naoElegivelId = criarProfissionalConfigurada("m3c.nao-elegivel-profissional@example.com", "72922233344", "Profissional Nao Elegivel", "ATIVA", "APROVADO", true, "PENDENTE", List.of(regiaoId), "QUINTA", "08:00", "12:00");

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(naoElegivelId))))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("PROFISSIONAL_NAO_ELEGIVEL"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(999999999L))))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("PROFISSIONAL_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void clienteNaoSelecionaProfissionaisParaSolicitacaoDeOutraCliente() throws Exception {
        String tokenDona = criarClienteELogar("m3c.dona-selecao@example.com");
        String tokenOutra = criarClienteELogar("m3c.outra-selecao@example.com");
        Long regiaoId = segundaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenDona, criarEndereco(tokenDona), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada profissional = criarProfissionalConfiguradaComToken("m3c.nao-dona-profissional@example.com", "73022233344", "Profissional Nao Dona", "ATIVA", "APROVADO", true, "APROVADO", List.of(regiaoId), "QUINTA", "08:00", "12:00");

        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutra)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(profissional.perfilId()))))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("SOLICITACAO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(get("/api/v1/convites/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void endpointDeSelecaoExigeJwt() throws Exception {
        mockMvc.perform(post("/api/v1/solicitacoes/1/selecionados")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(List.of(1L))))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void endpointsDeConvitesExigemJwt() throws Exception {
        mockMvc.perform(get("/api/v1/convites/meus"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/convites/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    private Long criarSolicitacao(String token, Long enderecoId, Long regiaoId, String tipoServico) throws Exception {
        ajustarEnderecoParaRegiao(enderecoId, regiaoId);
        String response = mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(solicitacaoJson(enderecoId, regiaoId, tipoServico)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CRIADA"))
                .andExpect(jsonPath("$.data.tipoServico").value(tipoServico))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private Long criarEndereco(String token) throws Exception {
        return criarEnderecoComBairro(token, "Centro Histórico");
    }

    private Long criarEnderecoComBairro(String token, String bairro) throws Exception {
        String response = mockMvc.perform(post("/api/v1/enderecos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "cep": "90010-000",
                                  "logradouro": "Rua da Solicitacao",
                                  "numero": "123",
                                  "bairro": "%s",
                                  "cidade": "Porto Alegre",
                                  "estado": "RS",
                                  "principal": true
                                }
                                """.formatted(bairro)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private void ajustarEnderecoParaRegiao(Long enderecoId, Long regiaoId) {
        var endereco = enderecoRepository.findById(enderecoId).orElseThrow();
        var regiao = regiaoAtendimentoRepository.findById(regiaoId).orElseThrow();
        endereco.atualizarDados(
                endereco.getCep(),
                endereco.getLogradouro(),
                endereco.getNumero(),
                endereco.getComplemento(),
                regiao.getNome(),
                endereco.getCidade(),
                endereco.getEstado(),
                endereco.getLatitude(),
                endereco.getLongitude()
        );
        enderecoRepository.saveAndFlush(endereco);
    }

    private String criarClienteELogar(String email) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Solicitacao",
                                  "email": "%s",
                                  "telefone": "+5551999998888",
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
                                  "nomeCompleto": "Profissional Solicitacao",
                                  "email": "%s",
                                  "telefone": "+5551988887777",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "Profissional Solicitacao",
                                  "cpf": "%s",
                                  "dataNascimento": "1990-03-20"
                                }
                                """.formatted(email, cpf)))
                .andExpect(status().isCreated());

        return login(email, "senha-segura-123");
    }

    private Long criarProfissionalConfigurada(
            String email,
            String cpf,
            String nomeExibicao,
            String statusConta,
            String statusAprovacao,
            boolean ativoParaReceberChamados,
            String statusVerificacao,
            List<Long> regiaoIds,
            String diaSemana,
            String horaInicio,
            String horaFim
    ) throws Exception {
        return criarProfissionalConfiguradaComToken(
                email,
                cpf,
                nomeExibicao,
                statusConta,
                statusAprovacao,
                ativoParaReceberChamados,
                statusVerificacao,
                regiaoIds,
                diaSemana,
                horaInicio,
                horaFim
        ).perfilId();
    }

    private ProfissionalConfigurada criarProfissionalConfiguradaComToken(
            String email,
            String cpf,
            String nomeExibicao,
            String statusConta,
            String statusAprovacao,
            boolean ativoParaReceberChamados,
            String statusVerificacao,
            List<Long> regiaoIds,
            String diaSemana,
            String horaInicio,
            String horaFim
    ) throws Exception {
        String tokenProfissional = cadastrarProfissional(email, cpf, nomeExibicao);
        Long perfilId = buscarMeuPerfilProfissionalId(tokenProfissional);
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(patch("/api/v1/profissionais/{id}/aprovacao", perfilId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusAprovacao": "%s"
                                }
                                """.formatted(statusAprovacao)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/profissionais/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeExibicao": "%s",
                                  "descricao": "Profissional preparada para seleção",
                                  "experienciaAnos": 3,
                                  "ativoParaReceberChamados": %s
                                }
                                """.formatted(nomeExibicao, ativoParaReceberChamados)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/profissionais/me/regioes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "regiaoIds": %s
                                }
                                """.formatted(objectMapper.writeValueAsString(regiaoIds))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/profissionais/me/disponibilidades")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "diaSemana": "%s",
                                  "horaInicio": "%s",
                                  "horaFim": "%s",
                                  "ativo": true
                                }
                                """.formatted(diaSemana, horaInicio, horaFim)))
                .andExpect(status().isCreated());

        Long documentoId = submeterDocumentoVerificacao(tokenProfissional);
        mockMvc.perform(patch("/api/v1/verificacoes/{id}/analisar", documentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusVerificacao": "%s",
                                  "observacaoAnalise": "Ajuste para teste de elegibilidade"
                                }
                                """.formatted(statusVerificacao)))
                .andExpect(status().isOk());

        Long usuarioId = buscarUsuarioAutenticadoId(tokenProfissional);
        mockMvc.perform(patch("/api/v1/usuarios/{id}/status", usuarioId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusConta": "%s"
                        }
                        """.formatted(statusConta)))
                .andExpect(status().isOk());

        return new ProfissionalConfigurada(perfilId, tokenProfissional);
    }

    private String cadastrarProfissional(String email, String cpf, String nomeExibicao) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/profissionais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "%s",
                                  "email": "%s",
                                  "telefone": "+5551988889999",
                                  "senha": "senha-segura-123",
                                  "nomeExibicao": "%s",
                                  "cpf": "%s",
                                  "dataNascimento": "1990-03-20"
                                }
                                """.formatted(nomeExibicao, email, nomeExibicao, cpf)))
                .andExpect(status().isCreated());
        return login(email, "senha-segura-123");
    }

    private Long buscarMeuPerfilProfissionalId(String tokenProfissional) throws Exception {
        String response = mockMvc.perform(get("/api/v1/profissionais/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private Long buscarUsuarioAutenticadoId(String token) throws Exception {
        String response = mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private Long submeterDocumentoVerificacao(String tokenProfissional) throws Exception {
        String response = mockMvc.perform(post("/api/v1/verificacoes/documentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tipoDocumento": "CPF",
                                  "numeroDocumento": "12345678901",
                                  "documentoFrenteUrl": "local/documentos/frente.png",
                                  "documentoVersoUrl": "local/documentos/verso.png",
                                  "selfieUrl": "local/documentos/selfie.png",
                                  "comprovanteResidenciaUrl": "local/documentos/comprovante.png"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private void adicionarDocumentoVerificacaoAnalisado(String tokenProfissional, String tokenAdmin, String statusVerificacao) throws Exception {
        Long documentoId = submeterDocumentoVerificacao(tokenProfissional);
        mockMvc.perform(patch("/api/v1/verificacoes/{id}/analisar", documentoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "statusVerificacao": "%s",
                                  "observacaoAnalise": "Documento posterior para teste de verificacao efetiva"
                                }
                                """.formatted(statusVerificacao)))
                .andExpect(status().isOk());
    }

    private void selecionarProfissionais(String tokenCliente, Long solicitacaoId, List<Long> profissionalIds) throws Exception {
        mockMvc.perform(post("/api/v1/solicitacoes/{id}/selecionados", solicitacaoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(selecaoJson(profissionalIds)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private AtendimentoCriado criarAtendimentoAguardandoPagamento(String prefixoEmail, String cpf) throws Exception {
        String tokenCliente = criarClienteELogar(prefixoEmail + "-cliente@example.com");
        Long regiaoId = ultimaRegiaoId();
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        ProfissionalConfigurada profissional = criarProfissionalConfiguradaComToken(
                prefixoEmail + "-profissional@example.com",
                cpf,
                "Profissional " + prefixoEmail,
                "ATIVA",
                "APROVADO",
                true,
                "APROVADO",
                List.of(regiaoId),
                "QUINTA",
                "08:00",
                "12:00"
        );
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(profissional.perfilId()));
        Long conviteId = primeiroConviteId(profissional.tokenProfissional());
        String response = mockMvc.perform(post("/api/v1/convites/{id}/aceitar", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.atendimentoStatus").value("AGUARDANDO_PAGAMENTO"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Long atendimentoId = objectMapper.readTree(response).path("data").path("atendimentoId").asLong();
        return new AtendimentoCriado(tokenCliente, profissional.tokenProfissional(), solicitacaoId, atendimentoId);
    }

    private AtendimentoCriado criarAtendimentoConfirmado(String prefixoEmail, String cpf, String checkoutId) throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamento(prefixoEmail, cpf);
        mockarCheckoutAsaas(checkoutId, "https://asaas.local/checkout/" + checkoutId);
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());
        confirmarCheckoutAsaas(checkoutId);
        return atendimento;
    }

    private AtendimentoCriado criarAtendimentoFinalizado(String prefixoEmail, String cpf, String checkoutId) throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoConfirmado(prefixoEmail, cpf, checkoutId);
        iniciarAtendimento(atendimento);
        finalizarAtendimento(atendimento);
        return atendimento;
    }

    private JsonNode encontrarAtendimentoNaLista(String response, Long atendimentoId) throws Exception {
        for (JsonNode item : objectMapper.readTree(response).path("data")) {
            if (item.path("id").asLong() == atendimentoId) {
                return item;
            }
        }

        return null;
    }

    private boolean listaContemAtendimento(String response, Long atendimentoId) throws Exception {
        return encontrarAtendimentoNaLista(response, atendimentoId) != null;
    }

    private JsonNode encontrarPagamentoNaLista(String response, Long pagamentoId) throws Exception {
        for (JsonNode item : objectMapper.readTree(response).path("data")) {
            if (item.path("id").asLong() == pagamentoId) {
                return item;
            }
        }

        return null;
    }

    private boolean listaContemPagamento(String response, Long pagamentoId) throws Exception {
        return encontrarPagamentoNaLista(response, pagamentoId) != null;
    }

    private JsonNode encontrarSolicitacaoNaLista(String response, Long solicitacaoId) throws Exception {
        for (JsonNode item : objectMapper.readTree(response).path("data")) {
            if (item.path("id").asLong() == solicitacaoId) {
                return item;
            }
        }

        return null;
    }

    private boolean listaContemSolicitacao(String response, Long solicitacaoId) throws Exception {
        return encontrarSolicitacaoNaLista(response, solicitacaoId) != null;
    }

    private AtendimentoCriado criarAtendimentoAguardandoPagamentoComProfissional(
            String prefixoEmail,
            Long regiaoId,
            ProfissionalConfigurada profissional
    ) throws Exception {
        String tokenCliente = criarClienteELogar(prefixoEmail + "-cliente@example.com");
        Long solicitacaoId = criarSolicitacao(tokenCliente, criarEndereco(tokenCliente), regiaoId, "FAXINA_RESIDENCIAL");
        selecionarProfissionais(tokenCliente, solicitacaoId, List.of(profissional.perfilId()));
        var convites = conviteProfissionalRepository.findBySolicitacaoId(solicitacaoId);
        assertThat(convites).hasSize(1);
        Long conviteId = convites.getFirst().getId();
        String response = mockMvc.perform(post("/api/v1/convites/{id}/aceitar", conviteId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + profissional.tokenProfissional()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.atendimentoStatus").value("AGUARDANDO_PAGAMENTO"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Long atendimentoId = objectMapper.readTree(response).path("data").path("atendimentoId").asLong();
        return new AtendimentoCriado(tokenCliente, profissional.tokenProfissional(), solicitacaoId, atendimentoId);
    }

    private AtendimentoCriado criarAtendimentoFinalizadoComProfissional(
            String prefixoEmail,
            Long regiaoId,
            ProfissionalConfigurada profissional,
            String checkoutId
    ) throws Exception {
        AtendimentoCriado atendimento = criarAtendimentoAguardandoPagamentoComProfissional(prefixoEmail, regiaoId, profissional);
        mockarCheckoutAsaas(checkoutId, "https://asaas.local/checkout/" + checkoutId);
        criarCheckout(atendimento.tokenCliente(), atendimento.atendimentoId());
        confirmarCheckoutAsaas(checkoutId);
        iniciarAtendimento(atendimento);
        finalizarAtendimento(atendimento);
        return atendimento;
    }

    private void confirmarCheckoutAsaas(String checkoutId) throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/asaas")
                        .header("asaas-access-token", ASAAS_WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "event": "CHECKOUT_PAID",
                                  "checkout": {
                                    "id": "%s"
                                  }
                                }
                                """.formatted(checkoutId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private void iniciarAtendimento(AtendimentoCriado atendimento) throws Exception {
        mockMvc.perform(post("/api/v1/atendimentos/{id}/iniciar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/inicio.png", "Inicio do atendimento")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("EM_EXECUCAO"));
    }

    private void finalizarAtendimento(AtendimentoCriado atendimento) throws Exception {
        mockMvc.perform(post("/api/v1/atendimentos/{id}/finalizar", atendimento.atendimentoId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + atendimento.tokenProfissional())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkpointJson("local/checkpoints/fim.png", "Fim do atendimento")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("FINALIZADO"));
    }

    private void mockarCriacaoAsaas(String gatewayPaymentId, String status, String urlPagamento, String pixCopiaECola) {
        given(asaasGatewayClient.criarCobranca(any()))
                .willReturn(new AsaasPagamentoGatewayResponse(
                        gatewayPaymentId,
                        status,
                        null,
                        null,
                        urlPagamento,
                        pixCopiaECola,
                        "{\"id\":\"%s\",\"status\":\"%s\"}".formatted(gatewayPaymentId, status)
                ));
    }

    private void mockarCheckoutAsaas(String checkoutId, String checkoutUrl) {
        given(asaasGatewayClient.criarCheckout(any()))
                .willReturn(new AsaasCheckoutGatewayResponse(
                        checkoutId,
                        checkoutUrl,
                        "{\"id\":\"%s\"}".formatted(checkoutId)
                ));
    }

    private void atualizarAgregadosProfissional(Long perfilId, String notaMedia, int totalAvaliacoes) {
        var perfil = perfilProfissionalRepository.findById(perfilId).orElseThrow();
        perfil.atualizarAgregadoAvaliacoes(new BigDecimal(notaMedia), totalAvaliacoes);
        perfilProfissionalRepository.saveAndFlush(perfil);
    }

    private Long criarPagamento(String tokenCliente, Long atendimentoId, String metodoPagamento) throws Exception {
        String response = mockMvc.perform(post("/api/v1/pagamentos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pagamentoJson(atendimentoId, metodoPagamento)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private void criarCheckout(String tokenCliente, Long atendimentoId) throws Exception {
        mockMvc.perform(post("/api/v1/pagamentos/checkout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutJson(atendimentoId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    private Long criarAvaliacao(String tokenCliente, Long atendimentoId, int nota, String comentario) throws Exception {
        String response = mockMvc.perform(post("/api/v1/avaliacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(avaliacaoJson(atendimentoId, nota, comentario)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("avaliacaoId").asLong();
    }

    private Long criarOcorrencia(String token, Long atendimentoId, String tipo, String descricao) throws Exception {
        String response = mockMvc.perform(post("/api/v1/ocorrencias")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ocorrenciaJson(atendimentoId, tipo, descricao)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private Long primeiroConviteId(String tokenProfissional) throws Exception {
        String response = mockMvc.perform(get("/api/v1/convites/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenProfissional))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").get(0).path("conviteId").asLong();
    }

    private String selecaoJson(List<Long> profissionalIds) throws Exception {
        return """
                {
                  "profissionalIds": %s
                }
                """.formatted(objectMapper.writeValueAsString(profissionalIds));
    }

    private String pagamentoJson(Long atendimentoId, String metodoPagamento) {
        return """
                {
                  "atendimentoId": %d,
                  "metodoPagamento": "%s"
                }
                """.formatted(atendimentoId, metodoPagamento);
    }

    private String checkoutJson(Long atendimentoId) {
        return """
                {
                  "atendimentoId": %d
                }
                """.formatted(atendimentoId);
    }

    private String checkpointJson(String fotoComprovacaoUrl, String observacao) {
        return """
                {
                  "latitude": -30.1234567,
                  "longitude": -51.1234567,
                  "fotoComprovacaoUrl": %s,
                  "observacao": %s
                }
                """.formatted(jsonString(fotoComprovacaoUrl), jsonString(observacao));
    }

    private String avaliacaoJson(Long atendimentoId, int nota, String comentario) {
        return """
                {
                  "atendimentoId": %d,
                  "nota": %d,
                  "comentario": %s
                }
                """.formatted(atendimentoId, nota, jsonString(comentario));
    }

    private String ocorrenciaJson(Long atendimentoId, String tipo, String descricao) {
        return """
                {
                  "atendimentoId": %d,
                  "tipo": "%s",
                  "descricao": %s
                }
                """.formatted(atendimentoId, tipo, jsonString(descricao));
    }

    private String statusOcorrenciaJson(String status) {
        return """
                {
                  "status": "%s"
                }
                """.formatted(status);
    }

    private String jsonString(String valor) {
        if (valor == null) {
            return "null";
        }
        return "\"" + valor + "\"";
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

    private Long primeiraRegiaoId() {
        return regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().get(0).getId();
    }

    private Long segundaRegiaoId() {
        return regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc().get(1).getId();
    }

    private Long ultimaRegiaoId() {
        var regioes = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc();
        return regioes.get(regioes.size() - 1).getId();
    }

    private Long regiaoIdPorNome(String nome) {
        return regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc()
                .stream()
                .filter(regiao -> regiao.getNome().equals(nome))
                .findFirst()
                .orElseThrow()
                .getId();
    }

    private String solicitacaoJson(Long enderecoId, Long regiaoId, String tipoServico) {
        return """
                {
                  "enderecoId": %d,
                  "regiaoId": %d,
                  "dataHoraDesejada": "2035-05-10T10:00:00-03:00",
                  "duracaoEstimadaHoras": 4,
                  "tipoServico": "%s",
                  "observacoes": "Limpeza solicitada pela cliente",
                  "valorServico": 180.00,
                  "percentualComissaoAgencia": 20.00,
                  "valorEstimadoProfissional": 144.00
                }
                """.formatted(enderecoId, regiaoId, tipoServico);
    }

    private String solicitacaoJsonSemRegiao(Long enderecoId, String tipoServico) {
        return """
                {
                  "enderecoId": %d,
                  "dataHoraDesejada": "2035-05-10T10:00:00-03:00",
                  "duracaoEstimadaHoras": 4,
                  "tipoServico": "%s",
                  "observacoes": "Limpeza solicitada pela cliente"
                }
                """.formatted(enderecoId, tipoServico);
    }
}
