import { getStatusContaInfo } from './usuarioLabels';
import type { StatusConta } from './types';

export function UsuarioStatusBadge({ status }: { status: StatusConta }) {
  const statusInfo = getStatusContaInfo(status);

  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
}
