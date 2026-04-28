import { Link } from 'react-router-dom';

import { formatOcorrenciaDateTime, formatOptionalId } from './ocorrenciaLabels';
import { OcorrenciaStatusBadge } from './OcorrenciaStatusBadge';
import { OcorrenciaTipoBadge } from './OcorrenciaTipoBadge';
import type { OcorrenciaAtendimento } from './types';

type OcorrenciaCardProps = {
  detailBasePath: string;
  ocorrencia: OcorrenciaAtendimento;
};

export function OcorrenciaCard({ detailBasePath, ocorrencia }: OcorrenciaCardProps) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">Ocorrência #{ocorrencia.id}</h2>
            <OcorrenciaStatusBadge status={ocorrencia.status} />
            <OcorrenciaTipoBadge tipo={ocorrencia.tipo} />
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{ocorrencia.descricao}</p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-green-100 px-4 text-sm font-black text-green-700 transition hover:bg-green-50"
          to={`${detailBasePath}/${ocorrencia.id}`}
        >
          Ver detalhe
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Atendimento" value={`#${ocorrencia.atendimentoId}`} />
        <DetailItem label="Aberta por" value={`#${ocorrencia.abertoPorUsuarioId}`} />
        <DetailItem label="Criada em" value={formatOcorrenciaDateTime(ocorrencia.criadoEm)} />
        <DetailItem label="Resolvida por" value={formatOptionalId(ocorrencia.resolvidoPorUsuarioId)} />
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
