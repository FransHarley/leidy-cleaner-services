import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { OcorrenciaInfoPanel } from '../../features/ocorrencias/OcorrenciaInfoPanel';
import { buscarOcorrencia } from '../../features/ocorrencias/ocorrenciasApi';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['ocorrencias', id],
};

export function OcorrenciaDetalhePage() {
  const { id } = useParams();
  const ocorrenciaId = Number(id);
  const validId = Number.isFinite(ocorrenciaId) && ocorrenciaId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const ocorrenciaQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(ocorrenciaId) : ['ocorrencias', 'invalid'],
    queryFn: () => buscarOcorrencia(requireToken(token), ocorrenciaId),
    enabled: Boolean(token && validId),
  });

  const protectedError = useMemo(
    () => (ocorrenciaQuery.error instanceof ApiError && ocorrenciaQuery.error.status === 401 ? ocorrenciaQuery.error : null),
    [ocorrenciaQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Ocorrência inválida" message="O identificador da ocorrência não é válido." />
        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/ocorrencias">
          Voltar para ocorrências
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Ocorrências</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe da ocorrência</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte os detalhes desta ocorrencia. A atualizacao de status e feita pela administracao.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/ocorrencias"
          >
            Voltar
          </Link>
        </div>
      </section>

      {ocorrenciaQuery.isLoading && <StateBox tone="loading" title="Carregando ocorrência" description="Buscando o registro selecionado." />}

      {ocorrenciaQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar a ocorrência"
          message={getApiErrorMessage(ocorrenciaQuery.error)}
          details={ocorrenciaQuery.error instanceof ApiError ? ocorrenciaQuery.error.errors : []}
        />
      )}

      {ocorrenciaQuery.data && <OcorrenciaInfoPanel ocorrencia={ocorrenciaQuery.data} />}
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
