import { formatAvaliacaoDateTime, formatNotaAvaliacao } from './avaliacaoLabels';
import type { AvaliacaoProfissional } from './types';

type AvaliacoesProfissionalListProps = {
  avaliacoes: AvaliacaoProfissional[];
  currentAtendimentoId?: number;
};

export function AvaliacoesProfissionalList({ avaliacoes, currentAtendimentoId }: AvaliacoesProfissionalListProps) {
  if (avaliacoes.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
        Nenhuma avaliação registrada para esta profissional.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {avaliacoes.map((avaliacao) => (
        <article
          key={avaliacao.avaliacaoId}
          className={[
            'rounded-lg border bg-white p-4 shadow-sm',
            avaliacao.atendimentoId === currentAtendimentoId ? 'border-green-100' : 'border-slate-100',
          ].join(' ')}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-black text-slate-900">Nota {formatNotaAvaliacao(avaliacao.nota)}</p>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
              {formatAvaliacaoDateTime(avaliacao.criadoEm)}
            </p>
          </div>
          {avaliacao.comentario && <p className="mt-3 break-words text-sm leading-6 text-slate-700">{avaliacao.comentario}</p>}
        </article>
      ))}
    </div>
  );
}
