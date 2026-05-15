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

    @Query("""
            select distinct new br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto(
                convite.id,
                convite.status,
                solicitacao.id,
                solicitacao.status,
                cliente.id,
                clienteUsuario.nomeCompleto,
                profissional.id,
                profissionalUsuario.nomeCompleto,
                solicitacao.dataHoraDesejada,
                solicitacao.tipoServico,
                solicitacao.duracaoEstimadaHoras,
                regiao.nome,
                convite.enviadoEm,
                convite.respondidoEm,
                convite.expiraEm,
                case when convite.expiraEm <= :agora then true else false end,
                pagamento.id,
                pagamento.status,
                credito.id
            )
            from ConviteProfissional convite
            join convite.solicitacao solicitacao
            join solicitacao.cliente cliente
            join cliente.usuario clienteUsuario
            join convite.profissional profissional
            join profissional.usuario profissionalUsuario
            join solicitacao.regiao regiao
            left join Pagamento pagamento
                on pagamento.solicitacao.id = solicitacao.id
            left join CreditoSolicitacao credito
                on credito.pagamentoOrigem.id = pagamento.id
            where (:status is null or convite.status = :status)
              and (:solicitacaoId is null or solicitacao.id = :solicitacaoId)
              and (:profissionalId is null or profissional.id = :profissionalId)
              and (:clienteId is null or cliente.id = :clienteId)
              and (:expiraAntesDe is null or convite.expiraEm <= :expiraAntesDe)
              and (:expiraDepoisDe is null or convite.expiraEm >= :expiraDepoisDe)
              and (:somenteVencidos = false or convite.expiraEm <= :agora)
            order by convite.expiraEm asc, convite.id desc
            """)
    List<AdminConviteMonitoramentoDto> findAdminMonitoramento(
            @Param("status") StatusConvite status,
            @Param("solicitacaoId") Long solicitacaoId,
            @Param("profissionalId") Long profissionalId,
            @Param("clienteId") Long clienteId,
            @Param("expiraAntesDe") java.time.OffsetDateTime expiraAntesDe,
            @Param("expiraDepoisDe") java.time.OffsetDateTime expiraDepoisDe,
            @Param("somenteVencidos") boolean somenteVencidos,
            @Param("agora") java.time.OffsetDateTime agora
    );

    List<ConviteProfissional> findBySolicitacaoId(Long solicitacaoId);

    Optional<ConviteProfissional> findBySolicitacaoIdAndProfissionalId(Long solicitacaoId, Long profissionalId);

    boolean existsBySolicitacaoId(Long solicitacaoId);

    void deleteBySolicitacaoId(Long solicitacaoId);
}
