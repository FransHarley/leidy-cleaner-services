import { Link } from 'react-router-dom';

import {
  formatCurrency,
  formatDateTime,
  getStatusAtendimentoPagamentoInfo,
  getTipoServicoPagamentoLabel,
} from './pagamentoLabels';
import type { AtendimentoPagamento } from './types';

export function AtendimentoPagamentoCard({ atendimento }: { atendimento: AtendimentoPagamento }) {
  const statusInfo = getStatusAtendimentoPagamentoInfo(atendimento.status);
  const isPendingPayment = atendimento.status === 'AGUARDANDO_PAGAMENTO';

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-green-100">
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
        </div>

        <Link
          className={[
            'inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700',
            isPendingPayment
              ? 'bg-green-700 text-white hover:bg-green-800'
              : 'border border-slate-200 text-slate-700 hover:bg-slate-50',
          ].join(' ')}
          to={`/app/cliente/pagamentos/atendimento/${atendimento.id}`}
        >
          {isPendingPayment ? 'Abrir checkout' : 'Ver pagamento'}
        </Link>
      </div>
    </article>
  );
}
