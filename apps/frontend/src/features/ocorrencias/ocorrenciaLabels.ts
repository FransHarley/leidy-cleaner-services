import type { StatusOcorrencia, TipoOcorrencia } from './types';
import { statusOcorrenciaValues, tipoOcorrenciaValues } from './types';

export const tipoOcorrenciaLabels: Record<TipoOcorrencia, string> = {
  ATRASO: 'Atraso',
  AUSENCIA: 'Ausência',
  CONDUTA: 'Conduta',
  QUALIDADE_SERVICO: 'Qualidade do serviço',
  PAGAMENTO: 'Pagamento',
  OUTRO: 'Outro',
};

export const statusOcorrenciaLabels: Record<StatusOcorrencia, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em análise',
  RESOLVIDA: 'Resolvida',
  CANCELADA: 'Cancelada',
};

export const tipoOcorrenciaOptions = tipoOcorrenciaValues.map((value) => ({
  value,
  label: tipoOcorrenciaLabels[value],
}));

export const statusOcorrenciaOptions = statusOcorrenciaValues.map((value) => ({
  value,
  label: statusOcorrenciaLabels[value],
}));

export function getTipoOcorrenciaLabel(tipo: TipoOcorrencia) {
  return tipoOcorrenciaLabels[tipo] ?? tipo;
}

export function getStatusOcorrenciaInfo(status: StatusOcorrencia) {
  const classNameByStatus: Record<StatusOcorrencia, string> = {
    ABERTA: 'bg-amber-50 text-amber-800',
    EM_ANALISE: 'bg-blue-50 text-blue-800',
    RESOLVIDA: 'bg-green-50 text-green-700',
    CANCELADA: 'bg-slate-100 text-slate-700',
  };

  return {
    label: statusOcorrenciaLabels[status] ?? status,
    className: classNameByStatus[status] ?? 'bg-slate-100 text-slate-700',
  };
}

export function formatOcorrenciaDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Não informado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatOptionalId(value: number | null | undefined) {
  return value === null || value === undefined ? 'Não informado' : `#${value}`;
}
