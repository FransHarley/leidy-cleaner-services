import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
  atendimentos: ['atendimentos', 'meus', 'profissional'],
};

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  details?: string[];
};

export function ProfessionalMobileNovaOcorrenciaPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const atendimentoIdParam = Number(searchParams.get('atendimentoId'));
  const initialAtendimentoId = Number.isFinite(atendimentoIdParam) && atendimentoIdParam > 0 ? atendimentoIdParam : 0;

  const atendimentosQuery = useQuery({
    queryKey: queryKeys.atendimentos,
    queryFn: () => listarMeusAtendimentos(requireToken(token)),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CriarOcorrenciaRequest) => criarOcorrencia(requireToken(token), payload),
    onMutate: () => {
      setFeedback(null);
    },
    onSuccess: async (ocorrencia) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ocorrencias });

      navigate(`/profissional/app/ocorrencias/${ocorrencia.id}`, {
        replace: true,
        state: {
          feedback: {
            tone: 'success',
            title: 'Ocorrencia registrada',
            message: 'Seu registro foi enviado com sucesso. Agora voce pode acompanhar o andamento por aqui.',
          },
        },
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: buildCreateErrorTitle(error),
        message: buildCreateErrorMessage(error),
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
    if (createMutation.isPending) {
      return;
    }

    createMutation.mutate(payload);
  }

  const atendimentos = atendimentosQuery.data ?? [];
  const hasPreselectedAtendimento = initialAtendimentoId > 0;
  const preselectedExists = hasPreselectedAtendimento ? atendimentos.some((atendimento) => atendimento.id === initialAtendimentoId) : true;

  return (
    <div className="grid gap-4">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Ocorrencias</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Nova ocorrencia</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Escolha o atendimento relacionado, informe o tipo do problema e descreva a situacao para a equipe acompanhar.
        </p>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {atendimentosQuery.isLoading && (
        <StateBox
          tone="loading"
          title="Carregando atendimentos"
          description="Buscando seus atendimentos disponiveis para vincular a ocorrencia."
          className="rounded-[1.75rem]"
        />
      )}

      {atendimentosQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar atendimentos"
          message={getApiErrorMessage(atendimentosQuery.error)}
          details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
        />
      )}

      {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
        <StateBox
          tone="empty"
          title="Nenhum atendimento disponivel"
          description="Quando voce tiver um atendimento vinculado a sua conta, ele aparecera aqui para registrar ocorrencias."
          className="rounded-[1.75rem]"
        />
      )}

      {atendimentosQuery.isSuccess && hasPreselectedAtendimento && !preselectedExists && (
        <FormAlert
          tone="info"
          title="Atendimento nao encontrado"
          message="O atendimento escolhido nao esta disponivel para sua conta. Selecione outro atendimento na lista para continuar."
        />
      )}

      {atendimentosQuery.isSuccess && atendimentos.length > 0 && (
        <OcorrenciaForm
          atendimentos={atendimentos}
          initialAtendimentoId={preselectedExists ? initialAtendimentoId : 0}
          isSubmitting={createMutation.isPending}
          profile="PROFISSIONAL"
          onSubmit={handleSubmit}
        />
      )}

      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        to="/profissional/app/ocorrencias"
      >
        Voltar para ocorrencias
      </Link>
    </div>
  );
}

function buildCreateErrorTitle(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Voce nao pode abrir esta ocorrencia';
    }

    if (error.code === 'ATENDIMENTO_NOT_FOUND' || error.status === 404) {
      return 'Atendimento indisponivel';
    }

    if (error.code === 'ATENDIMENTO_STATUS_INCOMPATIVEL' || error.status === 409) {
      return 'Nao foi possivel registrar agora';
    }
  }

  return 'Nao foi possivel registrar a ocorrencia';
}

function buildCreateErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Voce nao tem permissao para registrar uma ocorrencia neste atendimento.';
    }

    if (error.code === 'ATENDIMENTO_NOT_FOUND' || error.status === 404) {
      return 'O atendimento selecionado nao esta disponivel para a sua conta.';
    }

    if (error.code === 'ATENDIMENTO_STATUS_INCOMPATIVEL') {
      return 'Este atendimento nao esta disponivel para registrar ocorrencia neste momento.';
    }

    if (error.status === 409) {
      return 'Nao foi possivel registrar a ocorrencia agora. Atualize a tela e tente novamente.';
    }
  }

  return getApiErrorMessage(error);
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
