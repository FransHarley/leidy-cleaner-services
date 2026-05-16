import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { TextArea } from '../../components/ui/FormField';
import { formatCurrency, formatDateTime, getStatusAtendimentoInfo, getTipoServicoAtendimentoLabel } from '../atendimentos/atendimentoLabels';
import type { AtendimentoVisivel, AtendimentosProfile } from '../atendimentos/types';
import { tipoOcorrenciaOptions } from './ocorrenciaLabels';
import type { CriarOcorrenciaRequest } from './types';
import { tipoOcorrenciaValues } from './types';

const ocorrenciaSchema = z.object({
  atendimentoId: z.coerce.number().int('Selecione um atendimento válido.').min(1, 'Selecione um atendimento.'),
  tipo: z.enum(tipoOcorrenciaValues, {
    required_error: 'Selecione o tipo de ocorrência.',
  }),
  descricao: z.string().trim().min(1, 'Descreva a ocorrência.').max(2000, 'Use no máximo 2000 caracteres.'),
});

type OcorrenciaFormValues = z.infer<typeof ocorrenciaSchema>;

type OcorrenciaFormProps = {
  atendimentos: AtendimentoVisivel[];
  profile?: AtendimentosProfile;
  initialAtendimentoId?: number;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (payload: CriarOcorrenciaRequest) => void | Promise<void>;
};

export function OcorrenciaForm({
  atendimentos,
  profile = 'CLIENTE',
  initialAtendimentoId = 0,
  submitLabel = 'Registrar ocorrência',
  isSubmitting = false,
  onSubmit,
}: OcorrenciaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OcorrenciaFormValues>({
    resolver: zodResolver(ocorrenciaSchema),
    defaultValues: {
      atendimentoId: initialAtendimentoId,
      tipo: 'OUTRO',
      descricao: '',
    },
  });

  async function handleValidSubmit(values: OcorrenciaFormValues) {
    await onSubmit({
      atendimentoId: values.atendimentoId,
      tipo: values.tipo,
      descricao: values.descricao.trim(),
    });
  }

  return (
    <form className="grid gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
      <label className="block" htmlFor="atendimentoId">
        <span className="text-sm font-black text-slate-800">Atendimento</span>
        <select
          id="atendimentoId"
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          disabled={isSubmitting || atendimentos.length === 0}
          {...register('atendimentoId')}
        >
          <option value={0}>Selecione um atendimento</option>
          {atendimentos.map((atendimento) => {
            const statusInfo = getStatusAtendimentoInfo(atendimento.status);
            const amountLabel = profile === 'PROFISSIONAL' ? 'Você recebe' : 'Valor';
            const amount =
              profile === 'PROFISSIONAL'
                ? atendimento.valorEstimadoProfissional
                : 'valorServico' in atendimento
                  ? atendimento.valorServico
                  : null;
            return (
              <option key={atendimento.id} value={atendimento.id}>
                Atendimento - {statusInfo.label} - {getTipoServicoAtendimentoLabel(atendimento.tipoServico)} -{' '}
                {formatDateTime(atendimento.inicioPrevistoEm)} - {amountLabel}:{' '}
                {amount == null ? 'valor indisponível' : formatCurrency(amount)}
              </option>
            );
          })}
        </select>
        {errors.atendimentoId?.message && <span className="mt-2 block text-sm text-red-700">{errors.atendimentoId.message}</span>}
      </label>

      <label className="block" htmlFor="tipo">
        <span className="text-sm font-black text-slate-800">Tipo de ocorrência</span>
        <select
          id="tipo"
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          disabled={isSubmitting}
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
      />

      <div className="flex justify-end">
        <button
          className="min-h-11 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSubmitting || atendimentos.length === 0}
          type="submit"
        >
          {isSubmitting ? 'Registrando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
