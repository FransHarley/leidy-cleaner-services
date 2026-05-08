import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { FormAlert } from '../../components/ui/FormAlert';
import { TextArea } from '../../components/ui/FormField';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { tipoOcorrenciaOptions } from './ocorrenciaLabels';
import { criarOcorrencia } from './ocorrenciasApi';
import type { OcorrenciaAtendimento } from './types';
import { tipoOcorrenciaValues } from './types';

const ocorrenciaAtendimentoSchema = z.object({
  tipo: z.enum(tipoOcorrenciaValues, {
    required_error: 'Selecione o tipo de ocorrência.',
  }),
  descricao: z.string().trim().min(1, 'Descreva a ocorrência.').max(2000, 'Use no máximo 2000 caracteres.'),
});

type OcorrenciaAtendimentoFormValues = z.infer<typeof ocorrenciaAtendimentoSchema>;

type AtendimentoOcorrenciaPanelProps = {
  atendimentoId: number;
};

export function AtendimentoOcorrenciaPanel({ atendimentoId }: AtendimentoOcorrenciaPanelProps) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [createdOcorrencia, setCreatedOcorrencia] = useState<OcorrenciaAtendimento | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OcorrenciaAtendimentoFormValues>({
    resolver: zodResolver(ocorrenciaAtendimentoSchema),
    defaultValues: {
      tipo: 'OUTRO',
      descricao: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: OcorrenciaAtendimentoFormValues) =>
      criarOcorrencia(requireToken(token), {
        atendimentoId,
        tipo: values.tipo,
        descricao: values.descricao.trim(),
      }),
    onSuccess: async (ocorrencia) => {
      setCreatedOcorrencia(ocorrencia);
      setIsOpen(false);
      setErrorMessage(null);
      setErrorDetails([]);
      reset();
      await queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'meus'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setErrorMessage(getApiErrorMessage(error));
      setErrorDetails(error instanceof ApiError ? error.errors : []);
    },
  });

  function handleOpen() {
    setIsOpen(true);
    setCreatedOcorrencia(null);
    setErrorMessage(null);
    setErrorDetails([]);
  }

  function handleCancel() {
    setIsOpen(false);
    setErrorMessage(null);
    setErrorDetails([]);
    reset();
  }

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Ocorrência</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Descreva o problema ocorrido neste atendimento. A equipe administrativa irá analisar.
          </p>
        </div>

        {!isOpen && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            onClick={handleOpen}
          >
            Abrir ocorrência
          </button>
        )}
      </div>

      {createdOcorrencia && (
        <div className="mt-5">
          <FormAlert
            tone="success"
            title="Ocorrência aberta"
            message="O registro foi enviado para análise administrativa."
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-cyan-700 px-4 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              to={`/app/ocorrencias/${createdOcorrencia.id}`}
            >
              Ver ocorrência
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cyan-100 px-4 text-sm font-black text-cyan-700 transition hover:bg-cyan-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              to="/app/ocorrencias"
            >
              Minhas ocorrências
            </Link>
          </div>
        </div>
      )}

      {isOpen && (
        <form className="mt-5 grid gap-5" noValidate onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          {errorMessage && (
            <FormAlert
              tone="error"
              title="Não foi possível abrir a ocorrência"
              message={errorMessage}
              details={errorDetails}
            />
          )}

          <label className="block" htmlFor="tipoOcorrenciaAtendimento">
            <span className="text-sm font-black text-slate-800">Tipo da ocorrência</span>
            <select
              id="tipoOcorrenciaAtendimento"
              className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={createMutation.isPending}
              {...register('tipo')}
            >
              {tipoOcorrenciaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.tipo?.message && <span className="mt-2 block text-sm text-red-700">{errors.tipo.message}</span>}
          </label>

          <TextArea
            error={errors.descricao?.message}
            helperText="Informe apenas o necessário para a equipe entender a situação."
            label="Descrição"
            maxLength={2000}
            registration={register('descricao')}
            disabled={createMutation.isPending}
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="min-h-11 rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={createMutation.isPending}
              type="button"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button
              className="min-h-11 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Enviando...' : 'Enviar ocorrência'}
            </button>
          </div>
        </form>
      )}
    </section>
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
