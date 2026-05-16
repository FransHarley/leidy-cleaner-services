import type { MetodoPagamento, StatusAtendimentoPagamento, StatusPagamento, TipoServicoPagamento } from './types';

export const metodoPagamentoLabels: Record<MetodoPagamento, string> = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  CARTAO_CREDITO: 'Cartao de credito',
  CREDITO_SOLICITACAO: 'Solicitacao de reposicao',
};

export const tipoServicoPagamentoLabels: Record<TipoServicoPagamento, string> = {
  FAXINA_RESIDENCIAL: 'Faxina residencial',
  FAXINA_COMERCIAL: 'Faxina comercial',
  FAXINA_CONDOMINIO: 'Faxina de condominio',
  FAXINA_EVENTO: 'Faxina para evento',
};

export const statusAtendimentoPagamentoLabels: Record<StatusAtendimentoPagamento, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  CONFIRMADO: 'Confirmado',
  EM_EXECUCAO: 'Em execucao',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  EM_ANALISE: 'Em analise',
};

export const statusPagamentoLabels: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_CONFIRMACAO: 'Aguardando confirmacao',
  PAGO: 'Pago',
  FALHOU: 'Falhou',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Estornado',
};

export function getMetodoPagamentoLabel(metodo: MetodoPagamento) {
  return metodoPagamentoLabels[metodo] ?? metodo;
}

export function getTipoServicoPagamentoLabel(tipoServico: TipoServicoPagamento) {
  return tipoServicoPagamentoLabels[tipoServico] ?? tipoServico;
}

export function getStatusAtendimentoPagamentoInfo(status: StatusAtendimentoPagamento) {
  const classNameByStatus: Record<StatusAtendimentoPagamento, string> = {
    AGUARDANDO_PAGAMENTO: 'bg-amber-50 text-amber-800',
    CONFIRMADO: 'bg-green-50 text-green-700',
    EM_EXECUCAO: 'bg-purple-50 text-purple-800',
    FINALIZADO: 'bg-slate-100 text-slate-700',
    CANCELADO: 'bg-red-50 text-red-700',
    EM_ANALISE: 'bg-blue-50 text-blue-800',
  };

  return {
    label: statusAtendimentoPagamentoLabels[status],
    className: classNameByStatus[status],
  };
}

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
    label: statusPagamentoLabels[status],
    className: classNameByStatus[status],
  };
}

export function getStatusPagamentoDescription(status: StatusPagamento) {
  const descriptions: Record<StatusPagamento, string> = {
    PENDENTE: 'Seu pagamento foi iniciado e esta aguardando confirmacao.',
    AGUARDANDO_CONFIRMACAO: 'Recebemos o retorno do pagamento e estamos concluindo a confirmacao.',
    PAGO: 'Pagamento confirmado com sucesso.',
    FALHOU: 'Nao foi possivel concluir o pagamento.',
    CANCELADO: 'O pagamento foi cancelado.',
    ESTORNADO: 'O pagamento foi estornado.',
  };

  return descriptions[status];
}

export function getGatewayPagamentoLabel(gateway: string | null | undefined) {
  if (gateway === 'INTERNO') {
    return 'Interno';
  }

  if (gateway === 'ASAAS') {
    return 'Asaas';
  }

  return gateway ?? 'Nao informado';
}

export function canRecheckPagamento(status: StatusPagamento) {
  return status === 'PENDENTE' || status === 'AGUARDANDO_CONFIRMACAO';
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
