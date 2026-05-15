import { Link, useSearchParams } from 'react-router-dom';

export function ClientePagamentoRetornoPage() {
  const [searchParams] = useSearchParams();
  const atendimentoId = searchParams.get('atendimentoId');
  const solicitacaoId = searchParams.get('solicitacaoId');
  const pagamentoId = searchParams.get('pagamentoId');
  const resultado = searchParams.get('resultado');
  const pagamentoHref = solicitacaoId
    ? `/app/cliente/pagamentos/solicitacao/${solicitacaoId}`
    : atendimentoId
      ? `/app/cliente/pagamentos/atendimento/${atendimentoId}`
      : '/app/cliente/pagamentos';
  const resultadoMensagem = getResultadoMensagem(resultado);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Retorno do pagamento</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          O retorno do gateway nao confirma pagamento por si so. Consulte o status atual no backend.
        </p>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-2xl font-black text-slate-900">Acompanhar pagamento</h2>
        {resultadoMensagem && <p className="mt-2 text-sm font-semibold text-slate-700">{resultadoMensagem}</p>}
        {pagamentoId && !atendimentoId && (
          <p className="mt-2 text-sm font-semibold text-slate-700">Pagamento informado: #{pagamentoId}</p>
        )}
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Abra o fluxo correspondente para verificar o status atualizado no backend.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to={pagamentoHref}
          >
            Ver status
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
            to="/app/cliente/pagamentos"
          >
            Todos os pagamentos
          </Link>
        </div>
      </section>
    </div>
  );
}

function getResultadoMensagem(resultado: string | null) {
  if (resultado === 'sucesso') {
    return 'Retorno de pagamento recebido. Consulte o status atualizado antes de seguir.';
  }

  if (resultado === 'cancelado') {
    return 'Pagamento cancelado. Voce pode tentar novamente.';
  }

  if (resultado === 'expirado') {
    return 'O prazo do pagamento expirou. Gere uma nova tentativa se ainda desejar continuar.';
  }

  return null;
}
