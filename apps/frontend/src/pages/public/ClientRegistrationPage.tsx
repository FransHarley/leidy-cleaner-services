import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { ConsentCheckbox } from '../../components/ui/ConsentCheckbox';
import { FormAlert } from '../../components/ui/FormAlert';
import { TextInput } from '../../components/ui/FormField';
import { loginRequest } from '../../features/auth/authApi';
import { getDashboardPath } from '../../features/auth/session';
import { useAuth } from '../../features/auth/useAuth';
import { criarEndereco } from '../../features/cliente/enderecos/enderecoApi';
import { RegistrationPageLayout } from '../../layouts/RegistrationPageLayout';
import { formatCpf, isValidCpf, normalizeCpf } from '../../lib/cpf';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const clientRegistrationSchema = z
  .object({
    nomeCompleto: z.string().trim().min(3, 'Informe seu nome completo.').max(160, 'Use no maximo 160 caracteres.'),
    email: z.string().trim().min(1, 'Informe seu email.').email('Informe um email valido.').max(255, 'Use no maximo 255 caracteres.'),
    telefone: z.string().trim().min(8, 'Informe um telefone valido.').max(30, 'Use no maximo 30 caracteres.'),
    cpf: z
      .string()
      .trim()
      .min(1, 'Informe seu CPF.')
      .refine((value) => isValidCpf(value), 'CPF invalido.'),
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(120, 'Use no maximo 120 caracteres.'),
    confirmarSenha: z.string().min(1, 'Confirme sua senha.'),
    cep: z.string().trim().min(8, 'Informe o CEP.'),
    logradouro: z.string().trim().min(1, 'Informe o logradouro.').max(180, 'Use no maximo 180 caracteres.'),
    numero: z.string().trim().min(1, 'Informe o numero.').max(30, 'Use no maximo 30 caracteres.'),
    complemento: z.string().trim().max(120, 'Use no maximo 120 caracteres.').optional(),
    bairro: z.string().trim().min(1, 'Informe o bairro.').max(120, 'Use no maximo 120 caracteres.'),
    cidade: z.string().trim().min(1, 'Informe a cidade.').max(120, 'Use no maximo 120 caracteres.'),
    estado: z
      .string()
      .trim()
      .min(2, 'Use a UF com 2 letras.')
      .max(2, 'Use a UF com 2 letras.')
      .transform((value) => value.toUpperCase()),
    aceitarTermosUso: z.boolean().refine((value) => value, 'Voce precisa aceitar os Termos de Uso.'),
    aceitarPoliticaPrivacidade: z.boolean().refine((value) => value, 'Voce precisa aceitar a Política de Privacidade.'),
    aceitarCodigoConduta: z.boolean().refine((value) => value, 'Voce precisa aceitar o Código de Conduta.'),
  })
  .refine((values) => values.senha === values.confirmarSenha, {
    message: 'As senhas devem ser iguais.',
    path: ['confirmarSenha'],
  });

type ClientRegistrationFormValues = z.infer<typeof clientRegistrationSchema>;

