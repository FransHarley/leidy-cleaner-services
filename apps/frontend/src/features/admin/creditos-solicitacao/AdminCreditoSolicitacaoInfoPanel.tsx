import { Link } from 'react-router-dom';

import { PagamentoAdminStatusBadge } from '../pagamentos/PagamentoAdminStatusBadge';
import { getGatewayPagamentoLabel, getMetodoPagamentoLabel } from '../pagamentos/pagamentoAdminLabels';
import { SolicitacaoAdminStatusBadge } from '../solicitacoes/SolicitacaoAdminStatusBadge';
import { CreditoSolicitacaoAdminStatusBadge } from './CreditoSolicitacaoAdminStatusBadge';
import {
  formatCurrency,
  formatDateTime,
  formatOptionalText,
  getCreditoSolicitacaoTipoServicoLabel,
} from './creditoSolicitacaoAdminLabels';
import type {
  AdminCreditoSolicitacaoDetalhe,
  AdminCreditoSolicitacaoPagamentoResumo,
  AdminCreditoSolicitacaoSolicitacaoResumo,
} from './types';

export function AdminCreditoSolicitacaoInfoPanel({ credito }: { credito: AdminCreditoSolicitacaoDetalhe }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Credito de solicitacao #{credito.id}</h2>
        <CreditoSolicitacaoAdminStatusBadge status={credito.status} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Cliente" value={credito.clienteNome ? `${credito.clienteNome} (ID ${credito.clienteId})` : `ID ${credito.clienteId}`} />
        <DetailItem label="Tipo de servico" value={getCreditoSolicitacaoTipoServicoLabel(credito.tipoServico)} />
        <DetailItem label="Duracao estimada" value={`${credito.duracaoEstimadaHoras} horas`} />
        <DetailItem label="Regiao" value={credito.regiaoNome || `ID ${credito.regiaoId}`} />
        <DetailItem label="Solicitacao origem" value={credito.solicitacaoOrigemId ? `#${credito.solicitacaoOrigemId}` : 'Nao informada'} />
        <DetailItem label="Solicitacao uso" value={credito.solicitacaoUsoId ? `#${credito.solicitacaoUsoId}` : 'Nao utilizada'} />
        <DetailItem label="Pagamento origem" value={credito.pagamentoOrigemId ? `#${credito.pagamentoOrigemId}` : 'Nao informado'} />
        <DetailItem label="Valor de referencia" value={formatCurrency(credito.valorReferencia)} />
        <DetailItem label="Criado em" value={formatDateTime(credito.criadoEm)} />
        <DetailItem label="Reservado em" value={formatDateTime(credito.reservadoEm)} />
        <DetailItem label="Utilizado em" value={formatDateTime(credito.utilizadoEm)} />
        <DetailItem label="Cancelado em" value={formatDateTime(credito.canceladoEm)} />
      </dl>

      <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <h3 className="font-black text-slate-900">Observacao</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{formatOptionalText(credito.observacao)}</p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <SolicitacaoResumoCard titulo="Solicitacao origem" solicitacao={credito.solicitacaoOrigem} />
        <PagamentoResumoCard pagamento={credito.pagamentoOrigem} />
        <SolicitacaoResumoCard titulo="Solicitacao de uso" solicitacao={credito.solicitacaoUso} />
      </div>
    </section>
  );
}

function SolicitacaoResumoCard({
  solicitacao,
  titulo,
}: {
  solicitacao: AdminCreditoSolicitacaoSolicitacaoResumo | null;
  titulo: string;
}) {
  if (!solicitacao) {
    return (
      <section className="rounded-lg border border-slate-100 bg-slate-50 p-4">
        <h3 className="font-black text-slate-900">{titulo}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Nenhum resumo disponivel no momento.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-black text-slate-900">{titulo}</h3>
        <SolicitacaoAdminStatusBadge status={solicitacao.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <DetailItem label="ID" value={`#${solicitacao.id}`} />
        <DetailItem label="Cliente" value={solicitacao.clienteNome ? `${solicitacao.clienteNome} (ID ${solicitacao.clienteId})` : `ID ${solicitacao.clienteId}`} />
        <DetailItem label="Data desejada" value={formatDateTime(solicitacao.dataHoraDesejada)} />
        <DetailItem label="Servico" value={getCreditoSolicitacaoTipoServicoLabel(solicitacao.tipoServico)} />
        <DetailItem label="Duracao" value={`${solicitacao.duracaoEstimadaHoras} horas`} />
        <DetailItem label="Regiao" value={solicitacao.regiaoNome || `ID ${solicitacao.regiaoId}`} />
      </dl>
      <Link
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        to={`/app/admin/solicitacoes/${solicitacao.id}`}
      >
        Ver solicitacao
      </Link>
    </section>
  );
}

function PagamentoResumoCard({ pagamento }: { pagamento: AdminCreditoSolicitacaoPagamentoResumo | null }) {
  if (!pagamento) {
    return (
      <section className="rounded-lg border border-slate-100 bg-slate-50 p-4">
        <h3 className="font-black text-slate-900">Pagamento origem</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Nenhum pagamento relacionado foi encontrado.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-black text-slate-900">Pagamento origem</h3>
        <PagamentoAdminStatusBadge status={pagamento.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <DetailItem label="ID" value={`#${pagamento.id}`} />
        <DetailItem label="Gateway" value={getGatewayPagamentoLabel(pagamento.gateway)} />
        <DetailItem label="Metodo" value={getMetodoPagamentoLabel(pagamento.metodoPagamento)} />
        <DetailItem label="ID gateway" value={pagamento.gatewayPaymentId} />
        <DetailItem label="Solicitacao" value={pagamento.solicitacaoId ? `#${pagamento.solicitacaoId}` : 'Nao vinculada'} />
        <DetailItem label="Atendimento" value={pagamento.atendimentoId ? `#${pagamento.atendimentoId}` : 'Nao vinculado'} />
        <DetailItem label="Valor bruto" value={formatCurrency(pagamento.valorBruto)} />
        <DetailItem label="Valor liquido" value={formatCurrency(pagamento.valorLiquidoRecebido)} />
        <DetailItem label="Recebido em" value={formatDateTime(pagamento.recebidoEm)} />
      </dl>
      <Link
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        to={`/app/admin/pagamentos/${pagamento.id}`}
      >
        Ver pagamento
      </Link>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold leading-6 text-slate-800">{value}</dd>
    </div>
  );
}
