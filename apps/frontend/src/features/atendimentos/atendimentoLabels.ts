import type { StatusAtendimento, TipoCheckpointServico, TipoServicoAtendimento } from './types';

export const statusAtendimentoLabels: Record<StatusAtendimento, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  CONFIRMADO: 'Confirmado',
  EM_EXECUCAO: 'Em execução',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  EM_ANALISE: 'Em análise',
};

export const tipoServicoAtendimentoLabels: Record<TipoServicoAtendimento, string> = {
  FAXINA_RESIDENCIAL: 'Faxina residencial',
  FAXINA_COMERCIAL: 'Faxina comercial',
  FAXINA_CONDOMINIO: 'Faxina de condomínio',
  FAXINA_EVENTO: 'Faxina para evento',
};

export const tipoCheckpointLabels: Record<TipoCheckpointServico, string> = {
  INICIO: 'Início',
  FIM: 'Fim',
};

export function getStatusAtendimentoInfo(status: StatusAtendimento) {
  const classNameByStatus: Record<StatusAtendimento, string> = {
    AGUARDANDO_PAGAMENTO: 'bg-amber-50 text-amber-800',
    CONFIRMADO: 'bg-green-50 text-green-700',
    EM_EXECUCAO: 'bg-purple-50 text-purple-800',
    FINALIZADO: 'bg-slate-100 text-slate-700',
    CANCELADO: 'bg-red-50 text-red-700',
    EM_ANALISE: 'bg-blue-50 text-blue-800',
  };

  return {
    label: statusAtendimentoLabels[status],
    className: classNameByStatus[status],
  };
}

export function getTipoServicoAtendimentoLabel(tipoServico: TipoServicoAtendimento) {
  return tipoServicoAtendimentoLabels[tipoServico] ?? tipoServico;
}

export function getTipoCheckpointLabel(tipo: TipoCheckpointServico) {
  return tipoCheckpointLabels[tipo] ?? tipo;
}

export function canStartAtendimento(status: StatusAtendimento) {
  return status === 'CONFIRMADO';
}

export function canFinishAtendimento(status: StatusAtendimento) {
  return status === 'EM_EXECUCAO';
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Não informado';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Não informado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatCoordinate(value: number | null) {
  return value === null || value === undefined ? 'Não informado' : String(value);
}
