import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminCreditoSolicitacaoCard } from '../../features/admin/creditos-solicitacao/AdminCreditoSolicitacaoCard';
import {
  listarCreditosSolicitacaoAdmin,
  type ListarCreditosSolicitacaoAdminParams,
} from '../../features/admin/creditos-solicitacao/adminCreditosSolicitacaoApi';
import { statusCreditoSolicitacaoAdminLabels } from '../../features/admin/creditos-solicitacao/creditoSolicitacaoAdminLabels';
import { useAuth } from '../../features/auth/useAuth';
import type { StatusCreditoSolicitacao } from '../../features/cliente/creditos/types';
import { tipoServicoOptions } from '../../features/cliente/solicitacoes/solicitacaoLabels';
import type { TipoServico } from '../../features/cliente/solicitacoes/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const statusOptions = Object.entries(statusCreditoSolicitacaoAdminLabels).map(([value, label]) => ({
  value: value as StatusCreditoSolicitacao,
  label,
}));

const queryKeys = {
  creditos: (params: ListarCreditosSolicitacaoAdminParams) => ['admin', 'creditos-solicitacao', params],
};

type FilterState = {
  status: StatusCreditoSolicitacao | '';
  clienteId: string;
  solicitacaoOrigemId: string;
  solicitacaoUsoId: string;
  pagamentoOrigemId: string;
  tipoServico: TipoServico | '';
  regiaoId: string;
  criadoDe: string;
  criadoAte: string;
};

const emptyFilters: FilterState = {
  status: '',
  clienteId: '',
  solicitacaoOrigemId: '',
  solicitacaoUsoId: '',
  pagamentoOrigemId: '',
  tipoServico: '',
  regiaoId: '',
  criadoDe: '',
  criadoAte: '',
};

export function AdminCreditosSolicitacaoPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

  const params = useMemo(() => toApiParams(appliedFilters), [appliedFilters]);

  const creditosQuery = useQuery({
    queryKey: queryKeys.creditos(params),
    queryFn: () => listarCreditosSolicitacaoAdmin(requireToken(token), params),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (creditosQuery.error instanceof ApiError && creditosQuery.error.status === 401 ? creditosQuery.error : null),
    [creditosQuery.error],
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
      clienteId: normalizePositiveInteger(draftFilters.clienteId),
      solicitacaoOrigemId: normalizePositiveInteger(draftFilters.solicitacaoOrigemId),
      solicitacaoUsoId: normalizePositiveInteger(draftFilters.solicitacaoUsoId),
      pagamentoOrigemId: normalizePositiveInteger(draftFilters.pagamentoOrigemId),
      regiaoId: normalizePositiveInteger(draftFilters.regiaoId),
      criadoDe: normalizeDateTimeLocal(draftFilters.criadoDe),
      criadoAte: normalizeDateTimeLocal(draftFilters.criadoAte),
    });
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const creditos = creditosQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administracao</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Solicitacoes de reposicao</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte creditos de solicitacao gerados por recusa ou expiracao. Esta visao e somente leitura.
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
          label="Status"
          value={draftFilters.status}
          onChange={(value) => setDraftFilters((current) => ({ ...current, status: value as StatusCreditoSolicitacao | '' }))}
        >
          <option value="">Todos</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterInput label="Cliente" value={draftFilters.clienteId} onChange={(value) => setDraftFilters((current) => ({ ...current, clienteId: value }))} />
        <FilterInput
          label="Solicitacao origem"
          value={draftFilters.solicitacaoOrigemId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, solicitacaoOrigemId: value }))}
        />
        <FilterInput
          label="Solicitacao uso"
          value={draftFilters.solicitacaoUsoId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, solicitacaoUsoId: value }))}
        />
        <FilterInput
          label="Pagamento origem"
          value={draftFilters.pagamentoOrigemId}
          onChange={(value) => setDraftFilters((current) => ({ ...current, pagamentoOrigemId: value }))}
        />

        <FilterSelect
          label="Tipo de servico"
          value={draftFilters.tipoServico}
          onChange={(value) => setDraftFilters((current) => ({ ...current, tipoServico: value as TipoServico | '' }))}
        >
          <option value="">Todos</option>
          {tipoServicoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterInput label="Regiao" value={draftFilters.regiaoId} onChange={(value) => setDraftFilters((current) => ({ ...current, regiaoId: value }))} />
        <FilterDateTime label="Criado de" value={draftFilters.criadoDe} onChange={(value) => setDraftFilters((current) => ({ ...current, criadoDe: value }))} />
        <FilterDateTime label="Criado ate" value={draftFilters.criadoAte} onChange={(value) => setDraftFilters((current) => ({ ...current, criadoAte: value }))} />

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
        Valor de referencia aparece apenas para auditoria operacional e conciliacao do caso.
      </div>

      {creditosQuery.isLoading && <StateBox tone="loading" title="Carregando reposicoes" description="Buscando registros operacionais." />}

      {creditosQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar solicitacoes de reposicao"
          message={getApiErrorMessage(creditosQuery.error)}
          details={creditosQuery.error instanceof ApiError ? creditosQuery.error.errors : []}
        />
      )}

      {creditosQuery.isSuccess && creditos.length === 0 && (
        <StateBox
          tone="empty"
          title="Nenhum credito de solicitacao encontrado"
          description="Nenhuma reposicao foi encontrada com os filtros atuais."
        />
      )}

      {creditos.length > 0 && (
        <section className="grid gap-4">
          {creditos.map((credito) => (
            <AdminCreditoSolicitacaoCard key={credito.id} credito={credito} />
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

function toApiParams(filters: FilterState): ListarCreditosSolicitacaoAdminParams {
  return {
    status: filters.status || undefined,
    clienteId: toPositiveInteger(filters.clienteId),
    solicitacaoOrigemId: toPositiveInteger(filters.solicitacaoOrigemId),
    solicitacaoUsoId: toPositiveInteger(filters.solicitacaoUsoId),
    pagamentoOrigemId: toPositiveInteger(filters.pagamentoOrigemId),
    tipoServico: filters.tipoServico || undefined,
    regiaoId: toPositiveInteger(filters.regiaoId),
    criadoDe: filters.criadoDe || undefined,
    criadoAte: filters.criadoAte || undefined,
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
