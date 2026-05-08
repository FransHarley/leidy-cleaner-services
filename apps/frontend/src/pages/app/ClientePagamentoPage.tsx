import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { PagamentoDetail } from '../../features/cliente/pagamentos/PagamentoDetail';
import {
  buscarAtendimentoParaPagamento,
  buscarPagamentoPorAtendimento,
} from '../../features/cliente/pagamentos/pagamentosApi';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  atendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id],
  pagamentoPorAtendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id, 'pagamento'],
};

export function ClientePagamentoPage() {
  const { atendimentoId } = useParams();
  const parsedAtendimentoId = Number(atendimentoId);
  const validAtendimentoId = Number.isFinite(parsedAtendimentoId) && parsedAtendimentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const atendimentoQuery = useQuery({
    queryKey: validAtendimentoId ? queryKeys.atendimento(parsedAtendimentoId) : ['cliente', 'pagamentos', 'atendimento', 'invalid'],
    queryFn: () => buscarAtendimentoParaPagamento(requireToken(token), parsedAtendimentoId),
    enabled: Boolean(token && validAtendimentoId),
    retry: false,
  });

  const pagamentoQuery = useQuery({
    queryKey: validAtendimentoId
      ? queryKeys.pagamentoPorAtendimento(parsedAtendimentoId)
      : ['cliente', 'pagamentos', 'atendimento', 'invalid', 'pagamento'],
    queryFn: () => buscarPagamentoPorAtendimento(requireToken(token), parsedAtendimentoId),
    enabled: Boolean(token && validAtendimentoId),
    retry: false,
  });

  const protectedError = useMemo(
    () =>
      [atendimentoQuery.error, pagamentoQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [atendimentoQuery.error, pagamentoQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  if (!validAtendimentoId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Pagamento invalido" message="O atendimento informado nao e valido." />
        <BackToPaymentsLink />
      </div>
    );
  }

  const pagamentoNotFound = pagamentoQuery.error instanceof ApiError && pagamentoQuery.error.status === 404;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Checkout e status</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Acompanhe o pagamento do atendimento #{parsedAtendimentoId}. A confirmacao definitiva depende do webhook.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/cliente/pagamentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      {atendimentoQuery.isLoading && (
        <StateBox tone="loading" title="Carregando atendimento" description="Buscando o atendimento vinculado ao pagamento." />
      )}

      {atendimentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar o atendimento"
          message={getApiErrorMessage(atendimentoQuery.error)}
          details={atendimentoQuery.error instanceof ApiError ? atendimentoQuery.error.errors : []}
        />
      )}

      {pagamentoQuery.isLoading && (
        <StateBox tone="loading" title="Carregando pagamento" description="Buscando o pagamento vinculado ao atendimento." />
      )}

      {pagamentoQuery.data && <PagamentoDetail pagamento={pagamentoQuery.data} />}

      {pagamentoNotFound && (
        <FormAlert
          tone="info"
          title="Pagamento nao encontrado"
          message="Ainda nao existe pagamento registrado para este atendimento. Volte para a lista e escolha Pix ou cartao de credito antes de continuar para o pagamento."
        />
      )}

      {pagamentoQuery.isError && !protectedError && !pagamentoNotFound && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar o pagamento"
          message={getApiErrorMessage(pagamentoQuery.error)}
          details={pagamentoQuery.error instanceof ApiError ? pagamentoQuery.error.errors : []}
        />
      )}
    </div>
  );
}

function BackToPaymentsLink() {
  return (
    <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/cliente/pagamentos">
      Voltar para pagamentos
    </Link>
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
