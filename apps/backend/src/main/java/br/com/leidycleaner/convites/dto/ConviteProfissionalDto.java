package br.com.leidycleaner.convites.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import br.com.leidycleaner.convites.entity.StatusConvite;
import br.com.leidycleaner.solicitacoes.entity.TipoServico;

public record ConviteProfissionalDto(
        Long conviteId,
        Long solicitacaoId,
        StatusConvite status,
        OffsetDateTime enviadoEm,
        OffsetDateTime expiraEm,
        OffsetDateTime dataHoraDesejada,
        Integer duracaoEstimadaHoras,
        TipoServico tipoServico,
        String profissionalNome,
        BigDecimal profissionalNotaMedia,
        int profissionalTotalAvaliacoes,
        String bairro,
        String cidade,
        String estado,
        BigDecimal valorEstimadoProfissional
) {
}
