import { apiRequest } from '../../services/apiClient';
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  CadastroClienteRequest,
  CadastroProfissionalCompletoRequest,
  CadastroProfissionalRequest,
  CadastroUsuarioResponse,
  RegiaoAtendimentoPublica,
  UsuarioAutenticado,
} from './types';

export function loginRequest(payload: AuthLoginRequest) {
  return apiRequest<AuthLoginResponse>('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getCurrentUserRequest(token: string) {
  return apiRequest<UsuarioAutenticado>('/auth/me', {
    method: 'GET',
    token,
  });
}

export function registerClienteRequest(payload: CadastroClienteRequest) {
  return apiRequest<CadastroUsuarioResponse>('/usuarios/clientes', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registerProfissionalRequest(payload: CadastroProfissionalRequest) {
  return apiRequest<CadastroUsuarioResponse>('/usuarios/profissionais', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registerProfissionalCompletoRequest(payload: CadastroProfissionalCompletoRequest) {
  return apiRequest<CadastroUsuarioResponse>('/usuarios/profissionais/pre-cadastro-completo', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listPublicRegioesRequest() {
  return apiRequest<RegiaoAtendimentoPublica[]>('/regioes', {
    auth: false,
    method: 'GET',
  });
}
