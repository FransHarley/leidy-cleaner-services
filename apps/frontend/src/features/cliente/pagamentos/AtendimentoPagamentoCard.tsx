import { Link } from 'react-router-dom';

import { getAtendimentoRegiaoLabel } from '../../atendimentos/atendimentoDisplay';
import {
  formatCurrency,
  formatDateTime,
  getMetodoPagamentoLabel,
  getStatusAtendimentoPagamentoInfo,
  getTipoServicoPagamentoLabel,
} from './pagamentoLabels';
import { PagamentoStatusBadge } from './PagamentoStatusBadge';
import type { AtendimentoPagamento, MetodoPagamento, Pagamento } from './types';

type AtendimentoPagamentoCardProps = {
  atendimento: AtendimentoPagamento;
  isOpeningPayment?: boolean;
  isPagamentoLoading?: boolean;
  metodoPagamentoSelecionado: MetodoPagamento;
  onMetodoPagamentoChange?: (atendimentoId: number, metodoPagamento: MetodoPagamento) => void;
  onPay?: (atendimento: AtendimentoPagamento, pagamento: Pagamento | null, metodoPagamento: MetodoPagamento) => void;
  pagamento?: Pagamento | null;
};

export function AtendimentoPagamentoCard({
  atendimento,
  isOpeningPayment = false,
  isPagamentoLoading = false,
  metodoPagamentoSelecionado,
  onMetodoPagamentoChange,
  onPay,
  pagamento,
}: AtendimentoPagamentoCardProps) {
  const statusInfo = getStatusAtendimentoPagamentoInfo(atendimento.status);
  const pagamentoStatus = pagamento?.status ?? 'PENDENTE';
  const isPaid = pagamentoStatus === 'PAGO';
  const isPix = pagamento?.metodoPagamento === 'PIX';
  const isExistingPaymentBlocked =
    pagamentoStatus === 'CANCELADO' || pagamentoStatus === 'FALHOU' || pagamentoStatus === 'ESTORNADO';
  const canViewExistingPix =
    Boolean(pagamento) && isPix && !isPaid && !isExistingPaymentBlocked && atendimento.status !== 'CANCELADO';
  const canOpenExistingCardPayment =
    Boolean(pagamento?.urlPagamento) && !isPix && !isPaid && !isExistingPaymentBlocked && atendimento.status !== 'CANCELADO';
  const isCanceled = atendimento.status === 'CANCELADO';
  const hasExistingPayment = Boolean(pagamento);
  const isPayDisabled = isCanceled || isOpeningPayment || isPagamentoLoading;
  const metodoRegistrado = pagamento ? getMetodoPagamentoLabel(pagamento.metodoPagamento) : null;

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Atendimento #{atendimento.id}</h2>
            <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{getTipoServicoPagamentoLabel(atendimento.tipoServico)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Previsto para {formatDateTime(atendimento.inicioPrevistoEm)}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(atendimento.valorServico)}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {getAtendimentoRegiaoLabel(atendimento)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Status do pagamento</span>
            {isPagamentoLoading ? (
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-slate-600">
                Carregando
              </span>
            ) : (
              <PagamentoStatusBadge status={pagamentoStatus} />
            )}
          </div>
          {metodoRegistrado && (
            <p className="mt-2 text-sm font-semibold text-slate-700">Metodo escolhido: {metodoRegistrado}</p>
          )}
          {isCanceled && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700">
              Atendimento cancelado por falta de pagamento dentro do prazo.
            </p>
          )}
          {!hasExistingPayment && !isCanceled && !isPagamentoLoading && (
            <fieldset className="mt-4 grid gap-3">
              <legend className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Escolha o metodo</legend>
              <div className="grid gap-2 sm:max-w-md sm:grid-cols-2">
                <MetodoPagamentoOption
                  checked={metodoPagamentoSelecionado === 'PIX'}
                  description="Pagamento instantaneo pelo ambiente do Asaas."
                  groupName={`metodo-pagamento-${atendimento.id}`}
                  label="Pix"
                  value="PIX"
                  onChange={(metodoPagamento) => onMetodoPagamentoChange?.(atendimento.id, metodoPagamento)}
                />
                <MetodoPagamentoOption
                  checked={metodoPagamentoSelecionado === 'CARTAO_CREDITO'}
                  description="Checkout do Asaas para cartao de credito."
                  groupName={`metodo-pagamento-${atendimento.id}`}
                  label="Cartao de credito"
                  value="CARTAO_CREDITO"
                  onChange={(metodoPagamento) => onMetodoPagamentoChange?.(atendimento.id, metodoPagamento)}
                />
              </div>
            </fieldset>
          )}
          {isExistingPaymentBlocked && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-800">
              Esse pagamento esta {pagamentoStatus.toLowerCase().replace(/_/g, ' ')}. Nao criamos uma nova cobranca por aqui.
              Se precisar seguir, entre em contato com o suporte.
            </p>
          )}
        </div>

        {isPaid ? (
          <Link
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
            to={`/app/cliente/pagamentos/atendimento/${atendimento.id}`}
          >
            Ver pagamento
          </Link>
        ) : isCanceled ? (
          <Link
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
            to={`/app/cliente/pagamentos/atendimento/${atendimento.id}`}
          >
            Ver status
          </Link>
        ) : canViewExistingPix ? (
          <button
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
            disabled={isPayDisabled}
            type="button"
            onClick={() => onPay?.(atendimento, pagamento ?? null, metodoPagamentoSelecionado)}
          >
            {isOpeningPayment ? 'Abrindo...' : 'Ver QR Code Pix'}
          </button>
        ) : canOpenExistingCardPayment ? (
          <button
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
            disabled={isPayDisabled}
            type="button"
            onClick={() => onPay?.(atendimento, pagamento ?? null, metodoPagamentoSelecionado)}
          >
            {isOpeningPayment ? 'Abrindo...' : 'Abrir pagamento'}
          </button>
        ) : hasExistingPayment ? (
          <Link
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
            to={`/app/cliente/pagamentos/atendimento/${atendimento.id}`}
          >
            Ver status
          </Link>
        ) : (
          <button
            className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
            disabled={isPayDisabled}
            type="button"
            onClick={() => onPay?.(atendimento, pagamento ?? null, metodoPagamentoSelecionado)}
          >
            {isOpeningPayment ? 'Abrindo...' : 'Continuar para pagamento'}
          </button>
        )}
      </div>
    </article>
  );
}

type MetodoPagamentoOptionProps = {
  checked: boolean;
  description: string;
  groupName: string;
  label: string;
  value: MetodoPagamento;
  onChange: (metodoPagamento: MetodoPagamento) => void;
};

function MetodoPagamentoOption({
  checked,
  description,
  groupName,
  label,
  value,
  onChange,
}: MetodoPagamentoOptionProps) {
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
