import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { CreditosSolicitacaoList } from '../../features/cliente/creditos/CreditosSolicitacaoList';
import { listarMeusCreditosSolicitacao, usarCreditoEmSolicitacao } from '../../features/cliente/creditos/creditosSolicitacaoApi';
import { PagamentoDetail } from '../../features/cliente/pagamentos/PagamentoDetail';
import {
  buscarPagamentoPorSolicitacao,
  buscarPagamentoPorSolicitacaoOuNull,
  buscarPixQrCodePagamento,
  consultarStatusPagamento,
  criarPagamentoSolicitacao,
  redirecionarParaPagamentoAsaas,
} from '../../features/cliente/pagamentos/pagamentosApi';
import { formatCurrency, getMetodoPagamentoLabel } from '../../features/cliente/pagamentos/pagamentoLabels';
import type { CriarPagamentoSolicitacaoRequest, MetodoPagamento, StatusPagamento } from '../../features/cliente/pagamentos/types';
import { getStatusSolicitacaoInfo, getTipoServicoLabel } from '../../features/cliente/solicitacoes/solicitacaoLabels';
import { buscarSolicitacao } from '../../features/cliente/solicitacoes/solicitacaoApi';
import type { SolicitacaoFaxina } from '../../features/cliente/solicitacoes/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  solicitacoes: ['cliente', 'solicitacoes'],
  solicitacaoDetalhe: (id: number) => ['cliente', 'solicitacoes', id],
  pagamentoPorSolicitacao: (id: number) => ['cliente', 'pagamentos', 'solicitacao', id],
  pixQrCode: (id: number) => ['cliente', 'pagamentos', 'pix-qrcode', id],
  creditosDisponiveis: ['cliente', 'creditos-solicitacao', 'meus', 'DISPONIVEL'],
};

type Feedback = {
  tone: 'error' | 'info' | 'success';
  title?: string;
  message: string;
  details?: string[];
};

type MetodoPagamentoSolicitacao = Exclude<MetodoPagamento, 'CREDITO_SOLICITACAO'>;

