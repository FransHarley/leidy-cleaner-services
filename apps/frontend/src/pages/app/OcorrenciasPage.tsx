import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { OcorrenciaCard } from '../../features/ocorrencias/OcorrenciaCard';
import { listarMinhasOcorrencias } from '../../features/ocorrencias/ocorrenciasApi';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  minhas: ['ocorrencias', 'meus'],
};

export function OcorrenciasPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const ocorrenciasQuery = useQuery({
    queryKey: queryKeys.minhas,
    queryFn: () => listarMinhasOcorrencias(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () => (ocorrenciasQuery.error instanceof ApiError && ocorrenciasQuery.error.status === 401 ? ocorrenciasQuery.error : null),
    [ocorrenciasQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const ocorrencias = ocorrenciasQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Ocorrências</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Minhas ocorrências</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Acompanhe os registros abertos por voce e veja o andamento de cada um.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800"
            to="/app/ocorrencias/nova"
          >
            Nova ocorrência
          </Link>
        </div>
      </section>

      {ocorrenciasQuery.isLoading && <StateBox tone="loading" title="Carregando ocorrências" description="Buscando registros abertos por você." />}

      {ocorrenciasQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar ocorrências"
          message={getApiErrorMessage(ocorrenciasQuery.error)}
          details={ocorrenciasQuery.error instanceof ApiError ? ocorrenciasQuery.error.errors : []}
        />
      )}

      {ocorrenciasQuery.isSuccess && ocorrencias.length === 0 && (
        <StateBox tone="empty" title="Nenhuma ocorrência encontrada" description="Quando você abrir uma ocorrência, ela aparecerá aqui." />
      )}

      {ocorrencias.length > 0 && (
        <section className="grid gap-4">
          {ocorrencias.map((ocorrencia) => (
            <OcorrenciaCard key={ocorrencia.id} detailBasePath="/app/ocorrencias" ocorrencia={ocorrencia} />
          ))}
        </section>
      )}
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
