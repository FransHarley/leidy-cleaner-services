package br.com.leidycleaner.pagamentos.dto;

import java.math.BigDecimal;

import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;

public record CheckoutDto(
        Long atendimentoId,
        String checkoutUrl,
        String paymentUrl,
        BigDecimal valor,
        String descricao,
        MetodoPagamento metodoPagamento,
        StatusPagamento status
) {
}
