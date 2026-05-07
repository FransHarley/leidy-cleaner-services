package br.com.leidycleaner.atendimentos.mapper;

import br.com.leidycleaner.avaliacoes.dto.AvaliacaoProfissionalDto;
import br.com.leidycleaner.atendimentos.dto.AtendimentoFaxinaDto;
import br.com.leidycleaner.atendimentos.dto.AtendimentoFaxinaProfissionalDto;
import br.com.leidycleaner.atendimentos.dto.CheckpointServicoDto;
import br.com.leidycleaner.atendimentos.entity.AtendimentoFaxina;
import br.com.leidycleaner.atendimentos.entity.CheckpointServico;

public final class AtendimentoFaxinaMapper {

    private AtendimentoFaxinaMapper() {
    }

    public static AtendimentoFaxinaDto paraDto(AtendimentoFaxina atendimento) {
        return paraDto(atendimento, null);
    }

    public static AtendimentoFaxinaDto paraDto(AtendimentoFaxina atendimento, AvaliacaoProfissionalDto avaliacao) {
        return new AtendimentoFaxinaDto(
                atendimento.getId(),
                atendimento.getSolicitacao().getId(),
                atendimento.getCliente().getId(),
                atendimento.getProfissional().getId(),
                atendimento.getCliente().getUsuario().getNomeCompleto(),
                atendimento.getProfissional().getNomeExibicao(),
                atendimento.getProfissional().getNotaMedia(),
                atendimento.getProfissional().getTotalAvaliacoes(),
                formatarEndereco(atendimento),
                atendimento.getSolicitacao().getEndereco().getBairro(),
                atendimento.getSolicitacao().getRegiao().getNome(),
                atendimento.getStatus(),
                atendimento.getSolicitacao().getTipoServico(),
                atendimento.getValorServico(),
                atendimento.getPercentualComissaoAgencia(),
                atendimento.getValorEstimadoProfissional(),
                atendimento.getInicioPrevistoEm(),
                atendimento.getInicioRealEm(),
                atendimento.getFimRealEm(),
                atendimento.getCriadoEm(),
                atendimento.getAtualizadoEm(),
                avaliacao
        );
    }

    public static AtendimentoFaxinaProfissionalDto paraProfissionalDto(AtendimentoFaxina atendimento) {
        return paraProfissionalDto(atendimento, null);
    }

    public static AtendimentoFaxinaProfissionalDto paraProfissionalDto(AtendimentoFaxina atendimento, AvaliacaoProfissionalDto avaliacao) {
        return new AtendimentoFaxinaProfissionalDto(
                atendimento.getId(),
                atendimento.getSolicitacao().getId(),
                atendimento.getCliente().getId(),
                atendimento.getProfissional().getId(),
                atendimento.getCliente().getUsuario().getNomeCompleto(),
                atendimento.getProfissional().getNomeExibicao(),
                atendimento.getProfissional().getNotaMedia(),
                atendimento.getProfissional().getTotalAvaliacoes(),
                formatarEndereco(atendimento),
                atendimento.getSolicitacao().getEndereco().getBairro(),
                atendimento.getSolicitacao().getRegiao().getNome(),
                atendimento.getStatus(),
                atendimento.getSolicitacao().getTipoServico(),
                atendimento.getValorEstimadoProfissional(),
                atendimento.getInicioPrevistoEm(),
                atendimento.getInicioRealEm(),
                atendimento.getFimRealEm(),
                atendimento.getCriadoEm(),
                atendimento.getAtualizadoEm(),
                avaliacao
        );
    }

    private static String formatarEndereco(AtendimentoFaxina atendimento) {
        var endereco = atendimento.getSolicitacao().getEndereco();
        String complemento = endereco.getComplemento() == null || endereco.getComplemento().isBlank()
                ? ""
                : ", " + endereco.getComplemento();
        return "%s, %s%s - %s, %s/%s".formatted(
                endereco.getLogradouro(),
                endereco.getNumero(),
                complemento,
                endereco.getBairro(),
                endereco.getCidade(),
                endereco.getEstado()
        );
    }

    public static CheckpointServicoDto paraDto(CheckpointServico checkpoint) {
        return new CheckpointServicoDto(
                checkpoint.getId(),
                checkpoint.getAtendimento().getId(),
                checkpoint.getTipo(),
                checkpoint.getRegistradoPor().getId(),
                checkpoint.getRegistradoPor().getNomeCompleto(),
                checkpoint.getLatitude(),
                checkpoint.getLongitude(),
                checkpoint.getFotoComprovacaoUrl(),
                checkpoint.getObservacao(),
                checkpoint.getRegistradoEm()
        );
    }
}
