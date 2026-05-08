import { Link } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { useAuth } from '../../features/auth/useAuth';
import type { AdminDashboardIndicadores } from '../../features/dashboard/dashboardApi';
import { useDashboardIndicators } from '../../features/dashboard/useDashboardIndicators';
import { getApiErrorMessage } from '../../services/apiClient';
import { DashboardHeader } from './DashboardCards';

type AdminAlert = {
  count: number;
  label: string;
  href: string;
};

type OperationalCard = {
  title: string;
  value: number;
  description: string;
  cta: string;
  href: string;
};

export function AdminDashboardPage() {
  const { token } = useAuth();
  const { admin, error, isError, isLoading } = useDashboardIndicators('ADMIN', token);
  const alerts = buildAlerts(admin);
  const cards = buildCards(admin);

  return (
    <div className="grid gap-5">
      <DashboardHeader
        title="Administração"
        description="Acompanhe pendências operacionais e acesse rapidamente as áreas de gestão."
      />

      {isLoading && <StateBox tone="loading" title="Carregando indicadores" description="Buscando pendências operacionais." />}

      {isError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar o resumo"
          message={getApiErrorMessage(error)}
        />
      )}

      {!isLoading && !isError && (
        <>
          <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Operação</p>
              <h2 className="text-2xl font-black text-slate-900">Pendências que precisam de atenção</h2>
            </div>

            {alerts.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {alerts.map((alert) => (
                  <Link
                    key={alert.label}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 transition hover:border-red-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                    to={alert.href}
                  >
                    <span>{alert.label}</span>
                    <span className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-black text-white">{alert.count}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-900">
                Nenhuma pendência crítica no momento.
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Atalhos operacionais">
            {cards.map((card) => (
              <OperationalCard key={card.title} card={card} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function OperationalCard({ card }: { card: OperationalCard }) {
  return (
    <article className="flex min-h-[220px] flex-col rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-3xl font-black tracking-normal text-slate-900">{card.value}</p>
          <h2 className="mt-2 text-lg font-black text-slate-900">{card.title}</h2>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-lg font-black text-cyan-700">
          {card.title.charAt(0)}
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{card.description}</p>
      <Link
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        to={card.href}
      >
        {card.cta}
      </Link>
    </article>
  );
}

function buildAlerts(indicadores: AdminDashboardIndicadores): AdminAlert[] {
  const pagamentosAtencao =
    indicadores.pagamentosPendentes +
    indicadores.pagamentosAguardandoConfirmacao +
    indicadores.pagamentosFalhos;

  return [
    {
      count: indicadores.verificacoesPendentes,
      label: formatCount(indicadores.verificacoesPendentes, 'verificação aguardando análise', 'verificações aguardando análise'),
      href: '/app/admin/verificacoes',
    },
    {
      count: indicadores.profissionaisPendentes,
      label: formatCount(indicadores.profissionaisPendentes, 'profissional aguardando aprovação', 'profissionais aguardando aprovação'),
      href: '/app/admin/profissionais',
    },
    {
      count: indicadores.ocorrenciasAbertas,
      label: formatCount(indicadores.ocorrenciasAbertas, 'ocorrência aberta', 'ocorrências abertas'),
      href: '/app/admin/ocorrencias',
    },
    {
      count: indicadores.ocorrenciasEmAnalise,
      label: formatCount(indicadores.ocorrenciasEmAnalise, 'ocorrência em análise', 'ocorrências em análise'),
      href: '/app/admin/ocorrencias',
    },
    {
      count: indicadores.atendimentosEmAnalise,
      label: formatCount(indicadores.atendimentosEmAnalise, 'atendimento em análise', 'atendimentos em análise'),
      href: '/app/admin/atendimentos',
    },
    {
      count: pagamentosAtencao,
      label: formatCount(pagamentosAtencao, 'pagamento exigindo atenção', 'pagamentos exigindo atenção'),
      href: '/app/admin/pagamentos',
    },
    {
      count: indicadores.solicitacoesAbertas,
      label: formatCount(indicadores.solicitacoesAbertas, 'solicitação aberta ou em andamento', 'solicitações abertas ou em andamento'),
      href: '/app/admin/solicitacoes',
    },
  ].filter((alert) => alert.count > 0);
}

function buildCards(indicadores: AdminDashboardIndicadores): OperationalCard[] {
  const pagamentosAtencao =
    indicadores.pagamentosPendentes +
    indicadores.pagamentosAguardandoConfirmacao +
    indicadores.pagamentosFalhos;
  const ocorrenciasAtencao = indicadores.ocorrenciasAbertas + indicadores.ocorrenciasEmAnalise;

  return [
    {
      title: 'Verificações',
      value: indicadores.verificacoesPendentes,
      description: 'Documentos aguardando análise.',
      cta: 'Revisar verificações',
      href: '/app/admin/verificacoes',
    },
    {
      title: 'Profissionais',
      value: indicadores.profissionaisPendentes,
      description: 'Perfis aguardando aprovação operacional.',
      cta: 'Revisar profissionais',
      href: '/app/admin/profissionais',
    },
    {
      title: 'Ocorrências',
      value: ocorrenciasAtencao,
      description: 'Registros abertos ou em análise.',
      cta: 'Ver ocorrências',
      href: '/app/admin/ocorrencias',
    },
    {
      title: 'Pagamentos',
      value: pagamentosAtencao,
      description: 'Pagamentos pendentes, aguardando confirmação ou falhos.',
      cta: 'Ver pagamentos',
      href: '/app/admin/pagamentos',
    },
    {
      title: 'Atendimentos',
      value: indicadores.atendimentosEmAnalise,
      description: 'Atendimentos em análise operacional.',
      cta: 'Ver atendimentos',
      href: '/app/admin/atendimentos',
    },
    {
      title: 'Solicitações',
      value: indicadores.solicitacoesAbertas,
      description: 'Solicitações abertas ou em andamento.',
      cta: 'Ver solicitações',
      href: '/app/admin/solicitacoes',
    },
    {
      title: 'Usuários',
      value: indicadores.usuariosTotal,
      description: 'Acesso rápido à gestão de contas cadastradas.',
      cta: 'Ver usuários',
      href: '/app/admin/usuarios',
    },
  ];
}

function formatCount(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
