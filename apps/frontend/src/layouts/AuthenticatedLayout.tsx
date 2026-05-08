import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { BrandMark } from '../components/public/BrandMark';
import { NotificationBadge, type NotificationBadgeTone } from '../components/ui/NotificationBadge';
import { getFirstName, getProfileLabel, isAdminUser } from '../features/auth/session';
import type { TipoUsuario } from '../features/auth/types';
import { useAuth } from '../features/auth/useAuth';
import { useDashboardIndicators } from '../features/dashboard/useDashboardIndicators';

type NavigationItem = {
  label: string;
  href: string;
};

const navigationByProfile: Record<TipoUsuario, NavigationItem[]> = {
  CLIENTE: [
    { label: 'Resumo', href: '/app/cliente' },
    { label: 'Meus endereços', href: '/app/cliente/enderecos' },
    { label: 'Minhas solicitações', href: '/app/cliente/solicitacoes' },
    { label: 'Pagamentos', href: '/app/cliente/pagamentos' },
    { label: 'Atendimentos', href: '/app/cliente/atendimentos' },
    { label: 'Ocorrências', href: '/app/ocorrencias' },
  ],
  PROFISSIONAL: [
    { label: 'Resumo', href: '/app/profissional' },
    { label: 'Meu perfil', href: '/app/profissional/perfil' },
    { label: 'Regiões', href: '/app/profissional/regioes' },
    { label: 'Disponibilidade', href: '/app/profissional/disponibilidade' },
    { label: 'Verificações', href: '/app/profissional/verificacoes' },
    { label: 'Convites', href: '/app/profissional/convites' },
    { label: 'Atendimentos', href: '/app/profissional/atendimentos' },
    { label: 'Ocorrências', href: '/app/ocorrencias' },
  ],
  ADMIN: [
    { label: 'Resumo', href: '/app/admin' },
    { label: 'Verificações', href: '/app/admin/verificacoes' },
    { label: 'Profissionais', href: '/app/admin/profissionais' },
    { label: 'Usuários', href: '/app/admin/usuarios' },
    { label: 'Solicitações', href: '/app/admin/solicitacoes' },
    { label: 'Atendimentos', href: '/app/admin/atendimentos' },
    { label: 'Pagamentos', href: '/app/admin/pagamentos' },
    { label: 'Preços', href: '/app/admin/configuracoes/precos' },
    { label: 'Ocorrências', href: '/app/admin/ocorrencias' },
  ],
};

export function AuthenticatedLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const profile = user ? (isAdminUser(user) ? 'ADMIN' : user.tipoUsuario) : 'CLIENTE';
  const indicators = useDashboardIndicators(profile, token);

  if (!user) {
    return null;
  }

  const navigationItems = navigationByProfile[profile];
  const greetingName = getFirstName(user.nomeCompleto) || getProfileLabel(profile);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f6f7f4] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-5 py-4 md:px-8">
          <BrandMark compact />
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-black text-slate-900">{user.nomeCompleto}</p>
              <p className="text-xs font-semibold text-slate-500">{getProfileLabel(profile)}</p>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              type="button"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-5 px-5 py-5 md:grid-cols-[260px_minmax(0,1fr)] md:px-8 md:py-8">
        <aside className="min-w-0 self-start rounded-lg border border-slate-100 bg-white p-3 shadow-sm md:sticky md:top-24">
          <div className="px-3 py-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Área {getProfileLabel(profile)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Olá, {greetingName}.</p>
          </div>
          <nav className="mt-2 grid gap-1 sm:grid-cols-2 md:grid-cols-1" aria-label="Navegação autenticada">
            {navigationItems.map((item) => (
              <NavLink
                key={item.label}
                className={({ isActive }) =>
                  [
                    'flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm font-bold transition',
                    isActive ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50 hover:text-cyan-700',
                  ].join(' ')
                }
                end={item.href === '/app/cliente' || item.href === '/app/profissional' || item.href === '/app/admin'}
                to={item.href}
              >
                <span className="min-w-0 truncate">{item.label}</span>
                <SidebarBadge item={item} indicators={indicators} profile={profile} />
              </NavLink>
            ))}
          </nav>
          <button
            className="mt-3 flex min-h-11 w-full items-center rounded-lg border border-cyan-100 px-3 py-3 text-left text-sm font-bold text-cyan-700 transition hover:bg-cyan-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            type="button"
            onClick={handleLogout}
          >
            Ver página pública
          </button>
        </aside>

        <main className="w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarBadge({
  indicators,
  item,
  profile,
}: {
  indicators: ReturnType<typeof useDashboardIndicators>;
  item: NavigationItem;
  profile: TipoUsuario;
}) {
  const badge = getSidebarBadge(profile, item.label, indicators);

  if (!badge) {
    return null;
  }

  return <NotificationBadge count={badge.count} label={badge.label} tone={badge.tone} />;
}

