import { Link } from 'react-router-dom';

import { formatAdminDateTime, formatOptionalText } from './verificacaoLabels';
import { VerificacaoStatusBadge } from './VerificacaoStatusBadge';
import type { DocumentoVerificacaoAdmin } from './types';

export function VerificacaoCard({ verificacao }: { verificacao: DocumentoVerificacaoAdmin }) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Verificação #{verificacao.id}</h2>
            <VerificacaoStatusBadge status={verificacao.statusVerificacao} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{verificacao.tipoDocumento}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{formatOptionalText(verificacao.usuarioNome)}</p>
          {verificacao.analisadoEm && (
            <p className="mt-1 text-sm leading-6 text-slate-600">Analisada em {formatAdminDateTime(verificacao.analisadoEm)}</p>
          )}
        </div>

        <Link
          className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
          to={`/app/admin/verificacoes/${verificacao.id}`}
        >
          Revisar
        </Link>
      </div>
    </article>
  );
}
