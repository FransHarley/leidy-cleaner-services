import { formatBoolean, formatDateTime, formatId } from './usuarioLabels';
import { UsuarioStatusBadge } from './UsuarioStatusBadge';
import { UsuarioTipoBadge } from './UsuarioTipoBadge';
import type { AdminUsuario } from './types';

export function AdminUsuarioInfoPanel({ usuario }: { usuario: AdminUsuario }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">{usuario.nomeCompleto}</h2>
        <UsuarioTipoBadge tipo={usuario.tipoUsuario} />
        <UsuarioStatusBadge status={usuario.statusConta} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Usuário" value={`#${usuario.usuarioId}`} />
        <DetailItem label="Perfil cliente" value={formatId(usuario.perfilClienteId)} />
        <DetailItem label="Perfil profissional" value={formatId(usuario.perfilProfissionalId)} />
        <DetailItem label="Nome completo" value={usuario.nomeCompleto} />
        <DetailItem label="E-mail" value={usuario.email} />
        <DetailItem label="Telefone" value={usuario.telefone} />
        <DetailItem label="E-mail verificado" value={formatBoolean(usuario.emailVerificado)} />
        <DetailItem label="Telefone verificado" value={formatBoolean(usuario.telefoneVerificado)} />
        <DetailItem label="Último login" value={formatDateTime(usuario.ultimoLoginEm)} />
        <DetailItem label="Criado em" value={formatDateTime(usuario.criadoEm)} />
        <DetailItem label="Atualizado em" value={formatDateTime(usuario.atualizadoEm)} />
      </dl>
    </section>
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
