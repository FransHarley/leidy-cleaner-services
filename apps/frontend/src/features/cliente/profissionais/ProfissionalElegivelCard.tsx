import type { ProfissionalDisponivel } from './types';

type ProfissionalElegivelCardProps = {
  disabled?: boolean;
  onReadReviews: (profissional: ProfissionalDisponivel) => void;
  onToggle: (profissional: ProfissionalDisponivel) => void;
  profissional: ProfissionalDisponivel;
  selectionOrder?: number;
  selected?: boolean;
};

export function ProfissionalElegivelCard({
  disabled = false,
  onReadReviews,
  onToggle,
  profissional,
  selectionOrder,
  selected = false,
}: ProfissionalElegivelCardProps) {
  return (
    <article
      className={[
        'rounded-lg border bg-white p-5 shadow-sm transition',
        selected ? 'border-cyan-200 ring-2 ring-cyan-100' : 'border-slate-100',
        disabled && !selected ? 'opacity-60' : 'hover:border-cyan-100',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-xl font-black text-cyan-700">
            {profissional.nomeExibicao.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{profissional.nomeExibicao}</h2>
              {selectionOrder && (
                <span className="rounded-lg bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-cyan-700">
                  {selectionOrder}ª escolha
                </span>
              )}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {profissional.experienciaAnos} ano{profissional.experienciaAnos === 1 ? '' : 's'} de experiência
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{formatRatingSummary(profissional)}</p>
          </div>
        </div>

        <div className="grid shrink-0 gap-2 sm:flex sm:flex-wrap">
          {profissional.totalAvaliacoes > 0 && (
            <button
              className="min-h-10 w-full rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
              type="button"
              onClick={() => onReadReviews(profissional)}
            >
              Ler avaliações
            </button>
          )}
          <button
            className={[
              'min-h-10 rounded-lg px-4 text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700',
              selected
                ? 'border border-red-100 text-red-700 hover:bg-red-50 focus-visible:ring-red-600'
                : 'bg-cyan-700 text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300',
              'w-full sm:w-auto',
            ].join(' ')}
            disabled={disabled && !selected}
            type="button"
            onClick={() => onToggle(profissional)}
          >
            {selected ? 'Remover' : 'Selecionar'}
          </button>
        </div>
      </div>
    </article>
  );
}

function formatRating(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRatingSummary(profissional: ProfissionalDisponivel) {
  if (profissional.totalAvaliacoes <= 0) {
    return 'Sem avaliações ainda';
  }

  return `Nota ${formatRating(profissional.notaMedia)} · ${profissional.totalAvaliacoes} avaliação${
    profissional.totalAvaliacoes === 1 ? '' : 'ões'
  }`;
}
