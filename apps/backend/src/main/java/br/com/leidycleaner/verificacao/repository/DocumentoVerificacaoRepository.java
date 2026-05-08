package br.com.leidycleaner.verificacao.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.verificacao.entity.DocumentoVerificacao;
import br.com.leidycleaner.verificacao.entity.StatusVerificacao;

public interface DocumentoVerificacaoRepository extends JpaRepository<DocumentoVerificacao, Long> {

    long countByStatusVerificacaoIn(Collection<StatusVerificacao> statuses);

    @Query("""
            select documento
            from DocumentoVerificacao documento
            join fetch documento.usuario
            left join fetch documento.analisadoPorUsuario
            where documento.usuario.id = :usuarioId
            order by coalesce(documento.analisadoEm, documento.criadoEm) desc, documento.id desc
            """)
    List<DocumentoVerificacao> findVerificacoesEfetivasPorUsuarioId(
            @Param("usuarioId") Long usuarioId,
            Pageable pageable
    );

    default Optional<DocumentoVerificacao> findVerificacaoEfetivaPorUsuarioId(Long usuarioId) {
        // Effective/current verification is the latest by analisadoEm when available,
        // otherwise criadoEm, with id desc as deterministic tie-breaker.
        return findVerificacoesEfetivasPorUsuarioId(usuarioId, PageRequest.of(0, 1))
                .stream()
                .findFirst();
    }

    default boolean usuarioPossuiVerificacaoEfetivaAprovada(Long usuarioId) {
        return findVerificacaoEfetivaPorUsuarioId(usuarioId)
                .map(documento -> documento.getStatusVerificacao() == StatusVerificacao.APROVADO)
                .orElse(false);
    }

    @Query("""
            select documento
            from DocumentoVerificacao documento
            join fetch documento.usuario
            left join fetch documento.analisadoPorUsuario
            order by documento.criadoEm desc
            """)
    List<DocumentoVerificacao> findByOrderByCriadoEmDesc();

    @Query("""
            select documento
            from DocumentoVerificacao documento
            join fetch documento.usuario
            left join fetch documento.analisadoPorUsuario
            where documento.id = :id
            """)
    Optional<DocumentoVerificacao> findByIdWithUsuarios(@Param("id") Long id);
}
