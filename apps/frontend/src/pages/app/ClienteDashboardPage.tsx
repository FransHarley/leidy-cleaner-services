import { getFirstName } from '../../features/auth/session';
import { useAuth } from '../../features/auth/useAuth';
import { useDashboardIndicators } from '../../features/dashboard/useDashboardIndicators';
import { DashboardActionAlert, DashboardCards, DashboardHeader, DashboardSummaryCards } from './DashboardCards';

const clienteItems = [
  {
    title: 'Enderecos',
    description: 'Organize os locais onde voce pode receber o atendimento.',
    href: '/app/cliente/enderecos',
  },
  {
    title: 'Solicitacoes',
    description: 'Crie pedidos de faxina e acompanhe cada etapa do andamento.',
    href: '/app/cliente/solicitacoes',
  },
  {
    title: 'Pagamentos',
    description: 'Veja suas cobrancas e acompanhe a confirmacao do pagamento.',
    href: '/app/cliente/pagamentos',
  },
  {
    title: 'Atendimentos',
    description: 'Veja seus servicos confirmados, em andamento e finalizados.',
    href: '/app/cliente/atendimentos',
  },
  {
    title: 'Ocorrencias',
    description: 'Abra um registro quando precisar de ajuda com um atendimento.',
    href: '/app/ocorrencias',
  },
];

export function ClienteDashboardPage() {
  const { token, user } = useAuth();
  const { cliente } = useDashboardIndicators('CLIENTE', token);
  const pendingPaymentHref = cliente.primeiroAtendimentoPagamentoPendenteId
    ? `/app/cliente/pagamentos/atendimento/${cliente.primeiroAtendimentoPagamentoPendenteId}`
    : '/app/cliente/pagamentos';
  const pendingEvaluationHref = cliente.primeiroAtendimentoAguardandoAvaliacaoId
    ? `/app/cliente/atendimentos/${cliente.primeiroAtendimentoAguardandoAvaliacaoId}`
    : '/app/cliente/atendimentos';

  return (
    <div className="grid gap-5">
      <DashboardHeader
        title={`Bem-vindo, ${getFirstName(user?.nomeCompleto) || 'Cliente'}.`}
        description="Acompanhe suas solicitacoes, confirme o pagamento e veja quando sua profissional for acionada."
      />
      {cliente.pagamentosPendentes > 0 && (
        <DashboardActionAlert
          cta={cliente.primeiroAtendimentoPagamentoPendenteId ? 'Pagar agora' : 'Ver pagamento'}
          description="Finalize o pagamento para liberar o envio do convite para a profissional escolhida."
          href={pendingPaymentHref}
          title="Voce tem pagamento pendente"
        />
      )}
      {cliente.atendimentosAguardandoAvaliacao > 0 && (
        <DashboardActionAlert
          cta="Avaliar agora"
          description="Seu servico foi finalizado. Conte como foi a experiencia com a profissional."
          href={pendingEvaluationHref}
          title="Avalie seu atendimento"
          tone="cyan"
        />
      )}
      <DashboardSummaryCards
        items={[
          {
            title: 'Pagamentos pendentes',
            value: cliente.pagamentosPendentes,
            description: 'Solicitacoes aguardando pagamento ou confirmacao.',
            tone: cliente.pagamentosPendentes > 0 ? 'red' : 'neutral',
          },
          {
            title: 'Atendimentos confirmados',
            value: cliente.atendimentosConfirmados,
            description: 'Servicos prontos para acontecer.',
            tone: cliente.atendimentosConfirmados > 0 ? 'green' : 'neutral',
          },
          {
            title: 'Solicitacoes ativas',
            value: cliente.solicitacoesAtivas,
            description: 'Pedidos que ainda estao em andamento.',
            tone: cliente.solicitacoesAtivas > 0 ? 'yellow' : 'neutral',
          },
          {
            title: 'Ocorrencias abertas',
            value: cliente.ocorrenciasAbertas,
            description: 'Chamados que ainda estao sendo acompanhados.',
            tone: cliente.ocorrenciasAbertas > 0 ? 'yellow' : 'neutral',
          },
        ]}
      />
      <DashboardCards items={clienteItems} />
    </div>
  );
}
