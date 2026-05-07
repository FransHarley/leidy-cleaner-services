package br.com.leidycleaner.convites.mapper;

import java.time.OffsetDateTime;

import br.com.leidycleaner.convites.dto.ConviteProfissionalDto;
import br.com.leidycleaner.convites.entity.ConviteProfissional;
import br.com.leidycleaner.convites.entity.StatusConvite;
import br.com.leidycleaner.enderecos.entity.Endereco;
import br.com.leidycleaner.solicitacoes.entity.SolicitacaoFaxina;

public final class ConviteProfissionalMapper {

    private ConviteProfissionalMapper() {
    }

    public static ConviteProfissionalDto paraDto(ConviteProfissional convite) {
        SolicitacaoFaxina solicitacao = convite.getSolicitacao();
        Endereco endereco = solicitacao.getEndereco();
        return new ConviteProfissionalDto(
                convite.getId(),
                solicitacao.getId(),
                statusEfetivo(convite),
                convite.getEnviadoEm(),
                convite.getExpiraEm(),
                solicitacao.getDataHoraDesejada(),
                solicitacao.getDuracaoEstimadaHoras(),
                solicitacao.getTipoServico(),
                convite.getProfissional().getNomeExibicao(),
                convite.getProfissional().getNotaMedia(),
                convite.getProfissional().getTotalAvaliacoes(),
                endereco.getBairro(),
                endereco.getCidade(),
                endereco.getEstado(),
                solicitacao.getValorEstimadoProfissional()
        );
    }

    private static StatusConvite statusEfetivo(ConviteProfissional convite) {
        if (convite.podeResponder() && convite.expiradoEm(OffsetDateTime.now())) {
            return StatusConvite.EXPIRADO;
        }

        return convite.getStatus();
    }
}
