import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { DisponibilidadeForm } from '../../features/profissional/disponibilidades/DisponibilidadeForm';
import { DisponibilidadeList } from '../../features/profissional/disponibilidades/DisponibilidadeList';
import {
  atualizarDisponibilidade,
  criarDisponibilidade,
  excluirDisponibilidade,
  listarMinhasDisponibilidades,
} from '../../features/profissional/perfil/profissionalApi';
import type {
  DisponibilidadeProfissional,
  DisponibilidadeProfissionalRequest,
} from '../../features/profissional/perfil/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  disponibilidades: ['profissional', 'disponibilidades'],
};

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function ProfissionalDisponibilidadePage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingDisponibilidade, setEditingDisponibilidade] = useState<DisponibilidadeProfissional | null>(null);
  const [deletingDisponibilidadeId, setDeletingDisponibilidadeId] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);

  const disponibilidadesQuery = useQuery({
    queryKey: queryKeys.disponibilidades,
    queryFn: () => listarMinhasDisponibilidades(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () =>
      disponibilidadesQuery.error instanceof ApiError && disponibilidadesQuery.error.status === 401
        ? disponibilidadesQuery.error
        : null,
    [disponibilidadesQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const createMutation = useMutation({
    mutationFn: (payload: DisponibilidadeProfissionalRequest) => criarDisponibilidade(requireToken(token), payload),
    onSuccess: async () => {
      await refreshDisponibilidades(queryClient);
      setEditingDisponibilidade(null);
      setFormKey((current) => current + 1);
      setFeedback({ tone: 'success', title: 'Disponibilidade criada', message: 'O horário foi adicionado à sua agenda semanal.' });
    },
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DisponibilidadeProfissionalRequest }) =>
      atualizarDisponibilidade(requireToken(token), id, payload),
    onSuccess: async () => {
      await refreshDisponibilidades(queryClient);
      setEditingDisponibilidade(null);
      setFormKey((current) => current + 1);
      setFeedback({ tone: 'success', title: 'Disponibilidade atualizada', message: 'O horário foi salvo com sucesso.' });
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => excluirDisponibilidade(requireToken(token), id),
    onMutate: (id) => {
      setDeletingDisponibilidadeId(id);
      setFeedback(null);
    },
    onSuccess: async () => {
      await refreshDisponibilidades(queryClient);
      setFeedback({ tone: 'success', title: 'Disponibilidade excluída', message: 'A agenda foi atualizada.' });
    },
    onError: handleMutationError,
    onSettled: () => setDeletingDisponibilidadeId(null),
  });

  function handleMutationError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      navigate('/entrar', { replace: true });
      return;
    }

    setFeedback({
      tone: 'error',
      title: 'Não foi possível concluir',
      message: getApiErrorMessage(error),
      details: error instanceof ApiError ? error.errors : [],
    });
  }

  async function handleSubmit(payload: DisponibilidadeProfissionalRequest) {
    setFeedback(null);

    if (editingDisponibilidade) {
      await updateMutation.mutateAsync({ id: editingDisponibilidade.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  const disponibilidades = disponibilidadesQuery.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profissional</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Disponibilidade semanal</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Cadastre seus horarios semanais para mostrar quando voce pode atender.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/profissional"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      <section className="grid gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h2 className="text-lg font-black text-slate-900">
            {editingDisponibilidade ? 'Editar disponibilidade' : 'Adicionar disponibilidade'}
          </h2>
          <div className="mt-4">
            <DisponibilidadeForm
              key={`${editingDisponibilidade?.id ?? 'nova'}-${formKey}`}
              initialDisponibilidade={editingDisponibilidade}
              isSubmitting={isSaving}
              onCancel={editingDisponibilidade ? () => setEditingDisponibilidade(null) : undefined}
              onSubmit={handleSubmit}
            />
          </div>
        </div>

        {disponibilidadesQuery.isLoading && (
          <StateBox tone="loading" title="Carregando disponibilidades" description="Buscando seus horários cadastrados." />
        )}
        {disponibilidadesQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar disponibilidades"
            message={getApiErrorMessage(disponibilidadesQuery.error)}
          />
        )}
        {disponibilidadesQuery.isSuccess && disponibilidades.length === 0 && (
          <StateBox tone="empty" title="Nenhum horário cadastrado" description="Adicione seu primeiro horário de disponibilidade semanal." />
        )}
        {disponibilidades.length > 0 && (
          <DisponibilidadeList
            disponibilidades={disponibilidades}
            deletingId={deletingDisponibilidadeId}
            onDelete={(disponibilidade) => {
              if (window.confirm('Excluir este horário de disponibilidade?')) {
                deleteMutation.mutate(disponibilidade.id);
              }
            }}
            onEdit={(disponibilidade) => {
              setFeedback(null);
              setEditingDisponibilidade(disponibilidade);
            }}
          />
        )}
      </section>
    </div>
  );
}

async function refreshDisponibilidades(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.disponibilidades });
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
