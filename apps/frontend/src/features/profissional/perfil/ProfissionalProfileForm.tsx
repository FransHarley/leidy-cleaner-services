import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { TextArea, TextInput } from '../../../components/ui/FormField';
import type { AtualizarPerfilProfissionalRequest, PerfilProfissional } from './types';

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(max, message).optional(),
  );

const optionalNonNegativeInteger = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  },
  z
    .number({ invalid_type_error: 'Informe um número válido.' })
    .int('Informe um número inteiro.')
    .min(0, 'Informe zero ou mais anos.')
    .optional(),
);

const profileSchema = z.object({
  nomeExibicao: z.string().trim().min(2, 'Informe o nome de exibição.').max(160, 'Use no máximo 160 caracteres.'),
  descricao: optionalText(2000, 'Use uma descrição menor.'),
  fotoPerfilUrl: optionalText(500, 'Use no máximo 500 caracteres.'),
  experienciaAnos: optionalNonNegativeInteger,
  ativoParaReceberChamados: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfissionalProfileFormProps = {
  perfil: PerfilProfissional;
  isSubmitting?: boolean;
  onSubmit: (payload: AtualizarPerfilProfissionalRequest) => void | Promise<void>;
};

export function ProfissionalProfileForm({ perfil, isSubmitting = false, onSubmit }: ProfissionalProfileFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(perfil),
  });

  useEffect(() => {
    reset(toFormValues(perfil));
  }, [perfil, reset]);

  async function handleValidSubmit(values: ProfileFormValues) {
    await onSubmit({
      nomeExibicao: values.nomeExibicao.trim(),
      descricao: values.descricao ?? null,
      fotoPerfilUrl: values.fotoPerfilUrl ?? null,
      experienciaAnos: values.experienciaAnos ?? null,
      ativoParaReceberChamados: values.ativoParaReceberChamados,
    });
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
      <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <TextInput
          error={errors.nomeExibicao?.message}
          label="Nome de exibição"
          placeholder="Como clientes verão seu nome"
          registration={register('nomeExibicao')}
          type="text"
        />
        <TextInput
          error={errors.experienciaAnos?.message}
          label="Experiência em anos"
          min={0}
          placeholder="0"
          registration={register('experienciaAnos')}
          type="number"
        />
      </div>

      <TextArea
        error={errors.descricao?.message}
        helperText="Opcional"
        label="Descrição profissional"
        placeholder="Conte brevemente sobre sua experiência e forma de atendimento"
        registration={register('descricao')}
      />

      <TextInput
        error={errors.fotoPerfilUrl?.message}
        helperText="Opcional. Informe um link ou referencia da imagem."
        label="URL da foto de perfil"
        placeholder="https://..."
        registration={register('fotoPerfilUrl')}
        type="url"
      />

      <label className="flex items-start gap-3 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
        <input
          className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-700"
          type="checkbox"
          {...register('ativoParaReceberChamados')}
        />
        <span>
          <span className="block font-black text-cyan-800">Ativo para receber chamados</span>
          <span className="mt-1 block leading-5 text-cyan-900/75">
            Sua disponibilidade fica sujeita a aprovacao e compatibilidade com os atendimentos.
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <button
          className="min-h-11 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(14,138,141,0.18)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </div>
    </form>
  );
}

function toFormValues(perfil: PerfilProfissional): ProfileFormValues {
  return {
    nomeExibicao: perfil.nomeExibicao,
    descricao: perfil.descricao ?? undefined,
    fotoPerfilUrl: perfil.fotoPerfilUrl ?? undefined,
    experienciaAnos: perfil.experienciaAnos,
    ativoParaReceberChamados: perfil.ativoParaReceberChamados,
  };
}
