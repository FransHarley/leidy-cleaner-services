import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { BrandMark } from '../components/public/BrandMark';
import { NotificationBadge, type NotificationBadgeTone } from '../components/ui/NotificationBadge';
import { WhatsAppFloatingButton } from '../components/ui/WhatsAppFloatingButton';
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
    { label: 'Meus enderecos', href: '/app/cliente/enderecos' },
    { label: 'Minhas solicitacoes', href: '/app/cliente/solicitacoes' },
    { label: 'Pagamentos', href: '/app/cliente/pagamentos' },
    { label: 'Atendimentos', href: '/app/cliente/atendimentos' },
    { label: 'Ocorrencias', href: '/app/ocorrencias' },
  ],
  PROFISSIONAL: [
    { label: 'Resumo', href: '/app/profissional' },
    { label: 'Meu perfil', href: '/app/profissional/perfil' },
    { label: 'Regioes', href: '/app/profissional/regioes' },
    { label: 'Disponibilidade', href: '/app/profissional/disponibilidade' },
    { label: 'Verificacoes', href: '/app/profissional/verificacoes' },
    { label: 'Convites', href: '/app/profissional/convites' },
    { label: 'Atendimentos', href: '/app/profissional/atendimentos' },
    { label: 'Ocorrencias', href: '/app/ocorrencias' },
  ],
  ADMIN: [
    { label: 'Resumo', href: '/app/admin' },
    { label: 'Verificacoes', href: '/app/admin/verificacoes' },
    { label: 'Profissionais', href: '/app/admin/profissionais' },
    { label: 'Usuarios', href: '/app/admin/usuarios' },
    { label: 'Solicitacoes', href: '/app/admin/solicitacoes' },
    { label: 'Atendimentos', href: '/app/admin/atendimentos' },
    { label: 'Pagamentos', href: '/app/admin/pagamentos' },
    { label: 'Monitoramento de convites', href: '/app/admin/convites/monitoramento' },
    { label: 'Solicitacoes de reposicao', href: '/app/admin/creditos-solicitacao' },
    { label: 'Precos', href: '/app/admin/configuracoes/precos' },
    { label: 'Ocorrencias', href: '/app/admin/ocorrencias' },
  ],
};

export function AuthenticatedLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = user ? (isAdminUser(user) ? 'ADMIN' : user.tipoUsuario) : 'CLIENTE';
  const indicators = useDashboardIndicators(profile, token);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldShowClientRequestCta = profile === 'CLIENTE' && location.pathname !== '/app/cliente/solicitacoes';

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

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
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-3 px-4 py-3 sm:px-5 md:px-8 md:py-4">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 lg:hidden"
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
              >
                {mobileMenuOpen ? 'Fechar' : 'Menu'}
              </button>
              <div className="min-w-0 flex-1">
                <BrandMark compact />
              </div>
            </div>
            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <div className="hidden min-w-0 text-right md:block">
                <p className="truncate text-sm font-black text-slate-900">{user.nomeCompleto}</p>
                <p className="text-xs font-semibold text-slate-500">{getProfileLabel(profile)}</p>
              </div>
              <button
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:px-4"
                type="button"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-end">
            {shouldShowClientRequestCta && (
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 md:ml-auto md:w-auto"
                to="/app/cliente/solicitacoes#nova-solicitacao"
              >
                Solicitar faxina
              </Link>
            )}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
          type="button"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={[
          'fixed inset-y-0 left-0 z-50 w-[min(88vw,22rem)] max-w-full overflow-y-auto border-r border-slate-100 bg-white p-4 shadow-xl transition-transform lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <BrandMark compact />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            type="button"
            onClick={() => setMobileMenuOpen(false)}
          >
            Fechar
          </button>
        </div>
        <div className="py-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Area {getProfileLabel(profile)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Ola, {greetingName}.</p>
        </div>
        <nav className="grid gap-2" aria-label="Navegacao autenticada">
          {navigationItems.map((item) => (
            <NavLink
              key={item.label}
              className={({ isActive }) =>
                [
                  'flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-bold transition',
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
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg border border-cyan-100 px-3 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          type="button"
          onClick={handleLogout}
        >
          Ver pagina publica
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-5 px-4 py-4 sm:px-5 md:py-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="hidden min-w-0 self-start rounded-lg border border-slate-100 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:block">
          <div className="px-3 py-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Area {getProfileLabel(profile)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Ola, {greetingName}.</p>
          </div>
          <nav className="mt-2 grid gap-1" aria-label="Navegacao autenticada">
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
            Ver pagina publica
          </button>
        </aside>

        <main className="w-full min-w-0">
          <Outlet />
        </main>
      </div>

      <WhatsAppFloatingButton />
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
  if (profile === 'ADMIN' && label === 'Verificacoes') {
    return {
      count: indicators.admin.verificacoesPendentes,
      label: `${indicators.admin.verificacoesPendentes} verificacoes pendentes`,
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

  if (profile === 'ADMIN' && label === 'Solicitacoes') {
    return {
      count: indicators.admin.solicitacoesAbertas,
      label: `${indicators.admin.solicitacoesAbertas} solicitacoes abertas`,
      tone: 'yellow' as NotificationBadgeTone,
    };
  }

  if (profile === 'ADMIN' && label === 'Atendimentos') {
    return {
      count: indicators.admin.atendimentosEmAnalise,
      label: `${indicators.admin.atendimentosEmAnalise} atendimentos em analise`,
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
      label: `${count} pagamentos exigem atencao`,
      tone: indicators.admin.pagamentosFalhos > 0 ? ('red' as NotificationBadgeTone) : ('yellow' as NotificationBadgeTone),
    };
  }

  if (profile === 'ADMIN' && label === 'Monitoramento de convites') {
    const count =
      indicators.admin.convitesVencidosPendentesProcessamento +
      indicators.admin.solicitacoesPagasAguardandoAceite;

    return {
      count,
      label: `${count} convites ou solicitacoes aguardando acompanhamento`,
      tone: indicators.admin.convitesVencidosPendentesProcessamento > 0 ? ('red' as NotificationBadgeTone) : ('yellow' as NotificationBadgeTone),
    };
  }

  if (profile === 'ADMIN' && label === 'Solicitacoes de reposicao') {
    return {
      count: indicators.admin.creditosSolicitacaoDisponiveis,
      label: `${indicators.admin.creditosSolicitacaoDisponiveis} solicitacoes de reposicao disponiveis`,
      tone: 'yellow' as NotificationBadgeTone,
    };
  }

  if (profile === 'ADMIN' && label === 'Ocorrencias') {
    const count = indicators.admin.ocorrenciasAbertas + indicators.admin.ocorrenciasEmAnalise;

    return {
      count,
      label: `${count} ocorrencias abertas ou em analise`,
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
