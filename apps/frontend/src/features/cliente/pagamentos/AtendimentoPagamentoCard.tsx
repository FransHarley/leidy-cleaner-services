import { Link } from 'react-router-dom';

import { getAtendimentoRegiaoLabel } from '../../atendimentos/atendimentoDisplay';
import {
  formatCurrency,
  formatDateTime,
  getStatusAtendimentoPagamentoInfo,
  getTipoServicoPagamentoLabel,
} from './pagamentoLabels';
import { PagamentoStatusBadge } from './PagamentoStatusBadge';
import type { AtendimentoPagamento, Pagamento } from './types';

type AtendimentoPagamentoCardProps = {
  atendimento: AtendimentoPagamento;
  isOpeningPayment?: boolean;
  isPagamentoLoading?: boolean;
  onPay?: (atendimento: AtendimentoPagamento, pagamento: Pagamento | null) => void;
  pagamento?: Pagamento | null;
};

export function AtendimentoPagamentoCard({
  atendimento,
  isOpeningPayment = false,
  isPagamentoLoading = false,
  onPay,
  pagamento,
}: AtendimentoPagamentoCardProps) {
  const statusInfo = getStatusAtendimentoPagamentoInfo(atendimento.status);
  const pagamentoStatus = pagamento?.status ?? 'PENDENTE';
  const isPaid = pagamentoStatus === 'PAGO';
  const isCanceled = atendimento.status === 'CANCELADO';
  const isPayDisabled = isCanceled || isOpeningPayment || isPagamentoLoading;

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
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
          {isCanceled && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700">
              Atendimento cancelado por falta de pagamento dentro do prazo.
            </p>
          )}
        </div>

        {isPaid ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to={`/app/cliente/pagamentos/atendimento/${atendimento.id}`}
          >
            Ver pagamento
          </Link>
        ) : isCanceled ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to={`/app/cliente/pagamentos/atendimento/${atendimento.id}`}
          >
            Ver status
          </Link>
        ) : (
          <button
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            disabled={isPayDisabled}
            type="button"
            onClick={() => onPay?.(atendimento, pagamento ?? null)}
          >
            {isOpeningPayment ? 'Abrindo...' : 'Pagar'}
          </button>
        )}
      </div>
    </article>
  );
}
