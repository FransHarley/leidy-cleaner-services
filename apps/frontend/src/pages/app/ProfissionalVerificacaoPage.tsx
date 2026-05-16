import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import {
  buscarMinhaVerificacao,
  registrarDocumentoVerificacao,
} from '../../features/profissional/perfil/profissionalApi';
import type {
  DocumentoVerificacaoRequest,
  StatusVerificacao,
} from '../../features/profissional/perfil/types';
import { VerificacaoDocumentalForm } from '../../features/profissional/verificacao/VerificacaoDocumentalForm';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  verificacao: ['profissional', 'verificacao'],
};

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function ProfissionalVerificacaoPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const verificacaoQuery = useQuery({
    queryKey: queryKeys.verificacao,
    queryFn: () => buscarMinhaVerificacao(requireToken(token)),
    enabled: Boolean(token),
    retry: (failureCount, error) => (isVerificationNotFound(error) ? false : failureCount < 2),
  });

  const protectedError = useMemo(
    () =>
      verificacaoQuery.error instanceof ApiError && verificacaoQuery.error.status === 401 ? verificacaoQuery.error : null,
    [verificacaoQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const submitMutation = useMutation({
    mutationFn: (payload: DocumentoVerificacaoRequest) => registrarDocumentoVerificacao(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.verificacao });
      setFeedback({ tone: 'success', title: 'Verificação registrada', message: 'Os dados foram enviados para análise.' });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível registrar verificação',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const verificacaoNotFound = isVerificationNotFound(verificacaoQuery.error);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profissional</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Verificação documental</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Acompanhe sua análise e envie os dados necessários para concluir a verificação.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/profissional"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      <section className="grid gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        {verificacaoQuery.isLoading && (
          <StateBox tone="loading" title="Carregando verificação" description="Buscando seu status documental atual." />
        )}
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
              <h2 className="text-lg font-black text-slate-900">{verificacaoQuery.data.tipoDocumento}</h2>
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
          isSubmitting={submitMutation.isPending}
          onSubmit={async (payload) => {
            setFeedback(null);
            await submitMutation.mutateAsync(payload);
          }}
        />
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: StatusVerificacao }) {
  const statusInfo = getStatusInfo(status);

  return (
    <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
}

function getStatusInfo(status: StatusVerificacao) {
  const map: Record<StatusVerificacao, { label: string; className: string }> = {
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
