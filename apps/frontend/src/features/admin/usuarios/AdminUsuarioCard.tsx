import { Link } from 'react-router-dom';

import { formatBoolean, formatDateTime, formatId } from './usuarioLabels';
import { UsuarioStatusBadge } from './UsuarioStatusBadge';
import { UsuarioTipoBadge } from './UsuarioTipoBadge';
import type { AdminUsuario } from './types';

export function AdminUsuarioCard({ usuario }: { usuario: AdminUsuario }) {
  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">{usuario.nomeCompleto}</h2>
            <UsuarioTipoBadge tipo={usuario.tipoUsuario} />
            <UsuarioStatusBadge status={usuario.statusConta} />
          </div>
          <p className="mt-2 break-words text-sm font-semibold text-slate-700">{usuario.email}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{usuario.telefone}</p>
        </div>

        <Link
          className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
          to={`/app/admin/usuarios/${usuario.usuarioId}`}
        >
          Ver detalhes
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Usuário" value={`#${usuario.usuarioId}`} />
        <DetailItem label="Perfil cliente" value={formatId(usuario.perfilClienteId)} />
        <DetailItem label="Perfil profissional" value={formatId(usuario.perfilProfissionalId)} />
        <DetailItem label="E-mail verificado" value={formatBoolean(usuario.emailVerificado)} />
        <DetailItem label="Telefone verificado" value={formatBoolean(usuario.telefoneVerificado)} />
        <DetailItem label="Último login" value={formatDateTime(usuario.ultimoLoginEm)} />
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
