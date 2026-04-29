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
    title: 'Usuários',
    description: 'Consulte contas e vínculos de perfil sem alterar status ou senhas.',
    href: '/app/admin/usuarios',
  },
  {
    title: 'Atendimentos',
    description: 'Consulte atendimentos e checkpoints em visão administrativa somente leitura.',
    href: '/app/admin/atendimentos',
  },
  {
    title: 'Solicitações',
    description: 'Consulte solicitações de faxina em visão administrativa somente leitura.',
    href: '/app/admin/solicitacoes',
  },
  {
    title: 'Pagamentos',
    description: 'Consulte pagamentos vinculados a atendimentos sem alterar status.',
    href: '/app/admin/pagamentos',
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
