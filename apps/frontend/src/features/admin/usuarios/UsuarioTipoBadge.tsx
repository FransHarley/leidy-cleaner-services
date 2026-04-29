import { getTipoUsuarioInfo } from './usuarioLabels';
import type { TipoUsuario } from './types';

export function UsuarioTipoBadge({ tipo }: { tipo: TipoUsuario }) {
  const tipoInfo = getTipoUsuarioInfo(tipo);

  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${tipoInfo.className}`}>
      {tipoInfo.label}
    </span>
  );
}
