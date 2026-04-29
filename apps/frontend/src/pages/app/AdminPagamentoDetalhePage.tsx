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
        <FormAlert tone="error" title="Pagamento inválido" message="O identificador do pagamento não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/admin/pagamentos">
          Voltar para pagamentos
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
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do pagamento</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte o estado operacional retornado pelo backend. Esta visão não força transições de pagamento.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/admin/pagamentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      <FormAlert
        tone="info"
        title="Visão somente leitura"
        message="A administração pode consultar pagamentos, mas a confirmação definitiva continua restrita ao webhook do backend."
      />

      {pagamentoQuery.isLoading && <StateBox tone="loading" title="Carregando pagamento" description="Buscando os dados operacionais." />}

      {pagamentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o pagamento"
          message={getApiErrorMessage(pagamentoQuery.error)}
          details={pagamentoQuery.error instanceof ApiError ? pagamentoQuery.error.errors : []}
        />
      )}

      {pagamentoQuery.data?.status === 'AGUARDANDO_CONFIRMACAO' && (
        <FormAlert
          tone="info"
          title="Aguardando webhook"
          message="O gateway retornou indício de pagamento, mas o status definitivo ainda depende do webhook processado pelo backend."
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
      message: 'Sessão expirada. Entre novamente.',
    });
  }

  return token;
}
