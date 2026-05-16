import {
  formatCurrency,
  formatDateTime,
  getGatewayPagamentoLabel,
  getMetodoPagamentoLabel,
  getWebhookLabel,
} from './pagamentoAdminLabels';
import { PagamentoAdminStatusBadge } from './PagamentoAdminStatusBadge';
import type { PagamentoAdmin } from './types';

export function AdminPagamentoInfoPanel({ pagamento }: { pagamento: PagamentoAdmin }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Pagamento #{pagamento.id}</h2>
        <PagamentoAdminStatusBadge status={pagamento.status} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Atendimento" value={pagamento.atendimentoId ? `ID ${pagamento.atendimentoId}` : 'Nao vinculado'} />
        <DetailItem label="Solicitacao" value={pagamento.solicitacaoId ? `ID ${pagamento.solicitacaoId}` : 'Nao vinculada'} />
        <DetailItem label="Gateway" value={getGatewayPagamentoLabel(pagamento.gateway)} />
        <DetailItem label="ID gateway" value={pagamento.gatewayPaymentId} />
        <DetailItem label="Metodo" value={getMetodoPagamentoLabel(pagamento.metodoPagamento)} />
        <DetailItem label="Valor bruto" value={formatCurrency(pagamento.valorBruto)} />
        <DetailItem label="Taxa gateway" value={formatCurrency(pagamento.valorTaxaGateway)} />
        <DetailItem label="Valor liquido" value={formatCurrency(pagamento.valorLiquidoRecebido)} />
        <DetailItem label="Recebido em" value={formatDateTime(pagamento.recebidoEm)} />
        <DetailItem label="Confirmacao automatica" value={getWebhookLabel(pagamento.webhookProcessado)} />
      </dl>

      {(pagamento.urlPagamento || pagamento.pixCopiaECola) && (
        <div className="mt-6 grid gap-4">
          {pagamento.urlPagamento && <ReadOnlyBlock label="URL de pagamento" value={pagamento.urlPagamento} />}
          {pagamento.pixCopiaECola && <ReadOnlyBlock label="Pix copia e cola" value={pagamento.pixCopiaECola} multiline />}
        </div>
      )}
    </section>
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

function ReadOnlyBlock({ label, multiline = false, value }: { label: string; multiline?: boolean; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <h3 className="font-black text-slate-900">{label}</h3>
      {multiline ? (
        <textarea
          className="mt-3 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          readOnly
          value={value}
        />
      ) : (
        <p className="mt-2 break-all text-sm leading-6 text-slate-700">{value}</p>
      )}
    </div>
  );
}
