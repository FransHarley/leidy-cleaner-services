package br.com.leidycleaner.atendimentos.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.atendimentos.entity.CheckpointServico;
import br.com.leidycleaner.atendimentos.entity.TipoCheckpointServico;

public interface CheckpointServicoRepository extends JpaRepository<CheckpointServico, Long> {

    @Query("""
            select checkpoint
            from CheckpointServico checkpoint
            join fetch checkpoint.registradoPor
            where checkpoint.atendimento.id = :atendimentoId
            order by checkpoint.registradoEm asc, checkpoint.id asc
            """)
    List<CheckpointServico> findByAtendimentoIdOrderByRegistradoEmAscIdAsc(@Param("atendimentoId") Long atendimentoId);

    boolean existsByAtendimentoIdAndTipo(Long atendimentoId, TipoCheckpointServico tipo);
}
