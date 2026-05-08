import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';

import { ConsentCheckbox } from '../../components/ui/ConsentCheckbox';
import { FormAlert } from '../../components/ui/FormAlert';
import { TextArea, TextInput } from '../../components/ui/FormField';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { listPublicRegioesRequest } from '../../features/auth/authApi';
import { useAuth } from '../../features/auth/useAuth';
import { getDashboardPath } from '../../features/auth/session';
import { DIA_SEMANA_LABELS, DIA_SEMANA_VALUES, sortDisponibilidades } from '../../features/profissional/disponibilidades/disponibilidadeDisplay';
import type { DiaSemana, DisponibilidadeProfissionalRequest, RegiaoAtendimento } from '../../features/profissional/perfil/types';
import { RegistrationPageLayout } from '../../layouts/RegistrationPageLayout';
import { formatCpf, isValidCpf, normalizeCpf } from '../../lib/cpf';
import { ApiError, getApiErrorMessage } from '../../services/apiClient';

const optionalTrimmedText = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().max(1000, 'Use no maximo 1000 caracteres.').optional(),
);

const optionalNonNegativeInteger = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  },
  z
    .number({ invalid_type_error: 'Informe um numero valido.' })
    .int('Informe um numero inteiro.')
    .min(0, 'Informe zero ou mais anos.')
    .optional(),
);

const documentTypeOptions = [
  { value: 'RG', label: 'RG' },
  { value: 'CPF', label: 'CPF' },
] as const;

