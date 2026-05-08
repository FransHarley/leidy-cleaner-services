import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AtendimentoInfoPanel } from '../../features/atendimentos/AtendimentoInfoPanel';
import { buscarAtendimento, listarCheckpointsAtendimento } from '../../features/atendimentos/atendimentosApi';
import { CheckpointsList } from '../../features/atendimentos/CheckpointsList';
import { AvaliacaoForm } from '../../features/avaliacoes/AvaliacaoForm';
import { AvaliacaoResumo } from '../../features/avaliacoes/AvaliacaoResumo';
import { AvaliacoesProfissionalList } from '../../features/avaliacoes/AvaliacoesProfissionalList';
import { criarAvaliacaoProfissional, listarAvaliacoesProfissional } from '../../features/avaliacoes/avaliacoesApi';
import type { AvaliacaoProfissional, AvaliacaoProfissionalRequest } from '../../features/avaliacoes/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['atendimentos', 'cliente', id],
  checkpoints: (id: number) => ['atendimentos', 'cliente', id, 'checkpoints'],
  avaliacoesProfissional: (profissionalId: number) => ['avaliacoes', 'profissional', profissionalId],
};

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  details?: string[];
};

export function ClienteAtendimentoDetalhePage() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const validId = Number.isFinite(atendimentoId) && atendimentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submittedAvaliacao, setSubmittedAvaliacao] = useState<AvaliacaoProfissional | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [duplicateBlocked, setDuplicateBlocked] = useState(false);

  const atendimentoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(atendimentoId) : ['atendimentos', 'cliente', 'invalid'],
    queryFn: () => buscarAtendimento(requireToken(token), atendimentoId),
    enabled: Boolean(token && validId),
  });

  const checkpointsQuery = useQuery({
    queryKey: validId ? queryKeys.checkpoints(atendimentoId) : ['atendimentos', 'cliente', 'invalid', 'checkpoints'],
    queryFn: () => listarCheckpointsAtendimento(requireToken(token), atendimentoId),
    enabled: Boolean(token && validId),
  });

  const atendimento = atendimentoQuery.data;
  const canShowAvaliacao = atendimento?.status === 'FINALIZADO';
  const atendimentoCanceladoSemExecucao =
    atendimento?.status === 'CANCELADO' && !atendimento.inicioRealEm && !atendimento.fimRealEm;

  const avaliacoesQuery = useQuery({
    queryKey:
      canShowAvaliacao && atendimento.profissionalId
        ? queryKeys.avaliacoesProfissional(atendimento.profissionalId)
        : ['avaliacoes', 'profissional', 'invalid'],
    queryFn: () => listarAvaliacoesProfissional(requireToken(token), atendimento?.profissionalId ?? 0),
    enabled: Boolean(token && canShowAvaliacao && atendimento?.profissionalId),
  });

  const avaliacaoExistente = useMemo(
    () =>
      submittedAvaliacao ??
      atendimento?.avaliacao ??
      avaliacoesQuery.data?.find((avaliacao) => avaliacao.atendimentoId === atendimentoId) ??
      null,
    [avaliacoesQuery.data, atendimento?.avaliacao, atendimentoId, submittedAvaliacao],
  );

  const createAvaliacaoMutation = useMutation({
    mutationFn: (payload: AvaliacaoProfissionalRequest) => criarAvaliacaoProfissional(requireToken(token), payload),
    onSuccess: async (avaliacao) => {
      setSubmittedAvaliacao(avaliacao);
      setDuplicateBlocked(false);
      setFeedback({
        tone: 'success',
        title: 'Avaliação enviada',
        message: 'Sua avaliação foi registrada para este atendimento.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.detalhe(atendimentoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.avaliacoesProfissional(avaliacao.profissionalId) }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      if (error instanceof ApiError && error.code === 'AVALIACAO_JA_EXISTE') {
        setDuplicateBlocked(true);
        setFeedback({
          tone: 'info',
          title: 'Atendimento já avaliado',
          message: error.message,
        });

        if (atendimento?.profissionalId) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.avaliacoesProfissional(atendimento.profissionalId) });
        }

        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível enviar a avaliação',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const protectedError = useMemo(
    () =>
      [atendimentoQuery.error, checkpointsQuery.error, avaliacoesQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [atendimentoQuery.error, avaliacoesQuery.error, checkpointsQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleAvaliacaoSubmit(values: { nota: number; comentario: string | null }) {
    setFeedback(null);
    createAvaliacaoMutation.mutate({
      atendimentoId,
      nota: values.nota,
      comentario: values.comentario,
    });
  }

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Atendimento inválido" message="O identificador do atendimento não é válido." />
        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/cliente/atendimentos">
          Voltar para atendimentos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do atendimento</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Acompanhe o status operacional e os checkpoints registrados pela profissional.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/cliente/atendimentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      {atendimentoQuery.isLoading && <StateBox tone="loading" title="Carregando atendimento" description="Buscando os dados do atendimento." />}

      {atendimentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o atendimento"
          message={getApiErrorMessage(atendimentoQuery.error)}
          details={atendimentoQuery.error instanceof ApiError ? atendimentoQuery.error.errors : []}
        />
      )}

      {atendimentoQuery.data && <AtendimentoInfoPanel atendimento={atendimentoQuery.data} />}

      {atendimentoCanceladoSemExecucao && (
        <FormAlert tone="info" message="Atendimento cancelado por falta de pagamento dentro do prazo." />
      )}

      {canShowAvaliacao && atendimento && (
        <section className="grid gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Avaliação</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Avalie a profissional vinculada a este atendimento finalizado.</p>
          </div>

          {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

          {avaliacoesQuery.isLoading && (
            <StateBox tone="loading" title="Verificando avaliações" description="Buscando registros já existentes para esta profissional." />
          )}

          {avaliacoesQuery.isError && !protectedError && (
            <FormAlert
              tone="error"
              title="Não foi possível verificar avaliações anteriores"
              message={getApiErrorMessage(avaliacoesQuery.error)}
              details={avaliacoesQuery.error instanceof ApiError ? avaliacoesQuery.error.errors : []}
            />
          )}

          {avaliacaoExistente && <AvaliacaoResumo avaliacao={avaliacaoExistente} />}

          {!avaliacaoExistente && duplicateBlocked && (
            <FormAlert tone="info" message="O backend informou que este atendimento já possui avaliação registrada." />
          )}

          {!avaliacaoExistente && !duplicateBlocked && !avaliacoesQuery.isLoading && (
            <AvaliacaoForm isSubmitting={createAvaliacaoMutation.isPending} onSubmit={handleAvaliacaoSubmit} />
          )}

          {avaliacoesQuery.data && (
            <div className="grid gap-3">
              <h3 className="text-xl font-black text-slate-900">Avaliações da profissional</h3>
              <AvaliacoesProfissionalList avaliacoes={avaliacoesQuery.data} currentAtendimentoId={atendimento.id} />
            </div>
          )}
        </section>
      )}

      {!atendimentoCanceladoSemExecucao && (
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
      )}
    </div>
  );
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
