package br.com.leidycleaner.avaliacoes.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.avaliacoes.entity.AvaliacaoProfissional;

public interface AvaliacaoProfissionalRepository extends JpaRepository<AvaliacaoProfissional, Long> {

    boolean existsByAtendimentoId(Long atendimentoId);

    Optional<AvaliacaoProfissional> findByAtendimentoId(Long atendimentoId);

    long countByProfissionalId(Long profissionalId);

    List<AvaliacaoProfissional> findByProfissionalIdOrderByCriadoEmDescIdDesc(Long profissionalId);

    @Query("""
            select avg(avaliacao.nota)
            from AvaliacaoProfissional avaliacao
            where avaliacao.profissional.id = :profissionalId
            """)
    Double calcularNotaMediaProfissional(@Param("profissionalId") Long profissionalId);
}
