package br.com.leidycleaner.atendimentos.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.avaliacoes.dto.AvaliacaoProfissionalDto;
import br.com.leidycleaner.atendimentos.entity.StatusAtendimento;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

public record AtendimentoFaxinaProfissionalDto(
        Long id,
        Long solicitacaoId,
        Long clienteId,
        Long profissionalId,
        String clienteNome,
        String profissionalNome,
        BigDecimal profissionalNotaMedia,
        int profissionalTotalAvaliacoes,
        String enderecoResumo,
        String bairro,
        String regiaoNome,
        StatusAtendimento status,
        TipoServico tipoServico,
        BigDecimal valorEstimadoProfissional,
        OffsetDateTime inicioPrevistoEm,
        OffsetDateTime inicioRealEm,
        OffsetDateTime fimRealEm,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm,
        boolean podeAvaliar,
        AvaliacaoProfissionalDto avaliacao
) {
}
