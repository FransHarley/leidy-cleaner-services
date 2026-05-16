import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { formatOcorrenciaDateTime, formatOptionalId } from '../../features/ocorrencias/ocorrenciaLabels';
import { buscarOcorrencia } from '../../features/ocorrencias/ocorrenciasApi';
import { OcorrenciaStatusBadge } from '../../features/ocorrencias/OcorrenciaStatusBadge';
import { OcorrenciaTipoBadge } from '../../features/ocorrencias/OcorrenciaTipoBadge';
import type { OcorrenciaAtendimento } from '../../features/ocorrencias/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  detalhe: (id: number) => ['ocorrencias', 'profissional', 'mobile', id],
};

export function ProfessionalMobileOcorrenciaDetalhePage() {
  const { id } = useParams();
  const ocorrenciaId = Number(id);
  const validId = Number.isFinite(ocorrenciaId) && ocorrenciaId > 0;
  const { token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const ocorrenciaQuery = useQuery({
    queryKey: validId ? queryKeys.detalhe(ocorrenciaId) : ['ocorrencias', 'profissional', 'mobile', 'invalid'],
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
      <div className="grid gap-4">
        <FormAlert tone="error" title="Ocorrencia invalida" message="O identificador informado para esta ocorrencia nao e valido." />
        <MobileBackLink />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Ocorrencia</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Detalhe da ocorrencia</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Consulte a descricao do problema e acompanhe a situacao atual informada pela administracao.
        </p>
      </section>

      {location.state && isFeedbackState(location.state) && (
        <FormAlert
          tone={location.state.feedback.tone}
          title={location.state.feedback.title}
          message={location.state.feedback.message}
        />
      )}

      {ocorrenciaQuery.isLoading && (
        <StateBox
          tone="loading"
          title="Carregando ocorrencia"
          description="Buscando os dados completos desta ocorrencia."
          className="rounded-[1.75rem]"
        />
      )}

      {ocorrenciaQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar a ocorrencia"
          message={getApiErrorMessage(ocorrenciaQuery.error)}
          details={ocorrenciaQuery.error instanceof ApiError ? ocorrenciaQuery.error.errors : []}
        />
      )}

      {ocorrenciaQuery.data && <ProfessionalMobileOcorrenciaDetailCard ocorrencia={ocorrenciaQuery.data} />}

      <MobileBackLink />
    </div>
  );
}

function ProfessionalMobileOcorrenciaDetailCard({ ocorrencia }: { ocorrencia: OcorrenciaAtendimento }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-black text-slate-900">Ocorrencia #{ocorrencia.id}</h3>
        <OcorrenciaStatusBadge status={ocorrencia.status} />
        <OcorrenciaTipoBadge tipo={ocorrencia.tipo} />
      </div>

      <div className="mt-5 grid gap-4">
        <MobileDetailItem label="Atendimento relacionado" value={`#${ocorrencia.atendimentoId}`} />
        <MobileDetailItem label="Criada em" value={formatOcorrenciaDateTime(ocorrencia.criadoEm)} />
        <MobileDetailItem label="Resolvida em" value={formatOcorrenciaDateTime(ocorrencia.resolvidoEm)} />
        <MobileDetailItem label="Resolvida por" value={formatOptionalId(ocorrencia.resolvidoPorUsuarioId)} />
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-500">Descricao</p>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">{ocorrencia.descricao}</p>
      </div>
    </section>
  );
}

function MobileDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function MobileBackLink() {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
      to="/profissional/app/ocorrencias"
    >
      Voltar para ocorrencias
    </Link>
  );
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

function isFeedbackState(value: unknown): value is { feedback: { tone: 'success' | 'error' | 'info'; title?: string; message: string } } {
  if (!value || typeof value !== 'object' || !('feedback' in value)) {
    return false;
  }

  const feedback = (value as { feedback?: unknown }).feedback;
  return Boolean(feedback && typeof feedback === 'object' && 'message' in feedback && 'tone' in feedback);
}
