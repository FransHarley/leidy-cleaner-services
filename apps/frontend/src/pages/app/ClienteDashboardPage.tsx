import { getFirstName } from '../../features/auth/session';
import { useAuth } from '../../features/auth/useAuth';
import { DashboardCards, DashboardHeader } from './DashboardCards';

const clienteItems = [
  {
    title: 'Endereços',
    description: 'Base para organizar locais de atendimento do cliente.',
    href: '/app/cliente/enderecos',
  },
  {
    title: 'Solicitações',
    description: 'Espaço reservado para criação e acompanhamento de pedidos de faxina.',
    href: '/app/cliente/solicitacoes',
  },
  {
    title: 'Pagamentos',
    description: 'Acompanhe checkouts e status de pagamentos vinculados aos atendimentos.',
    href: '/app/cliente/pagamentos',
  },
  {
    title: 'Histórico',
    description: 'Consulta futura dos atendimentos concluídos e seus registros.',
  },
];

export function ClienteDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-5">
      <DashboardHeader
        title={`Bem-vindo, ${getFirstName(user?.nomeCompleto ?? '')}.`}
        description="Sua área de cliente está pronta para receber os próximos fluxos operacionais, mantendo contratação, pagamentos e histórico separados por etapa."
      />
      <DashboardCards items={clienteItems} />
    </div>
  );
}
