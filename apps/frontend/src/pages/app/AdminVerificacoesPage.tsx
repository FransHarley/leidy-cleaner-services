import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { listarVerificacoesAdmin } from '../../features/admin/verificacoes/adminVerificacoesApi';
import { VerificacaoCard } from '../../features/admin/verificacoes/VerificacaoCard';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const queryKeys = {
  verificacoes: ['admin', 'verificacoes'],
};

export function AdminVerificacoesPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const verificacoesQuery = useQuery({
    queryKey: queryKeys.verificacoes,
    queryFn: () => listarVerificacoesAdmin(requireToken(token)),
    enabled: Boolean(token),
  });

  const protectedError = useMemo(
    () => (verificacoesQuery.error instanceof ApiError && verificacoesQuery.error.status === 401 ? verificacoesQuery.error : null),
    [verificacoesQuery.error],
  );

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  const verificacoes = verificacoesQuery.data ?? [];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Verificações documentais</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Revise os documentos enviados pelas profissionais e registre sua analise.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-100 px-5 text-sm font-black text-cyan-700 transition hover:bg-cyan-50"
            to="/app/admin"
          >
            Voltar
          </Link>
        </div>
      </section>

      {verificacoesQuery.isLoading && <StateBox tone="loading" title="Carregando verificações" description="Buscando documentos enviados." />}

      {verificacoesQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar verificações"
          message={getApiErrorMessage(verificacoesQuery.error)}
          details={verificacoesQuery.error instanceof ApiError ? verificacoesQuery.error.errors : []}
        />
      )}

      {verificacoesQuery.isSuccess && verificacoes.length === 0 && (
        <StateBox tone="empty" title="Nenhuma verificação encontrada" description="Quando profissionais enviarem documentos, eles aparecerão aqui." />
      )}

      {verificacoes.length > 0 && (
        <section className="grid gap-4">
          {verificacoes.map((verificacao) => (
            <VerificacaoCard key={verificacao.id} verificacao={verificacao} />
          ))}
        </section>
      )}
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
