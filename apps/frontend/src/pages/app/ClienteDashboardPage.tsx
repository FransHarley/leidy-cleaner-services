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
    description: 'Acompanhe atendimentos, checkpoints e andamento operacional.',
    href: '/app/cliente/atendimentos',
  },
  {
    title: 'Ocorrências',
    description: 'Abra e acompanhe ocorrências vinculadas aos seus atendimentos.',
    href: '/app/ocorrencias',
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
