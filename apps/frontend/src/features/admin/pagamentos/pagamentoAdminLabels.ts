import type { GatewayPagamento, MetodoPagamento, StatusPagamento } from './types';

export const statusPagamentoLabels: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmacao',
  PAGO: 'Pago',
  FALHOU: 'Falhou',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Estornado',
};

export const metodoPagamentoLabels: Record<MetodoPagamento, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CARTAO_CREDITO: 'Cartao de credito',
  CREDITO_SOLICITACAO: 'Credito de solicitacao',
};

export const gatewayPagamentoLabels: Record<GatewayPagamento, string> = {
  ASAAS: 'Asaas',
  INTERNO: 'Interno',
};

export function getStatusPagamentoInfo(status: StatusPagamento) {
  const classNameByStatus: Record<StatusPagamento, string> = {
    PENDENTE: 'bg-amber-50 text-amber-800',
    AGUARDANDO_CONFIRMACAO: 'bg-blue-50 text-blue-800',
    PAGO: 'bg-green-50 text-green-700',
    FALHOU: 'bg-red-50 text-red-700',
    CANCELADO: 'bg-red-50 text-red-700',
    ESTORNADO: 'bg-slate-100 text-slate-700',
  };

  return {
    label: statusPagamentoLabels[status] ?? status,
    className: classNameByStatus[status] ?? 'bg-slate-100 text-slate-700',
  };
}

export function getMetodoPagamentoLabel(metodo: MetodoPagamento) {
  return metodoPagamentoLabels[metodo] ?? metodo;
}

export function getGatewayPagamentoLabel(gateway: GatewayPagamento) {
  return gatewayPagamentoLabels[gateway] ?? gateway;
}

export function getWebhookLabel(webhookProcessado: boolean) {
  return webhookProcessado ? 'Concluida' : 'Pendente';
}

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Nao informado';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Nao informado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
