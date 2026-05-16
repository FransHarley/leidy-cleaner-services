import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { ProfissionalProfileForm } from '../../features/profissional/perfil/ProfissionalProfileForm';
import { atualizarMeuPerfilProfissional, buscarMeuPerfilProfissional } from '../../features/profissional/perfil/profissionalApi';
import type {
  AtualizarPerfilProfissionalRequest,
  PerfilProfissional,
  StatusAprovacaoProfissional,
} from '../../features/profissional/perfil/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  perfil: ['profissional', 'perfil'],
};

export function ProfessionalMobilePerfilPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: 'error' | 'success';
    title: string;
    message: string;
    details?: string[];
  } | null>(null);

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil,
    queryFn: () => buscarMeuPerfilProfissional(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () => (perfilQuery.error instanceof ApiError && perfilQuery.error.status === 401 ? perfilQuery.error : null),
    [perfilQuery.error],
  );

  const updateProfileMutation = useMutation({
    mutationFn: (payload: AtualizarPerfilProfissionalRequest) => atualizarMeuPerfilProfissional(requireToken(token), payload),
    onMutate: () => {
      setFeedback(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.perfil });
      await perfilQuery.refetch();
      setIsEditing(false);
      setFeedback({
        tone: 'success',
        title: 'Perfil atualizado',
        message: 'Seus dados profissionais foram salvos com sucesso.',
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
        title: buildUpdateErrorTitle(error),
        message: buildUpdateErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  return (
    <div className="grid gap-4">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Perfil</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Perfil profissional</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Consulte seus dados de apresentacao e seu status atual sem precisar abrir a area completa de onboarding.
        </p>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {perfilQuery.isLoading && (
        <StateBox
          tone="loading"
          title="Carregando perfil"
          description="Buscando suas informacoes profissionais."
          className="rounded-[1.75rem]"
        />
      )}

      {perfilQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar o perfil"
          message={getApiErrorMessage(perfilQuery.error)}
          details={perfilQuery.error instanceof ApiError ? perfilQuery.error.errors : []}
        />
      )}

      {perfilQuery.isSuccess && !perfilQuery.data && (
        <StateBox
          tone="empty"
          title="Perfil ainda nao configurado"
          description="Assim que seus dados profissionais estiverem disponiveis, eles aparecerao aqui."
          className="rounded-[1.75rem]"
        />
      )}

      {perfilQuery.data && (
        <>
          <ProfessionalMobileProfileCard perfil={perfilQuery.data} />

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Dados editaveis</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Atualize seus dados permitidos de perfil e sua disponibilidade para receber chamados. Status, notas e
                  informacoes administrativas continuam bloqueados.
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={updateProfileMutation.isPending}
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setIsEditing((current) => !current);
                }}
              >
                {isEditing ? 'Fechar edicao' : 'Editar perfil'}
              </button>
            </div>

            {isEditing && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <ProfissionalProfileForm
                  perfil={perfilQuery.data}
                  isSubmitting={updateProfileMutation.isPending}
                  onSubmit={handleProfileSubmit}
                />
              </div>
            )}
          </section>
        </>
      )}

      <div className="grid gap-3">
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          to="/app/profissional/perfil"
        >
          Abrir perfil completo atual
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          to="/profissional/app"
        >
          Voltar para a home mobile
        </Link>
      </div>
    </div>
  );

  async function handleProfileSubmit(payload: AtualizarPerfilProfissionalRequest) {
    if (updateProfileMutation.isPending) {
      return;
    }

    await updateProfileMutation.mutateAsync(payload);
  }
}

function ProfessionalMobileProfileCard({ perfil }: { perfil: PerfilProfissional }) {
  const avatarFallback = getInitials(perfil.nomeExibicao);
  const statusAprovacao = getStatusInfo(perfil.statusAprovacao);
  const recebimentoChamados = perfil.ativoParaReceberChamados ? 'Ativa para receber chamados' : 'Indisponivel para novos chamados';

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {perfil.fotoPerfilUrl ? (
          <img
            alt={`Foto de perfil de ${perfil.nomeExibicao}`}
            className="h-20 w-20 rounded-[1.5rem] object-cover shadow-sm"
            src={perfil.fotoPerfilUrl}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-cyan-100 text-2xl font-black text-cyan-700 shadow-sm">
            {avatarFallback}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Apresentacao</p>
          <h3 className="mt-2 break-words text-2xl font-black text-slate-900">{perfil.nomeExibicao}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex rounded-2xl px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusAprovacao.className}`}>
              {statusAprovacao.label}
            </span>
            <span
              className={[
                'inline-flex rounded-2xl px-3 py-1 text-xs font-black uppercase tracking-[0.12em]',
                perfil.ativoParaReceberChamados ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-100 text-slate-700',
              ].join(' ')}
            >
              {recebimentoChamados}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <MobileDetailItem
          label="Descricao"
          value={perfil.descricao?.trim() ? perfil.descricao : 'Voce ainda nao cadastrou uma descricao profissional.'}
          muted={!perfil.descricao?.trim()}
        />
        <MobileDetailItem label="Experiencia" value={formatExperience(perfil.experienciaAnos)} />
        <MobileDetailItem label="Avaliacoes" value={formatRating(perfil.notaMedia, perfil.totalAvaliacoes)} />
        <MobileDetailItem label="Atualizado em" value={formatDateTime(perfil.atualizadoEm)} />
      </div>
    </section>
  );
}

function MobileDetailItem({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={['mt-1 text-sm font-semibold leading-6', muted ? 'text-slate-500' : 'text-slate-800'].join(' ')}>{value}</p>
    </div>
  );
}

function getStatusInfo(status: StatusAprovacaoProfissional) {
  const map: Record<StatusAprovacaoProfissional, { label: string; className: string }> = {
    PENDENTE: { label: 'Pendente', className: 'bg-amber-50 text-amber-800' },
    EM_ANALISE: { label: 'Em analise', className: 'bg-blue-50 text-blue-800' },
    APROVADO: { label: 'Aprovado', className: 'bg-cyan-50 text-cyan-700' },
    REJEITADO: { label: 'Rejeitado', className: 'bg-red-50 text-red-700' },
  };

  return map[status];
}

function buildUpdateErrorTitle(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return 'Voce nao pode editar este perfil';
  }

  return 'Nao foi possivel salvar o perfil';
}

function buildUpdateErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return 'Voce nao tem permissao para atualizar estes dados.';
  }

  return getApiErrorMessage(error);
}

function formatExperience(experienciaAnos: number) {
  return `${experienciaAnos} ano${experienciaAnos === 1 ? '' : 's'} de experiencia`;
}

function formatRating(notaMedia: number, totalAvaliacoes: number) {
  if (totalAvaliacoes <= 0) {
    return 'Sem avaliacoes ainda';
  }

  const nota = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(notaMedia));

  return `${nota} · ${totalAvaliacoes} avaliacao${totalAvaliacoes === 1 ? '' : 'oes'}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'P';
}

function requireToken(token: string | null) {
  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sessao expirada. Entre novamente.',
    });
  }

  return token;
}
