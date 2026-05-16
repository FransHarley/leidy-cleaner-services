import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AdminCreditoSolicitacaoInfoPanel } from '../../features/admin/creditos-solicitacao/AdminCreditoSolicitacaoInfoPanel';
import { buscarCreditoSolicitacaoAdmin } from '../../features/admin/creditos-solicitacao/adminCreditosSolicitacaoApi';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['admin', 'creditos-solicitacao', id],
};

export function AdminCreditoSolicitacaoDetalhePage() {
  const { id } = useParams();
  const creditoId = Number(id);
  const validId = Number.isFinite(creditoId) && creditoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const creditoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(creditoId) : ['admin', 'creditos-solicitacao', 'invalid'],
    queryFn: () => buscarCreditoSolicitacaoAdmin(requireToken(token), creditoId),
    enabled: Boolean(token && validId),
    retry: false,
  });

  const protectedError = useMemo(
    () => (creditoQuery.error instanceof ApiError && creditoQuery.error.status === 401 ? creditoQuery.error : null),
    [creditoQuery.error],
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
        <FormAlert tone="error" title="Credito invalido" message="O identificador informado nao e valido." />
        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/admin/creditos-solicitacao">
          Voltar para solicitacoes de reposicao
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administracao</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe da reposicao</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte o contexto completo desta reposicao. Esta visualizacao nao altera o status.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/admin/creditos-solicitacao"
          >
            Voltar
          </Link>
        </div>
      </section>

      <FormAlert
        tone="info"
        title="Visao somente leitura"
        message="A administracao pode acompanhar as reposicoes, mas o uso e a geracao seguem o fluxo normal da plataforma."
      />

      {creditoQuery.isLoading && <StateBox tone="loading" title="Carregando reposicao" description="Buscando o detalhamento operacional." />}

      {creditoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar a reposicao"
          message={getApiErrorMessage(creditoQuery.error)}
          details={creditoQuery.error instanceof ApiError ? creditoQuery.error.errors : []}
        />
      )}

      {creditoQuery.data && <AdminCreditoSolicitacaoInfoPanel credito={creditoQuery.data} />}
    </div>
  );
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
