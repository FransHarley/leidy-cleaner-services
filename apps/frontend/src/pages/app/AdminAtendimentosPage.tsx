import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminAtendimentoCard } from '../../features/admin/atendimentos/AdminAtendimentoCard';
import {
  listarAtendimentosAdmin,
  type ListarAtendimentosAdminParams,
} from '../../features/admin/atendimentos/adminAtendimentosApi';
import { statusAtendimentoLabels } from '../../features/atendimentos/atendimentoLabels';
import type { StatusAtendimento } from '../../features/atendimentos/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const statusOptions = Object.entries(statusAtendimentoLabels).map(([value, label]) => ({
  value: value as StatusAtendimento,
  label,
}));

const queryKeys = {
  atendimentos: (params: ListarAtendimentosAdminParams) => ['admin', 'atendimentos', params],
};

type FilterState = {
  status: StatusAtendimento | '';
  clienteId: string;
  profissionalId: string;
};

const emptyFilters: FilterState = {
  status: '',
  clienteId: '',
  profissionalId: '',
};

export function AdminAtendimentosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

  const params = useMemo(() => toApiParams(appliedFilters), [appliedFilters]);

  const atendimentosQuery = useQuery({
    queryKey: queryKeys.atendimentos(params),
    queryFn: () => listarAtendimentosAdmin(requireToken(token), params),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (atendimentosQuery.error instanceof ApiError && atendimentosQuery.error.status === 401 ? atendimentosQuery.error : null),
    [atendimentosQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({
      status: draftFilters.status,
      clienteId: normalizePositiveInteger(draftFilters.clienteId),
      profissionalId: normalizePositiveInteger(draftFilters.profissionalId),
    });
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const atendimentos = atendimentosQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Atendimentos</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Liste atendimentos operacionais pelo backend. Esta visão é somente leitura.
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

      <form
        className="flex min-w-0 flex-col items-stretch gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={handleFilterSubmit}
      >
        <label className="grid w-full gap-2 text-sm font-bold text-slate-700 sm:min-w-[min(100%,13rem)] sm:flex-1">
          Status
          <select
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, status: event.target.value as StatusAtendimento | '' }))
            }
          >
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <FilterInput
          label="Cliente"
          value={draftFilters.clienteId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, clienteId: value }))}
        />
        <FilterInput
          label="Profissional"
          value={draftFilters.profissionalId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, profissionalId: value }))}
        />

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

      {atendimentosQuery.isLoading && <StateBox tone="loading" title="Carregando atendimentos" description="Buscando registros operacionais." />}

      {atendimentosQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar atendimentos"
          message={getApiErrorMessage(atendimentosQuery.error)}
          details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
        />
      )}

      {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
        <StateBox tone="empty" title="Nenhum atendimento encontrado" description="O backend retornou uma lista vazia para os filtros atuais." />
      )}

      {atendimentos.length > 0 && (
        <section className="grid gap-4">
          {atendimentos.map((atendimento) => (
            <AdminAtendimentoCard key={atendimento.id} atendimento={atendimento} />
          ))}
        </section>
      )}
    </div>
  );
}

function FilterInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid w-full gap-2 text-sm font-bold text-slate-700 sm:min-w-[min(100%,13rem)] sm:flex-1">
      {label}
      <input
        className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        inputMode="numeric"
        placeholder="ID"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}


function normalizePositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : '';
}

function toApiParams(filters: FilterState): ListarAtendimentosAdminParams {
  const clienteId = Number(filters.clienteId);
  const profissionalId = Number(filters.profissionalId);

  return {
    status: filters.status || undefined,
    clienteId: Number.isInteger(clienteId) && clienteId > 0 ? clienteId : undefined,
    profissionalId: Number.isInteger(profissionalId) && profissionalId > 0 ? profissionalId : undefined,
  };
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
