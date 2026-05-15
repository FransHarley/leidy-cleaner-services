import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { listarMeusEnderecos } from '../../features/cliente/enderecos/enderecoApi';
import { SolicitacaoForm } from '../../features/cliente/solicitacoes/SolicitacaoForm';
import { SolicitacaoList } from '../../features/cliente/solicitacoes/SolicitacaoList';
import { formatDateTime } from '../../features/cliente/solicitacoes/SolicitacaoCard';
import { getSolicitacaoEnderecoLabel, getSolicitacaoRegiaoLabel } from '../../features/cliente/solicitacoes/solicitacaoDisplay';
import {
  canSelectProfessionals,
  getStatusSolicitacaoInfo,
  getTipoServicoLabel,
} from '../../features/cliente/solicitacoes/solicitacaoLabels';
import {
  buscarSolicitacao,
  cancelarSolicitacao,
  criarSolicitacao,
  listarMinhasSolicitacoes,
  listarRegioesAtivas,
} from '../../features/cliente/solicitacoes/solicitacaoApi';
import type {
  RegiaoAtendimento,
  SolicitacaoContexto,
  SolicitacaoFaxina,
  SolicitacaoFaxinaRequest,
} from '../../features/cliente/solicitacoes/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  enderecos: ['cliente', 'enderecos'],
  regioes: ['regioes'],
  solicitacoes: ['cliente', 'solicitacoes'],
  detalhe: (id: number | null) => ['cliente', 'solicitacoes', id],
};

type Feedback = {
  tone: 'error' | 'info' | 'success';
  title: string;
  message: string;
  details?: string[];
};

type SolicitationRedirectState = {
  feedback?: Feedback;
  selectedSolicitacaoId?: number | null;
};

