import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { AtendimentoPagamentoCard } from '../../features/cliente/pagamentos/AtendimentoPagamentoCard';
import {
  buscarPagamentoPorAtendimento,
  buscarPagamentoPorAtendimentoOuNull,
  criarCheckoutPagamento,
  listarMeusAtendimentosParaPagamento,
  redirecionarParaPagamentoAsaas,
} from '../../features/cliente/pagamentos/pagamentosApi';
import type {
  AtendimentoPagamento,
  CheckoutPagamento,
  MetodoPagamento,
  Pagamento,
} from '../../features/cliente/pagamentos/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  atendimentos: ['cliente', 'pagamentos', 'atendimentos'],
  pagamentoPorAtendimento: (id: number) => ['cliente', 'pagamentos', 'atendimento', id, 'pagamento'],
};

export function ClientePagamentosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ title: string; message: string; details?: string[] } | null>(null);
  const [openingAtendimentoId, setOpeningAtendimentoId] = useState<number | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<Record<number, MetodoPagamento>>({});

  const atendimentosQuery = useQuery({
    queryKey: queryKeys.atendimentos,
    queryFn: () => listarMeusAtendimentosParaPagamento(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () => (atendimentosQuery.error instanceof ApiError && atendimentosQuery.error.status === 401 ? atendimentosQuery.error : null),
    [atendimentosQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const atendimentos = atendimentosQuery.data ?? [];
  const pagamentosQueries = useQueries({
    queries: atendimentos.map((atendimento) => ({
      queryKey: queryKeys.pagamentoPorAtendimento(atendimento.id),
      queryFn: () => buscarPagamentoPorAtendimentoOuNull(requireToken(token), atendimento.id),
      enabled: Boolean(token && atendimentosQuery.isSuccess),
      retry: false,
    })),
  });
  const pagamentoProtectedError = pagamentosQueries.find(
    (query) => query.error instanceof ApiError && query.error.status === 401,
  )?.error;
  const pagamentoStatusError = pagamentosQueries.find(
    (query) => query.isError && !(query.error instanceof ApiError && query.error.status === 401),
  )?.error;

  useEffect(() => {
    if (pagamentoProtectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, pagamentoProtectedError]);

  const checkoutMutation = useMutation({
    mutationFn: ({ atendimentoId, metodoPagamento }: { atendimentoId: number; metodoPagamento: MetodoPagamento }) =>
      criarCheckoutPagamento(requireToken(token), { atendimentoId, metodoPagamento }),
  });

  function getSelectedMethod(atendimentoId: number) {
    return selectedMethods[atendimentoId] ?? 'PIX';
  }

  function handleMetodoPagamentoChange(atendimentoId: number, metodoPagamento: MetodoPagamento) {
    setSelectedMethods((current) => ({
      ...current,
      [atendimentoId]: metodoPagamento,
    }));
  }

  async function handlePay(
    atendimento: AtendimentoPagamento,
    pagamento: Pagamento | null,
    metodoPagamento: MetodoPagamento,
  ) {
    setFeedback(null);
    setOpeningAtendimentoId(atendimento.id);

    try {
      if (pagamento && pagamento.status !== 'PAGO') {
        if (pagamento.metodoPagamento === 'PIX') {
          navigate(`/app/cliente/pagamentos/atendimento/${atendimento.id}`);
          return;
        }

        if (pagamento.urlPagamento) {
          redirecionarParaPagamentoAsaas(pagamento.urlPagamento);
          return;
        }
      }

      const checkout = await checkoutMutation.mutateAsync({
        atendimentoId: atendimento.id,
        metodoPagamento,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pagamentoPorAtendimento(atendimento.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.atendimentos }),
      ]);

      if (checkout.metodoPagamento === 'PIX') {
        navigate(`/app/cliente/pagamentos/atendimento/${atendimento.id}`);
        return;
      }
      const paymentUrl = getCheckoutPaymentUrl(checkout);
      if (!paymentUrl) {
        throw new ApiError({
          status: 502,
          code: 'ASAAS_PAYMENT_URL_NOT_RETURNED',
          message: 'Nao foi possivel abrir o link de pagamento agora.',
        });
      }

      redirecionarParaPagamentoAsaas(paymentUrl);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      if (error instanceof ApiError && error.code === 'PAGAMENTO_JA_EXISTE') {
        const pagamentoExistente = await buscarPagamentoExistente(token, atendimento.id);
        if (pagamentoExistente?.metodoPagamento === 'PIX') {
          navigate(`/app/cliente/pagamentos/atendimento/${atendimento.id}`);
          return;
        }
        if (pagamentoExistente?.urlPagamento) {
          redirecionarParaPagamentoAsaas(pagamentoExistente.urlPagamento);
          return;
        }
      }

      setFeedback({
        title: 'Nao foi possivel abrir o pagamento',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    } finally {
      setOpeningAtendimentoId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Pagamentos dos atendimentos</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Acompanhe os pagamentos vinculados aos seus atendimentos e veja quando cada cobranca for confirmada.
        </p>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Atendimentos para pagamento</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Escolha Pix ou cartao de credito antes de abrir a cobranca no Asaas.</p>
        </div>

        {feedback && <FormAlert tone="error" title={feedback.title} message={feedback.message} details={feedback.details} />}

        {atendimentosQuery.isLoading && <StateBox tone="loading" title="Carregando atendimentos" description="Buscando seus atendimentos." />}

        {atendimentosQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Nao foi possivel carregar pagamentos"
            message={getApiErrorMessage(atendimentosQuery.error)}
            details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
          />
        )}

        {pagamentoStatusError && (
          <FormAlert
            tone="error"
            title="Nao foi possivel carregar alguns pagamentos"
            message={getApiErrorMessage(pagamentoStatusError)}
            details={pagamentoStatusError instanceof ApiError ? pagamentoStatusError.errors : []}
          />
        )}

        {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
          <StateBox
            tone="empty"
            title="Nenhum atendimento encontrado"
            description="Quando uma profissional aceitar sua solicitacao e o atendimento for criado, o pagamento aparecera aqui."
          />
        )}

        {atendimentos.length > 0 && (
          <div className="grid gap-4">
            {atendimentos.map((atendimento, index) => {
              const pagamentoQuery = pagamentosQueries[index];

              return (
                <AtendimentoPagamentoCard
                  key={atendimento.id}
                  atendimento={atendimento}
                  isOpeningPayment={openingAtendimentoId === atendimento.id}
                  isPagamentoLoading={Boolean(pagamentoQuery?.isLoading)}
                  metodoPagamentoSelecionado={getSelectedMethod(atendimento.id)}
                  onMetodoPagamentoChange={handleMetodoPagamentoChange}
                  onPay={handlePay}
                  pagamento={pagamentoQuery?.data ?? null}
                />
              );
            })}
          </div>
        )}

        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/cliente/solicitacoes">
          Voltar para solicitacoes
        </Link>
      </section>
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

function getCheckoutPaymentUrl(checkout: CheckoutPagamento) {
  return checkout.paymentUrl || checkout.checkoutUrl || null;
}

async function buscarPagamentoExistente(token: string | null, atendimentoId: number) {
  try {
    return await buscarPagamentoPorAtendimento(requireToken(token), atendimentoId);
  } catch {
    return null;
  }
}
