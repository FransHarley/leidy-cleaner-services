import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { TextInput } from '../../../components/ui/FormField';
import type { Endereco, EnderecoRequest } from './types';

const enderecoSchema = z.object({
  cep: z.string().trim().min(8, 'Informe o CEP.'),
  logradouro: z.string().trim().min(1, 'Informe o logradouro.').max(180, 'Use no máximo 180 caracteres.'),
  numero: z.string().trim().min(1, 'Informe o número.').max(30, 'Use no máximo 30 caracteres.'),
  complemento: z.string().trim().max(120, 'Use no máximo 120 caracteres.').optional(),
  bairro: z.string().trim().min(1, 'Informe o bairro.').max(120, 'Use no máximo 120 caracteres.'),
  cidade: z.string().trim().min(1, 'Informe a cidade.').max(120, 'Use no máximo 120 caracteres.'),
  estado: z
    .string()
    .trim()
    .min(2, 'Use a UF com 2 letras.')
    .max(2, 'Use a UF com 2 letras.')
    .transform((value) => value.toUpperCase()),
  principal: z.boolean(),
});

export type EnderecoFormValues = z.infer<typeof enderecoSchema>;

type EnderecoFormProps = {
  initialAddress?: Endereco | null;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: EnderecoRequest) => void | Promise<void>;
};

const emptyValues: EnderecoFormValues = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  principal: false,
};

export function EnderecoForm({ initialAddress, isSubmitting = false, onCancel, onSubmit }: EnderecoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnderecoFormValues>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: initialAddress ? toFormValues(initialAddress) : emptyValues,
  });

  useEffect(() => {
    reset(initialAddress ? toFormValues(initialAddress) : emptyValues);
  }, [initialAddress, reset]);

  async function handleValidSubmit(values: EnderecoFormValues) {
    await onSubmit({
      cep: values.cep.trim(),
      logradouro: values.logradouro.trim(),
      numero: values.numero.trim(),
      complemento: values.complemento?.trim() || null,
      bairro: values.bairro.trim(),
      cidade: values.cidade.trim(),
      estado: values.estado.trim().toUpperCase(),
      principal: values.principal,
      latitude: initialAddress?.latitude ?? undefined,
      longitude: initialAddress?.longitude ?? undefined,
    });
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit(handleValidSubmit)}>
      <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
        <TextInput
          autoComplete="postal-code"
          error={errors.cep?.message}
          label="CEP"
          placeholder="90000-000"
          registration={register('cep')}
          type="text"
        />
        <TextInput
          autoComplete="address-line1"
          error={errors.logradouro?.message}
          label="Logradouro"
          placeholder="Rua, avenida ou travessa"
          registration={register('logradouro')}
          type="text"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-[0.7fr_1.3fr]">
        <TextInput
          autoComplete="address-line2"
          error={errors.numero?.message}
          label="Número"
          placeholder="123"
          registration={register('numero')}
          type="text"
        />
        <TextInput
          autoComplete="address-line3"
          error={errors.complemento?.message}
          helperText="Opcional"
          label="Complemento"
          placeholder="Apartamento, bloco ou referência"
          registration={register('complemento')}
          type="text"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_1fr_120px]">
        <TextInput
          autoComplete="address-level3"
          error={errors.bairro?.message}
          label="Bairro"
          placeholder="Bairro"
          registration={register('bairro')}
          type="text"
        />
        <TextInput
          autoComplete="address-level2"
          error={errors.cidade?.message}
          label="Cidade"
          placeholder="Porto Alegre"
          registration={register('cidade')}
          type="text"
        />
        <TextInput
          autoComplete="address-level1"
          error={errors.estado?.message}
          label="UF"
          maxLength={2}
          placeholder="RS"
          registration={register('estado')}
          type="text"
        />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
        <input
          className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-700"
          type="checkbox"
          {...register('principal')}
        />
        <span>
          <span className="block font-black text-cyan-800">Definir como endereço principal</span>
          <span className="mt-1 block leading-5 text-cyan-900/75">
            O endereco principal sera atualizado na lista depois de salvar.
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
          {isSubmitting ? 'Salvando...' : initialAddress ? 'Salvar alterações' : 'Cadastrar endereço'}
        </button>
      </div>
    </form>
  );
}

function toFormValues(address: Endereco): EnderecoFormValues {
  return {
    cep: address.cep,
    logradouro: address.logradouro,
    numero: address.numero,
    complemento: address.complemento ?? '',
    bairro: address.bairro,
    cidade: address.cidade,
    estado: address.estado,
    principal: address.principal,
  };
}
