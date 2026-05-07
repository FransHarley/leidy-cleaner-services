import type { ConviteProfissional, StatusConvite, TipoServico } from './types';

export const statusConviteLabels: Record<StatusConvite, string> = {
  ENVIADO: 'Enviado',
  VISUALIZADO: 'Visualizado',
  ACEITO: 'Aceito',
  RECUSADO: 'Recusado',
  EXPIRADO: 'Expirado',
  CANCELADO: 'Cancelado',
};

export const tipoServicoLabels: Record<TipoServico, string> = {
  FAXINA_RESIDENCIAL: 'Faxina residencial',
  FAXINA_COMERCIAL: 'Faxina comercial',
  FAXINA_CONDOMINIO: 'Faxina de condomínio',
  FAXINA_EVENTO: 'Faxina para evento',
};

export function getStatusConviteInfo(status: StatusConvite) {
  const classNameByStatus: Record<StatusConvite, string> = {
    ENVIADO: 'bg-blue-50 text-blue-800',
    VISUALIZADO: 'bg-amber-50 text-amber-800',
    ACEITO: 'bg-green-50 text-green-700',
    RECUSADO: 'bg-slate-100 text-slate-700',
    EXPIRADO: 'bg-red-50 text-red-700',
    CANCELADO: 'bg-red-50 text-red-700',
  };

  return {
    label: statusConviteLabels[status],
    className: classNameByStatus[status],
  };
}

export function getTipoServicoLabel(tipoServico: TipoServico) {
  return tipoServicoLabels[tipoServico] ?? tipoServico;
}

export function canRespondToConvite(status: StatusConvite) {
  return status === 'ENVIADO' || status === 'VISUALIZADO';
}

export function getStatusConviteEfetivo(convite: ConviteProfissional): StatusConvite {
  if (canRespondToConvite(convite.status) && isConviteExpirado(convite.expiraEm)) {
    return 'EXPIRADO';
  }

  return convite.status;
}

export function isConviteExpirado(expiraEm: string) {
  const timestamp = new Date(expiraEm).getTime();
  return Number.isFinite(timestamp) && timestamp <= Date.now();
}

export function isConviteAtivo(convite: ConviteProfissional) {
  return canRespondToConvite(getStatusConviteEfetivo(convite)) && !isConviteExpirado(convite.expiraEm);
}

export function formatConviteProfissionalRating(convite: ConviteProfissional) {
  const totalAvaliacoes = convite.profissionalTotalAvaliacoes ?? 0;

  if (totalAvaliacoes <= 0) {
    return 'Sem avaliações ainda';
  }

  const nota = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(convite.profissionalNotaMedia ?? 0));

  return `${nota} · ${totalAvaliacoes} avaliação${totalAvaliacoes === 1 ? '' : 'ões'}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatInviteLocation({ bairro, cidade, estado }: { bairro: string; cidade: string; estado: string }) {
  return [bairro, cidade, estado].filter(Boolean).join(' - ');
}
