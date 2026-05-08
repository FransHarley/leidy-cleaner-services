package br.com.leidycleaner.pagamentos.dto;

import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import jakarta.validation.constraints.NotNull;

public record CheckoutRequest(
        @NotNull Long atendimentoId,
        MetodoPagamento metodoPagamento
) {
}
