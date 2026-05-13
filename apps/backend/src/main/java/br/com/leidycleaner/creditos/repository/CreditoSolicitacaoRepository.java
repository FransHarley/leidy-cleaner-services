package br.com.leidycleaner.creditos.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;

public interface CreditoSolicitacaoRepository extends JpaRepository<CreditoSolicitacao, Long> {

    Optional<CreditoSolicitacao> findByPagamentoOrigemId(Long pagamentoOrigemId);

    boolean existsByPagamentoOrigemId(Long pagamentoOrigemId);

    long countByPagamentoOrigemId(Long pagamentoOrigemId);

    long countByClienteIdAndStatus(Long clienteId, StatusCreditoSolicitacao status);
}
