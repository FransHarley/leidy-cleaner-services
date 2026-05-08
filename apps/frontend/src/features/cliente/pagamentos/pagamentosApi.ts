import { ApiError, apiRequest } from '../../../services/apiClient';
import type { AtendimentoPagamento, CheckoutPagamento, CheckoutPagamentoRequest, Pagamento, PixQrCodePagamento } from './types';

export function listarMeusAtendimentosParaPagamento(token: string) {
  return apiRequest<AtendimentoPagamento[]>('/atendimentos/meus', {
    method: 'GET',
    token,
  });
}

export function buscarAtendimentoParaPagamento(token: string, atendimentoId: number) {
  return apiRequest<AtendimentoPagamento>(`/atendimentos/${atendimentoId}`, {
    method: 'GET',
    token,
  });
}

export function criarCheckoutPagamento(token: string, payload: CheckoutPagamentoRequest) {
  return apiRequest<CheckoutPagamento>('/pagamentos/checkout', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function buscarPagamento(token: string, pagamentoId: number) {
  return apiRequest<Pagamento>(`/pagamentos/${pagamentoId}`, {
    method: 'GET',
    token,
  });
}

export function buscarPixQrCodePagamento(token: string, pagamentoId: number) {
  return apiRequest<PixQrCodePagamento>(`/pagamentos/${pagamentoId}/pix-qrcode`, {
    method: 'GET',
    token,
  });
}

export function buscarPagamentoPorAtendimento(token: string, atendimentoId: number) {
  return apiRequest<Pagamento>(`/pagamentos/atendimento/${atendimentoId}`, {
    method: 'GET',
    token,
  });
}

export async function buscarPagamentoPorAtendimentoOuNull(token: string, atendimentoId: number) {
  try {
    return await buscarPagamentoPorAtendimento(token, atendimentoId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function consultarStatusPagamento(token: string, pagamentoId: number) {
  return apiRequest<Pagamento>(`/pagamentos/${pagamentoId}/consultar-status`, {
    method: 'POST',
    token,
  });
}

export function redirecionarParaPagamentoAsaas(paymentUrl: string) {
  window.location.href = paymentUrl;
}
