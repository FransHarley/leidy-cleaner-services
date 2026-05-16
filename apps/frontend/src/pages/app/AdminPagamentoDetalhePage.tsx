import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { buscarPagamentoAdmin } from '../../features/admin/pagamentos/adminPagamentosApi';
import { AdminPagamentoInfoPanel } from '../../features/admin/pagamentos/AdminPagamentoInfoPanel';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['admin', 'pagamentos', id],
};

export function AdminPagamentoDetalhePage() {
  const { id } = useParams();
  const pagamentoId = Number(id);
  const validId = Number.isFinite(pagamentoId) && pagamentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const pagamentoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(pagamentoId) : ['admin', 'pagamentos', 'invalid'],
    queryFn: () => buscarPagamentoAdmin(requireToken(token), pagamentoId),
    enabled: Boolean(token && validId),
    retry: false,
  });

  const protectedError = useMemo(
    () => (pagamentoQuery.error instanceof ApiError && pagamentoQuery.error.status === 401 ? pagamentoQuery.error : null),
    [pagamentoQuery.error],
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
        <FormAlert tone="error" title="Pagamento invalido" message="O identificador do pagamento nao e valido." />
        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/admin/pagamentos">
          Voltar para pagamentos
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
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do pagamento</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte os detalhes deste pagamento. Esta visualizacao nao altera o status.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/admin/pagamentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      <FormAlert
        tone="info"
        title="Visao somente leitura"
        message="A administracao pode acompanhar pagamentos, mas a confirmacao final acontece pelo sistema."
      />

      {pagamentoQuery.isLoading && <StateBox tone="loading" title="Carregando pagamento" description="Buscando os dados operacionais." />}

      {pagamentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar o pagamento"
          message={getApiErrorMessage(pagamentoQuery.error)}
          details={pagamentoQuery.error instanceof ApiError ? pagamentoQuery.error.errors : []}
        />
      )}

      {pagamentoQuery.data?.status === 'AGUARDANDO_CONFIRMACAO' && (
        <FormAlert
          tone="info"
          title="Confirmacao em andamento"
          message="Ja recebemos um sinal de pagamento, mas a confirmacao final ainda esta em andamento."
        />
      )}

      {pagamentoQuery.data && <AdminPagamentoInfoPanel pagamento={pagamentoQuery.data} />}
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
