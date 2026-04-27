import { useState } from 'react';

import {
  canRecheckPagamento,
  formatCurrency,
  formatDateTime,
  getMetodoPagamentoLabel,
  getStatusPagamentoDescription,
} from './pagamentoLabels';
import { PagamentoStatusBadge } from './PagamentoStatusBadge';
import type { Pagamento } from './types';

type PagamentoDetailProps = {
  isRechecking: boolean;
  pagamento: Pagamento;
  onRecheck: (pagamentoId: number) => void;
};

export function PagamentoDetail({ isRechecking, onRecheck, pagamento }: PagamentoDetailProps) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900">Pagamento #{pagamento.id}</h2>
            <PagamentoStatusBadge status={pagamento.status} />
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{getStatusPagamentoDescription(pagamento.status)}</p>
        </div>

        {canRecheckPagamento(pagamento.status) && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isRechecking}
            type="button"
            onClick={() => onRecheck(pagamento.id)}
          >
            {isRechecking ? 'Atualizando...' : 'Atualizar status'}
          </button>
        )}
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Atendimento" value={`#${pagamento.atendimentoId}`} />
        <DetailItem label="Gateway" value={pagamento.gateway} />
        <DetailItem label="Método" value={getMetodoPagamentoLabel(pagamento.metodoPagamento)} />
        <DetailItem label="Valor bruto" value={formatCurrency(pagamento.valorBruto)} />
        <DetailItem label="Taxa do gateway" value={formatCurrency(pagamento.valorTaxaGateway)} />
        <DetailItem label="Valor líquido" value={formatCurrency(pagamento.valorLiquidoRecebido)} />
        <DetailItem label="Criado em" value={formatDateTime(pagamento.criadoEm)} />
        <DetailItem label="Atualizado em" value={formatDateTime(pagamento.atualizadoEm)} />
        <DetailItem label="Recebido em" value={formatDateTime(pagamento.recebidoEm)} />
      </dl>

      <div className="mt-6 grid gap-4">
        {pagamento.urlPagamento && (
          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <h3 className="font-black text-green-900">Link de pagamento</h3>
            <p className="mt-2 break-all text-sm leading-6 text-green-800">{pagamento.urlPagamento}</p>
            <a
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-green-700 px-4 text-sm font-black text-white transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              href={pagamento.urlPagamento}
              rel="noreferrer"
              target="_blank"
            >
              Abrir checkout
            </a>
          </div>
        )}

        {pagamento.pixCopiaECola && <PixCopyBox pixCopiaECola={pagamento.pixCopiaECola} />}

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          O frontend apenas consulta e exibe o status retornado pelo backend. A confirmação definitiva de pagamento depende do webhook.
        </div>
      </div>
    </section>
  );
}

function PixCopyBox({ pixCopiaECola }: { pixCopiaECola: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCopiaECola);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-black text-slate-900">Pix copia e cola</h3>
        <button
          className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
          type="button"
          onClick={handleCopy}
        >
          {copied ? 'Copiado' : 'Copiar Pix'}
        </button>
      </div>
      <textarea
        className="mt-3 min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
        readOnly
        value={pixCopiaECola}
      />
    </div>
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
