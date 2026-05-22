import { Navigate } from 'react-router-dom';

import { useAuth } from '../features/auth/useAuth';
import {
  buildProfessionalAppOnlyLoginPath,
  isNativeProfessionalApp,
  isProfessionalAppUser,
  PROFESSIONAL_APP_HOME_PATH,
  PROFESSIONAL_APP_LANDING_PATH,
} from '../features/native/professionalApp';
import { PublicLayout } from '../layouts/PublicLayout';
import { HomePage } from '../pages/public/HomePage';

export function RootEntryRoute() {
  const { status, user } = useAuth();

  if (!isNativeProfessionalApp()) {
    return (
      <PublicLayout>
        <HomePage />
      </PublicLayout>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-5">
        <div className="rounded-[1.5rem] border border-cyan-100 bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-sm">
          Restaurando o acesso do app profissional...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={PROFESSIONAL_APP_LANDING_PATH} replace />;
  }

  if (!isProfessionalAppUser(user)) {
    return <Navigate to={buildProfessionalAppOnlyLoginPath()} replace />;
  }

  return <Navigate to={PROFESSIONAL_APP_HOME_PATH} replace />;
}
