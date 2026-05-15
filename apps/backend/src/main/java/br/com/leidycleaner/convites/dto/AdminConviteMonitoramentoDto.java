package br.com.leidycleaner.convites.dto;

import java.time.OffsetDateTime;

import br.com.leidycleaner.convites.entity.StatusConvite;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

public record AdminConviteMonitoramentoDto(
        Long conviteId,
        StatusConvite statusConvite,
        Long solicitacaoId,
        StatusSolicitacao solicitacaoStatus,
        Long clienteId,
        String clienteNome,
        Long profissionalId,
        String profissionalNome,
        OffsetDateTime dataHoraDesejada,
        TipoServico tipoServico,
        int duracaoEstimadaHoras,
        String regiaoNome,
        OffsetDateTime enviadoEm,
        OffsetDateTime respondidoEm,
        OffsetDateTime expiraEm,
        boolean expirado,
        Long pagamentoId,
        StatusPagamento pagamentoStatus,
        Long creditoSolicitacaoId
) {
}
