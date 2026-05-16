import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { DisponibilidadeForm } from '../../features/profissional/disponibilidades/DisponibilidadeForm';
import { DisponibilidadeList } from '../../features/profissional/disponibilidades/DisponibilidadeList';
import {
  atualizarDisponibilidade,
  atualizarMeuPerfilProfissional,
  buscarMeuPerfilProfissional,
  buscarMinhaVerificacao,
  criarDisponibilidade,
  definirMinhasRegioesProfissional,
  excluirDisponibilidade,
  listarMinhasDisponibilidades,
  listarMinhasRegioesProfissional,
  listarRegioesAtivas,
  registrarDocumentoVerificacao,
} from '../../features/profissional/perfil/profissionalApi';
import { ProfissionalProfileForm } from '../../features/profissional/perfil/ProfissionalProfileForm';
import type {
  AtualizarPerfilProfissionalRequest,
  DisponibilidadeProfissional,
  DisponibilidadeProfissionalRequest,
  DocumentoVerificacaoRequest,
  StatusAprovacaoProfissional,
  StatusVerificacao,
} from '../../features/profissional/perfil/types';
import { ProfissionalRegioesForm } from '../../features/profissional/regioes/ProfissionalRegioesForm';
import { VerificacaoDocumentalForm } from '../../features/profissional/verificacao/VerificacaoDocumentalForm';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  perfil: ['profissional', 'perfil'],
  regioes: ['regioes'],
  minhasRegioes: ['profissional', 'regioes'],
  disponibilidades: ['profissional', 'disponibilidades'],
  verificacao: ['profissional', 'verificacao'],
};

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function ProfissionalOnboardingPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editingDisponibilidade, setEditingDisponibilidade] = useState<DisponibilidadeProfissional | null>(null);
  const [deletingDisponibilidadeId, setDeletingDisponibilidadeId] = useState<number | null>(null);
  const [disponibilidadeFormKey, setDisponibilidadeFormKey] = useState(0);

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil,
    queryFn: () => buscarMeuPerfilProfissional(requireToken(token)),
    enabled: Boolean(token),
  });

  const regioesQuery = useQuery({
    queryKey: queryKeys.regioes,
    queryFn: listarRegioesAtivas,
  });

  const minhasRegioesQuery = useQuery({
    queryKey: queryKeys.minhasRegioes,
    queryFn: () => listarMinhasRegioesProfissional(requireToken(token)),
    enabled: Boolean(token),
  });

  const disponibilidadesQuery = useQuery({
    queryKey: queryKeys.disponibilidades,
    queryFn: () => listarMinhasDisponibilidades(requireToken(token)),
    enabled: Boolean(token),
  });

  const verificacaoQuery = useQuery({
    queryKey: queryKeys.verificacao,
    queryFn: () => buscarMinhaVerificacao(requireToken(token)),
    enabled: Boolean(token),
    retry: (failureCount, error) => {
      if (isVerificationNotFound(error)) {
        return false;
      }

      return failureCount < 2;
    },
  });

  const protectedError = useMemo(
    () =>
      [perfilQuery.error, minhasRegioesQuery.error, disponibilidadesQuery.error, verificacaoQuery.error].find(
        (error) => error instanceof ApiError && error.status === 401,
      ),
    [perfilQuery.error, minhasRegioesQuery.error, disponibilidadesQuery.error, verificacaoQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: AtualizarPerfilProfissionalRequest) => atualizarMeuPerfilProfissional(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.perfil });
      setFeedback({ tone: 'success', title: 'Perfil atualizado', message: 'Suas informações profissionais foram salvas.' });
    },
    onError: handleMutationError,
  });

  const saveRegionsMutation = useMutation({
    mutationFn: (regiaoIds: number[]) => definirMinhasRegioesProfissional(requireToken(token), { regiaoIds }),
    onSuccess: async (regioesSalvas) => {
      queryClient.setQueryData(queryKeys.minhasRegioes, regioesSalvas);
      await queryClient.invalidateQueries({ queryKey: queryKeys.minhasRegioes });
      setFeedback({ tone: 'success', title: 'Regiões atualizadas', message: 'Suas regiões de atendimento foram salvas.' });
    },
    onError: handleMutationError,
  });

  const createDisponibilidadeMutation = useMutation({
    mutationFn: (payload: DisponibilidadeProfissionalRequest) => criarDisponibilidade(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.disponibilidades });
      setEditingDisponibilidade(null);
      setDisponibilidadeFormKey((current) => current + 1);
      setFeedback({ tone: 'success', title: 'Disponibilidade criada', message: 'O horário foi adicionado à sua agenda semanal.' });
    },
    onError: handleMutationError,
  });

  const updateDisponibilidadeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DisponibilidadeProfissionalRequest }) =>
      atualizarDisponibilidade(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.disponibilidades });
      setEditingDisponibilidade(null);
      setDisponibilidadeFormKey((current) => current + 1);
      setFeedback({ tone: 'success', title: 'Disponibilidade atualizada', message: 'O horário foi salvo com sucesso.' });
    },
    onError: handleMutationError,
  });

  const deleteDisponibilidadeMutation = useMutation({
    mutationFn: (id: number) => excluirDisponibilidade(requireToken(token), id),
    onMutate: (id) => {
      setDeletingDisponibilidadeId(id);
      setFeedback(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.disponibilidades });
      setFeedback({ tone: 'success', title: 'Disponibilidade excluída', message: 'A agenda foi atualizada.' });
    },
    onError: handleMutationError,
    onSettled: () => {
      setDeletingDisponibilidadeId(null);
    },
  });

  const registerVerificationMutation = useMutation({
    mutationFn: (payload: DocumentoVerificacaoRequest) => registrarDocumentoVerificacao(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.verificacao });
      setFeedback({ tone: 'success', title: 'Verificação registrada', message: 'Os dados foram enviados para análise.' });
    },
    onError: handleMutationError,
  });

  function handleMutationError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      navigate('/entrar', { replace: true });
      return;
    }

    setFeedback({
      tone: 'error',
      title: 'Não foi possível concluir',
      message: getApiErrorMessage(error),
      details: error instanceof ApiError ? error.errors : [],
    });
  }

  async function handleDisponibilidadeSubmit(payload: DisponibilidadeProfissionalRequest) {
    setFeedback(null);

    if (editingDisponibilidade) {
      await updateDisponibilidadeMutation.mutateAsync({ id: editingDisponibilidade.id, payload });
      return;
    }

    await createDisponibilidadeMutation.mutateAsync(payload);
  }

  function handleDeleteDisponibilidade(disponibilidade: DisponibilidadeProfissional) {
    const confirmed = window.confirm('Excluir este horário de disponibilidade?');

    if (confirmed) {
      deleteDisponibilidadeMutation.mutate(disponibilidade.id);
    }
  }

  const isSavingDisponibilidade = createDisponibilidadeMutation.isPending || updateDisponibilidadeMutation.isPending;
  const disponibilidades = disponibilidadesQuery.data ?? [];
  const verificacaoNotFound = isVerificationNotFound(verificacaoQuery.error);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profissional</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Meu perfil e onboarding</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Complete seus dados profissionais, regioes, disponibilidade e verificacao documental para concluir seu cadastro.
        </p>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      <OnboardingSection title="Perfil profissional" description="Dados de apresentação e disponibilidade operacional para receber chamados.">
        {perfilQuery.isLoading && <StateBox tone="loading" title="Carregando perfil" description="Buscando suas informações profissionais." />}
        {perfilQuery.isError && !protectedError && (
          <FormAlert tone="error" title="Não foi possível carregar o perfil" message={getApiErrorMessage(perfilQuery.error)} />
        )}
        {perfilQuery.data && (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-3">
              <InfoItem label="Status de aprovação" value={<StatusBadge status={perfilQuery.data.statusAprovacao} />} />
              <InfoItem label="CPF" value={perfilQuery.data.cpf} />
              <InfoItem label="Avaliações" value={`${perfilQuery.data.totalAvaliacoes} avaliações · nota ${perfilQuery.data.notaMedia}`} />
            </div>
            <ProfissionalProfileForm
              perfil={perfilQuery.data}
              isSubmitting={updateProfileMutation.isPending}
              onSubmit={async (payload) => {
                setFeedback(null);
                await updateProfileMutation.mutateAsync(payload);
              }}
            />
          </div>
        )}
      </OnboardingSection>

      <OnboardingSection title="Regiões de atendimento" description="Selecione as regiões em que você atende para receber convites compatíveis.">
        {(regioesQuery.isLoading || minhasRegioesQuery.isLoading) && (
          <StateBox tone="loading" title="Carregando regiões" description="Buscando regiões ativas e suas seleções atuais." />
        )}
        {(regioesQuery.isError || minhasRegioesQuery.isError) && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar regiões"
            message={getApiErrorMessage(regioesQuery.error ?? minhasRegioesQuery.error)}
          />
        )}
        {regioesQuery.data && minhasRegioesQuery.data && (
          <ProfissionalRegioesForm
            regioes={regioesQuery.data}
            selectedRegioes={minhasRegioesQuery.data}
            isSubmitting={saveRegionsMutation.isPending}
            onSubmit={async (regiaoIds) => {
              setFeedback(null);
              await saveRegionsMutation.mutateAsync(regiaoIds);
            }}
          />
        )}
      </OnboardingSection>

      <OnboardingSection title="Disponibilidade semanal" description="Cadastre seus horarios recorrentes para mostrar quando voce pode atender.">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <h3 className="text-lg font-black text-slate-900">
            {editingDisponibilidade ? 'Editar disponibilidade' : 'Adicionar disponibilidade'}
          </h3>
          <div className="mt-4">
            <DisponibilidadeForm
              key={`${editingDisponibilidade?.id ?? 'nova'}-${disponibilidadeFormKey}`}
              initialDisponibilidade={editingDisponibilidade}
              isSubmitting={isSavingDisponibilidade}
              onCancel={editingDisponibilidade ? () => setEditingDisponibilidade(null) : undefined}
              onSubmit={handleDisponibilidadeSubmit}
            />
          </div>
        </div>

        {disponibilidadesQuery.isLoading && (
          <StateBox tone="loading" title="Carregando disponibilidades" description="Buscando seus horários cadastrados." />
        )}
        {disponibilidadesQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar disponibilidades"
            message={getApiErrorMessage(disponibilidadesQuery.error)}
          />
        )}
        {disponibilidadesQuery.isSuccess && disponibilidades.length === 0 && (
          <StateBox tone="empty" title="Nenhum horário cadastrado" description="Adicione seu primeiro horário de disponibilidade semanal." />
        )}
        {disponibilidades.length > 0 && (
          <DisponibilidadeList
            disponibilidades={disponibilidades}
            deletingId={deletingDisponibilidadeId}
            onDelete={handleDeleteDisponibilidade}
            onEdit={(disponibilidade) => {
              setFeedback(null);
              setEditingDisponibilidade(disponibilidade);
            }}
          />
        )}
      </OnboardingSection>

      <OnboardingSection title="Verificação documental" description="Informe os dados solicitados para analise documental.">
        {verificacaoQuery.isLoading && <StateBox tone="loading" title="Carregando verificação" description="Buscando seu status documental atual." />}
        {verificacaoQuery.isError && !verificacaoNotFound && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar verificação"
            message={getApiErrorMessage(verificacaoQuery.error)}
          />
        )}
        {verificacaoQuery.data && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-black text-slate-900">{verificacaoQuery.data.tipoDocumento}</h3>
              <StatusBadge status={verificacaoQuery.data.statusVerificacao} />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">Documento: {verificacaoQuery.data.numeroDocumento}</p>
            {verificacaoQuery.data.observacaoAnalise && (
              <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Observação da análise: {verificacaoQuery.data.observacaoAnalise}
              </p>
            )}
          </div>
        )}
        {verificacaoNotFound && (
          <StateBox tone="empty" title="Nenhuma verificação registrada" description="Envie seus dados documentais para iniciar a análise." />
        )}
        <VerificacaoDocumentalForm
          isSubmitting={registerVerificationMutation.isPending}
          onSubmit={async (payload) => {
            setFeedback(null);
            await registerVerificationMutation.mutateAsync(payload);
          }}
        />
      </OnboardingSection>
    </div>
  );
}

function OnboardingSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className="mt-2 font-bold text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusAprovacaoProfissional | StatusVerificacao }) {
  const statusInfo = getStatusInfo(status);

  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
}

function getStatusInfo(status: StatusAprovacaoProfissional | StatusVerificacao) {
  const map: Record<StatusAprovacaoProfissional | StatusVerificacao, { label: string; className: string }> = {
    PENDENTE: { label: 'Pendente', className: 'bg-amber-50 text-amber-800' },
    EM_ANALISE: { label: 'Em análise', className: 'bg-blue-50 text-blue-800' },
    APROVADO: { label: 'Aprovado', className: 'bg-cyan-50 text-cyan-700' },
    REJEITADO: { label: 'Rejeitado', className: 'bg-red-50 text-red-700' },
  };

  return map[status];
}

function isVerificationNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404 && error.code === 'VERIFICACAO_NOT_FOUND';
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
