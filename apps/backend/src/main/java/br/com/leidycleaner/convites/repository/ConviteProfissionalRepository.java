package br.com.leidycleaner.convites.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.entity.StatusConvite;
import jakarta.persistence.LockModeType;

public interface ConviteProfissionalRepository
        extends JpaRepository<ConviteProfissional, Long>, ConviteProfissionalRepositoryCustom {

    @Query("""
            select convite
            from ConviteProfissional convite
            join fetch convite.solicitacao solicitacao
            join fetch solicitacao.endereco
            join fetch convite.profissional profissional
            join profissional.usuario usuario
            where usuario.id = :usuarioId
            order by convite.enviadoEm desc, convite.id desc
            """)
    List<ConviteProfissional> findByProfissionalUsuarioIdOrderByEnviadoEmDescIdDesc(@Param("usuarioId") Long usuarioId);

    @Query("""
            select convite
            from ConviteProfissional convite
            join fetch convite.solicitacao solicitacao
            join fetch solicitacao.endereco
            join fetch convite.profissional profissional
            join profissional.usuario usuario
            where convite.id = :id
              and usuario.id = :usuarioId
            """)
    Optional<ConviteProfissional> findByIdAndProfissionalUsuarioId(
            @Param("id") Long id,
            @Param("usuarioId") Long usuarioId
    );

    @Query("""
            select convite.solicitacao.id
            from ConviteProfissional convite
            where convite.id = :id
              and convite.profissional.usuario.id = :usuarioId
            """)
    Optional<Long> findSolicitacaoIdByIdAndProfissionalUsuarioId(
            @Param("id") Long id,
            @Param("usuarioId") Long usuarioId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select convite
            from ConviteProfissional convite
            where convite.id = :id
              and convite.profissional.usuario.id = :usuarioId
            """)
    Optional<ConviteProfissional> findByIdAndProfissionalUsuarioIdForUpdate(
            @Param("id") Long id,
            @Param("usuarioId") Long usuarioId
    );

    @Query("""
            select convite.solicitacao.id
            from ConviteProfissional convite
            where convite.id = :id
            """)
    Optional<Long> findSolicitacaoIdById(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select convite
            from ConviteProfissional convite
            where convite.id = :id
            """)
    Optional<ConviteProfissional> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select convite.id
            from ConviteProfissional convite
            where convite.status in :statuses
              and convite.expiraEm <= :agora
            order by convite.expiraEm asc, convite.id asc
            """)
    List<Long> findExpiredRespondableIds(
            @Param("statuses") List<StatusConvite> statuses,
            @Param("agora") java.time.OffsetDateTime agora,
            Pageable pageable
    );

    @Query("""
            select count(convite)
            from ConviteProfissional convite
            where convite.status in :statuses
              and convite.expiraEm <= :agora
            """)
    long countExpiredRespondable(
            @Param("statuses") List<StatusConvite> statuses,
            @Param("agora") java.time.OffsetDateTime agora
    );

    List<ConviteProfissional> findBySolicitacaoId(Long solicitacaoId);

    Optional<ConviteProfissional> findBySolicitacaoIdAndProfissionalId(Long solicitacaoId, Long profissionalId);

    boolean existsBySolicitacaoId(Long solicitacaoId);

    void deleteBySolicitacaoId(Long solicitacaoId);
}
