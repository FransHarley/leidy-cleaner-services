package br.com.leidycleaner.enderecos;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static br.com.leidycleaner.support.TestAceites.camposAceiteJson;
import static br.com.leidycleaner.support.TestCpf.proximoCpf;

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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EnderecoIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;

    @Autowired
    EnderecoIntegrationTest(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    @Test
    void usuarioAutenticadoCriaListaAtualizaEExcluiEndereco() throws Exception {
        String token = criarClienteELogar("m2b.crud@example.com");
        Long enderecoId = criarEndereco(token, "Rua das Flores", "100", false);

        mockMvc.perform(get("/api/v1/enderecos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(enderecoId));

        mockMvc.perform(put("/api/v1/enderecos/{id}", enderecoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enderecoJson("Rua Atualizada", "200", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(enderecoId))
                .andExpect(jsonPath("$.data.logradouro").value("Rua Atualizada"))
                .andExpect(jsonPath("$.data.numero").value("200"))
                .andExpect(jsonPath("$.data.principal").value(true));

        mockMvc.perform(delete("/api/v1/enderecos/{id}", enderecoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/enderecos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void usuarioNaoAtualizaNemExcluiEnderecoDeOutroUsuario() throws Exception {
        String tokenDono = criarClienteELogar("m2b.dono@example.com");
        String tokenOutro = criarClienteELogar("m2b.outro@example.com");
        Long enderecoId = criarEndereco(tokenDono, "Rua do Dono", "10", true);

        mockMvc.perform(put("/api/v1/enderecos/{id}", enderecoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutro)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enderecoJson("Rua Indevida", "99", true)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ENDERECO_NOT_FOUND"))
                .andExpect(jsonPath("$.errors").isArray());

        mockMvc.perform(delete("/api/v1/enderecos/{id}", enderecoId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenOutro))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("ENDERECO_NOT_FOUND"));
    }

    @Test
    void primeiroEnderecoViraPrincipalAutomaticamente() throws Exception {
        String token = criarClienteELogar("m2b.primeiro@example.com");

        Long enderecoId = criarEndereco(token, "Rua Primeira", "1", false);

        mockMvc.perform(get("/api/v1/enderecos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(enderecoId))
                .andExpect(jsonPath("$.data[0].principal").value(true));
    }

    @Test
    void marcarEnderecoComoPrincipalDesmarcaPrincipalAnterior() throws Exception {
        String token = criarClienteELogar("m2b.principal@example.com");
        Long primeiroId = criarEndereco(token, "Rua Principal Antiga", "1", true);
        Long segundoId = criarEndereco(token, "Rua Principal Nova", "2", true);

        mockMvc.perform(get("/api/v1/enderecos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(segundoId))
                .andExpect(jsonPath("$.data[0].principal").value(true))
                .andExpect(jsonPath("$.data[1].id").value(primeiroId))
                .andExpect(jsonPath("$.data[1].principal").value(false));
    }

    @Test
    void excluirPrincipalReatribuiPrincipalDeFormaDeterministica() throws Exception {
        String token = criarClienteELogar("m2b.reatribuir@example.com");
        Long primeiroId = criarEndereco(token, "Rua Mais Antiga", "1", true);
        Long segundoId = criarEndereco(token, "Rua Segunda", "2", false);
        Long terceiroId = criarEndereco(token, "Rua Terceira", "3", false);

        mockMvc.perform(delete("/api/v1/enderecos/{id}", primeiroId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/enderecos/meus")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(segundoId))
                .andExpect(jsonPath("$.data[0].principal").value(true))
                .andExpect(jsonPath("$.data[1].id").value(terceiroId))
                .andExpect(jsonPath("$.data[1].principal").value(false));
    }

    @Test
    void endpointsDeEnderecoExigemJwt() throws Exception {
        mockMvc.perform(get("/api/v1/enderecos/meus"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void validacaoMantemContratoDeErroJson() throws Exception {
        String token = criarClienteELogar("m2b.validacao@example.com");

        mockMvc.perform(post("/api/v1/enderecos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "cep": "",
                                  "logradouro": "",
                                  "numero": "10",
                                  "bairro": "Centro Histórico",
                                  "cidade": "Porto Alegre",
                                  "estado": "RS"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    private Long criarEndereco(String token, String logradouro, String numero, boolean principal) throws Exception {
        String response = mockMvc.perform(post("/api/v1/enderecos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(enderecoJson(logradouro, numero, principal)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("id").asLong();
    }

    private String criarClienteELogar(String email) throws Exception {
        mockMvc.perform(post("/api/v1/usuarios/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeCompleto": "Cliente Endereco",
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

    private String enderecoJson(String logradouro, String numero, boolean principal) {
        return """
                {
                  "cep": "90010-000",
                  "logradouro": "%s",
                  "numero": "%s",
                  "complemento": "Apto 101",
                  "bairro": "Centro Histórico",
                  "cidade": "Porto Alegre",
                  "estado": "rs",
                  "latitude": -30.0324990,
                  "longitude": -51.2303770,
                  "principal": %s
                }
                """.formatted(logradouro, numero, principal);
    }
}
