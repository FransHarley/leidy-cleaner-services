package br.com.leidycleaner.regioes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import br.com.leidycleaner.regioes.entity.RegiaoAtendimento;
import br.com.leidycleaner.regioes.entity.TipoRegiaoAtendimento;
import br.com.leidycleaner.regioes.repository.RegiaoAtendimentoRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RegiaoAtendimentoIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final RegiaoAtendimentoRepository regiaoAtendimentoRepository;

    @Autowired
    RegiaoAtendimentoIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            RegiaoAtendimentoRepository regiaoAtendimentoRepository
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.regiaoAtendimentoRepository = regiaoAtendimentoRepository;
    }

    @Test
    void flywayCadastraBairrosPortoAlegreECidadesLitoralAtivosSemDuplicar() {
        var regioes = regiaoAtendimentoRepository.findByAtivoTrueOrderByNomeAsc();
        Map<String, RegiaoAtendimento> porNome = regioes.stream()
                .collect(Collectors.toMap(RegiaoAtendimento::getNome, Function.identity()));

        assertThat(regioes)
                .extracting(RegiaoAtendimento::getNome)
                .doesNotHaveDuplicates()
                .contains(
                        "Aberta dos Morros",
                        "Centro",
                        "Petrópolis",
                        "Restinga",
                        "Vila São José",
                        "Tramandaí",
                        "Capão da Canoa",
                        "Xangri-lá"
                );

        assertThat(regioes.stream()
                .filter(regiao -> regiao.getTipo() == TipoRegiaoAtendimento.BAIRRO)
                .toList())
                .hasSizeGreaterThanOrEqualTo(94);
        assertThat(regioes.stream()
                .filter(regiao -> regiao.getTipo() == TipoRegiaoAtendimento.CIDADE)
                .map(RegiaoAtendimento::getNome)
                .toList())
                .contains("Tramandaí", "Capão da Canoa", "Xangri-lá");

        assertThat(porNome.get("Petrópolis").isAtivo()).isTrue();
        assertThat(porNome.get("Tramandaí").isAtivo()).isTrue();
        assertThat(porNome.get("Tramandaí").getTipo()).isEqualTo(TipoRegiaoAtendimento.CIDADE);
        assertThat(porNome.get("Centro").getTipo()).isEqualTo(TipoRegiaoAtendimento.BAIRRO);
    }

    @Test
    void endpointListaRegioesAtivasComBairrosECidades() throws Exception {
        String response = mockMvc.perform(get("/api/v1/regioes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        var regioes = StreamSupport.stream(objectMapper.readTree(response).path("data").spliterator(), false)
                .toList();

        assertThat(regioes).anySatisfy(regiao -> assertRegiao(regiao, "Tramandaí", "CIDADE"));
        assertThat(regioes).anySatisfy(regiao -> assertRegiao(regiao, "Capão da Canoa", "CIDADE"));
        assertThat(regioes).anySatisfy(regiao -> assertRegiao(regiao, "Xangri-lá", "CIDADE"));
        assertThat(regioes).anySatisfy(regiao -> assertRegiao(regiao, "Centro", "BAIRRO"));
        assertThat(regioes).anySatisfy(regiao -> assertRegiao(regiao, "Restinga", "BAIRRO"));
        assertThat(regioes).anySatisfy(regiao -> assertRegiao(regiao, "Petrópolis", "BAIRRO"));
    }

    private void assertRegiao(JsonNode regiao, String nome, String tipo) {
        assertThat(regiao.path("nome").asText()).isEqualTo(nome);
        assertThat(regiao.path("tipo").asText()).isEqualTo(tipo);
        assertThat(regiao.path("ativo").asBoolean()).isTrue();
    }
}