export function ClienteSolicitacoesPage() {
  const { token, logout, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const sessionReady = status === 'authenticated' && Boolean(token);
  const redirectState = location.state as SolicitationRedirectState | null;

  const enderecosQuery = useQuery({
    queryKey: queryKeys.enderecos,
    queryFn: () => listarMeusEnderecos(requireToken(token)),
    enabled: sessionReady,
  });

  const regioesQuery = useQuery({
    queryKey: queryKeys.regioes,
    queryFn: listarRegioesAtivas,
  });

  const solicitacoesQuery = useQuery({
    queryKey: queryKeys.solicitacoes,
    queryFn: () => listarMinhasSolicitacoes(requireToken(token)),
    enabled: sessionReady,
  });

  const detalheQuery = useQuery({
    queryKey: queryKeys.detalhe(selectedId),
    queryFn: () => buscarSolicitacao(requireToken(token), requireSelectedId(selectedId)),
    enabled: Boolean(sessionReady && selectedId),
  });

  const protectedError = useMemo(
    () =>
      [enderecosQuery.error, solicitacoesQuery.error, detalheQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [detalheQuery.error, enderecosQuery.error, solicitacoesQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const section = document.getElementById(location.hash.replace('#', ''));
    section?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [location.hash]);

  useEffect(() => {
    if (!redirectState?.feedback && !redirectState?.selectedSolicitacaoId) {
      return;
    }

    if (redirectState.feedback) {
      setFeedback(redirectState.feedback);
    }

    if (redirectState.selectedSolicitacaoId) {
      setSelectedId(redirectState.selectedSolicitacaoId);
    }

    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  }, [location.hash, location.pathname, location.search, navigate, redirectState]);

  const createMutation = useMutation({
    mutationFn: (payload: SolicitacaoFaxinaRequest) => criarSolicitacao(requireToken(token), payload),
    onSuccess: async (solicitacao) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacoes }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'indicadores'] }),
      ]);
      navigate(`/app/cliente/solicitacoes/${solicitacao.id}/profissionais`, {
        replace: true,
        state: {
          feedback: {
            tone: 'success',
            title: 'Solicitacao criada',
            message: 'Solicitação criada. Agora escolha uma profissional.',
          },
        } satisfies SolicitationRedirectState,
      });
    },
    onError: handleMutationError,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelarSolicitacao(requireToken(token), id),
    onMutate: (id) => {
      setCancellingId(id);
      setFeedback(null);
    },
    onSuccess: async (solicitacao) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.solicitacoes });
      await queryClient.invalidateQueries({ queryKey: queryKeys.detalhe(solicitacao.id) });
      setSelectedId(solicitacao.id);
      setFeedback({
        tone: 'success',
        title: 'Solicitacao cancelada',
        message: 'A solicitacao foi atualizada para o status cancelado.',
      });
    },
    onError: handleMutationError,
    onSettled: () => {
      setCancellingId(null);
    },
  });

  const enderecos = enderecosQuery.data ?? [];
  const regioes = regioesQuery.data ?? [];
  const solicitacoes = solicitacoesQuery.data ?? [];

  function handleMutationError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      navigate('/entrar', { replace: true });
      return;
    }

    setFeedback({
      tone: 'error',
      title: 'Nao foi possivel concluir',
      message: getApiErrorMessage(error),
      details: error instanceof ApiError ? error.errors : [],
    });
  }

  async function handleCreate(payload: SolicitacaoFaxinaRequest) {
    setFeedback(null);
    await createMutation.mutateAsync(payload);
  }

  function handleCancel(solicitacao: SolicitacaoFaxina) {
    const confirmed = window.confirm(`Cancelar a solicitacao #${solicitacao.id}?`);

    if (confirmed) {
      cancelMutation.mutate(solicitacao.id);
    }
  }

  function getContexto(solicitacao: SolicitacaoFaxina): SolicitacaoContexto {
    return {
      endereco: enderecos.find((endereco) => endereco.id === solicitacao.enderecoId),
      regiao: regioes.find((regiao) => regiao.id === solicitacao.regiaoId),
    };
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Minhas solicitacoes</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Crie e acompanhe solicitacoes de faxina usando seus enderecos cadastrados. Validacao de elegibilidade, status e
          cancelamento fica no backend.
        </p>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6" id="nova-solicitacao">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-slate-900">Nova solicitacao</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Escolha um endereco cadastrado. A regiao operacional sera definida pelo bairro em Porto Alegre ou pela cidade no
            litoral atendido.
          </p>
        </div>

        {(enderecosQuery.isLoading || regioesQuery.isLoading) && (
          <StateBox tone="loading" title="Carregando dados" description="Buscando seus enderecos e regioes ativas." />
        )}

        {(enderecosQuery.isError || regioesQuery.isError) && !protectedError && (
          <FormAlert
            tone="error"
            title="Nao foi possivel preparar o formulario"
            message={getApiErrorMessage(enderecosQuery.error ?? regioesQuery.error)}
            details={
              enderecosQuery.error instanceof ApiError
                ? enderecosQuery.error.errors
                : regioesQuery.error instanceof ApiError
                  ? regioesQuery.error.errors
                  : []
            }
          />
        )}

        {enderecosQuery.isSuccess && enderecos.length === 0 && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Cadastre um endereco antes de criar uma solicitacao.{' '}
            <Link className="font-black underline" to="/app/cliente/enderecos">
              Ir para meus enderecos
            </Link>
          </div>
        )}

        {enderecosQuery.isSuccess && regioesQuery.isSuccess && enderecos.length > 0 && (
          <SolicitacaoForm
            enderecos={enderecos}
            regioes={regioes}
            isSubmitting={createMutation.isPending}
            onSubmit={handleCreate}
            token={token}
          />
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Acompanhamento</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Veja o status das suas solicitacoes e abra os detalhes quando precisar.</p>
        </div>

        {solicitacoesQuery.isLoading && <StateBox tone="loading" title="Carregando solicitacoes" description="Buscando suas solicitacoes cadastradas." />}

        {solicitacoesQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Nao foi possivel carregar solicitacoes"
            message={getApiErrorMessage(solicitacoesQuery.error)}
            details={solicitacoesQuery.error instanceof ApiError ? solicitacoesQuery.error.errors : []}
          />
        )}

        {solicitacoesQuery.isSuccess && solicitacoes.length === 0 && (
          <StateBox tone="empty" title="Nenhuma solicitacao cadastrada" description="Crie sua primeira solicitacao usando o formulario acima." />
        )}

        {solicitacoes.length > 0 && (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <SolicitacaoList
              cancellingId={cancellingId}
              getContexto={getContexto}
              selectedId={selectedId}
              solicitacoes={solicitacoes}
              onCancel={handleCancel}
              onSelect={(solicitacao) => setSelectedId(solicitacao.id)}
            />
            <SolicitacaoDetailPanel
              contexto={
                detalheQuery.data
                  ? getContexto(detalheQuery.data)
                  : selectedId
                    ? getContexto(solicitacoes.find((solicitacao) => solicitacao.id === selectedId) ?? solicitacoes[0])
                    : undefined
              }
              error={detalheQuery.error}
              isCancelling={Boolean(selectedId && cancellingId === selectedId)}
              isLoading={detalheQuery.isLoading}
              onCancel={handleCancel}
              solicitacao={detalheQuery.data ?? null}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function SolicitacaoDetailPanel({
  contexto,
  error,
  isCancelling,
  isLoading,
  onCancel,
  solicitacao,
}: {
  contexto?: SolicitacaoContexto;
  error: unknown;
  isCancelling?: boolean;
  isLoading: boolean;
  onCancel: (solicitacao: SolicitacaoFaxina) => void;
  solicitacao: SolicitacaoFaxina | null;
}) {
  if (!solicitacao && !isLoading && !error) {
    return <StateBox description="Selecione uma solicitacao para ver mais informacoes." title="Detalhes" />;
  }

  if (isLoading) {
    return <StateBox tone="loading" title="Carregando detalhes" description="Buscando dados completos da solicitacao." />;
  }

  if (error) {
    return <FormAlert tone="error" title="Nao foi possivel carregar detalhes" message={getApiErrorMessage(error)} />;
  }

  if (!solicitacao) {
    return null;
  }

  const statusInfo = getStatusSolicitacaoInfo(solicitacao.status);

  return (
    <aside className="self-start rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-black text-slate-900">Solicitacao #{solicitacao.id}</h2>
        <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 text-sm">
        <DetailItem label="Tipo" value={getTipoServicoLabel(solicitacao.tipoServico)} />
        <DetailItem label="Data desejada" value={formatDateTime(solicitacao.dataHoraDesejada)} />
        <DetailItem label="Duracao estimada" value={`${solicitacao.duracaoEstimadaHoras} horas`} />
        <DetailItem label="Endereco" value={getSolicitacaoEnderecoLabel(solicitacao, contexto)} />
        <DetailItem label="Bairro/regiao" value={getSolicitacaoRegiaoLabel(solicitacao, contexto)} />
        <DetailItem label="Valor do servico" value={formatServiceValue(solicitacao.valorServico)} />
        {solicitacao.observacoes && <DetailItem label="Observacoes" value={solicitacao.observacoes} />}
      </dl>

      {solicitacao.status === 'NAO_ACEITA_CREDITO_GERADO' && (
        <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
          Esta solicitacao gerou uma solicitacao de reposicao equivalente. Ela pode ser usada em uma nova solicitacao compativel.
        </div>
      )}

      {['CRIADA', 'AGUARDANDO_SELECAO', 'CONVITES_ENVIADOS', 'AGUARDANDO_ACEITE'].includes(solicitacao.status) && (
        <div className="mt-5 grid gap-3">
          {canSelectProfessionals(solicitacao.status) && (
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              to={`/app/cliente/solicitacoes/${solicitacao.id}/profissionais`}
            >
              Selecionar profissionais
            </Link>
          )}
          <button
            className="min-h-10 w-full rounded-lg border border-red-100 px-4 text-sm font-black text-red-700 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isCancelling}
            type="button"
            onClick={() => onCancel(solicitacao)}
          >
            {isCancelling ? 'Cancelando...' : 'Cancelar solicitacao'}
          </button>
        </div>
      )}

      {['AGUARDANDO_PAGAMENTO', 'PAGA_AGUARDANDO_ACEITE'].includes(solicitacao.status) && (
        <div className="mt-5">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to={`/app/cliente/pagamentos/solicitacao/${solicitacao.id}`}
          >
            {solicitacao.status === 'AGUARDANDO_PAGAMENTO' ? 'Ir para pagamento' : 'Ver pagamento e status'}
          </Link>
        </div>
      )}
    </aside>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatServiceValue(value: number | null | undefined) {
  return value === null || value === undefined ? 'Valor sera calculado conforme a duracao informada.' : formatCurrency(value);
}

function requireToken(token: string | null) {
  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sessao expirada. Entre novamente.',
    });
  }

  return token;
}

function requireSelectedId(selectedId: number | null) {
  if (!selectedId) {
    throw new ApiError({
      status: 400,
      code: 'SOLICITACAO_NOT_SELECTED',
      message: 'Selecione uma solicitacao.',
    });
  }

  return selectedId;
}
