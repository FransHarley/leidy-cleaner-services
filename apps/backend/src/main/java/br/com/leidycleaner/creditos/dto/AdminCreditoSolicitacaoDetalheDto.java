package br.com.leidycleaner.creditos.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

public record AdminCreditoSolicitacaoDetalheDto(
        Long id,
        StatusCreditoSolicitacao status,
        Long clienteId,
        String clienteNome,
        Long solicitacaoOrigemId,
        Long pagamentoOrigemId,
        Long solicitacaoUsoId,
        TipoServico tipoServico,
        int duracaoEstimadaHoras,
        Long regiaoId,
        String regiaoNome,
        BigDecimal valorReferencia,
        OffsetDateTime criadoEm,
        OffsetDateTime reservadoEm,
        OffsetDateTime utilizadoEm,
        OffsetDateTime canceladoEm,
        String observacao,
        AdminCreditoSolicitacaoSolicitacaoResumoDto solicitacaoOrigem,
        AdminCreditoSolicitacaoPagamentoResumoDto pagamentoOrigem,
        AdminCreditoSolicitacaoSolicitacaoResumoDto solicitacaoUso
) {
}