export function ClientRegistrationPage() {
  const { registerCliente, login, user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<{ message: string; details: string[] } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientRegistrationFormValues>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      nomeCompleto: '',
      email: '',
      telefone: '',
      cpf: '',
      senha: '',
      confirmarSenha: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: 'Porto Alegre',
      estado: 'RS',
      aceitarTermosUso: false,
      aceitarPoliticaPrivacidade: false,
      aceitarCodigoConduta: false,
    },
  });

  if (user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  async function onSubmit(values: ClientRegistrationFormValues) {
    setSubmitError(null);

    let accountCreated = false;

    try {
      const email = values.email.trim();
      const senha = values.senha;

      await registerCliente({
        nomeCompleto: values.nomeCompleto.trim(),
        email,
        telefone: values.telefone.trim(),
        cpf: normalizeCpf(values.cpf),
        senha,
        aceitarTermosUso: values.aceitarTermosUso,
        aceitarPoliticaPrivacidade: values.aceitarPoliticaPrivacidade,
        aceitarCodigoConduta: values.aceitarCodigoConduta,
      });

      accountCreated = true;

      const session = await loginRequest({ email, senha });

      await criarEndereco(session.accessToken, {
        cep: values.cep.trim(),
        logradouro: values.logradouro.trim(),
        numero: values.numero.trim(),
        complemento: values.complemento?.trim() || null,
        bairro: values.bairro.trim(),
        cidade: values.cidade.trim(),
        estado: values.estado.trim().toUpperCase(),
        principal: true,
      });

      await login({ email, senha });
      navigate('/app/cliente/enderecos', { replace: true });
    } catch (error) {
      const apiMessage = getApiErrorMessage(error);

      setSubmitError({
        message: accountCreated
          ? `Sua conta foi criada, mas não conseguimos concluir o endereço inicial automaticamente. ${apiMessage}`
          : apiMessage,
        details: error instanceof ApiError ? error.errors : [],
      });
    }
  }

  return (
    <RegistrationPageLayout
      contentLayout="stacked"
      eyebrow="Cadastro de cliente"
      title="Crie sua conta para solicitar faxinas com profissionais verificadas."
      description="O endereço inicial ajuda a plataforma a localizar a região correta e agiliza a primeira solicitação."
      aside={<ClientRegistrationHighlights />}
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-black text-slate-900">Cadastro de cliente</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Preencha os dados de acesso, confirme o endereço inicial e valide os aceites obrigatórios para entrar na área do cliente sem depender de etapas extras.
            </p>
          </div>

          <div className="mt-6">
            <ClientJourney />
          </div>

          <form className="mt-6 grid gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
            {submitError && (
              <FormAlert tone="error" title="Não foi possível concluir o cadastro" message={submitError.message} details={submitError.details} />
            )}

            <FormSection
              title="Etapa 1 - Dados da conta"
              description="Esses dados serão usados para autenticação, pagamentos centralizados e acompanhamento das solicitações."
            >
              <TextInput
                autoComplete="off"
                error={errors.nomeCompleto?.message}
                label="Nome completo"
                placeholder="Seu nome completo"
                registration={register('nomeCompleto')}
                type="text"
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  autoComplete="email"
                  error={errors.email?.message}
                  label="Email"
                  placeholder="voce@email.com"
                  registration={register('email')}
                  type="email"
                />
                <TextInput
                  autoComplete="tel"
                  error={errors.telefone?.message}
                  label="Telefone"
                  placeholder="(51) 99999-9999"
                  registration={register('telefone')}
                  type="tel"
                />
              </div>
              <TextInput
                autoComplete="off"
                error={errors.cpf?.message}
                label="CPF"
                maxLength={14}
                placeholder="000.000.000-00"
                registration={register('cpf', {
                  onChange: (event) => {
                    event.target.value = formatCpf(event.target.value);
                  },
                })}
                type="text"
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  autoComplete="new-password"
                  error={errors.senha?.message}
                  label="Senha"
                  placeholder="Mínimo de 8 caracteres"
                  registration={register('senha')}
                  type="password"
                />
                <TextInput
                  autoComplete="new-password"
                  error={errors.confirmarSenha?.message}
                  label="Confirmar senha"
                  placeholder="Repita sua senha"
                  registration={register('confirmarSenha')}
                  type="password"
                />
              </div>
            </FormSection>

            <FormSection
              title="Etapa 2 - Endereço inicial"
              description="Esse endereço será salvo logo após o cadastro para manter sua conta pronta para a primeira solicitação."
            >
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
            </FormSection>

            <FormSection
              title="Etapa 3 - Aceites obrigatórios"
              description="Os documentos abaixo explicam como a plataforma opera, trata dados e lida com segurança e conduta."
            >
              <ConsentCheckbox
                error={errors.aceitarTermosUso?.message}
                helperText="Obrigatório para criar a conta."
                label={
                  <>
                    Li e aceito os{' '}
                    <Link className="font-black text-cyan-700 hover:text-cyan-800" target="_blank" to="/termos-de-uso">
                      Termos de Uso
                    </Link>
                    .
                  </>
                }
                registration={register('aceitarTermosUso')}
              />
              <ConsentCheckbox
                error={errors.aceitarPoliticaPrivacidade?.message}
                label={
                  <>
                    Li e aceito a{' '}
                    <Link className="font-black text-cyan-700 hover:text-cyan-800" target="_blank" to="/privacidade">
                      Política de Privacidade e Tratamento de Dados
                    </Link>
                    .
                  </>
                }
                registration={register('aceitarPoliticaPrivacidade')}
              />
              <ConsentCheckbox
                error={errors.aceitarCodigoConduta?.message}
                label={
                  <>
                    Estou ciente das regras de{' '}
                    <Link className="font-black text-cyan-700 hover:text-cyan-800" target="_blank" to="/codigo-de-conduta">
                      conduta, segurança e uso responsável da plataforma
                    </Link>
                    .
                  </>
                }
                registration={register('aceitarCodigoConduta')}
              />
            </FormSection>

            <button
              className="min-h-12 rounded-lg bg-cyan-700 px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(6,182,212,0.22)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Criando cadastro...' : 'Criar conta e salvar endereço'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Já tem conta?{' '}
            <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/entrar">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </RegistrationPageLayout>
  );
}

const clientSteps = [
  { title: 'Conta', description: 'Nome, CPF, contato e senha obrigatórios.' },
  { title: 'Endereço inicial', description: 'Primeiro endereço salvo junto do fluxo atual.' },
  { title: 'Aceites', description: 'Termos, privacidade e conduta antes do acesso.' },
];

function ClientRegistrationHighlights() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-5 md:p-6">
        <h2 className="text-lg font-black text-slate-900">O que acontece depois</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Depois do cadastro, você entra na área do cliente com o primeiro endereço pronto para criar a solicitação.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p>O CPF ajuda a proteger a conta e evitar duplicidade de cadastro.</p>
        <p>O endereço inicial facilita a localização da região de atendimento desde a primeira jornada.</p>
      </div>
    </div>
  );
}

function ClientJourney() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {clientSteps.map((step, index) => (
        <div key={step.title} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-700">Etapa {index + 1}</p>
          <h3 className="mt-2 text-base font-black text-slate-900">{step.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-slate-50/70 p-5">
      <div>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
