import { getFirstName } from '../../features/auth/session';
import { useAuth } from '../../features/auth/useAuth';
import { DashboardCards, DashboardHeader } from './DashboardCards';

const profissionalItems = [
  {
    title: 'Perfil',
    description: 'Base para dados profissionais e apresentação dentro da plataforma.',
    href: '/app/profissional/perfil',
  },
  {
    title: 'Regiões',
    description: 'Área futura para regiões de atendimento habilitadas.',
  },
  {
    title: 'Disponibilidade',
    description: 'Espaço reservado para agenda semanal e horários disponíveis.',
  },
  {
    title: 'Verificações',
    description: 'Acompanhamento futuro de documentos, selfie e aprovação operacional.',
  },
  {
    title: 'Convites',
    description: 'Visualize solicitações recebidas e responda aos convites pendentes.',
    href: '/app/profissional/convites',
  },
  {
    title: 'Atendimentos',
    description: 'Acompanhe serviços atribuídos e registre início ou fim quando permitido.',
    href: '/app/profissional/atendimentos',
  },
  {
    title: 'Ocorrências',
    description: 'Registre e acompanhe ocorrências vinculadas aos seus atendimentos.',
    href: '/app/ocorrencias',
  },
];

export function ProfissionalDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-5">
      <DashboardHeader
        title={`Olá, ${getFirstName(user?.nomeCompleto ?? '')}.`}
        description="Sua área profissional reúne perfil, regiões, disponibilidade, convites e atendimentos operacionais."
      />
      <DashboardCards items={profissionalItems} />
    </div>
  );
}
