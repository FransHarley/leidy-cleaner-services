package br.com.leidycleaner.creditos.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.leidycleaner.core.exception.BusinessException;
import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.repository.CreditoSolicitacaoRepository;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;

@Service
public class CreditoSolicitacaoService {

    private final CreditoSolicitacaoRepository creditoSolicitacaoRepository;

    public CreditoSolicitacaoService(CreditoSolicitacaoRepository creditoSolicitacaoRepository) {
        this.creditoSolicitacaoRepository = creditoSolicitacaoRepository;
    }

    @Transactional
    public CreditoSolicitacao gerarCreditoDisponivel(
            SolicitacaoFaxina solicitacao,
            Pagamento pagamento,
            String observacao
    ) {
        if (pagamento.getSolicitacao() == null || !pagamento.getSolicitacao().getId().equals(solicitacao.getId())) {
            throw new BusinessException(
                    "PAGAMENTO_SOLICITACAO_INCOMPATIVEL",
                    "Pagamento informado nao pertence a solicitacao que gerou o credito",
                    HttpStatus.CONFLICT
            );
        }
        return creditoSolicitacaoRepository.findByPagamentoOrigemId(pagamento.getId())
                .orElseGet(() -> creditoSolicitacaoRepository.saveAndFlush(
                        CreditoSolicitacao.criarDisponivel(solicitacao, pagamento, observacao)
                ));
    }
}
