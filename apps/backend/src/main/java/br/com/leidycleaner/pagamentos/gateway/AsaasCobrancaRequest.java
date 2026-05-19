package br.com.leidycleaner.pagamentos.gateway;

import java.math.BigDecimal;

import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;

public record AsaasCobrancaRequest(
        String customerId,
        String externalReference,
        String callbackParametroNome,
        Long callbackReferenciaId,
        MetodoPagamento metodoPagamento,
        BigDecimal valor,
        String descricao
) {

    public AsaasCobrancaRequest(
            String customerId,
            Long atendimentoId,
            MetodoPagamento metodoPagamento,
            BigDecimal valor,
            String descricao
    ) {
        this(
                customerId,
                "atendimento-" + atendimentoId,
                "atendimentoId",
                atendimentoId,
                metodoPagamento,
                valor,
                descricao
        );
    }

    public static AsaasCobrancaRequest paraSolicitacao(
            String customerId,
            Long solicitacaoId,
            MetodoPagamento metodoPagamento,
            BigDecimal valor,
            String descricao
    ) {
        return new AsaasCobrancaRequest(
                customerId,
                "solicitacao-" + solicitacaoId,
                "solicitacaoId",
                solicitacaoId,
                metodoPagamento,
                valor,
                descricao
        );
    }
}
