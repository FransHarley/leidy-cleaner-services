package br.com.leidycleaner.configuracoes;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static br.com.leidycleaner.support.TestAceites.camposAceiteJson;
import static br.com.leidycleaner.support.TestCpf.proximoCpf;

import java.math.BigDecimal;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.configuracoes.dto.ConfiguracaoPrecoUpdateRequest;
import br.com.leidycleaner.configuracoes.service.ConfiguracaoPrecoService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConfiguracaoPrecoIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final ConfiguracaoPrecoService configuracaoPrecoService;

    @Autowired
    ConfiguracaoPrecoIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            ConfiguracaoPrecoService configuracaoPrecoService
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.configuracaoPrecoService = configuracaoPrecoService;
    }

    @AfterEach
    void restaurarConfiguracaoPadrao() {
        configuracaoPrecoService.atualizarAtiva(new ConfiguracaoPrecoUpdateRequest(
                new BigDecimal("45.00"),
                new BigDecimal("20.00")
        ));
    }

    @Test
    void adminLeConfiguracaoPrecoAtiva() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(get("/api/v1/admin/configuracoes/precos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.valorHora").value(45.00))
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").value(20.00))
                .andExpect(jsonPath("$.data.percentualEstimadoProfissional").value(80.00));
    }

    @Test
    void adminAtualizaConfiguracaoPrecoAtiva() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(put("/api/v1/admin/configuracoes/precos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "valorHora": 50.00,
                                  "percentualComissaoAgencia": 20.00
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valorHora").value(50.00))
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").value(20.00))
                .andExpect(jsonPath("$.data.percentualEstimadoProfissional").value(80.00));
    }

    @Test
    void clienteNaoAtualizaConfiguracaoPreco() throws Exception {
        String tokenCliente = criarClienteELogar("precos.cliente.negado@example.com");

        mockMvc.perform(put("/api/v1/admin/configuracoes/precos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "valorHora": 55.00,
                                  "percentualComissaoAgencia": 18.00
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejeitaPercentualDeComissaoInvalido() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(put("/api/v1/admin/configuracoes/precos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "valorHora": 50.00,
                                  "percentualComissaoAgencia": 120.00
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rejeitaValorHoraInvalido() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");

        mockMvc.perform(put("/api/v1/admin/configuracoes/precos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "valorHora": 0.00,
                                  "percentualComissaoAgencia": 20.00
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void criacaoDeSolicitacaoUsaConfiguracaoDePrecoPersistida() throws Exception {
        String tokenAdmin = login("admin@leidycleaner.local", "Admin123!local");
        mockMvc.perform(put("/api/v1/admin/configuracoes/precos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "valorHora": 50.00,
                                  "percentualComissaoAgencia": 20.00
                                }
                                """))
                .andExpect(status().isOk());

        String tokenCliente = criarClienteELogar("precos.solicitacao@example.com");
        Long enderecoId = criarEndereco(tokenCliente);

        mockMvc.perform(post("/api/v1/solicitacoes")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "enderecoId": %d,
                                  "dataHoraDesejada": "2035-05-10T10:00:00-03:00",
                                  "duracaoEstimadaHoras": 4,
                                  "tipoServico": "FAXINA_RESIDENCIAL",
                                  "observacoes": "Solicitação usando preço persistido",
                                  "valorServico": 1.00,
                                  "percentualComissaoAgencia": 0.00,
                                  "valorEstimadoProfissional": 1.00
                                }
                                """.formatted(enderecoId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valorServico").value(200.00))
                .andExpect(jsonPath("$.data.percentualComissaoAgencia").value(20.00))
                .andExpect(jsonPath("$.data.valorEstimadoProfissional").value(160.00));
    }

    private String criarClienteELogar(String email) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Precificação",
                                  "email": "%s",
                                  "telefone": "+5551999997777",
                                  "cpf": "%s",
                                  "senha": "senha-segura-123",
                                  %s
                                }
                                """.formatted(email, proximoCpf(), camposAceiteJson())))
                .andExpect(status().isCreated());

        return login(email, "senha-segura-123");
    }

    private Long criarEndereco(String token) throws Exception {
        String response = mockMvc.perform(post("/api/v1/enderecos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "cep": "90010-000",
                                  "logradouro": "Rua da Precificação",
                                  "numero": "123",
                                  "bairro": "Centro Histórico",
                                  "cidade": "Porto Alegre",
                                  "estado": "RS",
                                  "principal": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
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
}
