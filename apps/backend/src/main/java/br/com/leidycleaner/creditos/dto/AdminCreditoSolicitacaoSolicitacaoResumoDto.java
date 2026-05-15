package br.com.leidycleaner.creditos.dto;

import java.time.OffsetDateTime;

import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

public record AdminCreditoSolicitacaoSolicitacaoResumoDto(
        Long id,
        StatusSolicitacao status,
        Long clienteId,
        String clienteNome,
        OffsetDateTime dataHoraDesejada,
        TipoServico tipoServico,
        int duracaoEstimadaHoras,
        Long regiaoId,
        String regiaoNome
) {
}
