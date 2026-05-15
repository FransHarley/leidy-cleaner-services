package br.com.leidycleaner.creditos.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.pagamentos.entity.GatewayPagamento;
import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;

public record AdminCreditoSolicitacaoPagamentoResumoDto(
        Long id,
        GatewayPagamento gateway,
        MetodoPagamento metodoPagamento,
        StatusPagamento status,
        String gatewayPaymentId,
        Long solicitacaoId,
        Long atendimentoId,
        BigDecimal valorBruto,
        BigDecimal valorLiquidoRecebido,
        OffsetDateTime recebidoEm,
        OffsetDateTime criadoEm
) {
}
