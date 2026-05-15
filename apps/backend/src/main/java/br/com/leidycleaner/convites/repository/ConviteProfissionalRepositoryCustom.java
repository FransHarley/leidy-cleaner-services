package br.com.leidycleaner.convites.repository;

import java.time.OffsetDateTime;
import java.util.List;

import br.com.leidycleaner.convites.dto.AdminConviteMonitoramentoDto;
import br.com.leidycleaner.convites.entity.StatusConvite;

public interface ConviteProfissionalRepositoryCustom {

    List<AdminConviteMonitoramentoDto> findAdminMonitoramento(
            StatusConvite status,
            Long solicitacaoId,
            Long profissionalId,
            Long clienteId,
            OffsetDateTime expiraAntesDe,
            OffsetDateTime expiraDepoisDe,
            boolean somenteVencidos,
            OffsetDateTime agora
    );
}
