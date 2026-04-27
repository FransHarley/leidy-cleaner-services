import { getStatusPagamentoInfo } from './pagamentoLabels';
import type { StatusPagamento } from './types';

export function PagamentoStatusBadge({ status }: { status: StatusPagamento }) {
  const statusInfo = getStatusPagamentoInfo(status);

  return (
    <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
}
