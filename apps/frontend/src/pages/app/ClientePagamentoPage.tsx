import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { PagamentoDetail } from '../../features/cliente/pagamentos/PagamentoDetail';
import {
  formatCurrency,
  formatDateTime,
  getStatusAtendimentoPagamentoInfo,
  getTipoServicoPagamentoLabel,
} from '../../features/cliente/pagamentos/pagamentoLabels';
import {
  buscarAtendimentoParaPagamento,
  buscarPagamento,
  buscarPagamentoPorAtendimento,
  consultarStatusPagamento,
  criarCheckoutPagamento,
} from '../../features/cliente/pagamentos/pagamentosApi';
import type { AtendimentoPagamento, CheckoutPagamento, Pagamento } from '../../features/cliente/pagamentos/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  atendimentos: ['cliente', 'pagamentos', 'atendimentos'],
  atendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id],
  pagamento: (id: number) => ['cliente', 'pagamentos', 'pagamento', id],
  pagamentoPorAtendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id, 'pagamento'],
};

const checkoutAutoAttempts = new Set<number>();

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title: string;
  message: string;
  details?: string[];
};

export function ClientePagamentoPage() {
  const { atendimentoId, pagamentoId } = useParams();
  const parsedAtendimentoId = Number(atendimentoId);
  const parsedPagamentoId = Number(pagamentoId);
  const byAtendimento = atendimentoId !== undefined;
  const byPagamento = pagamentoId !== undefined;
  const validAtendimentoId = byAtendimento && Number.isFinite(parsedAtendimentoId) && parsedAtendimentoId > 0;
  const validPagamentoId = byPagamento && Number.isFinite(parsedPagamentoId) && parsedPagamentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPagamento | null>(null);
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState(false);

  useEffect(() => {
    setFeedback(null);
    setCheckoutPreview(null);
    setHasAttemptedCheckout(false);
  }, [parsedAtendimentoId, parsedPagamentoId]);

  const atendimentoQuery = useQuery({
    queryKey: validAtendimentoId ? queryKeys.atendimento(parsedAtendimentoId) : ['cliente', 'pagamentos', 'atendimento', 'invalid'],
    queryFn: () => buscarAtendimentoParaPagamento(requireToken(token), parsedAtendimentoId),
    enabled: Boolean(token && validAtendimentoId),
    retry: false,
  });

  const pagamentoPorAtendimentoQuery = useQuery({
    queryKey: validAtendimentoId
      ? queryKeys.pagamentoPorAtendimento(parsedAtendimentoId)
      : ['cliente', 'pagamentos', 'atendimento', 'invalid', 'pagamento'],
    queryFn: () => buscarPagamentoPorAtendimento(requireToken(token), parsedAtendimentoId),
    enabled: Boolean(token && validAtendimentoId),
    retry: false,
  });

  const pagamentoPorIdQuery = useQuery({
    queryKey: validPagamentoId ? queryKeys.pagamento(parsedPagamentoId) : ['cliente', 'pagamentos', 'pagamento', 'invalid'],
    queryFn: () => buscarPagamento(requireToken(token), parsedPagamentoId),
    enabled: Boolean(token && validPagamentoId),
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: (id: number) => criarCheckoutPagamento(requireToken(token), { atendimentoId: id }),
    onSuccess: async (checkout) => {
      setCheckoutPreview(checkout);
      setFeedback({
        tone: 'success',
        title: 'Checkout criado',
        message: 'O backend criou o checkout e registrou o pagamento pendente para este atendimento.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pagamentoPorAtendimento(checkout.atendimentoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.atendimentos }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      if (error instanceof ApiError && error.code === 'PAGAMENTO_JA_EXISTE' && validAtendimentoId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.pagamentoPorAtendimento(parsedAtendimentoId) });
      } else if (validAtendimentoId) {
        checkoutAutoAttempts.delete(parsedAtendimentoId);
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível criar o checkout',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const recheckMutation = useMutation({
    mutationFn: (id: number) => consultarStatusPagamento(requireToken(token), id),
    onSuccess: async (pagamento) => {
      setFeedback({
        tone: pagamento.status === 'PAGO' ? 'success' : 'info',
        title: 'Status atualizado',
        message:
          pagamento.status === 'PAGO'
            ? 'O backend retornou este pagamento como pago.'
            : 'A consulta foi feita no backend. Se ainda estiver pendente, aguarde o webhook ou tente novamente depois.',
      });
      queryClient.setQueryData(queryKeys.pagamento(pagamento.id), pagamento);
      queryClient.setQueryData(queryKeys.pagamentoPorAtendimento(pagamento.atendimentoId), pagamento);
      await queryClient.invalidateQueries({ queryKey: queryKeys.atendimentos });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível atualizar o status',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const protectedError = useMemo(
    () =>
      [atendimentoQuery.error, pagamentoPorAtendimentoQuery.error, pagamentoPorIdQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [atendimentoQuery.error, pagamentoPorAtendimentoQuery.error, pagamentoPorIdQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const pagamentoNotFoundForAtendimento =
    validAtendimentoId &&
    pagamentoPorAtendimentoQuery.error instanceof ApiError &&
    pagamentoPorAtendimentoQuery.error.status === 404;
  const shouldCreateCheckout =
    validAtendimentoId &&
    Boolean(atendimentoQuery.data) &&
    atendimentoQuery.data?.status === 'AGUARDANDO_PAGAMENTO' &&
    pagamentoNotFoundForAtendimento;

  useEffect(() => {
    if (
      shouldCreateCheckout &&
      !hasAttemptedCheckout &&
      !checkoutAutoAttempts.has(parsedAtendimentoId) &&
      !checkoutMutation.isPending
    ) {
      checkoutAutoAttempts.add(parsedAtendimentoId);
      setHasAttemptedCheckout(true);
      checkoutMutation.mutate(parsedAtendimentoId);
    }
  }, [checkoutMutation, hasAttemptedCheckout, parsedAtendimentoId, shouldCreateCheckout]);

  const pagamento = byPagamento ? pagamentoPorIdQuery.data : pagamentoPorAtendimentoQuery.data;
  const validRoute = validAtendimentoId || validPagamentoId;

  if (!validRoute) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Pagamento inválido" message="O identificador informado não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/cliente/pagamentos">
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
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Cliente</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Checkout e status</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Pague pelo checkout do Asaas e acompanhe o status retornado pelo backend.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/cliente/pagamentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {validAtendimentoId && (
        <AtendimentoContext
          atendimento={atendimentoQuery.data}
          error={atendimentoQuery.error}
          isLoading={atendimentoQuery.isLoading}
          protectedError={protectedError}
        />
      )}

      {renderPaymentState({
        atendimento: atendimentoQuery.data,
        checkoutPreview,
        isCreatingCheckout: checkoutMutation.isPending,
        isRechecking: recheckMutation.isPending,
        pagamento,
        pagamentoError: byPagamento ? pagamentoPorIdQuery.error : pagamentoPorAtendimentoQuery.error,
        pagamentoIsLoading: byPagamento ? pagamentoPorIdQuery.isLoading : pagamentoPorAtendimentoQuery.isLoading,
        pagamentoNotFoundForAtendimento,
        protectedError,
        shouldCreateCheckout,
        onRecheck: (id) => recheckMutation.mutate(id),
      })}
    </div>
  );
}

function AtendimentoContext({
  atendimento,
  error,
  isLoading,
  protectedError,
}: {
  atendimento?: AtendimentoPagamento;
  error: unknown;
  isLoading: boolean;
  protectedError: unknown;
}) {
  if (isLoading) {
    return <StateBox tone="loading" title="Carregando atendimento" description="Buscando o contexto do atendimento." />;
  }

  if (error && !protectedError) {
    return <FormAlert tone="error" title="Não foi possível carregar o atendimento" message={getApiErrorMessage(error)} />;
  }

  if (!atendimento) {
    return null;
  }

  const statusInfo = getStatusAtendimentoPagamentoInfo(atendimento.status);

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Atendimento #{atendimento.id}</h2>
        <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>
      <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Tipo" value={getTipoServicoPagamentoLabel(atendimento.tipoServico)} />
        <DetailItem label="Início previsto" value={formatDateTime(atendimento.inicioPrevistoEm)} />
        <DetailItem label="Valor do serviço" value={formatCurrency(atendimento.valorServico)} />
        <DetailItem label="Solicitação" value={`#${atendimento.solicitacaoId}`} />
      </dl>
    </section>
  );
}

function renderPaymentState({
  atendimento,
  checkoutPreview,
  isCreatingCheckout,
  isRechecking,
  onRecheck,
  pagamento,
  pagamentoError,
  pagamentoIsLoading,
  pagamentoNotFoundForAtendimento,
  protectedError,
  shouldCreateCheckout,
}: {
  atendimento?: AtendimentoPagamento;
  checkoutPreview: CheckoutPagamento | null;
  isCreatingCheckout: boolean;
  isRechecking: boolean;
  onRecheck: (pagamentoId: number) => void;
  pagamento?: Pagamento;
  pagamentoError: unknown;
  pagamentoIsLoading: boolean;
  pagamentoNotFoundForAtendimento: boolean;
  protectedError: unknown;
  shouldCreateCheckout: boolean;
}) {
  if (pagamentoIsLoading) {
    return <StateBox tone="loading" title="Carregando pagamento" description="Buscando o pagamento vinculado." />;
  }

  if (pagamento) {
    return <PagamentoDetail isRechecking={isRechecking} pagamento={pagamento} onRecheck={onRecheck} />;
  }

  if (isCreatingCheckout || shouldCreateCheckout) {
    return <StateBox tone="loading" title="Preparando checkout" description="Criando o pagamento pelo checkout principal do backend." />;
  }

  if (checkoutPreview) {
    return (
      <section className="rounded-lg border border-green-100 bg-green-50 p-5 shadow-sm">
        <h2 className="text-xl font-black text-green-900">Checkout criado</h2>
        <p className="mt-2 text-sm leading-6 text-green-800">{checkoutPreview.descricao}</p>
        <p className="mt-2 text-sm font-semibold text-green-900">{formatCurrency(checkoutPreview.valor)}</p>
        <a
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-green-700 px-4 text-sm font-black text-white transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          href={checkoutPreview.checkoutUrl}
          rel="noreferrer"
          target="_blank"
        >
          Abrir checkout
        </a>
      </section>
    );
  }

  if (pagamentoError && !protectedError && !pagamentoNotFoundForAtendimento) {
    return (
      <FormAlert
        tone="error"
        title="Não foi possível carregar o pagamento"
        message={getApiErrorMessage(pagamentoError)}
        details={pagamentoError instanceof ApiError ? pagamentoError.errors : []}
      />
    );
  }

  if (pagamentoNotFoundForAtendimento) {
    const canCreate = atendimento?.status === 'AGUARDANDO_PAGAMENTO';

    return (
      <FormAlert
        tone={canCreate ? 'info' : 'error'}
        title={canCreate ? 'Pagamento em preparação' : 'Pagamento não encontrado'}
        message={
          canCreate
            ? 'Nenhum pagamento foi encontrado; o checkout será criado automaticamente.'
            : 'Nenhum pagamento foi encontrado para este atendimento no estado atual.'
        }
      />
    );
  }

  return null;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold leading-6 text-slate-800">{value}</dd>
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
