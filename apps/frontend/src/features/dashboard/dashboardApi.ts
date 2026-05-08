import { apiRequest } from '../../services/apiClient';

export type AdminDashboardIndicadores = {
  verificacoesPendentes: number;
  profissionaisPendentes: number;
  ocorrenciasAbertas: number;
  ocorrenciasEmAnalise: number;
  pagamentosPendentes: number;
  pagamentosAguardandoConfirmacao: number;
  pagamentosFalhos: number;
  atendimentosEmAnalise: number;
  solicitacoesAbertas: number;
  usuariosTotal: number;
};

export function buscarIndicadoresAdmin(token: string) {
  return apiRequest<AdminDashboardIndicadores>('/admin/dashboard/indicadores', {
    method: 'GET',
    token,
  });
}
