import type { AtendimentoFaxina } from './types';

export function getAtendimentoClienteLabel(atendimento: Pick<AtendimentoFaxina, 'clienteId' | 'clienteNome'>) {
  return atendimento.clienteNome ?? `Cliente ID ${atendimento.clienteId}`;
}

export function getAtendimentoProfissionalLabel(
  atendimento: Pick<AtendimentoFaxina, 'profissionalId' | 'profissionalNome'>,
) {
  return atendimento.profissionalNome ?? `Profissional ID ${atendimento.profissionalId}`;
}

export function getAtendimentoProfissionalRatingLabel(
  atendimento: Pick<AtendimentoFaxina, 'profissionalNotaMedia' | 'profissionalTotalAvaliacoes'>,
) {
  const totalAvaliacoes = atendimento.profissionalTotalAvaliacoes ?? 0;

  if (totalAvaliacoes <= 0) {
    return 'Sem avaliações ainda';
  }

  const nota = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(atendimento.profissionalNotaMedia ?? 0));

  return `${nota} · ${totalAvaliacoes} avaliação${totalAvaliacoes === 1 ? '' : 'ões'}`;
}

export function getAtendimentoEnderecoLabel(
  atendimento: Pick<AtendimentoFaxina, 'enderecoResumo' | 'bairro' | 'regiaoNome'>,
) {
  return atendimento.enderecoResumo ?? atendimento.bairro ?? atendimento.regiaoNome ?? 'Endereço não informado';
}

export function getAtendimentoRegiaoLabel(atendimento: Pick<AtendimentoFaxina, 'bairro' | 'regiaoNome'>) {
  return atendimento.regiaoNome ?? atendimento.bairro ?? 'Região não informada';
}
