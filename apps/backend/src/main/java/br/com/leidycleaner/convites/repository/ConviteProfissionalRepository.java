package br.com.leidycleaner.convites.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.convites.entity.ConviteProfissional;
import jakarta.persistence.LockModeType;

public interface ConviteProfissionalRepository extends JpaRepository<ConviteProfissional, Long> {

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

    List<ConviteProfissional> findBySolicitacaoId(Long solicitacaoId);

    Optional<ConviteProfissional> findBySolicitacaoIdAndProfissionalId(Long solicitacaoId, Long profissionalId);

    boolean existsBySolicitacaoId(Long solicitacaoId);

    void deleteBySolicitacaoId(Long solicitacaoId);
}
