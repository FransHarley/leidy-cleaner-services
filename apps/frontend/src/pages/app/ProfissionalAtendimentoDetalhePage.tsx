import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AtendimentoInfoPanel } from '../../features/atendimentos/AtendimentoInfoPanel';
import {
  buscarAtendimento,
  finalizarAtendimento,
  iniciarAtendimento,
  listarCheckpointsAtendimento,
} from '../../features/atendimentos/atendimentosApi';
import { canFinishAtendimento, canStartAtendimento } from '../../features/atendimentos/atendimentoLabels';
import { CheckpointActionForm } from '../../features/atendimentos/CheckpointActionForm';
import { CheckpointsList } from '../../features/atendimentos/CheckpointsList';
import type { CheckpointServicoRequest } from '../../features/atendimentos/types';
import { AvaliacaoResumo } from '../../features/avaliacoes/AvaliacaoResumo';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  list: ['atendimentos', 'meus', 'profissional'],
  detalhe: (id: number) => ['atendimentos', 'profissional', id],
  checkpoints: (id: number) => ['atendimentos', 'profissional', id, 'checkpoints'],
};

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title: string;
  message: string;
  details?: string[];
};

export function ProfissionalAtendimentoDetalhePage() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const validId = Number.isFinite(atendimentoId) && atendimentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const atendimentoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(atendimentoId) : ['atendimentos', 'profissional', 'invalid'],
    queryFn: () => buscarAtendimento(requireToken(token), atendimentoId),
    enabled: Boolean(token && validId),
  });

  const checkpointsQuery = useQuery({
    queryKey: validId ? queryKeys.checkpoints(atendimentoId) : ['atendimentos', 'profissional', 'invalid', 'checkpoints'],
    queryFn: () => listarCheckpointsAtendimento(requireToken(token), atendimentoId),
    enabled: Boolean(token && validId),
  });

  const startMutation = useMutation({
    mutationFn: (payload: CheckpointServicoRequest) => iniciarAtendimento(requireToken(token), atendimentoId, payload),
    onSuccess: async () => {
      setFeedback({
        tone: 'success',
        title: 'Atendimento iniciado',
        message: 'O backend registrou o início e criou o checkpoint correspondente.',
      });
      await refreshAttendanceQueries(queryClient, atendimentoId);
    },
    onError: handleMutationError,
  });

  const finishMutation = useMutation({
    mutationFn: (payload: CheckpointServicoRequest) => finalizarAtendimento(requireToken(token), atendimentoId, payload),
    onSuccess: async () => {
      setFeedback({
        tone: 'success',
        title: 'Atendimento finalizado',
        message: 'O backend registrou o fim e criou o checkpoint correspondente.',
      });
      await refreshAttendanceQueries(queryClient, atendimentoId);
    },
    onError: handleMutationError,
  });

  const protectedError = useMemo(
    () =>
      [atendimentoQuery.error, checkpointsQuery.error].find((error) => error instanceof ApiError && error.status === 401),
    [atendimentoQuery.error, checkpointsQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleMutationError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      navigate('/entrar', { replace: true });
      return;
    }

    setFeedback({
      tone: 'error',
      title: 'Não foi possível atualizar atendimento',
      message: getApiErrorMessage(error),
      details: error instanceof ApiError ? error.errors : [],
    });
  }

  function handleStart(payload: CheckpointServicoRequest) {
    const confirmed = window.confirm('Registrar início deste atendimento?');

    if (confirmed) {
      setFeedback(null);
      startMutation.mutate(payload);
    }
  }

  function handleFinish(payload: CheckpointServicoRequest) {
    const confirmed = window.confirm('Registrar finalização deste atendimento?');

    if (confirmed) {
      setFeedback(null);
      finishMutation.mutate(payload);
    }
  }

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Atendimento inválido" message="O identificador do atendimento não é válido." />
        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/profissional/atendimentos">
          Voltar para atendimentos
        </Link>
      </div>
    );
  }

  const atendimento = atendimentoQuery.data;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profissional</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do atendimento</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Registre início e fim apenas quando o atendimento estiver no status correto.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/profissional/atendimentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {atendimentoQuery.isLoading && <StateBox tone="loading" title="Carregando atendimento" description="Buscando os dados do atendimento." />}

      {atendimentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o atendimento"
          message={getApiErrorMessage(atendimentoQuery.error)}
          details={atendimentoQuery.error instanceof ApiError ? atendimentoQuery.error.errors : []}
        />
      )}

      {atendimento && <AtendimentoInfoPanel atendimento={atendimento} financialView="professional" />}

      {atendimento?.status === 'FINALIZADO' && (
        <section className="grid gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Avaliação</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Feedback da cliente para este atendimento finalizado.</p>
          </div>

          {atendimento.avaliacao ? (
            <AvaliacaoResumo avaliacao={atendimento.avaliacao} title="Avaliação recebida" />
          ) : (
            <FormAlert tone="info" message="Cliente ainda não avaliou este atendimento." />
          )}
        </section>
      )}

      {atendimento && (
        <section className="grid gap-4">
          {canStartAtendimento(atendimento.status) && (
            <CheckpointActionForm actionLabel="Iniciar atendimento" isSubmitting={startMutation.isPending} onSubmit={handleStart} />
          )}

          {canFinishAtendimento(atendimento.status) && (
            <CheckpointActionForm
              actionLabel="Finalizar atendimento"
              isSubmitting={finishMutation.isPending}
              tone="finish"
              onSubmit={handleFinish}
            />
          )}

          {!canStartAtendimento(atendimento.status) && !canFinishAtendimento(atendimento.status) && (
            <FormAlert
              tone="info"
              message="Este atendimento não está em um status que permite registrar início ou fim pela profissional."
            />
          )}
        </section>
      )}

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Checkpoints</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Registros de início e fim retornados pelo backend.</p>
        </div>

        {checkpointsQuery.isLoading && <StateBox tone="loading" title="Carregando checkpoints" description="Buscando registros do atendimento." />}

        {checkpointsQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar checkpoints"
            message={getApiErrorMessage(checkpointsQuery.error)}
            details={checkpointsQuery.error instanceof ApiError ? checkpointsQuery.error.errors : []}
          />
        )}

        {checkpointsQuery.data && <CheckpointsList checkpoints={checkpointsQuery.data} />}
      </section>
    </div>
  );
}

async function refreshAttendanceQueries(queryClient: QueryClient, atendimentoId: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.list }),
    queryClient.invalidateQueries({ queryKey: queryKeys.detalhe(atendimentoId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.checkpoints(atendimentoId) }),
  ]);
}


function requireToken(token: string | null) {
  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sessão expirada. Entre novamente.',
    });
  }

  return token;
}
