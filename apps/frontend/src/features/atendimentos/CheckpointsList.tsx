import { formatCoordinate, formatDateTime, getTipoCheckpointLabel } from './atendimentoLabels';
import type { CheckpointServico } from './types';

export function CheckpointsList({ checkpoints }: { checkpoints: CheckpointServico[] }) {
  if (checkpoints.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-6 text-center shadow-sm">
        <h3 className="font-black text-slate-900">Nenhum checkpoint registrado</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Os registros de início e fim aparecerão aqui quando existirem.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {checkpoints.map((checkpoint) => (
        <article key={checkpoint.id} className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-slate-900">{getTipoCheckpointLabel(checkpoint.tipo)}</h3>
          </div>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
            <DetailItem label="Registrado em" value={formatDateTime(checkpoint.registradoEm)} />
            <DetailItem label="Registrado por" value={checkpoint.registradoPorNome || 'Usuário não identificado'} />
            {checkpoint.latitude !== null && checkpoint.latitude !== undefined && (
              <DetailItem label="Latitude" value={formatCoordinate(checkpoint.latitude)} />
            )}
            {checkpoint.longitude !== null && checkpoint.longitude !== undefined && (
              <DetailItem label="Longitude" value={formatCoordinate(checkpoint.longitude)} />
            )}
            {checkpoint.fotoComprovacaoUrl && <DetailItem label="Evidência" value={checkpoint.fotoComprovacaoUrl} />}
            {checkpoint.observacao && <DetailItem label="Observação" value={checkpoint.observacao} />}
          </dl>
        </article>
      ))}
    </div>
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