export function ClientePagamentoSolicitacaoPage() {
  const { solicitacaoId } = useParams();
  const parsedSolicitacaoId = Number(solicitacaoId);
  const validSolicitacaoId = Number.isFinite(parsedSolicitacaoId) && parsedSolicitacaoId > 0;
  const { token, logout, status } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPagamentoSolicitacao>('PIX');
  const [usingCreditoId, setUsingCreditoId] = useState<number | null>(null);
  const previousPagamentoStatusRef = useRef<StatusPagamento | null>(null);
  const autoRefreshKeyRef = useRef<string | null>(null);
  const paymentActionSectionRef = useRef<HTMLDivElement | null>(null);
  const retorno = searchParams.get('retorno');
  const pagamentoIdFromReturn = parsePositiveId(searchParams.get('pagamentoId'));
  const sessionReady = status === 'authenticated' && Boolean(token);

  const solicitacaoQuery = useQuery({
    queryKey: validSolicitacaoId ? queryKeys.solicitacaoDetalhe(parsedSolicitacaoId) : ['cliente', 'solicitacoes', 'invalid'],
    queryFn: () => buscarSolicitacao(requireToken(token), parsedSolicitacaoId),
    enabled: Boolean(sessionReady && validSolicitacaoId),
    retry: false,
  });

  const pagamentoQuery = useQuery({
    queryKey: validSolicitacaoId ? queryKeys.pagamentoPorSolicitacao(parsedSolicitacaoId) : ['cliente', 'pagamentos', 'solicitacao', 'invalid'],
    queryFn: () => buscarPagamentoPorSolicitacaoOuNull(requireToken(token), parsedSolicitacaoId),
    enabled: Boolean(sessionReady && validSolicitacaoId),
    refetchInterval: (query) => (isPendingPaymentStatus(query.state.data?.status) ? 5000 : false),
    refetchOnWindowFocus: true,
    retry: false,
  });

  const creditosQuery = useQuery({
    queryKey: queryKeys.creditosDisponiveis,
    queryFn: () => listarMeusCreditosSolicitacao(requireToken(token), 'DISPONIVEL'),
    enabled: Boolean(sessionReady && validSolicitacaoId),
    retry: false,
  });

  const pagamento = pagamentoQuery.data ?? null;
  const shouldLoadPixQrCode = Boolean(pagamento && pagamento.metodoPagamento === 'PIX' && isPendingPaymentStatus(pagamento.status));
  const pixQrCodeQuery = useQuery({
    queryKey: pagamento ? queryKeys.pixQrCode(pagamento.id) : ['cliente', 'pagamentos', 'pix-qrcode', 'invalid'],
    queryFn: () => buscarPixQrCodePagamento(requireToken(token), pagamento!.id),
    enabled: Boolean(sessionReady && shouldLoadPixQrCode),
    retry: false,
  });

  const protectedError = useMemo(
    () =>
      [solicitacaoQuery.error, pagamentoQuery.error, creditosQuery.error, pixQrCodeQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [creditosQuery.error, pagamentoQuery.error, pixQrCodeQuery.error, solicitacaoQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  useEffect(() => {
    if (retorno === 'cancelado') {
      setFeedback({
        tone: 'info',
        title: 'Pagamento cancelado',
        message: 'Pagamento cancelado. Voce pode tentar novamente.',
      });
      return;
    }

    if (retorno === 'expirado') {
      setFeedback({
        tone: 'info',
        title: 'Prazo expirado',
        message: 'O prazo do pagamento expirou. Gere uma nova tentativa se ainda desejar continuar.',
      });
    }
  }, [retorno]);

  useEffect(() => {
    const currentStatus = pagamento?.status ?? null;
    const previousStatus = previousPagamentoStatusRef.current;

    previousPagamentoStatusRef.current = currentStatus;

    if (!currentStatus || !previousStatus || currentStatus === previousStatus) {
      return;
    }

    if (currentStatus === 'PAGO') {
      setFeedback({
        tone: 'success',
        message: 'Pagamento confirmado. Agora aguardamos o aceite da profissional.',
      });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacaoDetalhe(parsedSolicitacaoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacoes }),
      ]);
    }
  }, [pagamento?.status, parsedSolicitacaoId, queryClient]);

  const criarPagamentoMutation = useMutation({
    mutationFn: (payload: CriarPagamentoSolicitacaoRequest) => criarPagamentoSolicitacao(requireToken(token), payload),
    onMutate: () => {
      setFeedback(null);
    },
    onSuccess: async (novoPagamento) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pagamentoPorSolicitacao(parsedSolicitacaoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacaoDetalhe(parsedSolicitacaoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacoes }),
      ]);

      if (novoPagamento.metodoPagamento === 'PIX') {
        setFeedback({
          tone: 'info',
          message: 'Pagamento Pix criado. Use o QR Code abaixo e aguarde a confirmacao do backend.',
        });
        return;
      }

      if (novoPagamento.urlPagamento) {
        redirecionarParaPagamentoAsaas(novoPagamento.urlPagamento);
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Nao foi possivel abrir o pagamento',
        message: 'A URL de pagamento nao foi retornada pelo gateway.',
      });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      if (error instanceof ApiError && error.code === 'PAGAMENTO_JA_EXISTE') {
        await queryClient.invalidateQueries({ queryKey: queryKeys.pagamentoPorSolicitacao(parsedSolicitacaoId) });
      }

      requestAnimationFrame(() => {
        paymentActionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      setFeedback({
        tone: 'error',
        title: 'Nao foi possivel iniciar o pagamento',
        message: getPaymentCreationErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const consultarStatusMutation = useMutation({
    mutationFn: async ({ pagamentoId }: { pagamentoId: number | null }) => {
      const activeToken = requireToken(token);
      const resolvedPagamentoId = pagamentoId ?? (await buscarPagamentoPorSolicitacao(activeToken, parsedSolicitacaoId)).id;
      const pagamentoAtualizado = await consultarStatusPagamento(activeToken, resolvedPagamentoId);

      await invalidateSolicitacaoPagamentoQueries(queryClient, parsedSolicitacaoId);
      await Promise.all([pagamentoQuery.refetch(), solicitacaoQuery.refetch()]);

      return pagamentoAtualizado;
    },
    onMutate: () => {
      setFeedback(null);
    },
    onSuccess: (pagamentoAtualizado) => {
      if (pagamentoAtualizado.status === 'PAGO') {
        navigate('/app/cliente/solicitacoes', {
          replace: true,
          state: {
            feedback: {
              tone: 'success',
              title: 'Pagamento confirmado',
              message: 'Pagamento confirmado. Agora aguardamos o aceite da profissional.',
            },
            selectedSolicitacaoId: parsedSolicitacaoId,
          },
        });
        return;
      }

      setFeedback({
        tone: 'info',
        title: 'Confirmacao em andamento',
        message: 'Pagamento recebido no Asaas. Estamos aguardando a confirmacao no sistema. Voce pode atualizar o status em instantes.',
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Nao foi possivel atualizar o pagamento',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const usarCreditoMutation = useMutation({
    mutationFn: ({ creditoId }: { creditoId: number }) => usarCreditoEmSolicitacao(requireToken(token), creditoId, parsedSolicitacaoId),
    onMutate: ({ creditoId }) => {
      setUsingCreditoId(creditoId);
      setFeedback(null);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacaoDetalhe(parsedSolicitacaoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.solicitacoes }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pagamentoPorSolicitacao(parsedSolicitacaoId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.creditosDisponiveis }),
        queryClient.invalidateQueries({ queryKey: ['cliente', 'pagamentos'] }),
      ]);
      setFeedback({
        tone: 'success',
        message: 'Solicitacao de reposicao usada. Agora aguardamos o aceite da profissional.',
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Nao foi possivel usar a solicitacao de reposicao',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
    onSettled: () => {
      setUsingCreditoId(null);
    },
  });

  useEffect(() => {
    if (retorno !== 'sucesso' || !sessionReady || !validSolicitacaoId || consultarStatusMutation.isPending) {
      return;
    }

    const refreshKey = `${parsedSolicitacaoId}:${pagamentoIdFromReturn ?? 'solicitacao'}`;
    if (autoRefreshKeyRef.current === refreshKey) {
      return;
    }

    autoRefreshKeyRef.current = refreshKey;
    consultarStatusMutation.mutate({ pagamentoId: pagamentoIdFromReturn });
  }, [consultarStatusMutation, pagamentoIdFromReturn, parsedSolicitacaoId, retorno, sessionReady, validSolicitacaoId]);

  if (!validSolicitacaoId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Solicitacao invalida" message="A solicitacao informada nao e valida." />
        <BackToSolicitacoesLink />
      </div>
    );
  }

  const solicitacao = solicitacaoQuery.data ?? null;
  const creditos = creditosQuery.data ?? [];
  const pagamentoNotFound = pagamentoQuery.isSuccess && pagamento === null;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Pagamento da solicitacao</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Quite a solicitacao #{parsedSolicitacaoId} por Pix, cartao de credito ou solicitacao de reposicao equivalente.
              A confirmacao final continua sendo controlada pelo backend.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/cliente/solicitacoes"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {retorno === 'sucesso' && consultarStatusMutation.isPending && (
        <StateBox tone="loading" title="Confirmando pagamento..." description="Consultando o status atualizado no backend." />
      )}

      <SolicitacaoPagamentoContextSection error={solicitacaoQuery.error} isLoading={solicitacaoQuery.isLoading} solicitacao={solicitacao} />

      {solicitacao?.status === 'PAGA_AGUARDANDO_ACEITE' && (
        <FormAlert
          tone="info"
          title="Aguardando aceite da profissional"
          message="O pagamento desta solicitacao ja foi concluido. Agora aguardamos o aceite da profissional selecionada."
        />
      )}

      {solicitacao?.status === 'NAO_ACEITA_CREDITO_GERADO' && (
        <FormAlert
          tone="info"
          title="Reposicao disponivel"
          message="Esta solicitacao nao seguiu para atendimento e gerou uma solicitacao de reposicao equivalente para futuras tentativas."
        />
      )}

      {pagamentoQuery.isLoading && (
        <StateBox tone="loading" title="Carregando pagamento" description="Buscando o pagamento vinculado a esta solicitacao." />
      )}

      {pagamento && (
        <PagamentoDetail
          backHref="/app/cliente/solicitacoes"
          backLabel="Voltar para solicitacoes"
          isPixQrCodeLoading={pixQrCodeQuery.isLoading}
          isRefreshingStatus={pagamentoQuery.isRefetching || consultarStatusMutation.isPending}
          onRefreshStatus={
            pagamento.gateway === 'ASAAS' && isPendingPaymentStatus(pagamento.status)
              ? () => consultarStatusMutation.mutate({ pagamentoId: pagamento.id })
              : null
          }
          pagamento={pagamento}
          pixQrCode={pixQrCodeQuery.data ?? null}
          pixQrCodeErrorMessage={pixQrCodeQuery.isError ? getApiErrorMessage(pixQrCodeQuery.error) : null}
        />
      )}

      {pagamentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar o pagamento"
          message={getApiErrorMessage(pagamentoQuery.error)}
          details={pagamentoQuery.error instanceof ApiError ? pagamentoQuery.error.errors : []}
        />
      )}

      {pagamentoNotFound && solicitacao?.status === 'AGUARDANDO_PAGAMENTO' && (
        <section className="grid gap-5">
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="grid gap-3">
              <h2 className="text-2xl font-black text-slate-900">Escolha como quitar esta solicitacao</h2>
              <p className="text-sm leading-6 text-slate-600">
                Voce pode seguir com Pix ou cartao de credito. Se a profissional nao aceitar, voce recebe uma solicitacao de reposicao equivalente.
              </p>
            </div>

            {criarPagamentoMutation.isError && feedback?.tone === 'error' && (
              <div className="mt-5">
                <FormAlert tone="error" title={feedback.title} message={feedback.message} details={feedback.details} />
              </div>
            )}

            <fieldset className="mt-5 grid gap-3">
              <legend className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Pagamento normal</legend>
              <div className="grid gap-2 sm:max-w-2xl sm:grid-cols-2">
                <MetodoPagamentoOption
                  checked={selectedMetodo === 'PIX'}
                  description="Pagamento instantaneo com QR Code e validacao final pelo backend."
                  groupName="metodo-pagamento-solicitacao"
                  label="Pix"
                  value="PIX"
                  onChange={setSelectedMetodo}
                />
                <MetodoPagamentoOption
                  checked={selectedMetodo === 'CARTAO_CREDITO'}
                  description="Pagamento no ambiente do Asaas para cartao de credito."
                  groupName="metodo-pagamento-solicitacao"
                  label="Cartao de credito"
                  value="CARTAO_CREDITO"
                  onChange={setSelectedMetodo}
                />
              </div>
            </fieldset>

            <div ref={paymentActionSectionRef} className="mt-5 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                disabled={criarPagamentoMutation.isPending}
                type="button"
                onClick={() =>
                  criarPagamentoMutation.mutate({
                    solicitacaoId: parsedSolicitacaoId,
                    metodoPagamento: selectedMetodo,
                  })
                }
              >
                {criarPagamentoMutation.isPending ? 'Preparando pagamento...' : `Continuar com ${getMetodoPagamentoLabel(selectedMetodo)}`}
              </button>
              <span className="text-sm leading-6 text-slate-500">
                A confirmacao final do pagamento continua sendo feita pelo backend.
              </span>
            </div>
          </section>

          <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm md:p-6">
            <div className="grid gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Solicitacao de reposicao</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Use um credito equivalente</h2>
              </div>
              <p className="text-sm leading-6 text-slate-700">
                Escolha uma solicitacao de reposicao disponivel para tentar novamente um servico equivalente, sem divisao ou uso parcial.
              </p>
            </div>

            {creditosQuery.isLoading && (
              <div className="mt-5">
                <StateBox tone="loading" title="Carregando solicitacoes de reposicao" description="Buscando seus creditos disponiveis." />
              </div>
            )}

            {creditosQuery.isError && !protectedError && (
              <div className="mt-5">
                <FormAlert
                  tone="error"
                  title="Nao foi possivel carregar as solicitacoes de reposicao"
                  message={getApiErrorMessage(creditosQuery.error)}
                  details={creditosQuery.error instanceof ApiError ? creditosQuery.error.errors : []}
                />
              </div>
            )}

            {creditosQuery.isSuccess && (
              <div className="mt-5">
                <CreditosSolicitacaoList
                  creditos={creditos}
                  isSubmittingCreditoId={usingCreditoId}
                  onUse={(credito) => {
                    if (!solicitacao) {
                      return;
                    }

                    const confirmed = window.confirm(
                      `Usar a solicitacao de reposicao #${credito.id} na solicitacao #${solicitacao.id}? A validacao final sera feita pelo sistema.`,
                    );

                    if (confirmed) {
                      usarCreditoMutation.mutate({ creditoId: credito.id });
                    }
                  }}
                  solicitacaoAlvo={solicitacao}
                />
              </div>
            )}
          </section>
        </section>
      )}

      {pagamentoNotFound && solicitacao && solicitacao.status !== 'AGUARDANDO_PAGAMENTO' && (
        <FormAlert
          tone="info"
          title="Pagamento indisponivel nesta etapa"
          message="Esta solicitacao nao esta mais aguardando pagamento. Consulte o status atual para seguir o fluxo correto."
        />
      )}

      {(retorno === 'cancelado' || retorno === 'expirado') && (
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to="/app/cliente/solicitacoes"
          >
            Voltar para solicitacoes
          </Link>
        </div>
      )}
    </div>
  );
}

function SolicitacaoPagamentoContextSection({
  error,
  isLoading,
  solicitacao,
}: {
  error: unknown;
  isLoading: boolean;
  solicitacao: SolicitacaoFaxina | null;
}) {
  if (isLoading) {
    return <StateBox tone="loading" title="Carregando solicitacao" description="Buscando os dados da solicitacao." />;
  }

  if (error) {
    return (
      <FormAlert
        tone="error"
        title="Nao foi possivel carregar a solicitacao"
        message={getApiErrorMessage(error)}
        details={error instanceof ApiError ? error.errors : []}
      />
    );
  }

  if (!solicitacao) {
    return null;
  }

  const statusInfo = getStatusSolicitacaoInfo(solicitacao.status);

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Solicitacao #{solicitacao.id}</h2>
        <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Tipo" value={getTipoServicoLabel(solicitacao.tipoServico)} />
        <DetailItem label="Duracao estimada" value={`${solicitacao.duracaoEstimadaHoras} horas`} />
        <DetailItem label="Regiao" value={solicitacao.regiaoNome ?? `Regiao #${solicitacao.regiaoId}`} />
        <DetailItem label="Valor da solicitacao" value={formatCurrency(solicitacao.valorServico)} />
      </dl>

      <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
        Se a profissional nao aceitar, o sistema podera liberar uma solicitacao de reposicao equivalente para uma nova tentativa.
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}

function MetodoPagamentoOption({
  checked,
  description,
  groupName,
  label,
  value,
  onChange,
}: {
  checked: boolean;
  description: string;
  groupName: string;
  label: string;
  value: MetodoPagamentoSolicitacao;
  onChange: (metodoPagamento: MetodoPagamentoSolicitacao) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition ${
        checked ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200'
      }`}
    >
      <input
        checked={checked}
        className="mt-1 h-4 w-4 border-slate-300 text-cyan-700 focus:ring-cyan-700"
        name={groupName}
        type="radio"
        value={value}
        onChange={() => onChange(value)}
      />
      <span className="min-w-0">
        <span className="block font-black">{label}</span>
        <span className="mt-1 block leading-5 text-slate-600">{description}</span>
      </span>
    </label>
  );
}

function BackToSolicitacoesLink() {
  return (
    <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/cliente/solicitacoes">
      Voltar para solicitacoes
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

function parsePositiveId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getPaymentCreationErrorMessage(error: unknown) {
  const fallbackMessage = 'Nao foi possivel iniciar o pagamento. Verifique a configuracao do Asaas ou tente novamente.';

  if (error instanceof ApiError) {
    return error.message?.trim() ? error.message : fallbackMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

async function invalidateSolicitacaoPagamentoQueries(queryClient: ReturnType<typeof useQueryClient>, solicitacaoId: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['cliente', 'pagamentos'] }),
    queryClient.invalidateQueries({ queryKey: ['cliente', 'pagamentos', 'atendimentos'] }),
    queryClient.invalidateQueries({ queryKey: ['cliente', 'pagamentos', 'solicitacao', solicitacaoId] }),
    queryClient.invalidateQueries({ queryKey: ['cliente', 'solicitacoes'] }),
    queryClient.invalidateQueries({ queryKey: ['cliente', 'solicitacoes', solicitacaoId] }),
  ]);
}
