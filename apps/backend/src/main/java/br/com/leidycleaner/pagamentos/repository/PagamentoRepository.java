package br.com.leidycleaner.pagamentos.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.pagamentos.entity.MetodoPagamento;
import br.com.leidycleaner.pagamentos.entity.Pagamento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import br.com.leidycleaner.pagamentos.entity.GatewayPagamento;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {

    long countByStatus(StatusPagamento status);

    long countByGatewayAndMetodoPagamento(GatewayPagamento gateway, MetodoPagamento metodoPagamento);

    @Query("""
            select p
            from Pagamento p
            left join fetch p.atendimento a
            left join fetch a.cliente ac
            left join fetch ac.usuario
            left join fetch p.solicitacao s
            left join fetch s.cliente sc
            left join fetch sc.usuario
            where (:status is null or p.status = :status)
              and (:metodoPagamento is null or p.metodoPagamento = :metodoPagamento)
              and (:atendimentoId is null or a.id = :atendimentoId)
              and (:solicitacaoId is null or s.id = :solicitacaoId)
            order by p.criadoEm desc, p.id desc
            """)
    List<Pagamento> findAdminList(
            @Param("status") StatusPagamento status,
            @Param("metodoPagamento") MetodoPagamento metodoPagamento,
            @Param("atendimentoId") Long atendimentoId,
            @Param("solicitacaoId") Long solicitacaoId
    );

    @Query("""
            select p
            from Pagamento p
            join fetch p.atendimento a
            join fetch a.cliente c
            join fetch c.usuario
            where a.id = :atendimentoId
            """)
    Optional<Pagamento> findByAtendimentoId(@Param("atendimentoId") Long atendimentoId);

    @Query("""
            select p
            from Pagamento p
            join fetch p.solicitacao s
            join fetch s.cliente c
            join fetch c.usuario
            where s.id = :solicitacaoId
            """)
    Optional<Pagamento> findBySolicitacaoId(@Param("solicitacaoId") Long solicitacaoId);

    @Query("""
            select p
            from Pagamento p
            left join fetch p.atendimento a
            left join fetch a.cliente ac
            left join fetch ac.usuario
            left join fetch p.solicitacao s
            left join fetch s.cliente sc
            left join fetch sc.usuario
            where p.id = :id
            """)
    Optional<Pagamento> findByIdWithRelacionamentos(@Param("id") Long id);

    Optional<Pagamento> findByGatewayPaymentId(String gatewayPaymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from Pagamento p
            left join fetch p.atendimento
            left join fetch p.solicitacao
            where p.gatewayPaymentId = :gatewayPaymentId
            """)
    Optional<Pagamento> findByGatewayPaymentIdForUpdate(@Param("gatewayPaymentId") String gatewayPaymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from Pagamento p
            join fetch p.atendimento a
            where a.id = :atendimentoId
            """)
    Optional<Pagamento> findByAtendimentoIdForUpdate(@Param("atendimentoId") Long atendimentoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from Pagamento p
            left join fetch p.atendimento
            join fetch p.solicitacao s
            where s.id = :solicitacaoId
            """)
    Optional<Pagamento> findBySolicitacaoIdForUpdate(@Param("solicitacaoId") Long solicitacaoId);

    boolean existsByAtendimentoId(Long atendimentoId);

    boolean existsBySolicitacaoId(Long solicitacaoId);
}
