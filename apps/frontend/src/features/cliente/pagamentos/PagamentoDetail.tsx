import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  formatDateTime,
  formatCurrency,
  getMetodoPagamentoLabel,
  getStatusPagamentoDescription,
} from './pagamentoLabels';
import { PagamentoStatusBadge } from './PagamentoStatusBadge';
import type { Pagamento, PixQrCodePagamento } from './types';

type PagamentoDetailProps = {
  isPixQrCodeLoading?: boolean;
  pagamento: Pagamento;
  pixQrCode?: PixQrCodePagamento | null;
  pixQrCodeErrorMessage?: string | null;
};

export function PagamentoDetail({
  isPixQrCodeLoading = false,
  pagamento,
  pixQrCode = null,
  pixQrCodeErrorMessage = null,
}: PagamentoDetailProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const isPaid = pagamento.status === 'PAGO';
  const isPix = pagamento.metodoPagamento === 'PIX';
  const isWaitingWebhook = pagamento.status === 'PENDENTE' || pagamento.status === 'AGUARDANDO_CONFIRMACAO';
  const requiresSupport = pagamento.status === 'CANCELADO' || pagamento.status === 'FALHOU' || pagamento.status === 'ESTORNADO';
  const pixPayload = pixQrCode?.payload ?? pagamento.pixCopiaECola ?? null;
  const pixImageSrc = getPixQrCodeImageSrc(pixQrCode?.encodedImage ?? null);

  async function handleCopyPixCode() {
    if (!pixPayload) {
      return;
    }

    try {
      if (!navigator.clipboard) {
        throw new Error('clipboard-unavailable');
      }
      await navigator.clipboard.writeText(pixPayload);
      setCopyFeedback('Codigo Pix copiado.');
    } catch {
      setCopyFeedback('Nao foi possivel copiar automaticamente. Copie o codigo manualmente.');
    }
  }

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
        {pixQrCode?.expirationDate && <DetailItem label="Expira em" value={formatDateTime(pixQrCode.expirationDate)} />}
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

        {isPix && !isPaid && (
          <section className="grid gap-4 rounded-lg border border-cyan-100 bg-cyan-50 p-4">
            <div>
              <h3 className="font-black text-cyan-900">Pagamento Pix</h3>
              <p className="mt-2 text-sm leading-6 text-cyan-900">
                Use o QR Code abaixo ou copie o codigo Pix. A confirmacao definitiva continua dependendo do webhook.
              </p>
            </div>

            {isPixQrCodeLoading && (
              <div className="rounded-lg border border-cyan-200 bg-white/80 p-4 text-sm font-semibold text-cyan-900">
                Carregando QR Code Pix...
              </div>
            )}

            {!isPixQrCodeLoading && pixQrCodeErrorMessage && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">
                Nao foi possivel carregar o QR Code Pix agora. {pixQrCodeErrorMessage}
              </div>
            )}

            {!isPixQrCodeLoading && pixImageSrc && (
              <div className="flex justify-center rounded-lg border border-cyan-200 bg-white p-4">
                <img
                  alt="QR Code Pix para pagamento"
                  className="h-auto w-full max-w-64 rounded-lg"
                  src={pixImageSrc}
                />
              </div>
            )}

            {pixPayload && (
              <div className="rounded-lg border border-cyan-200 bg-white p-4">
                <h4 className="text-sm font-black text-cyan-900">Pix copia e cola</h4>
                <p className="mt-2 break-all text-sm leading-6 text-slate-700">{pixPayload}</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
                    type="button"
                    onClick={handleCopyPixCode}
                  >
                    Copiar codigo Pix
                  </button>
                  {copyFeedback && <span className="text-sm font-semibold text-cyan-900">{copyFeedback}</span>}
                </div>
              </div>
            )}

            {pagamento.urlPagamento && (
              <div className="rounded-lg border border-cyan-200 bg-white p-4">
                <h4 className="text-sm font-black text-cyan-900">Fatura Asaas</h4>
                <p className="mt-2 break-all text-sm leading-6 text-slate-700">{pagamento.urlPagamento}</p>
                <a
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-300 px-4 text-sm font-black text-cyan-800 transition hover:bg-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
                  href={pagamento.urlPagamento}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir fatura Asaas
                </a>
              </div>
            )}
          </section>
        )}

        {!isPix && pagamento.urlPagamento && isWaitingWebhook && (
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
            <h3 className="font-black text-cyan-900">Link de pagamento</h3>
            <p className="mt-2 break-all text-sm leading-6 text-cyan-800">{pagamento.urlPagamento}</p>
            <a
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              href={pagamento.urlPagamento}
              rel="noreferrer"
              target="_blank"
            >
              Abrir fatura Asaas
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

function getPixQrCodeImageSrc(encodedImage: string | null) {
  if (!encodedImage) {
    return null;
  }

  if (encodedImage.startsWith('data:image')) {
    return encodedImage;
  }

  return `data:image/png;base64,${encodedImage}`;
}
