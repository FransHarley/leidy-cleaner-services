import { getFirstName } from '../../features/auth/session';
import { useAuth } from '../../features/auth/useAuth';
import { DashboardCards, DashboardHeader } from './DashboardCards';

const adminItems = [
  {
    title: 'Verificações',
    description: 'Revise documentos e registre a análise operacional.',
    href: '/app/admin/verificacoes',
  },
  {
    title: 'Profissionais',
    description: 'Acompanhe aprovação de perfis conforme contratos disponíveis.',
    href: '/app/admin/profissionais',
  },
  {
    title: 'Solicitações',
    description: 'Espaço reservado para supervisão das solicitações de faxina.',
  },
  {
    title: 'Atendimentos',
    description: 'Área futura para visão operacional de serviços confirmados.',
  },
  {
    title: 'Pagamentos',
    description: 'Base para consulta administrativa de pagamentos recebidos.',
  },
  {
    title: 'Ocorrências',
    description: 'Acompanhe registros abertos e atualize status pelo contrato administrativo.',
    href: '/app/admin/ocorrencias',
  },
];

export function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-5">
      <DashboardHeader
        title={`Administração, ${getFirstName(user?.nomeCompleto ?? '')}.`}
        description="Acompanhe verificações, aprovações profissionais e ocorrências sem simular dados ou indicadores."
      />
      <DashboardCards items={adminItems} />
    </div>
  );
}
