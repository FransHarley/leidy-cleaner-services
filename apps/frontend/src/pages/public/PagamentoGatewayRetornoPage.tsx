import { Navigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../features/auth/useAuth';

type PagamentoGatewayRetornoPageProps = {
  resultado: 'sucesso' | 'cancelado' | 'expirado';
};

export function PagamentoGatewayRetornoPage({ resultado }: PagamentoGatewayRetornoPageProps) {
  const { status, user } = useAuth();
  const [searchParams] = useSearchParams();
  const solicitacaoId = parsePositiveId(searchParams.get('solicitacaoId'));
  const atendimentoId = parsePositiveId(searchParams.get('atendimentoId'));
  const pagamentoId = parsePositiveId(searchParams.get('pagamentoId'));
  const destination = buildAuthenticatedDestination({
    resultado,
    solicitacaoId,
    atendimentoId,
    pagamentoId,
  });

  if (status === 'loading') {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-5 py-10">
        <div className="rounded-lg border border-cyan-100 bg-white px-6 py-5 text-sm font-semibold text-slate-700 shadow-sm">
          Preparando o retorno do pagamento...
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate replace to={destination} />;
  }

  return <Navigate replace to={`/entrar?redirectTo=${encodeURIComponent(destination)}`} />;
}

function buildAuthenticatedDestination({
  resultado,
  solicitacaoId,
  atendimentoId,
  pagamentoId,
}: {
  resultado: 'sucesso' | 'cancelado' | 'expirado';
  solicitacaoId: number | null;
  atendimentoId: number | null;
  pagamentoId: number | null;
}) {
  if (solicitacaoId) {
    const search = buildSearchParams({
      retorno: resultado,
      pagamentoId,
    });
    return `/app/cliente/pagamentos/solicitacao/${solicitacaoId}${search}`;
  }

  if (atendimentoId) {
    const search = buildSearchParams({
      retorno: resultado,
      pagamentoId,
    });
    return `/app/cliente/pagamentos/atendimento/${atendimentoId}${search}`;
  }

  const search = buildSearchParams({
    resultado,
    pagamentoId,
    solicitacaoId,
    atendimentoId,
  });
  return `/app/cliente/pagamentos/retorno${search}`;
}

function buildSearchParams(params: Record<string, number | string | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function parsePositiveId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
