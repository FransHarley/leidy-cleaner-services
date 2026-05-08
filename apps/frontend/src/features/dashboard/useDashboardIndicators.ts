import { useQuery } from '@tanstack/react-query';

import { listarMeusAtendimentos } from '../atendimentos/atendimentosApi';
import type { AtendimentoVisivel } from '../atendimentos/types';
import type { TipoUsuario } from '../auth/types';
import { listarMeusAtendimentosParaPagamento } from '../cliente/pagamentos/pagamentosApi';
import type { AtendimentoPagamento } from '../cliente/pagamentos/types';
import { listarMinhasSolicitacoes } from '../cliente/solicitacoes/solicitacaoApi';
import type { SolicitacaoFaxina, StatusSolicitacao } from '../cliente/solicitacoes/types';
import { listarMinhasOcorrencias } from '../ocorrencias/ocorrenciasApi';
import type { OcorrenciaAtendimento } from '../ocorrencias/types';
import { isConviteAtivo } from '../profissional/convites/conviteLabels';
import { listarMeusConvites } from '../profissional/convites/convitesApi';
import type { ConviteProfissional } from '../profissional/convites/types';
import { buscarIndicadoresAdmin, type AdminDashboardIndicadores } from './dashboardApi';

const activeSolicitacaoStatuses = new Set<StatusSolicitacao>([
  'CRIADA',
  'AGUARDANDO_SELECAO',
  'CONVITES_ENVIADOS',
  'AGUARDANDO_ACEITE',
  'ACEITA',
  'PAGA',
  'EM_EXECUCAO',
]);

export type DashboardIndicators = {
  cliente: {
    pagamentosPendentes: number;
    atendimentosConfirmados: number;
    solicitacoesAtivas: number;
    ocorrenciasAbertas: number;
    primeiroAtendimentoPagamentoPendenteId: number | null;
  };
  profissional: {
    convitesPendentes: number;
    proximosAtendimentos: number;
    atendimentosEmExecucao: number;
  };
  admin: AdminDashboardIndicadores;
};

export const emptyDashboardIndicators: DashboardIndicators = {
  cliente: {
    pagamentosPendentes: 0,
    atendimentosConfirmados: 0,
    solicitacoesAtivas: 0,
    ocorrenciasAbertas: 0,
    primeiroAtendimentoPagamentoPendenteId: null,
  },
  profissional: {
    convitesPendentes: 0,
    proximosAtendimentos: 0,
    atendimentosEmExecucao: 0,
  },
  admin: {
    verificacoesPendentes: 0,
    profissionaisPendentes: 0,
    ocorrenciasAbertas: 0,
    ocorrenciasEmAnalise: 0,
    pagamentosPendentes: 0,
    pagamentosAguardandoConfirmacao: 0,
    pagamentosFalhos: 0,
    atendimentosEmAnalise: 0,
    solicitacoesAbertas: 0,
    usuariosTotal: 0,
  },
};

export function useDashboardIndicators(profile: TipoUsuario, token: string | null) {
  const isCliente = profile === 'CLIENTE';
  const isProfissional = profile === 'PROFISSIONAL';
  const isAdmin = profile === 'ADMIN';

  const clientePagamentosQuery = useQuery({
    queryKey: ['cliente', 'pagamentos', 'atendimentos'],
    queryFn: () => listarMeusAtendimentosParaPagamento(requireToken(token)),
    enabled: isCliente && Boolean(token),
  });

  const clienteAtendimentosQuery = useQuery({
    queryKey: ['atendimentos', 'meus', 'cliente'],
    queryFn: () => listarMeusAtendimentos(requireToken(token)),
    enabled: isCliente && Boolean(token),
  });

  const clienteSolicitacoesQuery = useQuery({
    queryKey: ['cliente', 'solicitacoes'],
    queryFn: () => listarMinhasSolicitacoes(requireToken(token)),
    enabled: isCliente && Boolean(token),
  });

  const ocorrenciasQuery = useQuery({
    queryKey: ['ocorrencias', 'meus'],
    queryFn: () => listarMinhasOcorrencias(requireToken(token)),
    enabled: (isCliente || isProfissional) && Boolean(token),
  });

  const profissionalConvitesQuery = useQuery({
    queryKey: ['profissional', 'convites'],
    queryFn: () => listarMeusConvites(requireToken(token)),
    enabled: isProfissional && Boolean(token),
  });

  const profissionalAtendimentosQuery = useQuery({
    queryKey: ['atendimentos', 'meus', 'profissional'],
    queryFn: () => listarMeusAtendimentos(requireToken(token)),
    enabled: isProfissional && Boolean(token),
  });

  const adminDashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'indicadores'],
    queryFn: () => buscarIndicadoresAdmin(requireToken(token)),
    enabled: isAdmin && Boolean(token),
    staleTime: 60_000,
  });

  const atendimentosPagamento = clientePagamentosQuery.data ?? [];
  const clienteAtendimentos = clienteAtendimentosQuery.data ?? [];
  const solicitacoes = clienteSolicitacoesQuery.data ?? [];
  const ocorrencias = ocorrenciasQuery.data ?? [];
  const convites = profissionalConvitesQuery.data ?? [];
  const profissionalAtendimentos = profissionalAtendimentosQuery.data ?? [];

  return {
    cliente: buildClienteIndicators(atendimentosPagamento, clienteAtendimentos, solicitacoes, ocorrencias),
    profissional: buildProfissionalIndicators(convites, profissionalAtendimentos),
    admin: adminDashboardQuery.data ?? emptyDashboardIndicators.admin,
    isLoading:
      clientePagamentosQuery.isLoading ||
      clienteAtendimentosQuery.isLoading ||
      clienteSolicitacoesQuery.isLoading ||
      ocorrenciasQuery.isLoading ||
      profissionalConvitesQuery.isLoading ||
      profissionalAtendimentosQuery.isLoading ||
      adminDashboardQuery.isLoading,
    isError: adminDashboardQuery.isError,
    error: adminDashboardQuery.error,
  };
}

function buildClienteIndicators(
  atendimentosPagamento: AtendimentoPagamento[],
  atendimentos: AtendimentoVisivel[],
  solicitacoes: SolicitacaoFaxina[],
  ocorrencias: OcorrenciaAtendimento[],
) {
  const pagamentosPendentes = atendimentosPagamento.filter((atendimento) => atendimento.status === 'AGUARDANDO_PAGAMENTO');
  return {
    pagamentosPendentes: pagamentosPendentes.length,
    atendimentosConfirmados: atendimentos.filter((atendimento) => atendimento.status === 'CONFIRMADO').length,
    solicitacoesAtivas: solicitacoes.filter((solicitacao) => activeSolicitacaoStatuses.has(solicitacao.status)).length,
    ocorrenciasAbertas: ocorrencias.filter((ocorrencia) => ocorrencia.status === 'ABERTA' || ocorrencia.status === 'EM_ANALISE').length,
    primeiroAtendimentoPagamentoPendenteId: pagamentosPendentes[0]?.id ?? null,
  };
}

function buildProfissionalIndicators(convites: ConviteProfissional[], atendimentos: AtendimentoVisivel[]) {
  return {
    convitesPendentes: convites.filter(isConviteAtivo).length,
    proximosAtendimentos: atendimentos.filter((atendimento) => atendimento.status === 'CONFIRMADO').length,
    atendimentosEmExecucao: atendimentos.filter((atendimento) => atendimento.status === 'EM_EXECUCAO').length,
  };
}

function requireToken(token: string | null) {
  if (!token) {
    throw new Error('Sessão expirada.');
  }

  return token;
}
