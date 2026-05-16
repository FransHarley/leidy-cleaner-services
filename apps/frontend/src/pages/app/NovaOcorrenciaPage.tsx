import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { listarMeusAtendimentos } from '../../features/atendimentos/atendimentosApi';
import { useAuth } from '../../features/auth/useAuth';
import { OcorrenciaForm } from '../../features/ocorrencias/OcorrenciaForm';
import { criarOcorrencia } from '../../features/ocorrencias/ocorrenciasApi';
import type { CriarOcorrenciaRequest } from '../../features/ocorrencias/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  ocorrencias: ['ocorrencias', 'meus'],
  atendimentos: ['ocorrencias', 'atendimentos', 'meus'],
};

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  details?: string[];
};

export function NovaOcorrenciaPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const atendimentosQuery = useQuery({
    queryKey: queryKeys.atendimentos,
    queryFn: () => listarMeusAtendimentos(requireToken(token)),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CriarOcorrenciaRequest) => criarOcorrencia(requireToken(token), payload),
    onSuccess: async (ocorrencia) => {
      setFeedback({
        tone: 'success',
        title: 'Ocorrência registrada',
        message: 'Ocorrencia criada com sucesso.',
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.ocorrencias });
      navigate(`/app/ocorrencias/${ocorrencia.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível registrar a ocorrência',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const protectedError = useMemo(
    () =>
      [atendimentosQuery.error].find((error) => error instanceof ApiError && error.status === 401) ??
      (createMutation.error instanceof ApiError && createMutation.error.status === 401 ? createMutation.error : null),
    [atendimentosQuery.error, createMutation.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleSubmit(payload: CriarOcorrenciaRequest) {
    setFeedback(null);
    createMutation.mutate(payload);
  }

  const atendimentos = atendimentosQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Ocorrências</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Nova ocorrência</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Selecione o atendimento relacionado e descreva a situacao.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/ocorrencias"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {atendimentosQuery.isLoading && <StateBox tone="loading" title="Carregando atendimentos" description="Buscando seus atendimentos disponíveis." />}

      {atendimentosQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar atendimentos"
          message={getApiErrorMessage(atendimentosQuery.error)}
          details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
        />
      )}

      {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
        <StateBox tone="empty"
          title="Nenhum atendimento encontrado"
          description="Escolha um atendimento para registrar a ocorrencia."
        />
      )}

      {atendimentosQuery.isSuccess && (
        <OcorrenciaForm
          atendimentos={atendimentos}
          isSubmitting={createMutation.isPending}
          profile={user?.tipoUsuario === 'PROFISSIONAL' ? 'PROFISSIONAL' : 'CLIENTE'}
          onSubmit={handleSubmit}
        />
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
