package br.com.leidycleaner.solicitacoes.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SelecionarProfissionaisRequest(
        @NotNull
        @Size(min = 1)
        List<@NotNull Long> profissionalIds
) {
}
