import { Link } from 'react-router-dom';

import { formatCurrency, formatDateTime, getTipoServicoAtendimentoLabel } from './atendimentoLabels';
import { getAtendimentoProfissionalLabel, getAtendimentoProfissionalRatingLabel, getAtendimentoRegiaoLabel } from './atendimentoDisplay';
import { AtendimentoStatusBadge } from './AtendimentoStatusBadge';
import type { AtendimentoVisivel, AtendimentosProfile } from './types';

type AtendimentoCardProps = {
  atendimento: AtendimentoVisivel;
  profile: AtendimentosProfile;
};

export function AtendimentoCard({ atendimento, profile }: AtendimentoCardProps) {
  const basePath = profile === 'CLIENTE' ? '/app/cliente/atendimentos' : '/app/profissional/atendimentos';
  const amountLabel = profile === 'PROFISSIONAL' ? 'Você recebe' : 'Valor do serviço';
  const amount = profile === 'PROFISSIONAL' ? atendimento.valorEstimadoProfissional : 'valorServico' in atendimento ? atendimento.valorServico : null;

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Atendimento #{atendimento.id}</h2>
            <AtendimentoStatusBadge status={atendimento.status} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{getTipoServicoAtendimentoLabel(atendimento.tipoServico)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Previsto para {formatDateTime(atendimento.inicioPrevistoEm)}</p>
          {profile === 'CLIENTE' && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {getAtendimentoProfissionalLabel(atendimento)} · {getAtendimentoProfissionalRatingLabel(atendimento)}
            </p>
          )}
          <div className="mt-2">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">{amountLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {amount == null ? 'Valor indisponível' : formatCurrency(amount)}
            </p>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {getAtendimentoRegiaoLabel(atendimento)}
          </p>
        </div>

        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          to={`${basePath}/${atendimento.id}`}
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}
