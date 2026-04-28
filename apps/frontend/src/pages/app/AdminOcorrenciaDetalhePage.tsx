import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { useAuth } from '../../features/auth/useAuth';
import { OcorrenciaInfoPanel } from '../../features/ocorrencias/OcorrenciaInfoPanel';
import { atualizarStatusOcorrenciaAdmin, buscarOcorrencia } from '../../features/ocorrencias/ocorrenciasApi';
import { OcorrenciaStatusForm } from '../../features/ocorrencias/OcorrenciaStatusForm';
import type { AtualizarStatusOcorrenciaRequest } from '../../features/ocorrencias/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  list: ['admin', 'ocorrencias'],
  detalhe: (id: number) => ['admin', 'ocorrencias', id],
};

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function AdminOcorrenciaDetalhePage() {
  const { id } = useParams();
  const ocorrenciaId = Number(id);
  const validId = Number.isFinite(ocorrenciaId) && ocorrenciaId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const ocorrenciaQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(ocorrenciaId) : ['admin', 'ocorrencias', 'invalid'],
    queryFn: () => buscarOcorrencia(requireToken(token), ocorrenciaId),
    enabled: Boolean(token && validId),
  });

  const statusMutation = useMutation({
    mutationFn: (payload: AtualizarStatusOcorrenciaRequest) =>
      atualizarStatusOcorrenciaAdmin(requireToken(token), ocorrenciaId, payload),
    onSuccess: async () => {
      setFeedback({
        tone: 'success',
        title: 'Status atualizado',
        message: 'A ocorrência foi atualizada pelo backend.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.detalhe(ocorrenciaId) }),
      ]);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível atualizar o status',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const protectedError = useMemo(
    () =>
      [ocorrenciaQuery.error, statusMutation.error].find((error) => error instanceof ApiError && error.status === 401) ?? null,
    [ocorrenciaQuery.error, statusMutation.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleStatusSubmit(payload: AtualizarStatusOcorrenciaRequest) {
    setFeedback(null);
    statusMutation.mutate(payload);
  }

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Ocorrência inválida" message="O identificador da ocorrência não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/admin/ocorrencias">
          Voltar para ocorrências
        </Link>
      </div>
    );
  }

  const ocorrencia = ocorrenciaQuery.data;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe da ocorrência</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte o registro e atualize o status pelo endpoint administrativo.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/admin/ocorrencias"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {ocorrenciaQuery.isLoading && <StateBox title="Carregando ocorrência" description="Buscando o registro selecionado." />}

      {ocorrenciaQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar a ocorrência"
          message={getApiErrorMessage(ocorrenciaQuery.error)}
          details={ocorrenciaQuery.error instanceof ApiError ? ocorrenciaQuery.error.errors : []}
        />
      )}

      {ocorrencia && (
        <>
          <OcorrenciaInfoPanel ocorrencia={ocorrencia} />
          <OcorrenciaStatusForm
            initialStatus={ocorrencia.status}
            isSubmitting={statusMutation.isPending}
            onSubmit={handleStatusSubmit}
          />
        </>
      )}
    </div>
  );
}

function StateBox({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-6 text-center shadow-sm">
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
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
