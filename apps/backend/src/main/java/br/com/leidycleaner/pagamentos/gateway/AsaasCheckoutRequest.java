package br.com.leidycleaner.pagamentos.gateway;

import java.math.BigDecimal;

import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;

public record AsaasCheckoutRequest(
        Long atendimentoId,
        String customerId,
        MetodoPagamento metodoPagamento,
        BigDecimal valor,
        String descricao
) {
}
