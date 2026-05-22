import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { FormAlert } from '../components/ui/FormAlert';
import { BrandMark } from '../components/public/BrandMark';
import { getFirstName } from '../features/auth/session';
import { useAuth } from '../features/auth/useAuth';
import {
  subscribeToForegroundPushEvents,
  type ProfessionalForegroundPushEvent,
} from '../features/notificacoes/pushNotificationRouting';
import { useProfessionalPushNotifications } from '../features/notificacoes/useProfessionalPushNotifications';

type MobileNavigationItem = {
  label: string;
  href: string;
};

const mobileNavigationItems: MobileNavigationItem[] = [
  { label: 'Inicio', href: '/profissional/app' },
  { label: 'Convites', href: '/profissional/app/convites' },
  { label: 'Atend.', href: '/profissional/app/atendimentos' },
  { label: 'Perfil', href: '/profissional/app/perfil' },
  { label: 'Agenda', href: '/profissional/app/disponibilidade' },
];

const titleByPath = [
  { matchPrefix: '/profissional/app/convites', title: 'Convites' },
  { matchPrefix: '/profissional/app/atendimentos', title: 'Atendimentos' },
  { matchPrefix: '/profissional/app/perfil', title: 'Perfil' },
  { matchPrefix: '/profissional/app/regioes', title: 'Regioes' },
  { matchPrefix: '/profissional/app/disponibilidade', title: 'Disponibilidade' },
  { matchPrefix: '/profissional/app/verificacao', title: 'Verificacao' },
  { matchPrefix: '/profissional/app/ocorrencias', title: 'Ocorrencias' },
];

export function ProfessionalMobileLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [foregroundPushEvent, setForegroundPushEvent] = useState<ProfessionalForegroundPushEvent | null>(null);

  useProfessionalPushNotifications({
    enabled: user?.tipoUsuario === 'PROFISSIONAL',
    userId: user?.id ?? null,
    authToken: token,
  });

  useEffect(() => {
    const unsubscribe = subscribeToForegroundPushEvents((event) => {
      if (user?.tipoUsuario !== 'PROFISSIONAL') {
        return;
      }

      if (event.tipo === 'CONVITE_RECEBIDO' || event.conviteId) {
        void queryClient.invalidateQueries({ queryKey: ['profissional', 'convites'] });
      }

      if (event.atendimentoId) {
        void queryClient.invalidateQueries({ queryKey: ['atendimentos', 'meus', 'profissional'] });
        void queryClient.invalidateQueries({ queryKey: ['atendimentos', 'profissional'] });
      }

      setForegroundPushEvent(event);
    });

    return unsubscribe;
  }, [queryClient, user?.tipoUsuario]);

  useEffect(() => {
    if (!foregroundPushEvent) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setForegroundPushEvent(null);
    }, 8000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [foregroundPushEvent]);

  if (!user) {
    return null;
  }

  const pageTitle = titleByPath.find((item) => location.pathname.startsWith(item.matchPrefix))?.title ?? 'Inicio';
  const firstName = getFirstName(user.nomeCompleto) || 'Profissional';
  const foregroundTargetPath = foregroundPushEvent?.targetPath ?? null;

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#dff5f3_0%,#f4f7f3_34%,#f8faf8_100%)] text-slate-900 sm:px-4 sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-[30rem] flex-col bg-[#f8faf8] sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-white/80 sm:shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <BrandMark compact />
              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">App profissional</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900">{pageTitle}</h1>
              <p className="mt-1 text-sm text-slate-600">Ola, {firstName}. Experiencia mobile dedicada para sua rotina.</p>
            </div>
            <button
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
              type="button"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4">
          {foregroundPushEvent && (
            <div className="mb-4 grid gap-3">
              <FormAlert
                tone="info"
                title={foregroundPushEvent.title}
                message={foregroundPushEvent.body}
              />
              {foregroundTargetPath && (
                <button
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-black text-cyan-800 transition hover:bg-cyan-100"
                  type="button"
                  onClick={() => {
                    setForegroundPushEvent(null);
                    navigate(foregroundTargetPath);
                  }}
                >
                  Abrir agora
                </button>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[30rem] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 gap-2 rounded-[1.75rem] border border-slate-200 bg-white/96 p-2 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.55)] backdrop-blur">
          {mobileNavigationItems.map((item) => (
            <NavLink
              key={item.href}
              className={({ isActive }) =>
                [
                  'flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 text-center text-[0.7rem] font-black leading-tight transition',
                  isActive || (item.href === '/profissional/app' && location.pathname === '/profissional/app')
                    ? 'bg-cyan-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-cyan-700',
                ].join(' ')
              }
              end={item.href === '/profissional/app'}
              to={item.href}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
