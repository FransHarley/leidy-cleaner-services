import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { buscarSolicitacaoAdmin } from '../../features/admin/solicitacoes/adminSolicitacoesApi';
import { AdminSolicitacaoInfoPanel } from '../../features/admin/solicitacoes/AdminSolicitacaoInfoPanel';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['admin', 'solicitacoes', id],
};

export function AdminSolicitacaoDetalhePage() {
  const { id } = useParams();
  const solicitacaoId = Number(id);
  const validId = Number.isFinite(solicitacaoId) && solicitacaoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const solicitacaoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(solicitacaoId) : ['admin', 'solicitacoes', 'invalid'],
    queryFn: () => buscarSolicitacaoAdmin(requireToken(token), solicitacaoId),
    enabled: Boolean(token && validId),
    retry: false,
  });

  const protectedError = useMemo(
    () => (solicitacaoQuery.error instanceof ApiError && solicitacaoQuery.error.status === 401 ? solicitacaoQuery.error : null),
    [solicitacaoQuery.error],
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
        <FormAlert tone="error" title="Solicitação inválida" message="O identificador da solicitação não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/admin/solicitacoes">
          Voltar para solicitações
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
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe da solicitação</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte dados operacionais retornados pelo backend. Esta visão não altera a solicitação.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/admin/solicitacoes"
          >
            Voltar
          </Link>
        </div>
      </section>

      <FormAlert
        tone="info"
        title="Visão somente leitura"
        message="A administração pode consultar solicitações, mas cancelamento, seleção de profissionais e convites continuam restritos aos fluxos existentes."
      />

      {solicitacaoQuery.isLoading && <StateBox tone="loading" title="Carregando solicitação" description="Buscando os dados operacionais." />}

      {solicitacaoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar a solicitação"
          message={getApiErrorMessage(solicitacaoQuery.error)}
          details={solicitacaoQuery.error instanceof ApiError ? solicitacaoQuery.error.errors : []}
        />
      )}

      {solicitacaoQuery.data && <AdminSolicitacaoInfoPanel solicitacao={solicitacaoQuery.data} />}
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
