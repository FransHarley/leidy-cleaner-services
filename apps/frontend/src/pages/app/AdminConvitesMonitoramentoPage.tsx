import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminConviteMonitoramentoCard } from '../../features/admin/convites-monitoramento/AdminConviteMonitoramentoCard';
import {
  listarConvitesMonitoramentoAdmin,
  type ListarConvitesMonitoramentoAdminParams,
} from '../../features/admin/convites-monitoramento/adminConvitesMonitoramentoApi';
import { useAuth } from '../../features/auth/useAuth';
import { statusConviteLabels } from '../../features/profissional/convites/conviteLabels';
import type { StatusConvite } from '../../features/profissional/convites/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const statusOptions = Object.entries(statusConviteLabels).map(([value, label]) => ({
  value: value as StatusConvite,
  label,
}));

const queryKeys = {
  convites: (params: ListarConvitesMonitoramentoAdminParams) => ['admin', 'convites-monitoramento', params],
};

type FilterState = {
  status: StatusConvite | '';
  solicitacaoId: string;
  profissionalId: string;
  clienteId: string;
  expiraAntesDe: string;
  expiraDepoisDe: string;
  somenteVencidos: boolean;
};

const emptyFilters: FilterState = {
  status: '',
  solicitacaoId: '',
  profissionalId: '',
  clienteId: '',
  expiraAntesDe: '',
  expiraDepoisDe: '',
  somenteVencidos: false,
};

export function AdminConvitesMonitoramentoPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

  const params = useMemo(() => toApiParams(appliedFilters), [appliedFilters]);

  const convitesQuery = useQuery({
    queryKey: queryKeys.convites(params),
    queryFn: () => listarConvitesMonitoramentoAdmin(requireToken(token), params),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (convitesQuery.error instanceof ApiError && convitesQuery.error.status === 401 ? convitesQuery.error : null),
    [convitesQuery.error],
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
      ...draftFilters,
      solicitacaoId: normalizePositiveInteger(draftFilters.solicitacaoId),
      profissionalId: normalizePositiveInteger(draftFilters.profissionalId),
      clienteId: normalizePositiveInteger(draftFilters.clienteId),
      expiraAntesDe: normalizeDateTimeLocal(draftFilters.expiraAntesDe),
      expiraDepoisDe: normalizeDateTimeLocal(draftFilters.expiraDepoisDe),
    });
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const convites = convitesQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administracao</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Monitoramento de convites</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Acompanhe solicitacoes pagas aguardando aceite, convites vencidos e creditos de solicitacao gerados.
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
        className="grid gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4"
        onSubmit={handleFilterSubmit}
      >
        <FilterSelect
          label="Status do convite"
          value={draftFilters.status}
          onChange={(value) => setDraftFilters((current) => ({ ...current, status: value as StatusConvite | '' }))}
        >
          <option value="">Todos</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterInput
          label="Solicitacao"
          value={draftFilters.solicitacaoId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, solicitacaoId: value }))}
        />
        <FilterInput
          label="Profissional"
          value={draftFilters.profissionalId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, profissionalId: value }))}
        />
        <FilterInput
          label="Cliente"
          value={draftFilters.clienteId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, clienteId: value }))}
        />
        <FilterDateTime label="Expira ate" value={draftFilters.expiraAntesDe} onChange={(value) => setDraftFilters((current) => ({ ...current, expiraAntesDe: value }))} />
        <FilterDateTime
          label="Expira depois de"
          value={draftFilters.expiraDepoisDe}
          onChange={(value) => setDraftFilters((current) => ({ ...current, expiraDepoisDe: value }))}
        />

        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input
            checked={draftFilters.somenteVencidos}
            className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
            type="checkbox"
            onChange={(event) => setDraftFilters((current) => ({ ...current, somenteVencidos: event.target.checked }))}
          />
          Somente vencidos
        </label>

        <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-4 xl:flex-row">
          <button
            className="min-h-11 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            type="submit"
          >
            Filtrar
          </button>
          <button
            className="min-h-11 rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            type="button"
            onClick={handleClearFilters}
          >
            Limpar
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        Acompanhe convites e solicitacoes que ainda precisam de observacao. Esta tela nao altera o andamento automaticamente.
      </div>

      {convitesQuery.isLoading && <StateBox tone="loading" title="Carregando monitoramento" description="Buscando convites e solicitacoes pagas aguardando aceite." />}

      {convitesQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar o monitoramento"
          message={getApiErrorMessage(convitesQuery.error)}
          details={convitesQuery.error instanceof ApiError ? convitesQuery.error.errors : []}
        />
      )}

      {convitesQuery.isSuccess && convites.length === 0 && (
        <StateBox tone="empty" title="Nenhum convite encontrado" description="Nenhum convite foi encontrado com os filtros atuais." />
      )}

      {convites.length > 0 && (
        <section className="grid gap-4">
          {convites.map((convite) => (
            <AdminConviteMonitoramentoCard key={convite.conviteId} convite={convite} />
          ))}
        </section>
      )}
    </div>
  );
}

function FilterInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
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

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <select
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function FilterDateTime({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        type="datetime-local"
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

function normalizeDateTimeLocal(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : '';
}

function toApiParams(filters: FilterState): ListarConvitesMonitoramentoAdminParams {
  return {
    status: filters.status || undefined,
    solicitacaoId: toPositiveInteger(filters.solicitacaoId),
    profissionalId: toPositiveInteger(filters.profissionalId),
    clienteId: toPositiveInteger(filters.clienteId),
    expiraAntesDe: filters.expiraAntesDe || undefined,
    expiraDepoisDe: filters.expiraDepoisDe || undefined,
    somenteVencidos: filters.somenteVencidos || undefined,
  };
}

function toPositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
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
