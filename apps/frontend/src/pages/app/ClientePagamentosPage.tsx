import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { useAuth } from '../../features/auth/useAuth';
import { AtendimentoPagamentoCard } from '../../features/cliente/pagamentos/AtendimentoPagamentoCard';
import { listarMeusAtendimentosParaPagamento } from '../../features/cliente/pagamentos/pagamentosApi';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  atendimentos: ['cliente', 'pagamentos', 'atendimentos'],
};

export function ClientePagamentosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const atendimentosQuery = useQuery({
    queryKey: queryKeys.atendimentos,
    queryFn: () => listarMeusAtendimentosParaPagamento(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () => (atendimentosQuery.error instanceof ApiError && atendimentosQuery.error.status === 401 ? atendimentosQuery.error : null),
    [atendimentosQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const atendimentos = atendimentosQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-green-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Cliente</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Pagamentos</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Acompanhe os pagamentos vinculados aos seus atendimentos. A confirmação definitiva sempre vem do backend.
        </p>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Atendimentos para pagamento</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Abra um atendimento para iniciar ou acompanhar o checkout correspondente.
          </p>
        </div>

        {atendimentosQuery.isLoading && <StateBox title="Carregando atendimentos" description="Buscando seus atendimentos vinculados." />}

        {atendimentosQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar pagamentos"
            message={getApiErrorMessage(atendimentosQuery.error)}
            details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
          />
        )}

        {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
          <StateBox
            title="Nenhum atendimento encontrado"
            description="Quando uma profissional aceitar sua solicitação e o atendimento for criado, o pagamento aparecerá aqui."
          />
        )}

        {atendimentos.length > 0 && (
          <div className="grid gap-4">
            {atendimentos.map((atendimento) => (
              <AtendimentoPagamentoCard key={atendimento.id} atendimento={atendimento} />
            ))}
          </div>
        )}

        <Link className="font-black text-green-700 hover:text-green-800" to="/app/cliente/solicitacoes">
          Voltar para solicitações
        </Link>
      </section>
    </div>
  );
}

function StateBox({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-6 text-center shadow-sm">
      <h3 className="font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function requireToken(token: string | null) {
  if (!token) {
    throw new ApiError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sessão expirada. Entre novamente.',
    });
  }

  return token;
}
