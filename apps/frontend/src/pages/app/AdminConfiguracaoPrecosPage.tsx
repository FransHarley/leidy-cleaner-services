import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { FormAlert } from '../../components/ui/FormAlert';
import { TextInput } from '../../components/ui/FormField';
import { StateBox } from '../../components/ui/PageState';
import {
  getPricingConfiguration,
  updatePricingConfiguration,
} from '../../features/admin/configuracoes/precos/adminConfiguracaoPrecosApi';
import type { PricingConfigurationUpdatePayload } from '../../features/admin/configuracoes/precos/types';
import { useAuth } from '../../features/auth/useAuth';
import { formatCurrency } from '../../features/atendimentos/atendimentoLabels';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const pricingQueryKey = ['admin', 'configuracoes', 'precos'];

const pricingSchema = z.object({
  valorHora: z.coerce.number({ invalid_type_error: 'Informe o valor da hora.' }).positive('O valor da hora deve ser maior que zero.'),
  percentualComissaoAgencia: z.coerce
    .number({ invalid_type_error: 'Informe a comissão da agência.' })
    .min(0, 'A comissão da agência deve ser maior ou igual a zero.')
    .max(100, 'A comissão da agência deve ser menor ou igual a 100.'),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

type Feedback = {
  tone: 'error' | 'success';
  title: string;
  message: string;
  details?: string[];
};

const previewDurations = [4, 6, 8];

export function AdminConfiguracaoPrecosPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const pricingQuery = useQuery({
    queryKey: pricingQueryKey,
    queryFn: () => getPricingConfiguration(requireToken(token)),
    enabled: Boolean(token),
    retry: false,
  });

  const protectedError = useMemo(
    () => (pricingQuery.error instanceof ApiError && pricingQuery.error.status === 401 ? pricingQuery.error : null),
    [pricingQuery.error],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      valorHora: 45,
      percentualComissaoAgencia: 20,
    },
  });

  useEffect(() => {
    if (protectedError) {
      logout();
      navigate('/entrar', { replace: true });
    }
  }, [logout, navigate, protectedError]);

  useEffect(() => {
    if (pricingQuery.data) {
      reset({
        valorHora: Number(pricingQuery.data.valorHora),
        percentualComissaoAgencia: Number(pricingQuery.data.percentualComissaoAgencia),
      });
    }
  }, [pricingQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: PricingConfigurationUpdatePayload) => updatePricingConfiguration(requireToken(token), payload),
    onSuccess: async (updated) => {
      queryClient.setQueryData(pricingQueryKey, updated);
      await queryClient.invalidateQueries({ queryKey: pricingQueryKey });
      setFeedback({
        tone: 'success',
        title: 'Preços atualizados',
        message: 'A nova configuracao sera usada nas proximas solicitacoes.',
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        logout();
        navigate('/entrar', { replace: true });
        return;
      }

      setFeedback({
        tone: 'error',
        title: 'Não foi possível salvar os preços',
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    },
  });

  async function handleValidSubmit(values: PricingFormValues) {
    setFeedback(null);
    await mutation.mutateAsync({
      valorHora: roundMoney(values.valorHora),
      percentualComissaoAgencia: roundPercent(values.percentualComissaoAgencia),
    });
  }

  const watchedValorHora = Number(watch('valorHora'));
  const watchedComissao = Number(watch('percentualComissaoAgencia'));
  const valorHora = Number.isFinite(watchedValorHora) ? watchedValorHora : 0;
  const percentualComissaoAgencia = Number.isFinite(watchedComissao) ? watchedComissao : 0;
  const percentualEstimadoProfissional = Math.max(0, 100 - percentualComissaoAgencia);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administração</p>
            <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">Preços</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Defina o valor da hora cobrado da cliente e a comissão da agência usada no cálculo operacional.
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

      {feedback && <FormAlert tone={feedback.tone} title={feedback.title} message={feedback.message} details={feedback.details} />}

      {pricingQuery.isLoading && <StateBox tone="loading" title="Carregando preços" description="Buscando a configuração ativa." />}

      {pricingQuery.isError && !protectedError && (
        <FormAlert
          tone="error"
          title="Não foi possível carregar preços"
          message={getApiErrorMessage(pricingQuery.error)}
          details={pricingQuery.error instanceof ApiError ? pricingQuery.error.errors : []}
        />
      )}

      <section className="grid min-w-0 gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <form className="grid min-w-0 gap-5" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
          <div className="grid min-w-0 gap-5 md:grid-cols-[1fr_1fr_1fr]">
            <TextInput
              error={errors.valorHora?.message}
              label="Valor da hora"
              min="0.01"
              placeholder="50,00"
              registration={register('valorHora')}
              step="0.01"
              type="number"
            />

            <TextInput
              error={errors.percentualComissaoAgencia?.message}
              label="Comissão da agência (%)"
              min="0"
              max="100"
              placeholder="20"
              registration={register('percentualComissaoAgencia')}
              step="0.01"
              type="number"
            />

            <label className="block" htmlFor="percentualEstimadoProfissional">
              <span className="text-sm font-black text-slate-800">Percentual estimado da profissional (%)</span>
              <input
                id="percentualEstimadoProfissional"
                className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-700 outline-none"
                readOnly
                type="text"
                value={formatPercent(percentualEstimadoProfissional)}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              className="min-h-11 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={mutation.isPending || pricingQuery.isLoading}
              type="submit"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar preços'}
            </button>
          </div>
        </form>

        <div className="grid min-w-0 gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
          <p className="font-black">Valores de referência</p>
          <p className="text-xs leading-5 text-blue-700">
            Simulação administrativa apenas. Não são cobranças, nem reservas de profissional, nem criam atendimentos.
          </p>
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            {previewDurations.map((duration) => (
              <PreviewCard
                key={duration}
                commissionPercent={percentualComissaoAgencia}
                duration={duration}
                hourlyRate={valorHora}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PreviewCard({
  commissionPercent,
  duration,
  hourlyRate,
}: {
  commissionPercent: number;
  duration: number;
  hourlyRate: number;
}) {
  const serviceValue = roundMoney(duration * hourlyRate);
  const agencyValue = roundMoney(serviceValue * (commissionPercent / 100));
  const professionalValue = roundMoney(serviceValue - agencyValue);

  return (
    <div className="min-w-0 rounded-lg border border-blue-100 bg-white p-4 text-slate-800">
      <p className="text-sm font-black text-slate-900">{duration} horas</p>
      <p className="mt-2 text-sm leading-6">
        {duration}h x {formatCurrency(hourlyRate)} = <span className="font-black">{formatCurrency(serviceValue)}</span>
      </p>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3">
          <dt className="min-w-0 text-slate-500">Comissão da agência</dt>
          <dd className="font-black text-slate-900">{formatCurrency(agencyValue)}</dd>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3">
          <dt className="min-w-0 text-slate-500">Valor estimado da profissional</dt>
          <dd className="font-black text-slate-900">{formatCurrency(professionalValue)}</dd>
        </div>
      </dl>
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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
