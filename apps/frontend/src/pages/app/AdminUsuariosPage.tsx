import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminUsuarioCard } from '../../features/admin/usuarios/AdminUsuarioCard';
import { listarUsuariosAdmin } from '../../features/admin/usuarios/adminUsuariosApi';
import { statusContaOptions, tipoUsuarioOptions } from '../../features/admin/usuarios/usuarioLabels';
import type { ListarUsuariosAdminParams, StatusConta, TipoUsuario } from '../../features/admin/usuarios/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  usuarios: (params: ListarUsuariosAdminParams) => ['admin', 'usuarios', params],
};

type FilterState = {
  tipoUsuario: TipoUsuario | '';
  statusConta: StatusConta | '';
  search: string;
};

const emptyFilters: FilterState = {
  tipoUsuario: '',
  statusConta: '',
  search: '',
};

export function AdminUsuariosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(emptyFilters);

  const params = useMemo(() => toApiParams(appliedFilters), [appliedFilters]);

  const usuariosQuery = useQuery({
    queryKey: queryKeys.usuarios(params),
    queryFn: () => listarUsuariosAdmin(requireToken(token), params),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (usuariosQuery.error instanceof ApiError && usuariosQuery.error.status === 401 ? usuariosQuery.error : null),
    [usuariosQuery.error],
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
      tipoUsuario: draftFilters.tipoUsuario,
      statusConta: draftFilters.statusConta,
      search: draftFilters.search.trim(),
    });
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  const usuarios = usuariosQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Usuários</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte contas e vínculos de perfil em visão operacional somente leitura.
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
          Tipo
          <select
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            value={draftFilters.tipoUsuario}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, tipoUsuario: event.target.value as TipoUsuario | '' }))
            }
          >
            <option value="">Todos</option>
            {tipoUsuarioOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid w-full gap-2 text-sm font-bold text-slate-700 sm:min-w-[min(100%,14rem)] sm:flex-1">
          Status da conta
          <select
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            value={draftFilters.statusConta}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, statusConta: event.target.value as StatusConta | '' }))
            }
          >
            <option value="">Todos</option>
            {statusContaOptions.map((option) => (
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
            placeholder="Nome, e-mail ou telefone"
            type="search"
            value={draftFilters.search}
            onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
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

      <FormAlert
        tone="info"
        title="Visão somente leitura"
        message="Esta tela não altera status, senha, permissões ou dados cadastrais."
      />

      {usuariosQuery.isLoading && <StateBox tone="loading" title="Carregando usuários" description="Buscando registros operacionais." />}

      {usuariosQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar usuários"
          message={getApiErrorMessage(usuariosQuery.error)}
          details={usuariosQuery.error instanceof ApiError ? usuariosQuery.error.errors : []}
        />
      )}

      {usuariosQuery.isSuccess && usuarios.length === 0 && (
        <StateBox tone="empty" title="Nenhum usuário encontrado" description="O backend retornou uma lista vazia para os filtros atuais." />
      )}

      {usuarios.length > 0 && (
        <section className="grid gap-4">
          {usuarios.map((usuario) => (
            <AdminUsuarioCard key={usuario.usuarioId} usuario={usuario} />
          ))}
        </section>
      )}
    </div>
  );
}


function toApiParams(filters: FilterState): ListarUsuariosAdminParams {
  return {
    tipoUsuario: filters.tipoUsuario || undefined,
    statusConta: filters.statusConta || undefined,
    search: filters.search.trim() || undefined,
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
