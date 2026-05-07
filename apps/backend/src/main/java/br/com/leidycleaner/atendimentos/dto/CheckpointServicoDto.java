package br.com.leidycleaner.atendimentos.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.atendimentos.entity.TipoCheckpointServico;

public record CheckpointServicoDto(
        Long id,
        Long atendimentoId,
        TipoCheckpointServico tipo,
        Long registradoPorUsuarioId,
        String registradoPorNome,
        BigDecimal latitude,
        BigDecimal longitude,
        String fotoComprovacaoUrl,
        String observacao,
        OffsetDateTime registradoEm
) {
}
