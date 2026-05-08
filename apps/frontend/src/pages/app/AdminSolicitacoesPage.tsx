import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminSolicitacaoCard } from '../../features/admin/solicitacoes/AdminSolicitacaoCard';
import {
  listarSolicitacoesAdmin,
  type ListarSolicitacoesAdminParams,
} from '../../features/admin/solicitacoes/adminSolicitacoesApi';
import { statusSolicitacaoLabels, tipoServicoOptions } from '../../features/cliente/solicitacoes/solicitacaoLabels';
import type { StatusSolicitacao, TipoServico } from '../../features/cliente/solicitacoes/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const statusOptions = Object.entries(statusSolicitacaoLabels).map(([value, label]) => ({
  value: value as StatusSolicitacao,
  label,
}));

const queryKeys = {
  solicitacoes: (params: ListarSolicitacoesAdminParams) => ['admin', 'solicitacoes', params],
};

type FilterState = {
  status: StatusSolicitacao | '';
  clienteId: string;
  regiaoId: string;
  tipoServico: TipoServico | '';
};

const emptyFilters: FilterState = {
  status: '',
  clienteId: '',
  regiaoId: '',
  tipoServico: '',
};

export function AdminSolicitacoesPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

  const params = useMemo(() => toApiParams(appliedFilters), [appliedFilters]);

  const solicitacoesQuery = useQuery({
    queryKey: queryKeys.solicitacoes(params),
    queryFn: () => listarSolicitacoesAdmin(requireToken(token), params),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (solicitacoesQuery.error instanceof ApiError && solicitacoesQuery.error.status === 401 ? solicitacoesQuery.error : null),
    [solicitacoesQuery.error],
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
      regiaoId: normalizePositiveInteger(draftFilters.regiaoId),
      tipoServico: draftFilters.tipoServico,
    });
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const solicitacoes = solicitacoesQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Solicitações</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte solicitações criadas pelas clientes. Esta visão é somente leitura.
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
              setDraftFilters((current) => ({ ...current, status: event.target.value as StatusSolicitacao | '' }))
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

        <label className="grid w-full gap-2 text-sm font-bold text-slate-700 sm:min-w-[min(100%,13rem)] sm:flex-1">
          Tipo
          <select
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            value={draftFilters.tipoServico}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, tipoServico: event.target.value as TipoServico | '' }))
            }
          >
            <option value="">Todos</option>
            {tipoServicoOptions.map((option) => (
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
          label="Região"
          value={draftFilters.regiaoId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, regiaoId: value }))}
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

      {solicitacoesQuery.isLoading && <StateBox tone="loading" title="Carregando solicitações" description="Buscando registros operacionais." />}

      {solicitacoesQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar solicitações"
          message={getApiErrorMessage(solicitacoesQuery.error)}
          details={solicitacoesQuery.error instanceof ApiError ? solicitacoesQuery.error.errors : []}
        />
      )}

      {solicitacoesQuery.isSuccess && solicitacoes.length === 0 && (
        <StateBox tone="empty" title="Nenhuma solicitação encontrada" description="O backend retornou uma lista vazia para os filtros atuais." />
      )}

      {solicitacoes.length > 0 && (
        <section className="grid gap-4">
          {solicitacoes.map((solicitacao) => (
            <AdminSolicitacaoCard key={solicitacao.id} solicitacao={solicitacao} />
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

function toApiParams(filters: FilterState): ListarSolicitacoesAdminParams {
  const clienteId = Number(filters.clienteId);
  const regiaoId = Number(filters.regiaoId);

  return {
    status: filters.status || undefined,
    clienteId: Number.isInteger(clienteId) && clienteId > 0 ? clienteId : undefined,
    regiaoId: Number.isInteger(regiaoId) && regiaoId > 0 ? regiaoId : undefined,
    tipoServico: filters.tipoServico || undefined,
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
