import { Capacitor } from '@capacitor/core';

import { getDashboardPath } from '../auth/session';
import type { UsuarioAutenticado } from '../auth/types';

export const PROFESSIONAL_APP_HOME_PATH = '/profissional/app';
export const PROFESSIONAL_APP_LANDING_PATH = '/app-profissional';
export const PROFESSIONAL_APP_ONLY_REASON = 'app-profissional';

export function isNativeProfessionalApp() {
  return Capacitor.isNativePlatform();
}

export function isProfessionalAppUser(user: Pick<UsuarioAutenticado, 'tipoUsuario'> | null | undefined) {
  return user?.tipoUsuario === 'PROFISSIONAL';
}

export function getPreferredAuthenticatedPath(user: Pick<UsuarioAutenticado, 'tipoUsuario' | 'roles'>) {
  if (isNativeProfessionalApp() && isProfessionalAppUser(user)) {
    return PROFESSIONAL_APP_HOME_PATH;
  }

  return getDashboardPath(user);
}

export function buildProfessionalAppOnlyLoginPath() {
  return `/entrar?motivo=${encodeURIComponent(PROFESSIONAL_APP_ONLY_REASON)}`;
}

export function buildProfessionalAppLoginPath(redirectTo = PROFESSIONAL_APP_HOME_PATH) {
  return `/entrar?redirectTo=${encodeURIComponent(redirectTo)}`;
}

export function getProfessionalAppOnlyMessage() {
  return 'Este aplicativo e exclusivo para profissionais da Leidy Cleaner Services.';
}
