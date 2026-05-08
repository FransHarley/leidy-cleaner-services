package br.com.leidycleaner.ocorrencias.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.leidycleaner.ocorrencias.entity.OcorrenciaAtendimento;
import br.com.leidycleaner.ocorrencias.entity.StatusOcorrencia;

public interface OcorrenciaAtendimentoRepository extends JpaRepository<OcorrenciaAtendimento, Long> {

    long countByStatus(StatusOcorrencia status);

    @Query("""
            select ocorrencia
            from OcorrenciaAtendimento ocorrencia
            join fetch ocorrencia.atendimento
            join fetch ocorrencia.abertoPor
            left join fetch ocorrencia.resolvidoPor
            where ocorrencia.abertoPor.id = :abertoPorUsuarioId
            order by ocorrencia.criadoEm desc, ocorrencia.id desc
            """)
    List<OcorrenciaAtendimento> findByAbertoPorIdOrderByCriadoEmDescIdDesc(
            @Param("abertoPorUsuarioId") Long abertoPorUsuarioId
    );

    @Query("""
            select ocorrencia
            from OcorrenciaAtendimento ocorrencia
            join fetch ocorrencia.atendimento
            join fetch ocorrencia.abertoPor
            left join fetch ocorrencia.resolvidoPor
            order by ocorrencia.criadoEm desc, ocorrencia.id desc
            """)
    List<OcorrenciaAtendimento> findAllByOrderByCriadoEmDescIdDesc();

    @Query("""
            select ocorrencia
            from OcorrenciaAtendimento ocorrencia
            join fetch ocorrencia.atendimento atendimento
            join fetch atendimento.cliente cliente
            join fetch cliente.usuario
            join fetch atendimento.profissional profissional
            join fetch profissional.usuario
            join fetch ocorrencia.abertoPor
            left join fetch ocorrencia.resolvidoPor
            where ocorrencia.id = :id
            """)
    Optional<OcorrenciaAtendimento> findByIdWithRelations(@Param("id") Long id);
}
