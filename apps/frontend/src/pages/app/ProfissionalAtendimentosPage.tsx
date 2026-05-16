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
  atendimentos: ['atendimentos', 'meus', 'profissional'],
};

export function ProfissionalAtendimentosPage() {
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
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profissional</p>
        <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Meus atendimentos</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Acompanhe os servicos atribuidos a voce e registre o inicio e o fim no momento certo.
        </p>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Atendimentos atribuidos</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Abra um atendimento para ver detalhes e checkpoints.</p>
        </div>

        {atendimentosQuery.isLoading && <StateBox tone="loading" title="Carregando atendimentos" description="Buscando seus servicos atribuidos." />}

        {atendimentosQuery.isError && !protectedError && (
          <FormAlert
            tone="error"
            title="Nao foi possivel carregar atendimentos"
            message={getApiErrorMessage(atendimentosQuery.error)}
            details={atendimentosQuery.error instanceof ApiError ? atendimentosQuery.error.errors : []}
          />
        )}

        {atendimentosQuery.isSuccess && atendimentos.length === 0 && (
          <StateBox
            tone="empty"
            title="Nenhum atendimento atribuido"
            description="Quando voce aceitar um convite e o atendimento for criado, ele aparecera aqui."
          />
        )}

        {atendimentos.length > 0 && (
          <div className="grid gap-4">
            {atendimentos.map((atendimento) => (
              <AtendimentoCard key={atendimento.id} atendimento={atendimento} profile="PROFISSIONAL" />
            ))}
          </div>
        )}

        <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/app/profissional/convites">
          Voltar para convites
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
      message: 'Sessao expirada. Entre novamente.',
    });
  }

  return token;
}
