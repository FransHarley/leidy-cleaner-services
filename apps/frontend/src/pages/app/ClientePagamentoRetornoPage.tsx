import { Link, useSearchParams } from 'react-router-dom';

export function ClientePagamentoRetornoPage() {
  const [searchParams] = useSearchParams();
  const atendimentoId = searchParams.get('atendimentoId');
  const pagamentoId = searchParams.get('pagamentoId');
  const resultado = searchParams.get('resultado');
  const pagamentoHref = pagamentoId
    ? `/app/cliente/pagamentos/${pagamentoId}`
    : atendimentoId
      ? `/app/cliente/pagamentos/atendimento/${atendimentoId}`
      : '/app/cliente/pagamentos';

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Cliente</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Retorno do checkout</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          O retorno do gateway não confirma pagamento por si só. Consulte o status atualizado no backend.
        </p>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-2xl font-black text-slate-900">Acompanhar pagamento</h2>
        {resultado && <p className="mt-2 text-sm font-semibold text-slate-700">Resultado informado: {resultado}</p>}
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Abra o pagamento para verificar se o webhook já confirmou a cobrança.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-green-700 px-4 text-sm font-black text-white transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            to={pagamentoHref}
          >
            Ver status
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            to="/app/cliente/pagamentos"
          >
            Todos os pagamentos
          </Link>
        </div>
      </section>
    </div>
  );
}
