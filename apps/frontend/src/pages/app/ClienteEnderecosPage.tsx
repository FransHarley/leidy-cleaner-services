import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FormAlert } from '../../components/ui/FormAlert';
import { StateBox } from '../../components/ui/PageState';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';
import {
  atualizarEndereco,
  criarEndereco,
  excluirEndereco,
  listarMeusEnderecos,
} from '../../features/cliente/enderecos/enderecoApi';
import { EnderecoCard } from '../../features/cliente/enderecos/EnderecoCard';
import { EnderecoForm } from '../../features/cliente/enderecos/EnderecoForm';
import type { Endereco, EnderecoRequest } from '../../features/cliente/enderecos/types';
import { useAuth } from '../../features/auth/useAuth';

const enderecosQueryKey = ['cliente', 'enderecos'];

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

export function ClienteEnderecosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Endereco | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const enderecosQuery = useQuery({
    queryKey: enderecosQueryKey,
    queryFn: () => listarMeusEnderecos(requireToken(token)),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (enderecosQuery.error instanceof ApiError && enderecosQuery.error.status === 401) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [enderecosQuery.error, logout, navigate]);

  const createMutation = useMutation({
    mutationFn: (payload: EnderecoRequest) => criarEndereco(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enderecosQueryKey });
      closeForm();
      setFeedback({
        tone: 'success',
        title: 'Endereço cadastrado',
        message: 'Seu endereço foi salvo com sucesso.',
      });
    },
    onError: handleMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EnderecoRequest }) => atualizarEndereco(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enderecosQueryKey });
      closeForm();
      setFeedback({
        tone: 'success',
        title: 'Endereço atualizado',
        message: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => excluirEndereco(requireToken(token), id),
    onMutate: (id) => {
      setDeletingId(id);
      setFeedback(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enderecosQueryKey });
      setFeedback({
        tone: 'success',
        title: 'Endereço excluído',
        message: 'A lista foi atualizada com os endereços atuais.',
      });
    },
    onError: handleMutationError,
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const addresses = enderecosQuery.data ?? [];

  function handleMutationError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      logout();
      navigate('/entrar', { replace: true });
      return;
    }

    setFeedback({
      tone: 'error',
      title: 'Não foi possível concluir',
      message: getApiErrorMessage(error),
      details: error instanceof ApiError ? error.errors : [],
    });
  }

  async function handleSubmit(payload: EnderecoRequest) {
    setFeedback(null);

    if (editingAddress) {
      await updateMutation.mutateAsync({ id: editingAddress.id, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  function openCreateForm() {
    setEditingAddress(null);
    setFeedback(null);
    setFormOpen(true);
  }

  function openEditForm(address: Endereco) {
    setEditingAddress(address);
    setFeedback(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAddress(null);
  }

  function handleDelete(address: Endereco) {
    const confirmed = window.confirm(`Excluir o endereço ${address.logradouro}, ${address.numero}?`);

    if (confirmed) {
      deleteMutation.mutate(address.id);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Cliente</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Meus endereços</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Cadastre e mantenha seus locais de atendimento. O endereco principal aparecera destacado na lista.
            </p>
          </div>
          <button
            className="min-h-12 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(14,138,141,0.18)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2"
            type="button"
            onClick={openCreateForm}
          >
            Adicionar endereço
          </button>
        </div>
      </section>

      {feedback && (
        <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />
      )}

      {formOpen && (
        <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-black text-slate-900">
              {editingAddress ? 'Editar endereço' : 'Cadastrar novo endereço'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Preencha os campos obrigatorios para salvar seu endereco com seguranca.
            </p>
          </div>
          <EnderecoForm
            initialAddress={editingAddress}
            isSubmitting={isSaving}
            onCancel={closeForm}
            onSubmit={handleSubmit}
          />
        </section>
      )}

      <section className="grid gap-4">
        {enderecosQuery.isLoading && <StateBox tone="loading" title="Carregando endereços" description="Buscando seus endereços cadastrados." />}

        {enderecosQuery.isError && (
          <FormAlert
            tone="error"
            title="Não foi possível carregar seus endereços"
            message={getApiErrorMessage(enderecosQuery.error)}
            details={enderecosQuery.error instanceof ApiError ? enderecosQuery.error.errors : []}
          />
        )}

        {enderecosQuery.isSuccess && addresses.length === 0 && (
          <StateBox tone="empty"
            title="Nenhum endereço cadastrado"
            description="Adicione seu primeiro endereço para preparar as próximas etapas de solicitação de faxina."
          />
        )}

        {enderecosQuery.isSuccess &&
          addresses.map((address) => (
            <EnderecoCard
              key={address.id}
              endereco={address}
              isDeleting={deletingId === address.id}
              onDelete={handleDelete}
              onEdit={openEditForm}
            />
          ))}
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
