import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import {
  analisarProfissionalAdmin,
  listarProfissionaisAdmin,
} from '../../features/admin/profissionais/adminProfissionaisApi';
import { ProfissionalAdminCard } from '../../features/admin/profissionais/ProfissionalAdminCard';
import { statusAprovacaoProfissionalOptions } from '../../features/admin/profissionais/profissionalLabels';
import type { StatusAprovacaoProfissional } from '../../features/admin/profissionais/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  profissionais: (statusAprovacao: StatusAprovacaoProfissional | '', search: string) => [
    'admin',
    'profissionais',
    statusAprovacao,
    search,
  ],
};

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  details?: string[];
};

export function AdminProfissionaisPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusAprovacaoProfissional | ''>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const profissionaisQuery = useQuery({
    queryKey: queryKeys.profissionais(statusFilter, searchFilter),
    queryFn: () =>
      listarProfissionaisAdmin(requireToken(token), {
        statusAprovacao: statusFilter || undefined,
        search: searchFilter || undefined,
      }),
    enabled: Boolean(token),
    retry: false,
  });

  const approvalMutation = useMutation({
    mutationFn: ({ profissionalId, statusAprovacao }: { profissionalId: number; statusAprovacao: StatusAprovacaoProfissional }) =>
      analisarProfissionalAdmin(requireToken(token), profissionalId, { statusAprovacao }),
    onSuccess: async (profissional) => {
      setFeedback({
        tone: 'success',
        title: 'Aprovação atualizada',
        message: `Status de ${profissional.nomeExibicao} salvo como ${profissional.statusAprovacao}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'profissionais'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível atualizar aprovação',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const protectedError = useMemo(
    () => (profissionaisQuery.error instanceof ApiError && profissionaisQuery.error.status === 401 ? profissionaisQuery.error : null),
    [profissionaisQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleAprovacaoSubmit(values: { profissionalId: number; statusAprovacao: StatusAprovacaoProfissional }) {
    setFeedback(null);
    approvalMutation.mutate(values);
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchFilter(searchDraft.trim());
  }

  function handleClearFilters() {
    setStatusFilter('');
    setSearchDraft('');
    setSearchFilter('');
  }

  const profissionais = profissionaisQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Profissionais</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Liste perfis profissionais e acompanhe o status de aprovacao.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/admin"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Listagem de profissionais</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Filtre por status ou busque por nome e e-mail.</p>
        </div>

        <form
          className="flex min-w-0 flex-col items-stretch gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={handleFilterSubmit}
        >
          <label className="grid w-full gap-2 text-sm font-bold text-slate-700 sm:min-w-[min(100%,13rem)] sm:flex-1">
            Status
            <select
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusAprovacaoProfissional | '')}
            >
              <option value="">Todos</option>
              {statusAprovacaoProfissionalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid w-full gap-2 text-sm font-bold text-slate-700 sm:min-w-[min(100%,16rem)] sm:flex-[2_1_16rem]">
            Busca
            <input
              className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              placeholder="Nome ou e-mail"
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>

          <button
            className="min-h-11 w-full rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
            type="submit"
          >
            Filtrar
          </button>

          <button
            className="min-h-11 w-full rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
            type="button"
            onClick={handleClearFilters}
          >
            Limpar
          </button>
        </form>

        {profissionaisQuery.isLoading && <StateBox tone="loading" title="Carregando profissionais" description="Buscando perfis profissionais." />}

        {profissionaisQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar profissionais"
            message={getApiErrorMessage(profissionaisQuery.error)}
            details={profissionaisQuery.error instanceof ApiError ? profissionaisQuery.error.errors : []}
          />
        )}

        {profissionaisQuery.isSuccess && profissionais.length === 0 && (
          <StateBox tone="empty" title="Nenhuma profissional encontrada" description="Nenhuma profissional foi encontrada." />
        )}

        {profissionais.length > 0 && (
          <div className="grid gap-4">
            {profissionais.map((profissional) => (
              <ProfissionalAdminCard
                key={profissional.id}
                profissional={profissional}
                isSubmitting={approvalMutation.isPending}
                onSubmitAprovacao={handleAprovacaoSubmit}
              />
            ))}
          </div>
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
