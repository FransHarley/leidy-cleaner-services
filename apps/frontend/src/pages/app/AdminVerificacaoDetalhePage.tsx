import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AnaliseVerificacaoForm } from '../../features/admin/verificacoes/AnaliseVerificacaoForm';
import {
  analisarVerificacaoAdmin,
  buscarVerificacaoAdmin,
} from '../../features/admin/verificacoes/adminVerificacoesApi';
import { formatAdminDateTime, formatOptionalText } from '../../features/admin/verificacoes/verificacaoLabels';
import { VerificacaoStatusBadge } from '../../features/admin/verificacoes/VerificacaoStatusBadge';
import type { AnalisarDocumentoVerificacaoRequest, DocumentoVerificacaoAdmin } from '../../features/admin/verificacoes/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  list: ['admin', 'verificacoes'],
  detalhe: (id: number) => ['admin', 'verificacoes', id],
};

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function AdminVerificacaoDetalhePage() {
  const { id } = useParams();
  const verificacaoId = Number(id);
  const validId = Number.isFinite(verificacaoId) && verificacaoId > 0;
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const verificacaoQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(verificacaoId) : ['admin', 'verificacoes', 'invalid'],
    queryFn: () => buscarVerificacaoAdmin(requireToken(token), verificacaoId),
    enabled: Boolean(token && validId),
  });

  const analisarMutation = useMutation({
    mutationFn: (payload: AnalisarDocumentoVerificacaoRequest) =>
      analisarVerificacaoAdmin(requireToken(token), verificacaoId, payload),
    onSuccess: async () => {
      setFeedback({
        tone: 'success',
        title: 'Análise salva',
        message: 'A verificação foi atualizada pelo backend.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.detalhe(verificacaoId) }),
      ]);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível salvar a análise',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  const protectedError = useMemo(
    () => (verificacaoQuery.error instanceof ApiError && verificacaoQuery.error.status === 401 ? verificacaoQuery.error : null),
    [verificacaoQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  function handleAnaliseSubmit(payload: AnalisarDocumentoVerificacaoRequest) {
    setFeedback(null);
    analisarMutation.mutate(payload);
  }

  if (!validId) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="error" title="Verificação inválida" message="O identificador da verificação não é válido." />
        <Link className="font-black text-green-700 hover:text-green-800" to="/app/admin/verificacoes">
          Voltar para verificações
        </Link>
      </div>
    );
  }

  const verificacao = verificacaoQuery.data;

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Detalhe da verificação</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Consulte os campos retornados pelo backend e registre a análise documental.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-green-100 px-5 text-sm font-black text-green-700 transition hover:bg-green-50"
            to="/app/admin/verificacoes"
          >
            Voltar
          </Link>
        </div>
      </section>

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {verificacaoQuery.isLoading && <StateBox tone="loading" title="Carregando verificação" description="Buscando dados documentais." />}

      {verificacaoQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar a verificação"
          message={getApiErrorMessage(verificacaoQuery.error)}
          details={verificacaoQuery.error instanceof ApiError ? verificacaoQuery.error.errors : []}
        />
      )}

      {verificacao && (
        <>
          <VerificacaoInfoPanel verificacao={verificacao} />
          <AnaliseVerificacaoForm
            initialStatus={verificacao.statusVerificacao}
            isSubmitting={analisarMutation.isPending}
            onSubmit={handleAnaliseSubmit}
          />
        </>
      )}
    </div>
  );
}

function VerificacaoInfoPanel({ verificacao }: { verificacao: DocumentoVerificacaoAdmin }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Verificação #{verificacao.id}</h2>
        <VerificacaoStatusBadge status={verificacao.statusVerificacao} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Usuário" value={`#${verificacao.usuarioId}`} />
        <DetailItem label="Tipo de documento" value={verificacao.tipoDocumento} />
        <DetailItem label="Número" value={verificacao.numeroDocumento} />
        <DetailItem label="Criado em" value={formatAdminDateTime(verificacao.criadoEm)} />
        <DetailItem label="Analisado por" value={formatOptionalText(verificacao.analisadoPorUsuarioId)} />
        <DetailItem label="Analisado em" value={formatAdminDateTime(verificacao.analisadoEm)} />
        <DetailItem label="Observação" value={formatOptionalText(verificacao.observacaoAnalise)} />
      </dl>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <DocumentReference label="Documento frente" value={verificacao.documentoFrenteUrl} />
        <DocumentReference label="Documento verso" value={verificacao.documentoVersoUrl} />
        <DocumentReference label="Selfie" value={verificacao.selfieUrl} />
        <DocumentReference label="Comprovante de residência" value={verificacao.comprovanteResidenciaUrl} />
      </div>
    </section>
  );
}

function DocumentReference({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {value ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-800">Referência registrada</span>
          {isExternalUrl(value) && (
            <a
              className="text-sm font-black text-green-700 hover:text-green-800"
              href={value}
              rel="noreferrer"
              target="_blank"
            >
              Abrir
            </a>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-500">Não informado</p>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}


function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
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
