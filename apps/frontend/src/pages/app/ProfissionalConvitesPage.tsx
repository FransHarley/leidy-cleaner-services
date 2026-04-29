import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { ConviteCard } from '../../features/profissional/convites/ConviteCard';
import { listarMeusConvites } from '../../features/profissional/convites/convitesApi';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  convites: ['profissional', 'convites'],
};

export function ProfissionalConvitesPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const convitesQuery = useQuery({
    queryKey: queryKeys.convites,
    queryFn: () => listarMeusConvites(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () => (convitesQuery.error instanceof ApiError && convitesQuery.error.status === 401 ? convitesQuery.error : null),
    [convitesQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const convites = convitesQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Profissional</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Convites recebidos</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Acompanhe os convites de solicitações enviados para você e responda dentro do prazo indicado.
        </p>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Meus convites</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Abra um convite para ver os dados completos antes de aceitar ou recusar.
          </p>
        </div>

        {convitesQuery.isLoading && <StateBox tone="loading" title="Carregando convites" description="Buscando seus convites recebidos." />}

        {convitesQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar convites"
            message={getApiErrorMessage(convitesQuery.error)}
            details={convitesQuery.error instanceof ApiError ? convitesQuery.error.errors : []}
          />
        )}

        {convitesQuery.isSuccess && convites.length === 0 && (
          <StateBox tone="empty" title="Nenhum convite recebido" description="Quando uma solicitação for enviada para você, ela aparecerá aqui." />
        )}

        {convites.length > 0 && (
          <div className="grid gap-4">
            {convites.map((convite) => (
              <ConviteCard key={convite.conviteId} convite={convite} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


function requireToken(token: string | null) {
  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sessão expirada. Entre novamente.',
    });
  }

  return token;
}
