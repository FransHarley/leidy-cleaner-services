import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminPagamentoCard } from '../../features/admin/pagamentos/AdminPagamentoCard';
import {
  listarPagamentosAdmin,
  type ListarPagamentosAdminParams,
} from '../../features/admin/pagamentos/adminPagamentosApi';
import { metodoPagamentoLabels, statusPagamentoLabels } from '../../features/admin/pagamentos/pagamentoAdminLabels';
import type { MetodoPagamento, StatusPagamento } from '../../features/admin/pagamentos/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const statusOptions = Object.entries(statusPagamentoLabels).map(([value, label]) => ({
  value: value as StatusPagamento,
  label,
}));

const metodoOptions = Object.entries(metodoPagamentoLabels).map(([value, label]) => ({
  value: value as MetodoPagamento,
  label,
}));

const queryKeys = {
  pagamentos: (params: ListarPagamentosAdminParams) => ['admin', 'pagamentos', params],
};

type FilterState = {
  status: StatusPagamento | '';
  metodoPagamento: MetodoPagamento | '';
  atendimentoId: string;
};

const emptyFilters: FilterState = {
  status: '',
  metodoPagamento: '',
  atendimentoId: '',
};

export function AdminPagamentosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

  const params = useMemo(() => toApiParams(appliedFilters), [appliedFilters]);

  const pagamentosQuery = useQuery({
    queryKey: queryKeys.pagamentos(params),
    queryFn: () => listarPagamentosAdmin(requireToken(token), params),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (pagamentosQuery.error instanceof ApiError && pagamentosQuery.error.status === 401 ? pagamentosQuery.error : null),
    [pagamentosQuery.error],
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
      metodoPagamento: draftFilters.metodoPagamento,
      atendimentoId: normalizePositiveInteger(draftFilters.atendimentoId),
    });
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const pagamentos = pagamentosQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Pagamentos</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte pagamentos vinculados a atendimentos. Esta visão é somente leitura e não altera status.
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
              setDraftFilters((current) => ({ ...current, status: event.target.value as StatusPagamento | '' }))
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
          Método
          <select
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            value={draftFilters.metodoPagamento}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, metodoPagamento: event.target.value as MetodoPagamento | '' }))
            }
          >
            <option value="">Todos</option>
            {metodoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <FilterInput
          label="Atendimento"
          value={draftFilters.atendimentoId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, atendimentoId: value }))}
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

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        A confirmação definitiva de pagamento continua dependendo do webhook processado pelo backend.
      </div>

      {pagamentosQuery.isLoading && <StateBox tone="loading" title="Carregando pagamentos" description="Buscando registros operacionais." />}

      {pagamentosQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar pagamentos"
          message={getApiErrorMessage(pagamentosQuery.error)}
          details={pagamentosQuery.error instanceof ApiError ? pagamentosQuery.error.errors : []}
        />
      )}

      {pagamentosQuery.isSuccess && pagamentos.length === 0 && (
        <StateBox tone="empty" title="Nenhum pagamento encontrado" description="O backend retornou uma lista vazia para os filtros atuais." />
      )}

      {pagamentos.length > 0 && (
        <section className="grid gap-4">
          {pagamentos.map((pagamento) => (
            <AdminPagamentoCard key={pagamento.id} pagamento={pagamento} />
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

function toApiParams(filters: FilterState): ListarPagamentosAdminParams {
  const atendimentoId = Number(filters.atendimentoId);

  return {
    status: filters.status || undefined,
    metodoPagamento: filters.metodoPagamento || undefined,
    atendimentoId: Number.isInteger(atendimentoId) && atendimentoId > 0 ? atendimentoId : undefined,
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
