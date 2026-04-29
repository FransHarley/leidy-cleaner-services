import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { buscarAtendimentoAdmin, listarCheckpointsAtendimentoAdmin } from '../../features/admin/atendimentos/adminAtendimentosApi';
import { AtendimentoInfoPanel } from '../../features/atendimentos/AtendimentoInfoPanel';
import { CheckpointsList } from '../../features/atendimentos/CheckpointsList';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['admin', 'atendimentos', id],
  checkpoints: (id: number) => ['admin', 'atendimentos', id, 'checkpoints'],
};

export function AdminAtendimentoDetalhePage() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const validId = Number.isFinite(atendimentoId) && atendimentoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const atendimentoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(atendimentoId) : ['admin', 'atendimentos', 'invalid'],
    queryFn: () => buscarAtendimentoAdmin(requireToken(token), atendimentoId),
    enabled: Boolean(token && validId),
    retry: false,
  });

  const checkpointsQuery = useQuery({
    queryKey: validId ? queryKeys.checkpoints(atendimentoId) : ['admin', 'atendimentos', 'invalid', 'checkpoints'],
    queryFn: () => listarCheckpointsAtendimentoAdmin(requireToken(token), atendimentoId),
    enabled: Boolean(token && validId),
    retry: false,
  });

  const protectedError = useMemo(
    () =>
      [atendimentoQuery.error, checkpointsQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ) ?? null,
    [atendimentoQuery.error, checkpointsQuery.error],
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
        <FormAlert tone="error" title="Atendimento inválido" message="O identificador do atendimento não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/admin/atendimentos">
          Voltar para atendimentos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do atendimento</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte dados operacionais e checkpoints. Esta visão administrativa é somente leitura.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/admin/atendimentos"
          >
            Voltar
          </Link>
        </div>
      </section>

      <FormAlert
        tone="info"
        title="Visão somente leitura"
        message="A administração pode consultar o atendimento, mas início e finalização continuam restritos à profissional atribuída."
      />

      {atendimentoQuery.isLoading && <StateBox tone="loading" title="Carregando atendimento" description="Buscando os dados operacionais." />}

      {atendimentoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o atendimento"
          message={getApiErrorMessage(atendimentoQuery.error)}
          details={atendimentoQuery.error instanceof ApiError ? atendimentoQuery.error.errors : []}
        />
      )}

      {atendimentoQuery.data && <AtendimentoInfoPanel atendimento={atendimentoQuery.data} />}

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Checkpoints</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Registros de início e fim retornados pelo backend.</p>
        </div>

        {checkpointsQuery.isLoading && <StateBox tone="loading" title="Carregando checkpoints" description="Buscando registros do atendimento." />}

        {checkpointsQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar checkpoints"
            message={getApiErrorMessage(checkpointsQuery.error)}
            details={checkpointsQuery.error instanceof ApiError ? checkpointsQuery.error.errors : []}
          />
        )}

        {checkpointsQuery.data && <CheckpointsList checkpoints={checkpointsQuery.data} />}
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
