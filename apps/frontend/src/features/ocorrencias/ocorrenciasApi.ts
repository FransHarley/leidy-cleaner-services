import { apiRequest } from '../../services/apiClient';
import type { AtualizarStatusOcorrenciaRequest, CriarOcorrenciaRequest, OcorrenciaAtendimento } from './types';

export function criarOcorrencia(token: string, payload: CriarOcorrenciaRequest) {
  return apiRequest<OcorrenciaAtendimento>('/ocorrencias', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function listarMinhasOcorrencias(token: string) {
  return apiRequest<OcorrenciaAtendimento[]>('/ocorrencias/meus', {
    method: 'GET',
    token,
  });
}

export function buscarOcorrencia(token: string, ocorrenciaId: number) {
  return apiRequest<OcorrenciaAtendimento>(`/ocorrencias/${ocorrenciaId}`, {
    method: 'GET',
    token,
  });
}

export function listarOcorrenciasAdmin(token: string) {
  return apiRequest<OcorrenciaAtendimento[]>('/ocorrencias', {
    method: 'GET',
    token,
  });
}

export function atualizarStatusOcorrenciaAdmin(
  token: string,
  ocorrenciaId: number,
  payload: AtualizarStatusOcorrenciaRequest,
) {
  return apiRequest<OcorrenciaAtendimento>(`/ocorrencias/${ocorrenciaId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}
