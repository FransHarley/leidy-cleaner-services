package br.com.leidycleaner.solicitacoes.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.solicitacoes.entity.StatusSolicitacao;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;
import jakarta.persistence.LockModeType;

public interface SolicitacaoFaxinaRepository extends JpaRepository<SolicitacaoFaxina, Long> {

    long countByStatusIn(Collection<StatusSolicitacao> statuses);

    @Query("""
            select solicitacao
            from SolicitacaoFaxina solicitacao
            join fetch solicitacao.cliente cliente
            join fetch cliente.usuario usuario
            join fetch solicitacao.endereco
            join fetch solicitacao.regiao
            where usuario.id = :usuarioId
            order by solicitacao.criadoEm desc, solicitacao.id desc
            """)
    List<SolicitacaoFaxina> findByClienteUsuarioIdOrderByCriadoEmDescIdDesc(@Param("usuarioId") Long usuarioId);

    @Query("""
            select solicitacao
            from SolicitacaoFaxina solicitacao
            join fetch solicitacao.cliente cliente
            join fetch cliente.usuario usuario
            join fetch solicitacao.endereco
            join fetch solicitacao.regiao
            where solicitacao.id = :id
              and usuario.id = :usuarioId
            """)
    Optional<SolicitacaoFaxina> findByIdAndClienteUsuarioId(
            @Param("id") Long id,
            @Param("usuarioId") Long usuarioId
    );

    @Query("""
            select solicitacao
            from SolicitacaoFaxina solicitacao
            join fetch solicitacao.cliente cliente
            join fetch cliente.usuario
            join fetch solicitacao.endereco endereco
            join fetch solicitacao.regiao regiao
            where (:status is null or solicitacao.status = :status)
              and (:clienteId is null or cliente.id = :clienteId)
              and (:regiaoId is null or regiao.id = :regiaoId)
              and (:tipoServico is null or solicitacao.tipoServico = :tipoServico)
            order by solicitacao.criadoEm desc, solicitacao.id desc
            """)
    List<SolicitacaoFaxina> findAdminList(
            @Param("status") StatusSolicitacao status,
            @Param("clienteId") Long clienteId,
            @Param("regiaoId") Long regiaoId,
            @Param("tipoServico") TipoServico tipoServico
    );

    @Query("""
            select solicitacao
            from SolicitacaoFaxina solicitacao
            join fetch solicitacao.cliente cliente
            join fetch cliente.usuario
            join fetch solicitacao.endereco
            join fetch solicitacao.regiao
            where solicitacao.id = :id
            """)
    Optional<SolicitacaoFaxina> findByIdWithResumo(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select solicitacao from SolicitacaoFaxina solicitacao where solicitacao.id = :id")
    Optional<SolicitacaoFaxina> findByIdForUpdate(@Param("id") Long id);
}
