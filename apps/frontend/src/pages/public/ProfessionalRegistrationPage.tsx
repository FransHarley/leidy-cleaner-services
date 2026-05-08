import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';

import { ConsentCheckbox } from '../../components/ui/ConsentCheckbox';
import { FormAlert } from '../../components/ui/FormAlert';
import { TextArea, TextInput } from '../../components/ui/FormField';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { useAuth } from '../../features/auth/useAuth';
import { getDashboardPath } from '../../features/auth/session';
import { DIA_SEMANA_LABELS, DIA_SEMANA_VALUES, sortDisponibilidades } from '../../features/profissional/disponibilidades/disponibilidadeDisplay';
import { listarRegioesAtivas } from '../../features/profissional/perfil/profissionalApi';
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
    tipoDocumento: z.string().trim().min(1, 'Informe o tipo de documento.').max(40, 'Use no maximo 40 caracteres.'),
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
  { key: 'conta', title: 'Conta', description: 'Acesso e identificacao' },
  { key: 'perfil', title: 'Perfil', description: 'Dados profissionais' },
  { key: 'documentos', title: 'Documentos', description: 'Validacao e seguranca' },
  { key: 'regioes', title: 'Regioes', description: 'Onde voce atende' },
  { key: 'disponibilidade', title: 'Disponibilidade', description: 'Dias e horarios' },
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

  useEffect(() => {
    let isActive = true;

    async function loadRegioes() {
      setIsLoadingRegioes(true);
      setRegioesError(null);

      try {
        const data = await listarRegioesAtivas();

        if (isActive) {
          setRegioes(data.filter((regiao) => regiao.ativo));
        }
      } catch (error) {
        if (isActive) {
          setRegioesError(getApiErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsLoadingRegioes(false);
        }
      }
    }

    void loadRegioes();

    return () => {
      isActive = false;
    };
  }, []);

  if (user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  if (isSubmitted) {
    return (
      <RegistrationPageLayout
        eyebrow="Cadastro profissional"
        title="Cadastro enviado para analise."
        description="Nossa equipe vai revisar seus dados, documentos, regioes e disponibilidade antes de liberar o acesso profissional."
        aside={<ProfessionalRegistrationAside />}
      >
        <div className="rounded-lg border border-cyan-100 bg-white p-8 shadow-sm">
          <FormAlert
            tone="success"
            title="Cadastro enviado para analise."
            message="Assim que seu cadastro for aprovado, voce podera acessar a area profissional com o mesmo email informado no registro."
          />

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-5 text-sm leading-6 text-slate-600">
            <p>Enquanto a conta estiver pendente ou em analise, o login profissional permanece bloqueado.</p>
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

    if (currentStep === 'disponibilidade') {
      if (validateDisponibilidades()) {
        setCurrentStep('aceites');
      }
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
      nextErrors.documentoFrenteUrl = 'Envie a frente do documento.';
    }

    if (!documentoVersoUrl) {
      nextErrors.documentoVersoUrl = 'Envie o verso do documento.';
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
          tipoDocumento: values.tipoDocumento.trim(),
          numeroDocumento: values.numeroDocumento.trim(),
          documentoFrenteUrl,
          documentoVersoUrl,
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
      eyebrow="Cadastro profissional"
      title="Cadastre-se para receber convites de atendimento na sua regiao."
      description="O envio agora acontece em um fluxo completo, com documentos, regioes, disponibilidade e aceites obrigatorios antes da analise."
      aside={<ProfessionalRegistrationAside />}
    >
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black text-slate-900">Cadastro profissional</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Complete as etapas abaixo para enviar o cadastro para analise. O acesso profissional so sera liberado depois da aprovacao.
        </p>

        <div className="mt-6">
          <ProfessionalJourney currentStep={currentStep} />
        </div>

        <form className="mt-6 grid gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <FormAlert tone="error" title="Nao foi possivel enviar o cadastro" message={submitError.message} details={submitError.details} />
          )}

          {currentStep === 'conta' && (
            <FormSection title="Etapa 1 - Conta" description="Use um email valido e um CPF correto para criar sua identidade unica na plataforma.">
              <TextInput
                autoComplete="name"
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
              <div className="grid gap-5 md:grid-cols-2">
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
                <TextInput
                  autoComplete="new-password"
                  error={errors.senha?.message}
                  label="Senha"
                  placeholder="Minimo de 8 caracteres"
                  registration={register('senha')}
                  type="password"
                />
              </div>
              <TextInput
                autoComplete="new-password"
                error={errors.confirmarSenha?.message}
                label="Confirmar senha"
                placeholder="Repita sua senha"
                registration={register('confirmarSenha')}
                type="password"
              />
            </FormSection>
          )}

          {currentStep === 'perfil' && (
            <FormSection title="Etapa 2 - Perfil profissional" description="Esses dados ajudam a identificar sua apresentacao profissional para clientes e operacao.">
              <TextInput
                error={errors.nomeExibicao?.message}
                label="Nome de exibicao"
                placeholder="Como voce quer aparecer para os clientes"
                registration={register('nomeExibicao')}
                type="text"
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  error={errors.dataNascimento?.message}
                  label="Data de nascimento"
                  registration={register('dataNascimento')}
                  type="date"
                />
                <TextInput
                  error={errors.experienciaAnos?.message}
                  label="Experiencia em anos"
                  min={0}
                  placeholder="Opcional"
                  registration={register('experienciaAnos')}
                  type="number"
                />
              </div>
              <TextArea
                error={errors.descricao?.message}
                helperText="Opcional"
                label="Apresentacao profissional"
                placeholder="Conte brevemente sobre sua experiencia e rotina de atendimento"
                registration={register('descricao')}
              />
            </FormSection>
          )}

          {currentStep === 'documentos' && (
            <FormSection title="Etapa 3 - Documentos" description="Os arquivos enviados aqui ficam vinculados ao pre-cadastro para verificacao documental e seguranca.">
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  error={errors.tipoDocumento?.message}
                  label="Tipo de documento"
                  placeholder="RG, CNH ou outro documento valido"
                  registration={register('tipoDocumento')}
                  type="text"
                />
                <TextInput
                  error={errors.numeroDocumento?.message}
                  label="Numero do documento"
                  placeholder="Numero do documento"
                  registration={register('numeroDocumento')}
                  type="text"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ImageUploadField
                  allowCamera
                  capture="environment"
                  error={documentImageErrors.documentoFrenteUrl}
                  helperText="Selecione uma imagem ou tire uma foto."
                  label="Documento frente"
                  value={documentoFrenteUrl}
                  onChange={(value) => {
                    setDocumentImageErrors((current) => ({ ...current, documentoFrenteUrl: undefined }));
                    setDocumentoFrenteUrl(value);
                  }}
                />
                <ImageUploadField
                  allowCamera
                  capture="environment"
                  error={documentImageErrors.documentoVersoUrl}
                  helperText="Selecione uma imagem ou tire uma foto."
                  label="Documento verso"
                  value={documentoVersoUrl}
                  onChange={(value) => {
                    setDocumentImageErrors((current) => ({ ...current, documentoVersoUrl: undefined }));
                    setDocumentoVersoUrl(value);
                  }}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <ImageUploadField
                  allowCamera
                  capture="user"
                  error={documentImageErrors.selfieUrl}
                  helperText="Tire uma selfie para verificacao."
                  label="Selfie"
                  value={selfieUrl}
                  onChange={(value) => {
                    setDocumentImageErrors((current) => ({ ...current, selfieUrl: undefined }));
                    setSelfieUrl(value);
                  }}
                />
                <ImageUploadField
                  allowCamera
                  capture="environment"
                  error={documentImageErrors.comprovanteResidenciaUrl}
                  helperText="Selecione uma imagem ou tire uma foto."
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
            <FormSection title="Etapa 4 - Regioes" description="Selecione as regioes onde voce deseja receber convites de atendimento.">
              {regioesValidationMessage && <FormAlert tone="error" message={regioesValidationMessage} />}
              {regioesError && <FormAlert tone="error" message={regioesError} />}

              {isLoadingRegioes ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  Carregando regioes ativas...
                </div>
              ) : (
                <div className="grid gap-6">
                  {groupedRegioes.map((group) => (
                    <section key={group.title} className="grid gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{group.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
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
                <div className="grid gap-3">
                  {sortDisponibilidades(disponibilidades).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
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
            <FormSection
              title="Etapa 6 - Aceites"
              description="Antes de enviar, confirme que voce leu os documentos da plataforma e as regras operacionais de seguranca."
            >
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
            </FormSection>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                {isSubmitting ? 'Enviando cadastro...' : 'Enviar cadastro para analise'}
              </button>
            ) : (
              <button
                className="min-h-12 rounded-lg bg-cyan-700 px-6 text-sm font-black text-white shadow-[0_14px_28px_rgba(6,182,212,0.22)] transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2"
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
    </RegistrationPageLayout>
  );
}

function ProfessionalRegistrationAside() {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-5">
        <h2 className="text-lg font-black text-slate-900">Fluxo completo antes da analise</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          O envio publico ja inclui os dados essenciais para aprovacao operacional: identidade, documentos, regioes, disponibilidade e aceites.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <p>Contas pendentes, em analise ou rejeitadas nao recebem acesso profissional.</p>
        <p>Violacoes de conduta ou informacoes inconsistentes podem levar a bloqueio do cadastro.</p>
      </div>
    </div>
  );
}

function ProfessionalJourney({ currentStep }: { currentStep: ProfessionalStep }) {
  const activeIndex = professionalSteps.findIndex((step) => step.key === currentStep);

  return (
    <ol className="grid gap-3">
      {professionalSteps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;

        return (
          <li
            key={step.key}
            className={[
              'grid grid-cols-[auto_1fr] items-start gap-3 rounded-lg border px-4 py-3 text-sm',
              isActive ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-slate-50/70',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black',
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
