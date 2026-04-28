import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { statusOcorrenciaOptions } from './ocorrenciaLabels';
import type { AtualizarStatusOcorrenciaRequest, StatusOcorrencia } from './types';
import { statusOcorrenciaValues } from './types';

const statusSchema = z.object({
  status: z.enum(statusOcorrenciaValues, {
    required_error: 'Selecione o status.',
  }),
});

type OcorrenciaStatusFormValues = z.infer<typeof statusSchema>;

type OcorrenciaStatusFormProps = {
  initialStatus: StatusOcorrencia;
  isSubmitting: boolean;
  onSubmit: (payload: AtualizarStatusOcorrenciaRequest) => void;
};

export function OcorrenciaStatusForm({ initialStatus, isSubmitting, onSubmit }: OcorrenciaStatusFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OcorrenciaStatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: initialStatus,
    },
  });

  useEffect(() => {
    reset({ status: initialStatus });
  }, [initialStatus, reset]);

  function handleValidSubmit(values: OcorrenciaStatusFormValues) {
    onSubmit(values);
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
      <div>
        <h2 className="text-2xl font-black text-slate-900">Atualizar status</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">A transição é enviada ao backend pelo contrato administrativo.</p>
      </div>

      <label className="block" htmlFor="status">
        <span className="text-sm font-black text-slate-800">Status</span>
        <select
          id="status"
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          disabled={isSubmitting}
          {...register('status')}
        >
          {statusOcorrenciaOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status?.message && <span className="mt-2 block text-sm text-red-700">{errors.status.message}</span>}
      </label>

      <div className="flex justify-end">
        <button
          className="min-h-11 rounded-lg bg-green-700 px-5 text-sm font-black text-white transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar status'}
        </button>
      </div>
    </form>
  );
}
