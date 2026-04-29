import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { AtendimentoCard } from '../../features/atendimentos/AtendimentoCard';
import { listarMeusAtendimentos } from '../../features/atendimentos/atendimentosApi';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  atendimentos: ['atendimentos', 'meus', 'cliente'],
};

export function ClienteAtendimentosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const atendimentosQuery = useQuery({
    queryKey: queryKeys.atendimentos,
    queryFn: () => listarMeusAtendimentos(requireToken(token)),
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
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Meus atendimentos</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Acompanhe os atendimentos criados após o aceite da profissional. Esta área é somente leitura para clientes.
        </p>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Acompanhamento operacional</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Abra um atendimento para ver detalhes, pagamento e checkpoints.</p>
        </div>

        {atendimentosQuery.isLoading && <StateBox tone="loading" title="Carregando atendimentos" description="Buscando seus atendimentos vinculados." />}

        {atendimentosQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar atendimentos"
            message={getApiErrorMessage(atendimentosQuery.error)}
            details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
          />
        )}

        {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
          <StateBox tone="empty"
            title="Nenhum atendimento encontrado"
            description="Quando uma profissional aceitar sua solicitação, o atendimento aparecerá aqui."
          />
        )}

        {atendimentos.length > 0 && (
          <div className="grid gap-4">
            {atendimentos.map((atendimento) => (
              <AtendimentoCard key={atendimento.id} atendimento={atendimento} profile="CLIENTE" />
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