function getSidebarBadge(profile: TipoUsuario, label: string, indicators: ReturnType<typeof useDashboardIndicators>) {
  if (profile === 'ADMIN' && label === 'Verificações') {
    return {
      count: indicators.admin.verificacoesPendentes,
      label: `${indicators.admin.verificacoesPendentes} verificações pendentes`,
      tone: 'red' as NotificationBadgeTone,
    };
  }

  if (profile === 'ADMIN' && label === 'Profissionais') {
    return {
      count: indicators.admin.profissionaisPendentes,
      label: `${indicators.admin.profissionaisPendentes} profissionais pendentes`,
      tone: 'red' as NotificationBadgeTone,
    };
  }

  if (profile === 'ADMIN' && label === 'Solicitações') {
    return {
      count: indicators.admin.solicitacoesAbertas,
      label: `${indicators.admin.solicitacoesAbertas} solicitações abertas`,
      tone: 'yellow' as NotificationBadgeTone,
    };
  }

  if (profile === 'ADMIN' && label === 'Atendimentos') {
    return {
      count: indicators.admin.atendimentosEmAnalise,
      label: `${indicators.admin.atendimentosEmAnalise} atendimentos em análise`,
      tone: 'yellow' as NotificationBadgeTone,
    };
  }

  if (profile === 'ADMIN' && label === 'Pagamentos') {
    const count =
      indicators.admin.pagamentosPendentes +
      indicators.admin.pagamentosAguardandoConfirmacao +
      indicators.admin.pagamentosFalhos;

    return {
      count,
      label: `${count} pagamentos exigem atenção`,
      tone: indicators.admin.pagamentosFalhos > 0 ? ('red' as NotificationBadgeTone) : ('yellow' as NotificationBadgeTone),
    };
  }

  if (profile === 'ADMIN' && label === 'Ocorrências') {
    const count = indicators.admin.ocorrenciasAbertas + indicators.admin.ocorrenciasEmAnalise;

    return {
      count,
      label: `${count} ocorrências abertas ou em análise`,
      tone: 'red' as NotificationBadgeTone,
    };
  }

  if (profile === 'CLIENTE' && label === 'Pagamentos') {
    return {
      count: indicators.cliente.pagamentosPendentes,
      label: `${indicators.cliente.pagamentosPendentes} pagamentos pendentes`,
      tone: 'red' as NotificationBadgeTone,
    };
  }

  if (profile === 'CLIENTE' && label === 'Atendimentos') {
    return {
      count: indicators.cliente.atendimentosConfirmados,
      label: `${indicators.cliente.atendimentosConfirmados} atendimentos confirmados`,
      tone: 'neutral' as NotificationBadgeTone,
    };
  }

  if (profile === 'PROFISSIONAL' && label === 'Convites') {
    return {
      count: indicators.profissional.convitesPendentes,
      label: `${indicators.profissional.convitesPendentes} convites pendentes`,
      tone: 'red' as NotificationBadgeTone,
    };
  }

  if (profile === 'PROFISSIONAL' && label === 'Atendimentos') {
    const count = indicators.profissional.proximosAtendimentos + indicators.profissional.atendimentosEmExecucao;
    return {
      count,
      label: `${count} atendimentos ativos`,
      tone: indicators.profissional.atendimentosEmExecucao > 0 ? ('yellow' as NotificationBadgeTone) : ('neutral' as NotificationBadgeTone),
    };
  }

  return null;
}
