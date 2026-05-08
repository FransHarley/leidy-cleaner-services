package br.com.leidycleaner.atendimentos.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.pagamentos.entity.StatusPagamento;
import jakarta.persistence.LockModeType;

public interface AtendimentoFaxinaRepository extends JpaRepository<AtendimentoFaxina, Long> {

    Optional<AtendimentoFaxina> findBySolicitacaoId(Long solicitacaoId);

    boolean existsBySolicitacaoId(Long solicitacaoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select a
            from AtendimentoFaxina a
            where a.status = :statusAtendimento
              and a.inicioPrevistoEm < :agora
              and not exists (
                  select p.id
                  from Pagamento p
                  where p.atendimento = a
                    and p.status = :statusPagamentoPago
              )
            """)
    List<AtendimentoFaxina> findVencidosSemPagamentoPagoForUpdate(
            @Param("statusAtendimento") StatusAtendimento statusAtendimento,
            @Param("statusPagamentoPago") StatusPagamento statusPagamentoPago,
            @Param("agora") OffsetDateTime agora
    );

    @Query("""
            select a
            from AtendimentoFaxina a
            join fetch a.solicitacao s
            join fetch s.endereco
            join fetch s.regiao
            join fetch a.cliente c
            join fetch c.usuario cu
            join fetch a.profissional p
            join fetch p.usuario pu
            where cu.id = :usuarioId
               or pu.id = :usuarioId
            order by a.inicioPrevistoEm desc, a.id desc
            """)
    List<AtendimentoFaxina> findRelacionadosByUsuarioId(@Param("usuarioId") Long usuarioId);

    @Query("""
            select a
            from AtendimentoFaxina a
            join fetch a.solicitacao s
            join fetch s.endereco
            join fetch s.regiao
            join fetch a.cliente c
            join fetch c.usuario
            join fetch a.profissional p
            join fetch p.usuario
            where (:status is null or a.status = :status)
              and (:clienteId is null or c.id = :clienteId)
              and (:profissionalId is null or p.id = :profissionalId)
            order by a.inicioPrevistoEm desc, a.id desc
            """)
    List<AtendimentoFaxina> findAdminList(
            @Param("status") StatusAtendimento status,
            @Param("clienteId") Long clienteId,
            @Param("profissionalId") Long profissionalId
    );

    @Query("""
            select a
            from AtendimentoFaxina a
            join fetch a.solicitacao s
            join fetch s.endereco
            join fetch s.regiao
            join fetch a.cliente c
            join fetch c.usuario
            join fetch a.profissional p
            join fetch p.usuario
            where a.id = :id
            """)
    Optional<AtendimentoFaxina> findByIdWithResumo(@Param("id") Long id);

    @Query("""
            select a
            from AtendimentoFaxina a
            join fetch a.solicitacao s
            join fetch s.endereco
            join fetch s.regiao
            join fetch a.cliente c
            join fetch c.usuario cu
            join fetch a.profissional p
            join fetch p.usuario pu
            where a.id = :id
              and (
                  cu.id = :usuarioId
                  or pu.id = :usuarioId
              )
            """)
    Optional<AtendimentoFaxina> findRelacionadoByIdAndUsuarioId(
            @Param("id") Long id,
            @Param("usuarioId") Long usuarioId
    );
}
