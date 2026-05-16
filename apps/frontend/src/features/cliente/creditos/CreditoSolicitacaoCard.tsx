import { formatCurrency, formatDateTime } from '../pagamentos/pagamentoLabels';
import type { SolicitacaoFaxina } from '../solicitacoes/types';
import {
  getCreditoTipoServicoLabel,
  getStatusCreditoSolicitacaoInfo,
  isCreditoSolicitacaoProvavelmenteCompativel,
} from './creditoSolicitacaoLabels';
import type { CreditoSolicitacao } from './types';

type CreditoSolicitacaoCardProps = {
  credito: CreditoSolicitacao;
  isSubmitting?: boolean;
  onUse?: ((credito: CreditoSolicitacao) => void) | null;
  solicitacaoAlvo?: SolicitacaoFaxina | null;
};

export function CreditoSolicitacaoCard({
  credito,
  isSubmitting = false,
  onUse = null,
  solicitacaoAlvo = null,
}: CreditoSolicitacaoCardProps) {
  const statusInfo = getStatusCreditoSolicitacaoInfo(credito.status);
  const isCompatibilidadeProvavel = solicitacaoAlvo
    ? isCreditoSolicitacaoProvavelmenteCompativel(credito, solicitacaoAlvo)
    : false;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-slate-900">Credito de solicitacao #{credito.id}</h3>
            <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.1em] ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{getCreditoTipoServicoLabel(credito.tipoServico)}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {credito.duracaoEstimadaHoras} horas
            {credito.regiaoNome ? ` · ${credito.regiaoNome}` : ` · Regiao #${credito.regiaoId}`}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Gerado em {formatDateTime(credito.criadoEm)}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Solicitacao de origem #{credito.solicitacaoOrigemId}</p>
          {credito.valorReferencia !== null && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Valor de referencia da solicitacao original: {formatCurrency(credito.valorReferencia)}
            </p>
          )}
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
            Este credito permite uma nova tentativa equivalente. A confirmacao final acontece ao concluir a solicitacao.
          </p>
          {solicitacaoAlvo && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold leading-6 ${
                isCompatibilidadeProvavel ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
              }`}
            >
              {isCompatibilidadeProvavel
                ? 'Compatibilidade aparente com esta solicitacao.'
                : 'Pode haver incompatibilidade com esta solicitacao. Vamos conferir os detalhes antes de concluir.'}
            </p>
          )}
        </div>

        {onUse && credito.status === 'DISPONIVEL' && (
          <button
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
            disabled={isSubmitting}
            type="button"
            onClick={() => onUse(credito)}
          >
            {isSubmitting ? 'Usando...' : 'Usar esta solicitacao de reposicao'}
          </button>
        )}
      </div>
    </article>
  );
}
