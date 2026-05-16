import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import { formatOcorrenciaDateTime } from '../../features/ocorrencias/ocorrenciaLabels';
import { listarMinhasOcorrencias } from '../../features/ocorrencias/ocorrenciasApi';
import { OcorrenciaStatusBadge } from '../../features/ocorrencias/OcorrenciaStatusBadge';
import { OcorrenciaTipoBadge } from '../../features/ocorrencias/OcorrenciaTipoBadge';
import type { OcorrenciaAtendimento } from '../../features/ocorrencias/types';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  ocorrencias: ['ocorrencias', 'meus', 'profissional', 'mobile'],
};

type OccurrenceTab = 'abertas' | 'encerradas';

export function ProfessionalMobileOcorrenciasPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<OccurrenceTab>('abertas');

  const ocorrenciasQuery = useQuery({
    queryKey: queryKeys.ocorrencias,
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
  const abertas = sortOcorrencias(ocorrencias.filter((ocorrencia) => ocorrencia.status === 'ABERTA' || ocorrencia.status === 'EM_ANALISE'));
  const encerradas = sortOcorrencias(ocorrencias.filter((ocorrencia) => ocorrencia.status === 'RESOLVIDA' || ocorrencia.status === 'CANCELADA'));
  const visiveis = selectedTab === 'abertas' ? abertas : encerradas;

  return (
    <div className="grid gap-4">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Ocorrencias</p>
        <h2 className="mt-3 text-2xl font-black text-slate-900">Ocorrencias da profissional</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Acompanhe os registros ja abertos na sua conta e consulte o andamento de cada atendimento relacionado.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800"
          to="/profissional/app/ocorrencias/nova"
        >
          Abrir nova ocorrencia
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <TabButton count={abertas.length} isActive={selectedTab === 'abertas'} label="Em andamento" onClick={() => setSelectedTab('abertas')} />
        <TabButton count={encerradas.length} isActive={selectedTab === 'encerradas'} label="Encerradas" onClick={() => setSelectedTab('encerradas')} />
      </div>

      {ocorrenciasQuery.isLoading && (
        <StateBox
          tone="loading"
          title="Carregando ocorrencias"
          description="Buscando seus registros abertos e resolvidos."
          className="rounded-[1.75rem]"
        />
      )}

      {ocorrenciasQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Nao foi possivel carregar ocorrencias"
          message={getApiErrorMessage(ocorrenciasQuery.error)}
          details={ocorrenciasQuery.error instanceof ApiError ? ocorrenciasQuery.error.errors : []}
        />
      )}

      {ocorrenciasQuery.isSuccess && ocorrencias.length === 0 && (
        <StateBox
          tone="empty"
          title="Nenhuma ocorrencia encontrada"
          description="Quando uma ocorrencia for aberta para sua conta, ela aparecera aqui com o status atualizado."
          className="rounded-[1.75rem]"
        />
      )}

      {ocorrenciasQuery.isSuccess && ocorrencias.length > 0 && visiveis.length === 0 && (
        <StateBox
          tone="empty"
          title={selectedTab === 'abertas' ? 'Nenhuma ocorrencia em andamento' : 'Nenhuma ocorrencia encerrada'}
          description={
            selectedTab === 'abertas'
              ? 'As ocorrencias abertas ou em analise aparecerao nesta aba.'
              : 'Ocorrencias resolvidas ou canceladas aparecerao aqui.'
          }
          className="rounded-[1.75rem]"
        />
      )}

      {visiveis.length > 0 && (
        <div className="grid gap-3">
          {visiveis.map((ocorrencia) => (
            <ProfessionalMobileOcorrenciaSummaryCard key={ocorrencia.id} ocorrencia={ocorrencia} />
          ))}
        </div>
      )}

      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
        to="/profissional/app"
      >
        Voltar para a home mobile
      </Link>
    </div>
  );
}

function ProfessionalMobileOcorrenciaSummaryCard({ ocorrencia }: { ocorrencia: OcorrenciaAtendimento }) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-black text-slate-900">Ocorrencia #{ocorrencia.id}</h3>
        <OcorrenciaStatusBadge status={ocorrencia.status} />
        <OcorrenciaTipoBadge tipo={ocorrencia.tipo} />
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{ocorrencia.descricao}</p>

      <div className="mt-4 grid gap-3">
        <MobileDetailItem label="Atendimento" value={`#${ocorrencia.atendimentoId}`} />
        <MobileDetailItem label="Criada em" value={formatOcorrenciaDateTime(ocorrencia.criadoEm)} />
        <MobileDetailItem label="Resolvida em" value={formatOcorrenciaDateTime(ocorrencia.resolvidoEm)} />
      </div>

      <Link
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-cyan-100 bg-white px-4 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
        to={`/profissional/app/ocorrencias/${ocorrencia.id}`}
      >
        Ver detalhe
      </Link>
    </article>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        'min-h-12 rounded-[1.25rem] px-3 text-center text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700',
        isActive ? 'bg-cyan-700 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
      type="button"
      onClick={onClick}
    >
      <span className="block">{label}</span>
      <span className={['mt-1 block text-[0.7rem] font-semibold', isActive ? 'text-cyan-100' : 'text-slate-500'].join(' ')}>
        {count}
      </span>
    </button>
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

function sortOcorrencias(ocorrencias: OcorrenciaAtendimento[]) {
  return [...ocorrencias].sort((left, right) => new Date(right.criadoEm).getTime() - new Date(left.criadoEm).getTime());
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
