import { apiRequest } from '../../../services/apiClient';
import type { AdminUsuario, ListarUsuariosAdminParams } from './types';

export function listarUsuariosAdmin(token: string, params: ListarUsuariosAdminParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.tipoUsuario) {
    searchParams.set('tipoUsuario', params.tipoUsuario);
  }

  if (params.statusConta) {
    searchParams.set('statusConta', params.statusConta);
  }

  if (params.search) {
    searchParams.set('search', params.search);
  }

  const queryString = searchParams.toString();

  return apiRequest<AdminUsuario[]>(`/usuarios${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    token,
  });
}

export function buscarUsuarioAdmin(token: string, usuarioId: number) {
  return apiRequest<AdminUsuario>(`/usuarios/${usuarioId}`, {
    method: 'GET',
    token,
  });
}
