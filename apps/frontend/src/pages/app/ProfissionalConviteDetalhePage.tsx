import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import {
  formatConviteProfissionalRating,
  formatCurrency,
  formatDateTime,
  formatInviteLocation,
  getStatusConviteEfetivo,
  getTipoServicoLabel,
  isConviteAtivo,
} from '../../features/profissional/convites/conviteLabels';
import { aceitarConvite, buscarConvite, recusarConvite } from '../../features/profissional/convites/convitesApi';
import { ConviteStatusBadge } from '../../features/profissional/convites/ConviteStatusBadge';
import type { ConviteProfissional, ConviteResposta } from '../../features/profissional/convites/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  convites: ['profissional', 'convites'],
  detalhe: (id: number) => ['profissional', 'convites', id],
};

type Feedback = {
  tone: 'error' | 'success' | 'info';
  title: string;
  message: string;
  details?: string[];
};

type ConviteAction = 'aceitar' | 'recusar';

export function ProfissionalConviteDetalhePage() {
  const { id } = useParams();
  const conviteId = Number(id);
  const validId = Number.isFinite(conviteId) && conviteId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingAction, setPendingAction] = useState<ConviteAction | null>(null);

  const conviteQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(conviteId) : ['profissional', 'convites', 'invalid'],
    queryFn: () => buscarConvite(requireToken(token), conviteId),
    enabled: Boolean(token && validId),
  });

  const protectedError = useMemo(
    () => (conviteQuery.error instanceof ApiError && conviteQuery.error.status === 401 ? conviteQuery.error : null),
    [conviteQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const responseMutation = useMutation({
    mutationFn: (action: ConviteAction) => {
      const activeToken = requireToken(token);
      return action === 'aceitar' ? aceitarConvite(activeToken, conviteId) : recusarConvite(activeToken, conviteId);
    },
    onMutate: (action) => {
      setPendingAction(action);
      setFeedback(null);
    },
    onSuccess: async (response, action) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.convites }),
        queryClient.invalidateQueries({ queryKey: queryKeys.detalhe(conviteId) }),
      ]);
      setFeedback({
        tone: 'success',
        title: action === 'aceitar' ? 'Convite aceito' : 'Convite recusado',
        message: buildSuccessMessage(action, response),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível responder ao convite',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
    onSettled: () => {
      setPendingAction(null);
    },
  });

  function handleRespond(action: ConviteAction) {
    const confirmed = window.confirm(
      action === 'aceitar'
        ? 'Aceitar este convite? O atendimento será criado se o convite ainda estiver válido.'
        : 'Recusar este convite? Esta resposta será registrada para a solicitação.',
    );

    if (!confirmed) {
      return;
    }

    responseMutation.mutate(action);
  }

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Convite inválido" message="O identificador do convite não é válido." />
        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/profissional/convites">
          Voltar para convites
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profissional</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe do convite</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Confira data, local, prazo e o valor para você antes de aceitar ou recusar.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/profissional/convites"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {conviteQuery.isLoading && <StateBox tone="loading" title="Carregando convite" description="Buscando dados completos do convite." />}

      {conviteQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o convite"
          message={getApiErrorMessage(conviteQuery.error)}
          details={conviteQuery.error instanceof ApiError ? conviteQuery.error.errors : []}
        />
      )}

      {conviteQuery.data && (
        <ConviteDetail
          convite={conviteQuery.data}
          isResponding={responseMutation.isPending}
          pendingAction={pendingAction}
          onRespond={handleRespond}
        />
      )}
    </div>
  );
}

function ConviteDetail({
  convite,
  isResponding,
  onRespond,
  pendingAction,
}: {
  convite: ConviteProfissional;
  isResponding: boolean;
  onRespond: (action: ConviteAction) => void;
  pendingAction: ConviteAction | null;
}) {
  const canRespond = isConviteAtivo(convite);
  const statusEfetivo = getStatusConviteEfetivo(convite);

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Convite #{convite.conviteId}</h2>
        <ConviteStatusBadge status={statusEfetivo} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Solicitação" value={`#${convite.solicitacaoId}`} />
        <DetailItem label="Tipo de serviço" value={getTipoServicoLabel(convite.tipoServico)} />
        {convite.profissionalNome && (
          <DetailItem label="Profissional" value={`${convite.profissionalNome} · ${formatConviteProfissionalRating(convite)}`} />
        )}
        <DetailItem label="Data e hora" value={formatDateTime(convite.dataHoraDesejada)} />
        <DetailItem label="Duração estimada" value={`${convite.duracaoEstimadaHoras} horas`} />
        <DetailItem
          label="Região"
          value={formatInviteLocation({
            bairro: convite.bairro,
            cidade: convite.cidade,
            estado: convite.estado,
          })}
        />
        <DetailItem label="Valor para você" value={formatCurrency(Number(convite.valorEstimadoProfissional))} />
        <DetailItem label="Enviado em" value={formatDateTime(convite.enviadoEm)} />
        <DetailItem label="Expira em" value={formatDateTime(convite.expiraEm)} />
      </dl>

      {canRespond ? (
        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <button
            className="min-h-11 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isResponding}
            type="button"
            onClick={() => onRespond('aceitar')}
          >
            {pendingAction === 'aceitar' ? 'Aceitando...' : 'Aceitar convite'}
          </button>
          <button
            className="min-h-11 rounded-lg border border-red-100 px-5 text-sm font-black text-red-700 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={isResponding}
            type="button"
            onClick={() => onRespond('recusar')}
          >
            {pendingAction === 'recusar' ? 'Recusando...' : 'Recusar convite'}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <FormAlert
            tone="info"
            message={
              statusEfetivo === 'EXPIRADO'
                ? 'Este convite expirou e não está mais disponível para resposta.'
                : 'Este convite não está mais disponível para resposta.'
            }
          />
        </div>
      )}
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}


function buildSuccessMessage(action: ConviteAction, response: ConviteResposta) {
  if (action === 'aceitar') {
    return response.atendimentoId
      ? `O backend registrou o aceite e criou o atendimento #${response.atendimentoId}.`
      : 'O backend registrou o aceite do convite.';
  }

  return 'O backend registrou a recusa do convite.';
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
