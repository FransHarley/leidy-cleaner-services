package br.com.leidycleaner.creditos.repository;

import java.time.OffsetDateTime;
import java.util.List;

import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

public interface CreditoSolicitacaoRepositoryCustom {

    List<CreditoSolicitacao> findAdminList(
            StatusCreditoSolicitacao status,
            Long clienteId,
            Long solicitacaoOrigemId,
            Long solicitacaoUsoId,
            Long pagamentoOrigemId,
            TipoServico tipoServico,
            Long regiaoId,
            OffsetDateTime criadoDe,
            OffsetDateTime criadoAte
    );
}