const professionalRegistrationSchema = z
  .object({
    nomeCompleto: z.string().trim().min(3, 'Informe seu nome completo.').max(160, 'Use no maximo 160 caracteres.'),
    nomeExibicao: z.string().trim().min(2, 'Informe seu nome de exibicao.').max(160, 'Use no maximo 160 caracteres.'),
    email: z.string().trim().min(1, 'Informe seu email.').email('Informe um email valido.').max(255, 'Use no maximo 255 caracteres.'),
    telefone: z.string().trim().min(8, 'Informe um telefone valido.').max(30, 'Use no maximo 30 caracteres.'),
    cpf: z
      .string()
      .trim()
      .min(1, 'Informe seu CPF.')
      .refine((value) => isValidCpf(value), 'CPF invalido.'),
    dataNascimento: z
      .string()
      .min(1, 'Informe sua data de nascimento.')
      .refine((value) => {
        const date = new Date(`${value}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date < new Date();
      }, 'A data de nascimento deve estar no passado.'),
    descricao: optionalTrimmedText,
    experienciaAnos: optionalNonNegativeInteger,
    senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(120, 'Use no maximo 120 caracteres.'),
    confirmarSenha: z.string().min(1, 'Confirme sua senha.'),
    tipoDocumento: z.enum(['RG', 'CPF'], {
      errorMap: () => ({ message: 'Selecione o tipo de documento.' }),
    }),
    numeroDocumento: z.string().trim().min(1, 'Informe o numero do documento.').max(80, 'Use no maximo 80 caracteres.'),
    aceitarTermosUso: z.boolean().refine((value) => value, 'Voce precisa aceitar os Termos de Uso.'),
    aceitarPoliticaPrivacidade: z.boolean().refine((value) => value, 'Voce precisa aceitar a Politica de Privacidade.'),
    aceitarCodigoConduta: z.boolean().refine((value) => value, 'Voce precisa aceitar o Codigo de Conduta.'),
  })
  .refine((values) => values.senha === values.confirmarSenha, {
    message: 'As senhas devem ser iguais.',
    path: ['confirmarSenha'],
  });

type ProfessionalRegistrationFormValues = z.infer<typeof professionalRegistrationSchema>;
type ProfessionalStep = 'conta' | 'perfil' | 'documentos' | 'regioes' | 'disponibilidade' | 'aceites';
type AvailabilityDraft = {
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
};
type AvailabilityEntry = AvailabilityDraft & {
  id: number;
};
type DocumentImageErrors = {
  documentoFrenteUrl?: string;
  documentoVersoUrl?: string;
  selfieUrl?: string;
  comprovanteResidenciaUrl?: string;
};

const professionalSteps: Array<{ key: ProfessionalStep; title: string; description: string }> = [
  { key: 'conta', title: 'Conta', description: 'Acesso e identificação' },
  { key: 'perfil', title: 'Perfil', description: 'Dados profissionais' },
  { key: 'documentos', title: 'Documentos', description: 'Verificação e segurança' },
  { key: 'regioes', title: 'Regiões', description: 'Porto Alegre e litoral' },
  { key: 'disponibilidade', title: 'Disponibilidade', description: 'Dias e horários' },
  { key: 'aceites', title: 'Aceites', description: 'Termos e conduta' },
];

const accountFields: Array<keyof ProfessionalRegistrationFormValues> = ['nomeCompleto', 'email', 'telefone', 'cpf', 'senha', 'confirmarSenha'];
const profileFields: Array<keyof ProfessionalRegistrationFormValues> = ['nomeExibicao', 'dataNascimento', 'descricao', 'experienciaAnos'];
const documentFields: Array<keyof ProfessionalRegistrationFormValues> = ['tipoDocumento', 'numeroDocumento'];
const acceptanceFields: Array<keyof ProfessionalRegistrationFormValues> = [
  'aceitarTermosUso',
  'aceitarPoliticaPrivacidade',
  'aceitarCodigoConduta',
];

export function ProfessionalRegistrationPage() {
  const { registerProfissionalCompleto, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ProfessionalStep>('conta');
  const [submitError, setSubmitError] = useState<{ message: string; details: string[] } | null>(null);
  const [regioes, setRegioes] = useState<RegiaoAtendimento[]>([]);
  const [isLoadingRegioes, setIsLoadingRegioes] = useState(true);
  const [regioesError, setRegioesError] = useState<string | null>(null);
  const [selectedRegiaoIds, setSelectedRegiaoIds] = useState<number[]>([]);
  const [regioesValidationMessage, setRegioesValidationMessage] = useState<string | null>(null);
  const [disponibilidades, setDisponibilidades] = useState<AvailabilityEntry[]>([]);
  const [disponibilidadeDraft, setDisponibilidadeDraft] = useState<AvailabilityDraft>({
    diaSemana: 'SEGUNDA',
    horaInicio: '08:00',
    horaFim: '12:00',
  });
  const [disponibilidadesValidationMessage, setDisponibilidadesValidationMessage] = useState<string | null>(null);
  const [documentoFrenteUrl, setDocumentoFrenteUrl] = useState<string | null>(null);
  const [documentoVersoUrl, setDocumentoVersoUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [comprovanteResidenciaUrl, setComprovanteResidenciaUrl] = useState<string | null>(null);
  const [documentoTemVersoSeparado, setDocumentoTemVersoSeparado] = useState(false);
  const [documentImageErrors, setDocumentImageErrors] = useState<DocumentImageErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const nextAvailabilityId = useRef(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalRegistrationFormValues>({
    resolver: zodResolver(professionalRegistrationSchema),
    defaultValues: {
      nomeCompleto: '',
      nomeExibicao: '',
      email: '',
      telefone: '',
      cpf: '',
      dataNascimento: '',
      descricao: undefined,
      experienciaAnos: undefined,
      senha: '',
      confirmarSenha: '',
      tipoDocumento: 'RG',
      numeroDocumento: '',
      aceitarTermosUso: false,
      aceitarPoliticaPrivacidade: false,
      aceitarCodigoConduta: false,
    },
  });

  const groupedRegioes = useMemo(() => groupRegioes(regioes), [regioes]);

  const loadRegioes = useCallback(async () => {
    setIsLoadingRegioes(true);
    setRegioesError(null);

    try {
      const data = await listPublicRegioesRequest();

      setRegioes(data.filter((regiao) => regiao.ativo));
    } catch (error) {
      const message =
        error instanceof TypeError
          ? 'Não foi possível carregar as regiões agora. Confira a conexão com a API e tente novamente.'
          : getApiErrorMessage(error);

      setRegioesError(message);
    } finally {
      setIsLoadingRegioes(false);
    }
  }, []);

  useEffect(() => {
    void loadRegioes();
  }, [loadRegioes]);

  if (user) {
    return <Navigate replace to={getDashboardPath(user)} />;
  }

  if (isSubmitted) {
    return (
      <RegistrationPageLayout
        aside={<ProfessionalRegistrationSummary />}
        contentLayout="stacked"
        description="Nossa equipe vai revisar seus dados, documentos, regiões e disponibilidade antes de liberar o acesso profissional."
        eyebrow="Cadastro profissional"
        title="Cadastro enviado para análise."
      >
        <div className="mx-auto w-full max-w-5xl rounded-lg border border-cyan-100 bg-white p-8 shadow-sm">
          <FormAlert
            tone="success"
            title="Cadastro enviado para análise."
            message="Assim que seu cadastro for aprovado, você poderá acessar a área profissional com o mesmo email informado no registro."
          />

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-5 text-sm leading-6 text-slate-600 md:grid-cols-2">
            <p>Enquanto a conta estiver pendente ou em análise, o login profissional permanece bloqueado.</p>
            <p>Se precisarmos de algum ajuste, a equipe administrativa vai seguir o fluxo operacional definido pela plataforma.</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-cyan-700 px-6 text-sm font-black text-white transition hover:bg-cyan-800"
              to="/"
            >
              Voltar ao inicio
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              to="/cadastro"
            >
              Ver outras opcoes de cadastro
            </Link>
          </div>
        </div>
      </RegistrationPageLayout>
    );
  }

  async function handleNextStep() {
    setSubmitError(null);

    if (currentStep === 'conta') {
      const isValid = await trigger(accountFields);
      if (isValid) {
        setCurrentStep('perfil');
      }
      return;
    }

    if (currentStep === 'perfil') {
      const isValid = await trigger(profileFields);
      if (isValid) {
        setCurrentStep('documentos');
      }
      return;
    }

    if (currentStep === 'documentos') {
      const fieldsValid = await trigger(documentFields);
      const imagesValid = validateDocumentImages();

      if (fieldsValid && imagesValid) {
        setCurrentStep('regioes');
      }
      return;
    }

    if (currentStep === 'regioes') {
      if (validateSelectedRegioes()) {
        setCurrentStep('disponibilidade');
      }
      return;
    }

    if (currentStep === 'disponibilidade' && validateDisponibilidades()) {
      setCurrentStep('aceites');
    }
  }

  function handleBackStep() {
    setSubmitError(null);

    const currentIndex = professionalSteps.findIndex((step) => step.key === currentStep);
    const previousStep = professionalSteps[currentIndex - 1];

    if (previousStep) {
      setCurrentStep(previousStep.key);
    }
  }

  function toggleRegiao(regiaoId: number) {
    setRegioesValidationMessage(null);
    setSelectedRegiaoIds((current) =>
      current.includes(regiaoId) ? current.filter((id) => id !== regiaoId) : [...current, regiaoId],
    );
  }

  function validateSelectedRegioes() {
    if (selectedRegiaoIds.length === 0) {
      setRegioesValidationMessage('Selecione ao menos uma regiao de atendimento.');
      return false;
    }

    setRegioesValidationMessage(null);
    return true;
  }

  function validateDocumentImages() {
    const nextErrors: DocumentImageErrors = {};

    if (!documentoFrenteUrl) {
      nextErrors.documentoFrenteUrl = 'Envie o documento principal.';
    }

    if (documentoTemVersoSeparado && !documentoVersoUrl) {
      nextErrors.documentoVersoUrl = 'Envie a imagem do verso do documento.';
    }

    if (!selfieUrl) {
      nextErrors.selfieUrl = 'Envie uma selfie para verificacao.';
    }

    if (!comprovanteResidenciaUrl) {
      nextErrors.comprovanteResidenciaUrl = 'Envie um comprovante de residencia.';
    }

    setDocumentImageErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateDisponibilidades() {
    if (disponibilidades.length === 0) {
      setDisponibilidadesValidationMessage('Adicione ao menos uma faixa de disponibilidade.');
      return false;
    }

    setDisponibilidadesValidationMessage(null);
    return true;
  }

  function addDisponibilidade() {
    setDisponibilidadesValidationMessage(null);

    if (!disponibilidadeDraft.horaInicio || !disponibilidadeDraft.horaFim) {
      setDisponibilidadesValidationMessage('Informe horario de inicio e termino.');
      return;
    }

    if (disponibilidadeDraft.horaInicio >= disponibilidadeDraft.horaFim) {
      setDisponibilidadesValidationMessage('O horario final deve ser posterior ao horario inicial.');
      return;
    }

    const exists = disponibilidades.some(
      (entry) =>
        entry.diaSemana === disponibilidadeDraft.diaSemana &&
        entry.horaInicio === disponibilidadeDraft.horaInicio &&
        entry.horaFim === disponibilidadeDraft.horaFim,
    );

    if (exists) {
      setDisponibilidadesValidationMessage('Essa faixa ja foi adicionada.');
      return;
    }

    setDisponibilidades((current) =>
      sortDisponibilidades([
        ...current,
        {
          id: nextAvailabilityId.current++,
          ...disponibilidadeDraft,
        },
      ]),
    );
  }

  function removeDisponibilidade(entryId: number) {
    setDisponibilidadesValidationMessage(null);
    setDisponibilidades((current) => current.filter((entry) => entry.id !== entryId));
  }

  async function onSubmit(values: ProfessionalRegistrationFormValues) {
    setSubmitError(null);

    const fieldsValid = await trigger(acceptanceFields);
    const imagesValid = validateDocumentImages();
    const regioesValid = validateSelectedRegioes();
    const disponibilidadesValid = validateDisponibilidades();

    if (!fieldsValid || !imagesValid || !regioesValid || !disponibilidadesValid) {
      return;
    }

    try {
      await registerProfissionalCompleto({
        nomeCompleto: values.nomeCompleto.trim(),
        email: values.email.trim(),
        telefone: values.telefone.trim(),
        cpf: normalizeCpf(values.cpf),
        senha: values.senha,
        nomeExibicao: values.nomeExibicao.trim(),
        dataNascimento: values.dataNascimento,
        descricao: values.descricao,
        experienciaAnos: values.experienciaAnos,
        documento: {
          tipoDocumento: values.tipoDocumento,
          numeroDocumento: values.numeroDocumento.trim(),
          documentoFrenteUrl,
          documentoVersoUrl: documentoTemVersoSeparado ? documentoVersoUrl : documentoFrenteUrl,
          selfieUrl,
          comprovanteResidenciaUrl,
        },
        regiaoIds: selectedRegiaoIds,
        disponibilidades: sortDisponibilidades(disponibilidades).map<DisponibilidadeProfissionalRequest>((entry) => ({
          diaSemana: entry.diaSemana,
          horaInicio: entry.horaInicio,
          horaFim: entry.horaFim,
          ativo: true,
        })),
        aceitarTermosUso: values.aceitarTermosUso,
        aceitarPoliticaPrivacidade: values.aceitarPoliticaPrivacidade,
        aceitarCodigoConduta: values.aceitarCodigoConduta,
      });

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError({
        message: getApiErrorMessage(error),
        details: error instanceof ApiError ? error.errors : [],
      });
    }
  }

  return (
    <RegistrationPageLayout
      aside={<ProfessionalRegistrationSummary />}
      contentLayout="stacked"
      description="Envie seu pré-cadastro completo com documentos, regiões atendidas, disponibilidade e aceites obrigatórios antes da análise."
      eyebrow="Cadastro profissional"
      title="Cadastre-se para receber convites de atendimento na sua região."
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-black text-slate-900">Cadastro profissional</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Complete as etapas abaixo para enviar o cadastro para análise. O acesso profissional só será liberado depois da aprovação.
            </p>
          </div>

          <div className="mt-6">
            <ProfessionalJourney currentStep={currentStep} />
          </div>

          <form className="mt-6 grid gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
            {submitError && (
              <FormAlert tone="error" title="Nao foi possivel enviar o cadastro" message={submitError.message} details={submitError.details} />
            )}

            {currentStep === 'conta' && (
              <FormSection title="Etapa 1 - Conta" description="Use um email válido e um CPF correto para criar sua identidade única na plataforma.">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    autoComplete="name"
                    error={errors.nomeCompleto?.message}
                    label="Nome completo"
                    placeholder="Seu nome completo"
                    registration={register('nomeCompleto')}
                    type="text"
                  />
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
                </div>
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
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    autoComplete="new-password"
                    error={errors.senha?.message}
                    label="Senha"
                    placeholder="Minimo de 8 caracteres"
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
            )}

            {currentStep === 'perfil' && (
              <FormSection title="Etapa 2 - Perfil profissional" description="Esses dados ajudam clientes e operação a entender melhor sua experiência de atendimento.">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput
                    error={errors.nomeExibicao?.message}
                    label="Nome de exibicao"
                    placeholder="Como voce quer aparecer para os clientes"
                    registration={register('nomeExibicao')}
                    type="text"
                  />
                  <TextInput
                    error={errors.dataNascimento?.message}
                    label="Data de nascimento"
                    registration={register('dataNascimento')}
                    type="date"
                  />
                </div>
                <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                  <TextInput
                    error={errors.experienciaAnos?.message}
                    label="Experiencia em anos"
                    min={0}
                    placeholder="Opcional"
                    registration={register('experienciaAnos')}
                    type="number"
                  />
                  <TextArea
                    error={errors.descricao?.message}
                    helperText="Opcional"
                    label="Apresentacao profissional"
                    placeholder="Conte brevemente sobre sua experiencia e rotina de atendimento"
                    registration={register('descricao')}
                  />
                </div>
              </FormSection>
            )}

            {currentStep === 'documentos' && (
              <FormSection title="Etapa 3 - Documentos" description="Envie um documento valido, selfie e comprovante. O formulario aceita arquivo ou camera.">
                <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                  <label className="block">
                    <span className="text-sm font-black text-slate-800">Tipo de documento</span>
                    <select
                      className={`mt-2 min-h-12 w-full rounded-lg border bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 ${
                        errors.tipoDocumento?.message ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'
                      }`}
                      {...register('tipoDocumento')}
                    >
                      {documentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipoDocumento?.message && <span className="mt-2 block text-sm text-red-700">{errors.tipoDocumento.message}</span>}
                  </label>
                  <TextInput
                    error={errors.numeroDocumento?.message}
                    label="Numero do documento"
                    placeholder="Numero do documento"
                    registration={register('numeroDocumento')}
                    type="text"
                  />
                </div>

                <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Documento</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Envie uma imagem principal do documento. Se precisar, voce pode adicionar o verso separadamente.
                      </p>
                    </div>
                    <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        checked={documentoTemVersoSeparado}
                        className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-700"
                        type="checkbox"
                        onChange={(event) => {
                          setDocumentImageErrors((current) => ({ ...current, documentoVersoUrl: undefined }));
                          setDocumentoTemVersoSeparado(event.target.checked);

                          if (!event.target.checked) {
                            setDocumentoVersoUrl(null);
                          }
                        }}
                      />
                      <span>Adicionar verso em imagem separada</span>
                    </label>
                  </div>

                  <div className={`grid gap-5 ${documentoTemVersoSeparado ? 'md:grid-cols-2' : ''}`}>
                    <ImageUploadField
                      allowCamera
                      cameraButtonLabel="Tirar foto do documento"
                      capture="environment"
                      error={documentImageErrors.documentoFrenteUrl}
                      fileButtonLabel="Selecionar imagem do documento"
                      helperText="Voce pode enviar um arquivo ou usar a camera."
                      label={documentoTemVersoSeparado ? 'Documento frente' : 'Documento principal'}
                      value={documentoFrenteUrl}
                      onChange={(value) => {
                        setDocumentImageErrors((current) => ({ ...current, documentoFrenteUrl: undefined }));
                        setDocumentoFrenteUrl(value);
                      }}
                    />

                    {documentoTemVersoSeparado && (
                      <ImageUploadField
                        allowCamera
                        cameraButtonLabel="Tirar foto do verso"
                        capture="environment"
                        error={documentImageErrors.documentoVersoUrl}
                        fileButtonLabel="Selecionar imagem do verso"
                        helperText="Envie uma imagem separada somente se o documento tiver verso relevante."
                        label="Documento verso"
                        value={documentoVersoUrl}
                        onChange={(value) => {
                          setDocumentImageErrors((current) => ({ ...current, documentoVersoUrl: undefined }));
                          setDocumentoVersoUrl(value);
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <ImageUploadField
                    allowCamera
                    cameraButtonLabel="Tirar selfie"
                    capture="user"
                    error={documentImageErrors.selfieUrl}
                    fileButtonLabel="Selecionar selfie"
                    helperText="Voce pode escolher um arquivo ou usar a camera frontal."
                    label="Selfie"
                    value={selfieUrl}
                    onChange={(value) => {
                      setDocumentImageErrors((current) => ({ ...current, selfieUrl: undefined }));
                      setSelfieUrl(value);
                    }}
                  />
                  <ImageUploadField
                    allowCamera
                    cameraButtonLabel="Tirar foto do comprovante"
                    capture="environment"
                    error={documentImageErrors.comprovanteResidenciaUrl}
                    fileButtonLabel="Selecionar comprovante"
                    helperText="Voce pode enviar um arquivo ou usar a camera."
                    label="Comprovante de residencia"
                    value={comprovanteResidenciaUrl}
                    onChange={(value) => {
                      setDocumentImageErrors((current) => ({ ...current, comprovanteResidenciaUrl: undefined }));
                      setComprovanteResidenciaUrl(value);
                    }}
                  />
                </div>
              </FormSection>
            )}

            {currentStep === 'regioes' && (
              <FormSection title="Etapa 4 - Regiões" description="Selecione as regiões onde você deseja receber convites de atendimento.">
                {regioesValidationMessage && <FormAlert tone="error" message={regioesValidationMessage} />}
                {regioesError && (
                  <div className="grid gap-3">
                    <FormAlert tone="error" message={regioesError} />
                    <div>
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        type="button"
                        onClick={() => void loadRegioes()}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                )}

                {isLoadingRegioes ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    Carregando regiões ativas...
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {groupedRegioes.map((group) => (
                      <section key={group.title} className="grid gap-3">
                        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h3 className="text-base font-black text-slate-900">{group.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                          </div>
                          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            {group.regioes.length} {group.regioes.length === 1 ? 'opção' : 'opções'}
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {group.regioes.map((regiao) => (
                            <label
                              key={regiao.id}
                              className={[
                                'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition',
                                selectedRegiaoIds.includes(regiao.id)
                                  ? 'border-cyan-200 bg-cyan-50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50',
                              ].join(' ')}
                            >
                              <input
                                checked={selectedRegiaoIds.includes(regiao.id)}
                                className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-700"
                                type="checkbox"
                                onChange={() => toggleRegiao(regiao.id)}
                              />
                              <span>
                                <span className="block font-black text-slate-900">{regiao.nome}</span>
                                <span className="mt-1 block text-slate-500">{regiao.tipo === 'BAIRRO' ? 'Bairro' : 'Cidade'}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </FormSection>
            )}

            {currentStep === 'disponibilidade' && (
              <FormSection title="Etapa 5 - Disponibilidade" description="Adicione os dias e horarios em que voce pode receber chamados.">
                {disponibilidadesValidationMessage && <FormAlert tone="error" message={disponibilidadesValidationMessage} />}

                <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end">
                  <label className="block">
                    <span className="text-sm font-black text-slate-800">Dia da semana</span>
                    <select
                      className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                      value={disponibilidadeDraft.diaSemana}
                      onChange={(event) =>
                        setDisponibilidadeDraft((current) => ({
                          ...current,
                          diaSemana: event.target.value as DiaSemana,
                        }))
                      }
                    >
                      {DIA_SEMANA_VALUES.map((diaSemana) => (
                        <option key={diaSemana} value={diaSemana}>
                          {DIA_SEMANA_LABELS[diaSemana]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-slate-800">Inicio</span>
                    <input
                      className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                      type="time"
                      value={disponibilidadeDraft.horaInicio}
                      onChange={(event) =>
                        setDisponibilidadeDraft((current) => ({
                          ...current,
                          horaInicio: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-slate-800">Fim</span>
                    <input
                      className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                      type="time"
                      value={disponibilidadeDraft.horaFim}
                      onChange={(event) =>
                        setDisponibilidadeDraft((current) => ({
                          ...current,
                          horaFim: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    className="min-h-12 rounded-lg border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    type="button"
                    onClick={addDisponibilidade}
                  >
                    Adicionar
                  </button>
                </div>

                {disponibilidades.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                    Nenhuma faixa adicionada ainda.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sortDisponibilidades(disponibilidades).map((entry) => (
                      <div key={entry.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900">{DIA_SEMANA_LABELS[entry.diaSemana]}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {entry.horaInicio} as {entry.horaFim}
                          </p>
                        </div>
                        <button
                          className="text-sm font-black text-red-700 transition hover:text-red-800"
                          type="button"
                          onClick={() => removeDisponibilidade(entry.id)}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormSection>
            )}

            {currentStep === 'aceites' && (
              <FormSection title="Etapa 6 - Aceites" description="Antes de enviar, confirme que voce leu os documentos da plataforma e as regras operacionais de seguranca.">
                <div className="grid gap-4">
                  <ConsentCheckbox
                    error={errors.aceitarTermosUso?.message}
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
                          Politica de Privacidade e Tratamento de Dados
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
                          conduta, seguranca, atendimento presencial e uso responsavel da plataforma
                        </Link>
                        .
                      </>
                    }
                    registration={register('aceitarCodigoConduta')}
                  />
                </div>
              </FormSection>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              {currentStep !== 'conta' && (
                <button
                  className="min-h-12 rounded-lg border border-slate-200 px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
                  disabled={isSubmitting}
                  type="button"
                  onClick={handleBackStep}
                >
                  Voltar
                </button>
              )}

              {currentStep === 'aceites' ? (
                <button
                  className="min-h-12 rounded-lg bg-cyan-700 px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(6,182,212,0.22)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Enviando cadastro...' : 'Enviar cadastro para análise'}
                </button>
              ) : (
                <button
                  className="min-h-12 rounded-lg bg-cyan-700 px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(6,182,212,0.22)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  disabled={isSubmitting || (currentStep === 'regioes' && isLoadingRegioes)}
                  type="button"
                  onClick={handleNextStep}
                >
                  Continuar
                </button>
              )}
            </div>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Ja tem conta?{' '}
            <Link className="font-black text-cyan-700 hover:text-cyan-800" to="/entrar">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </RegistrationPageLayout>
  );
}

function ProfessionalRegistrationSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-5">
        <h2 className="text-base font-black text-slate-900">Cadastro completo</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          O envio público já inclui conta, documentos, regiões, disponibilidade e aceites obrigatórios.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Analise administrativa</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Depois do envio, a equipe valida os dados antes de liberar o acesso operacional.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-900">Seguranca da operacao</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          CPF, documentos e aceite de conduta ajudam a manter o cadastro consistente e rastreavel.
        </p>
      </div>
    </div>
  );
}

function ProfessionalJourney({ currentStep }: { currentStep: ProfessionalStep }) {
  const activeIndex = professionalSteps.findIndex((step) => step.key === currentStep);

  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {professionalSteps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;

        return (
          <li
            key={step.key}
            className={[
              'grid min-h-[112px] gap-3 rounded-lg border px-4 py-4 text-sm',
              isActive ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-slate-50/70',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black',
                isDone || isActive ? 'bg-cyan-700 text-white' : 'bg-white text-slate-500',
              ].join(' ')}
            >
              {index + 1}
            </span>
            <span>
              <span className="block font-black text-slate-900">{step.title}</span>
              <span className="mt-1 block leading-5 text-slate-600">{step.description}</span>
            </span>
          </li>
        );
      })}
    </ol>
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

function groupRegioes(regioes: RegiaoAtendimento[]) {
  const sortedRegioes = [...regioes].sort((first, second) =>
    first.nome.localeCompare(second.nome, 'pt-BR', { sensitivity: 'base' }),
  );

  return [
    {
      title: 'Porto Alegre',
      description: 'Selecione os bairros onde voce atende.',
      regioes: sortedRegioes.filter((regiao) => regiao.tipo === 'BAIRRO'),
    },
    {
      title: 'Litoral',
      description: 'Selecione as cidades onde voce atende.',
      regioes: sortedRegioes.filter((regiao) => regiao.tipo === 'CIDADE'),
    },
  ].filter((group) => group.regioes.length > 0);
}
