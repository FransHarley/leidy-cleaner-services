import { Link } from 'react-router-dom';

import {
  formatCurrency,
  formatDateTime,
  getMetodoPagamentoLabel,
  getStatusPagamentoDescription,
} from './pagamentoLabels';
import { PagamentoStatusBadge } from './PagamentoStatusBadge';
import type { Pagamento } from './types';

type PagamentoDetailProps = {
  pagamento: Pagamento;
};

export function PagamentoDetail({ pagamento }: PagamentoDetailProps) {
  const isPaid = pagamento.status === 'PAGO';
  const isWaitingWebhook = pagamento.status === 'PENDENTE' || pagamento.status === 'AGUARDANDO_CONFIRMACAO';
  const requiresSupport = pagamento.status === 'CANCELADO' || pagamento.status === 'FALHOU' || pagamento.status === 'ESTORNADO';

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">Pagamento #{pagamento.id}</h2>
            <PagamentoStatusBadge status={pagamento.status} />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            {isWaitingWebhook ? 'Aguardando confirmacao do pagamento pelo webhook.' : getStatusPagamentoDescription(pagamento.status)}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <div>
          <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Atendimento relacionado</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold leading-6 text-slate-800">
            #{pagamento.atendimentoId}
            <Link className="text-sm font-black text-cyan-700 hover:text-cyan-800" to={`/app/cliente/atendimentos/${pagamento.atendimentoId}`}>
              Ver atendimento
            </Link>
          </dd>
        </div>
        <DetailItem label="Metodo" value={getMetodoPagamentoLabel(pagamento.metodoPagamento)} />
        <DetailItem label="Valor" value={formatCurrency(pagamento.valorBruto)} />
        <DetailItem label="Criado em" value={formatDateTime(pagamento.criadoEm)} />
        <DetailItem label="Recebido em" value={formatDateTime(pagamento.recebidoEm)} />
      </dl>

      <div className="mt-6 grid gap-4">
        {isPaid && (
          <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm font-semibold leading-6 text-green-800">
            Pagamento confirmado pelo backend.
          </div>
        )}

        {isWaitingWebhook && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            Aguardando confirmacao do pagamento pelo webhook.
          </div>
        )}

        {requiresSupport && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            Esse pagamento nao pode ser recriado por aqui. Se voce ainda precisar concluir essa etapa, entre em contato com o suporte.
          </div>
        )}

        {pagamento.urlPagamento && isWaitingWebhook && (
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
            <h3 className="font-black text-cyan-900">Link de pagamento</h3>
            <p className="mt-2 break-all text-sm leading-6 text-cyan-800">{pagamento.urlPagamento}</p>
            <a
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              href={pagamento.urlPagamento}
            >
              Abrir pagamento novamente
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to="/app/cliente/pagamentos"
          >
            Voltar para pagamentos
          </Link>
        </div>
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
