import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DIA_SEMANA_OPTIONS, DIA_SEMANA_VALUES, formatDisponibilidadeTime } from './disponibilidadeDisplay';
import type { DisponibilidadeProfissional, DisponibilidadeProfissionalRequest } from '../perfil/types';

const disponibilidadeSchema = z
  .object({
    diaSemana: z.enum(DIA_SEMANA_VALUES, {
      required_error: 'Informe o dia da semana.',
    }),
    horaInicio: z.string().min(1, 'Informe o horário inicial.'),
    horaFim: z.string().min(1, 'Informe o horário final.'),
    ativo: z.boolean(),
  })
  .refine((values) => values.horaFim > values.horaInicio, {
    message: 'O horário final deve ser posterior ao inicial.',
    path: ['horaFim'],
  });

type DisponibilidadeFormValues = z.infer<typeof disponibilidadeSchema>;

type DisponibilidadeFormProps = {
  initialDisponibilidade?: DisponibilidadeProfissional | null;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: DisponibilidadeProfissionalRequest) => void | Promise<void>;
};

const emptyValues: DisponibilidadeFormValues = {
  diaSemana: 'SEGUNDA',
  horaInicio: '08:00',
  horaFim: '12:00',
  ativo: true,
};

export function DisponibilidadeForm({
  initialDisponibilidade,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: DisponibilidadeFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DisponibilidadeFormValues>({
    resolver: zodResolver(disponibilidadeSchema),
    defaultValues: initialDisponibilidade ? toFormValues(initialDisponibilidade) : emptyValues,
  });

  useEffect(() => {
    reset(initialDisponibilidade ? toFormValues(initialDisponibilidade) : emptyValues);
  }, [initialDisponibilidade, reset]);

  async function handleValidSubmit(values: DisponibilidadeFormValues) {
    await onSubmit({
      diaSemana: values.diaSemana,
      horaInicio: values.horaInicio,
      horaFim: values.horaFim,
      ativo: values.ativo,
    });
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr_0.8fr]">
        <label className="block" htmlFor="diaSemana">
          <span className="text-sm font-black text-slate-800">Dia da semana</span>
          <select
            id="diaSemana"
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            {...register('diaSemana')}
          >
            {DIA_SEMANA_OPTIONS.map((dia) => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </select>
          {errors.diaSemana?.message && <span className="mt-2 block text-sm text-red-700">{errors.diaSemana.message}</span>}
        </label>

        <label className="block" htmlFor="horaInicio">
          <span className="text-sm font-black text-slate-800">Início</span>
          <input
            id="horaInicio"
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            type="time"
            {...register('horaInicio')}
          />
          {errors.horaInicio?.message && <span className="mt-2 block text-sm text-red-700">{errors.horaInicio.message}</span>}
        </label>

        <label className="block" htmlFor="horaFim">
          <span className="text-sm font-black text-slate-800">Fim</span>
          <input
            id="horaFim"
            className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            type="time"
            {...register('horaFim')}
          />
          {errors.horaFim?.message && <span className="mt-2 block text-sm text-red-700">{errors.horaFim.message}</span>}
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
        <input
          className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-700"
          type="checkbox"
          {...register('ativo')}
        />
          <span>
            <span className="block font-black text-cyan-800">Disponibilidade ativa</span>
            <span className="mt-1 block leading-5 text-cyan-900/75">
            Sua agenda sera considerada nas proximas oportunidades compativeis.
            </span>
          </span>
        </label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            className="min-h-11 w-full rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 sm:w-auto"
            disabled={isSubmitting}
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
        <button
          className="min-h-11 w-full rounded-lg bg-cyan-700 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(14,138,141,0.18)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : initialDisponibilidade ? 'Salvar horário' : 'Adicionar horário'}
        </button>
      </div>
    </form>
  );
}

function toFormValues(disponibilidade: DisponibilidadeProfissional): DisponibilidadeFormValues {
  return {
    diaSemana: disponibilidade.diaSemana,
    horaInicio: formatDisponibilidadeTime(disponibilidade.horaInicio),
    horaFim: formatDisponibilidadeTime(disponibilidade.horaFim),
    ativo: disponibilidade.ativo,
  };
}
