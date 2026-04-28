import type { ReactNode } from 'react';

import { formatOcorrenciaDateTime, formatOptionalId } from './ocorrenciaLabels';
import { OcorrenciaStatusBadge } from './OcorrenciaStatusBadge';
import { OcorrenciaTipoBadge } from './OcorrenciaTipoBadge';
import type { OcorrenciaAtendimento } from './types';

export function OcorrenciaInfoPanel({ ocorrencia }: { ocorrencia: OcorrenciaAtendimento }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Ocorrência #{ocorrencia.id}</h2>
        <OcorrenciaStatusBadge status={ocorrencia.status} />
        <OcorrenciaTipoBadge tipo={ocorrencia.tipo} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Atendimento" value={`#${ocorrencia.atendimentoId}`} />
        <DetailItem label="Aberta por usuário" value={`#${ocorrencia.abertoPorUsuarioId}`} />
        <DetailItem label="Criada em" value={formatOcorrenciaDateTime(ocorrencia.criadoEm)} />
        <DetailItem label="Resolvida em" value={formatOcorrenciaDateTime(ocorrencia.resolvidoEm)} />
        <DetailItem label="Resolvida por usuário" value={formatOptionalId(ocorrencia.resolvidoPorUsuarioId)} />
      </dl>

      <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Descrição</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">{ocorrencia.descricao}</p>
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}
