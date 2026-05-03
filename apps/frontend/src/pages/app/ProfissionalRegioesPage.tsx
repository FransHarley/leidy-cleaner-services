import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import {
  definirMinhasRegioesProfissional,
  listarMinhasRegioesProfissional,
  listarRegioesAtivas,
} from '../../features/profissional/perfil/profissionalApi';
import { ProfissionalRegioesForm } from '../../features/profissional/regioes/ProfissionalRegioesForm';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  regioes: ['regioes'],
  minhasRegioes: ['profissional', 'regioes'],
};

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function ProfissionalRegioesPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const regioesQuery = useQuery({
    queryKey: queryKeys.regioes,
    queryFn: listarRegioesAtivas,
  });

  const minhasRegioesQuery = useQuery({
    queryKey: queryKeys.minhasRegioes,
    queryFn: () => listarMinhasRegioesProfissional(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () =>
      [minhasRegioesQuery.error].find((error) => error instanceof ApiError && error.status === 401) ?? null,
    [minhasRegioesQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const saveMutation = useMutation({
    mutationFn: (regiaoIds: number[]) => definirMinhasRegioesProfissional(requireToken(token), { regiaoIds }),
    onSuccess: async (regioesSalvas) => {
      queryClient.setQueryData(queryKeys.minhasRegioes, regioesSalvas);
      await queryClient.invalidateQueries({ queryKey: queryKeys.minhasRegioes });
      setFeedback({ tone: 'success', title: 'Regiões atualizadas', message: 'Seus bairros de atendimento foram salvos.' });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível salvar regiões',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Profissional</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Regiões de atendimento</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Selecione os bairros cadastrados pela administração em que você atende.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/profissional"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      <section className="grid gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        {(regioesQuery.isLoading || minhasRegioesQuery.isLoading) && (
          <StateBox tone="loading" title="Carregando regiões" description="Buscando regiões ativas e suas seleções atuais." />
        )}

        {(regioesQuery.isError || minhasRegioesQuery.isError) && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar regiões"
            message={getApiErrorMessage(regioesQuery.error ?? minhasRegioesQuery.error)}
          />
        )}

        {regioesQuery.data && minhasRegioesQuery.data && (
          <ProfissionalRegioesForm
            regioes={regioesQuery.data}
            selectedRegioes={minhasRegioesQuery.data}
            isSubmitting={saveMutation.isPending}
            onSubmit={async (regiaoIds) => {
              setFeedback(null);
              await saveMutation.mutateAsync(regiaoIds);
            }}
          />
        )}
      </section>
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
