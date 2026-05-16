import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { PagamentoDetail } from '../../features/cliente/pagamentos/PagamentoDetail';
import {
  buscarAtendimentoParaPagamento,
  buscarPagamentoPorAtendimento,
  buscarPixQrCodePagamento,
} from '../../features/cliente/pagamentos/pagamentosApi';
import type { StatusPagamento } from '../../features/cliente/pagamentos/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  atendimentos: ['cliente', 'pagamentos', 'atendimentos'],
  atendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id],
  atendimentoDetalhe: (id: number) => ['atendimentos', 'cliente', id],
  pagamentoPorAtendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id, 'pagamento'],
  pixQrCode: (id: number) => ['cliente', 'pagamentos', 'pix-qrcode', id],
};

export function ClientePagamentoPage() {
  const { atendimentoId } = useParams();
  const parsedAtendimentoId = Number(atendimentoId);
  const validAtendimentoId = Number.isFinite(parsedAtendimentoId) && parsedAtendimentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'info'; message: string } | null>(null);
  const previousPagamentoStatusRef = useRef<StatusPagamento | null>(null);

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
    refetchInterval: (query) => (isPendingPaymentStatus(query.state.data?.status) ? 5000 : false),
    refetchOnWindowFocus: true,
    retry: false,
  });

  const pagamento = pagamentoQuery.data ?? null;
  const shouldLoadPixQrCode = Boolean(pagamento && pagamento.metodoPagamento === 'PIX' && isPendingPaymentStatus(pagamento.status));
  const pixQrCodeQuery = useQuery({
    queryKey: pagamento ? queryKeys.pixQrCode(pagamento.id) : ['cliente', 'pagamentos', 'pix-qrcode', 'invalid'],
    queryFn: () => buscarPixQrCodePagamento(requireToken(token), pagamento!.id),
    enabled: Boolean(token && shouldLoadPixQrCode),
    retry: false,
  });

  const protectedError = useMemo(
    () =>
      [atendimentoQuery.error, pagamentoQuery.error, pixQrCodeQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [atendimentoQuery.error, pagamentoQuery.error, pixQrCodeQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  useEffect(() => {
    const currentStatus = pagamento?.status ?? null;
    const previousStatus = previousPagamentoStatusRef.current;

    previousPagamentoStatusRef.current = currentStatus;

    if (!currentStatus || !previousStatus || currentStatus === previousStatus) {
      return;
    }

    if (currentStatus === 'PAGO') {
      setFeedback({ tone: 'success', message: 'Pagamento confirmado.' });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.atendimento(parsedAtendimentoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.atendimentoDetalhe(parsedAtendimentoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.atendimentos }),
      ]);
      return;
    }

    if (isFinalPaymentStatus(currentStatus)) {
      setFeedback(null);
    }
  }, [pagamento?.status, parsedAtendimentoId, queryClient]);

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
              Acompanhe o pagamento do atendimento #{parsedAtendimentoId} e veja quando a confirmacao for concluida.
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

      {feedback && <FormAlert tone={feedback.tone} message={feedback.message} />}

      {pagamento && (
        <PagamentoDetail
          isPixQrCodeLoading={pixQrCodeQuery.isLoading}
          isRefreshingStatus={pagamentoQuery.isRefetching}
          onRefreshStatus={() => {
            setFeedback(null);
            void Promise.all([pagamentoQuery.refetch(), atendimentoQuery.refetch()]);
          }}
          pagamento={pagamento}
          pixQrCode={pixQrCodeQuery.data ?? null}
          pixQrCodeErrorMessage={pixQrCodeQuery.isError ? getApiErrorMessage(pixQrCodeQuery.error) : null}
        />
      )}

      {pagamentoNotFound && (
        <FormAlert
          tone="info"
          title="Pagamento nao encontrado"
          message="Ainda nao existe pagamento registrado para este atendimento. Volte para a lista e escolha Pix ou cartao de credito para continuar."
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

function isPendingPaymentStatus(status: StatusPagamento | null | undefined) {
  return status === 'PENDENTE' || status === 'AGUARDANDO_CONFIRMACAO';
}

function isFinalPaymentStatus(status: StatusPagamento | null | undefined) {
  return status === 'PAGO' || status === 'FALHOU' || status === 'CANCELADO' || status === 'ESTORNADO';
}
