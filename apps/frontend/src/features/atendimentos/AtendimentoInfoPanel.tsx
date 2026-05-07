import {
  formatCurrency,
  formatDateTime,
  getTipoServicoAtendimentoLabel,
} from './atendimentoLabels';
import {
  getAtendimentoClienteLabel,
  getAtendimentoEnderecoLabel,
  getAtendimentoProfissionalRatingLabel,
  getAtendimentoProfissionalLabel,
  getAtendimentoRegiaoLabel,
} from './atendimentoDisplay';
import { AtendimentoStatusBadge } from './AtendimentoStatusBadge';
import type { AtendimentoVisivel } from './types';

type AtendimentoInfoPanelProps = {
  atendimento: AtendimentoVisivel;
  financialView?: 'service-only' | 'professional' | 'admin';
};

export function AtendimentoInfoPanel({ atendimento, financialView = 'service-only' }: AtendimentoInfoPanelProps) {
  const showInternalFinancials = financialView === 'admin';
  const primaryFinancialLabel = financialView === 'professional' ? 'Você recebe' : 'Valor do serviço';
  const primaryFinancialValue =
    financialView === 'professional'
      ? atendimento.valorEstimadoProfissional
      : 'valorServico' in atendimento
        ? atendimento.valorServico
        : null;

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-black text-slate-900">Atendimento</h2>
        <AtendimentoStatusBadge status={atendimento.status} />
      </div>

      <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Tipo" value={getTipoServicoAtendimentoLabel(atendimento.tipoServico)} />
        <DetailItem label="Início previsto" value={formatDateTime(atendimento.inicioPrevistoEm)} />
        <DetailItem
          label={primaryFinancialLabel}
          value={primaryFinancialValue == null ? 'Valor indisponível' : formatCurrency(primaryFinancialValue)}
        />
        <DetailItem label="Cliente" value={getAtendimentoClienteLabel(atendimento)} />
        <DetailItem label="Profissional" value={getAtendimentoProfissionalLabel(atendimento)} />
        <DetailItem label="Avaliações da profissional" value={getAtendimentoProfissionalRatingLabel(atendimento)} />
        <DetailItem label="Endereço" value={getAtendimentoEnderecoLabel(atendimento)} />
        <DetailItem label="Bairro/região" value={getAtendimentoRegiaoLabel(atendimento)} />
        <DetailItem label="Início real" value={formatDateTime(atendimento.inicioRealEm)} />
        <DetailItem label="Fim real" value={formatDateTime(atendimento.fimRealEm)} />
        {showInternalFinancials && 'percentualComissaoAgencia' in atendimento && (
          <>
            <DetailItem label="Solicitação" value={`ID ${atendimento.solicitacaoId}`} />
            <DetailItem label="Comissão agência" value={`${Number(atendimento.percentualComissaoAgencia).toLocaleString('pt-BR')}%`} />
            <DetailItem label="Valor profissional" value={formatCurrency(atendimento.valorEstimadoProfissional)} />
          </>
        )}
      </dl>
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
