import { getStatusOcorrenciaInfo } from './ocorrenciaLabels';
import type { StatusOcorrencia } from './types';

export function OcorrenciaStatusBadge({ status }: { status: StatusOcorrencia }) {
  const statusInfo = getStatusOcorrenciaInfo(status);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
}
