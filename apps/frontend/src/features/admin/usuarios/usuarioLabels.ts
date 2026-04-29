import type { StatusConta, TipoUsuario } from './types';

export const tipoUsuarioOptions: Array<{ value: TipoUsuario; label: string }> = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'PROFISSIONAL', label: 'Profissional' },
];

export const statusContaOptions: Array<{ value: StatusConta; label: string }> = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'INATIVA', label: 'Inativa' },
  { value: 'BLOQUEADA', label: 'Bloqueada' },
  { value: 'PENDENTE_VERIFICACAO', label: 'Pendente de verificação' },
];

export function getTipoUsuarioInfo(tipoUsuario: TipoUsuario) {
  const labels: Record<TipoUsuario, { label: string; className: string }> = {
    ADMIN: { label: 'Admin', className: 'bg-purple-50 text-purple-800' },
    CLIENTE: { label: 'Cliente', className: 'bg-green-50 text-green-700' },
    PROFISSIONAL: { label: 'Profissional', className: 'bg-blue-50 text-blue-800' },
  };

  return labels[tipoUsuario];
}

export function getStatusContaInfo(statusConta: StatusConta) {
  const labels: Record<StatusConta, { label: string; className: string }> = {
    ATIVA: { label: 'Ativa', className: 'bg-green-50 text-green-700' },
    INATIVA: { label: 'Inativa', className: 'bg-slate-100 text-slate-700' },
    BLOQUEADA: { label: 'Bloqueada', className: 'bg-red-50 text-red-700' },
    PENDENTE_VERIFICACAO: { label: 'Pendente de verificação', className: 'bg-amber-50 text-amber-800' },
  };

  return labels[statusConta];
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

export function formatId(value: number | null | undefined) {
  return value ? `#${value}` : 'Não informado';
}

export function formatBoolean(value: boolean) {
  return value ? 'Sim' : 'Não';
}
