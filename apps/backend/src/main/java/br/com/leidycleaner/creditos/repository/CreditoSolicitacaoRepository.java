package br.com.leidycleaner.creditos.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.creditos.entity.CreditoSolicitacao;
import br.com.leidycleaner.creditos.entity.StatusCreditoSolicitacao;

public interface CreditoSolicitacaoRepository
        extends JpaRepository<CreditoSolicitacao, Long>, CreditoSolicitacaoRepositoryCustom {

    long countByStatus(StatusCreditoSolicitacao status);

    Optional<CreditoSolicitacao> findByPagamentoOrigemId(Long pagamentoOrigemId);

    boolean existsByPagamentoOrigemId(Long pagamentoOrigemId);

    long countByPagamentoOrigemId(Long pagamentoOrigemId);

    long countByClienteIdAndStatus(Long clienteId, StatusCreditoSolicitacao status);

    boolean existsBySolicitacaoUsoId(Long solicitacaoUsoId);

    Optional<CreditoSolicitacao> findBySolicitacaoUsoId(Long solicitacaoUsoId);

    @Query("""
            select distinct credito
            from CreditoSolicitacao credito
            join fetch credito.cliente cliente
            join fetch cliente.usuario usuario
            join fetch credito.regiao regiao
            join fetch credito.solicitacaoOrigem solicitacaoOrigem
            join fetch solicitacaoOrigem.cliente clienteOrigem
            join fetch clienteOrigem.usuario
            join fetch solicitacaoOrigem.regiao
            join fetch credito.pagamentoOrigem pagamentoOrigem
            left join fetch pagamentoOrigem.atendimento atendimentoOrigem
            left join fetch pagamentoOrigem.solicitacao solicitacaoPagamento
            left join fetch credito.solicitacaoUso solicitacaoUso
            left join fetch solicitacaoUso.cliente clienteUso
            left join fetch clienteUso.usuario
            left join fetch solicitacaoUso.regiao
            where credito.id = :id
            """)
    Optional<CreditoSolicitacao> findAdminById(@Param("id") Long id);

    @Query("""
            select credito
            from CreditoSolicitacao credito
            join fetch credito.cliente cliente
            join fetch cliente.usuario usuario
            join fetch credito.regiao regiao
            left join fetch credito.solicitacaoOrigem solicitacaoOrigem
            left join fetch credito.solicitacaoUso solicitacaoUso
            where usuario.id = :usuarioId
              and (:status is null or credito.status = :status)
            order by credito.criadoEm desc, credito.id desc
            """)
    List<CreditoSolicitacao> findByClienteUsuarioIdOrderByCriadoEmDescIdDesc(
            @Param("usuarioId") Long usuarioId,
            @Param("status") StatusCreditoSolicitacao status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select credito
            from CreditoSolicitacao credito
            join fetch credito.cliente cliente
            join fetch cliente.usuario usuario
            join fetch credito.regiao
            left join fetch credito.solicitacaoOrigem
            left join fetch credito.solicitacaoUso
            where credito.id = :id
              and usuario.id = :usuarioId
            """)
    Optional<CreditoSolicitacao> findByIdAndClienteUsuarioIdForUpdate(
            @Param("id") Long id,
            @Param("usuarioId") Long usuarioId
    );
}
