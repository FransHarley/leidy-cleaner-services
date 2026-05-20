import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';

const PROFESSIONAL_APP_HOME_ROUTE = '/profissional/app';
const ROOT_ROUTES = new Set([
  '/',
  '/entrar',
  '/cadastro',
  '/cadastro/cliente',
  '/cadastro/profissional',
  '/profissional/app',
  '/profissional/app/convites',
  '/profissional/app/atendimentos',
  '/profissional/app/perfil',
  '/profissional/app/regioes',
  '/profissional/app/disponibilidade',
  '/profissional/app/verificacao',
  '/profissional/app/ocorrencias',
]);

const DETAIL_ROUTE_FALLBACKS: Array<{ pattern: RegExp; fallback: string }> = [
  { pattern: /^\/profissional\/app\/convites\/[^/]+$/, fallback: '/profissional/app/convites' },
  { pattern: /^\/profissional\/app\/atendimentos\/[^/]+$/, fallback: '/profissional/app/atendimentos' },
  { pattern: /^\/profissional\/app\/ocorrencias\/nova$/, fallback: '/profissional/app/ocorrencias' },
  { pattern: /^\/profissional\/app\/ocorrencias\/[^/]+$/, fallback: '/profissional/app/ocorrencias' },
];

export function useAndroidBackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathnameRef = useRef(location.pathname);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    pathnameRef.current = location.pathname;
    navigateRef.current = navigate;
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    let cancelled = false;
    let removeListener: (() => Promise<void>) | undefined;

    void CapacitorApp.addListener('backButton', () => {
      void handleAndroidBackButton(pathnameRef.current, navigateRef.current);
    }).then((listener) => {
      if (cancelled) {
        void listener.remove();
        return;
      }

      removeListener = () => listener.remove();
    });

    return () => {
      cancelled = true;
      if (removeListener) {
        void removeListener();
      }
    };
  }, []);
}

async function handleAndroidBackButton(pathname: string, navigate: NavigateFunction) {
  const detailFallback = findDetailFallback(pathname);
  if (detailFallback) {
    if (hasHistoryToGoBack()) {
      navigate(-1);
      return;
    }

    navigate(detailFallback, { replace: true });
    return;
  }

  if (pathname.startsWith('/profissional/app/') && pathname !== PROFESSIONAL_APP_HOME_ROUTE) {
    navigate(PROFESSIONAL_APP_HOME_ROUTE);
    return;
  }

  if (pathname === '/cadastro/profissional' || pathname === '/cadastro/cliente') {
    navigate('/cadastro');
    return;
  }

  if (pathname === '/entrar' || pathname === '/cadastro') {
    navigate('/');
    return;
  }

  if (ROOT_ROUTES.has(pathname)) {
    await minimizeOrExitApp();
    return;
  }

  if (hasHistoryToGoBack()) {
    navigate(-1);
    return;
  }

  await minimizeOrExitApp();
}

function findDetailFallback(pathname: string) {
  return DETAIL_ROUTE_FALLBACKS.find((entry) => entry.pattern.test(pathname))?.fallback ?? null;
}

function hasHistoryToGoBack() {
  if (typeof window === 'undefined') {
    return false;
  }

  const historyIndex = window.history.state?.idx;
  if (typeof historyIndex === 'number') {
    return historyIndex > 0;
  }

  return window.history.length > 1;
}

async function minimizeOrExitApp() {
  try {
    await CapacitorApp.minimizeApp();
  } catch {
    CapacitorApp.exitApp();
  }
}
