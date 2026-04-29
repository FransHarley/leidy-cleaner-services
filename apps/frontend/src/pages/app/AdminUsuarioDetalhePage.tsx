import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { buscarUsuarioAdmin } from '../../features/admin/usuarios/adminUsuariosApi';
import { AdminUsuarioInfoPanel } from '../../features/admin/usuarios/AdminUsuarioInfoPanel';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['admin', 'usuarios', id],
};

export function AdminUsuarioDetalhePage() {
  const { id } = useParams();
  const usuarioId = Number(id);
  const validId = Number.isFinite(usuarioId) && usuarioId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const usuarioQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(usuarioId) : ['admin', 'usuarios', 'invalid'],
    queryFn: () => buscarUsuarioAdmin(requireToken(token), usuarioId),
    enabled: Boolean(token && validId),
    retry: false,
  });

  const protectedError = useMemo(
    () => (usuarioQuery.error instanceof ApiError && usuarioQuery.error.status === 401 ? usuarioQuery.error : null),
    [usuarioQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Usuário inválido" message="O identificador do usuário não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/admin/usuarios">
          Voltar para usuários
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do usuário</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte dados cadastrais seguros retornados pelo backend. Esta visão não altera a conta.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/admin/usuarios"
          >
            Voltar
          </Link>
        </div>
      </section>

      <FormAlert
        tone="info"
        title="Visão somente leitura"
        message="A administração pode consultar a conta, mas bloqueio, reset de senha e exclusão não fazem parte desta etapa."
      />

      {usuarioQuery.isLoading && <StateBox tone="loading" title="Carregando usuário" description="Buscando os dados operacionais." />}

      {usuarioQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o usuário"
          message={getApiErrorMessage(usuarioQuery.error)}
          details={usuarioQuery.error instanceof ApiError ? usuarioQuery.error.errors : []}
        />
      )}

      {usuarioQuery.data && <AdminUsuarioInfoPanel usuario={usuarioQuery.data} />}
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
