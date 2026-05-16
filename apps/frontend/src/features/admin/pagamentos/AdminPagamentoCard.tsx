import { Link } from 'react-router-dom';

import {
  formatCurrency,
  formatDateTime,
  getGatewayPagamentoLabel,
  getMetodoPagamentoLabel,
  getWebhookLabel,
} from './pagamentoAdminLabels';
import { PagamentoAdminStatusBadge } from './PagamentoAdminStatusBadge';
import type { PagamentoAdmin } from './types';

export function AdminPagamentoCard({ pagamento }: { pagamento: PagamentoAdmin }) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Pagamento #{pagamento.id}</h2>
            <PagamentoAdminStatusBadge status={pagamento.status} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {pagamento.atendimentoId ? `Atendimento ID ${pagamento.atendimentoId}` : 'Sem atendimento vinculado'}
            {pagamento.solicitacaoId ? ` · Solicitacao ID ${pagamento.solicitacaoId}` : ''}
          </p>
        </div>

        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          to={`/app/admin/pagamentos/${pagamento.id}`}
        >
          Ver detalhes
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Gateway" value={getGatewayPagamentoLabel(pagamento.gateway)} />
        <DetailItem label="Metodo" value={getMetodoPagamentoLabel(pagamento.metodoPagamento)} />
        <DetailItem label="Valor bruto" value={formatCurrency(pagamento.valorBruto)} />
        <DetailItem label="Taxa gateway" value={formatCurrency(pagamento.valorTaxaGateway)} />
        <DetailItem label="Valor liquido" value={formatCurrency(pagamento.valorLiquidoRecebido)} />
        <DetailItem label="Recebido em" value={formatDateTime(pagamento.recebidoEm)} />
        <DetailItem label="Confirmacao automatica" value={getWebhookLabel(pagamento.webhookProcessado)} />
      </dl>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}
