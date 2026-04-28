import { getTipoOcorrenciaLabel } from './ocorrenciaLabels';
import type { TipoOcorrencia } from './types';

export function OcorrenciaTipoBadge({ tipo }: { tipo: TipoOcorrencia }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-700">
      {getTipoOcorrenciaLabel(tipo)}
    </span>
  );
}
