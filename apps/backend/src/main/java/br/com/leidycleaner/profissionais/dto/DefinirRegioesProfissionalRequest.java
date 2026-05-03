package br.com.leidycleaner.profissionais.dto;

import java.util.Set;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record DefinirRegioesProfissionalRequest(
        @NotEmpty(message = "regiaoIds deve conter ao menos uma regiao")
        Set<@NotNull(message = "regiaoIds nao pode conter valores nulos") Long> regiaoIds
) {
}
