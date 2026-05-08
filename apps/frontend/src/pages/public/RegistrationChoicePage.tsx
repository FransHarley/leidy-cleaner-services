import { Link, Navigate } from 'react-router-dom';

import { ArrowRightIcon, ClipboardIcon, ShieldCheckIcon, SparkleIcon, UserIcon } from '../../components/public/PublicIcons';
import { getDashboardPath } from '../../features/auth/session';
import { useAuth } from '../../features/auth/useAuth';
import { RegistrationPageLayout } from '../../layouts/RegistrationPageLayout';

const registrationOptions = [
  {
    title: 'Quero contratar uma faxina',
    description: 'Crie sua conta de cliente, informe o endereco inicial e entre na area onde as solicitacoes sao acompanhadas.',
    href: '/cadastro/cliente',
    icon: SparkleIcon,
    benefits: ['Conta de cliente', 'Endereco inicial', 'Aceite dos documentos da plataforma'],
  },
  {
    title: 'Quero trabalhar como profissional',
    description: 'Envie o cadastro completo com documentos, regioes e disponibilidade para analise da equipe administrativa.',
    href: '/cadastro/profissional',
    icon: UserIcon,
    benefits: ['Perfil profissional', 'Verificacao documental', 'Regioes e agenda'],
  },
];

export function RegistrationChoicePage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return (
    <RegistrationPageLayout
      eyebrow="Cadastro"
      title="Escolha como voce quer entrar na operacao."
      description="Cada jornada pede dados diferentes para manter o cadastro consistente, seguro e pronto para o proximo passo."
      aside={<RegistrationChoiceAside />}
    >
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-black text-slate-900">Criar cadastro</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Selecione a opcao certa para seguir em uma pagina dedicada, com as etapas e validacoes esperadas para o seu perfil.
        </p>

        <div className="mt-6 grid gap-4">
          {registrationOptions.map((option) => (
            <RegistrationOption key={option.href} {...option} />
          ))}
        </div>

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

function RegistrationChoiceAside() {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-5">
        <h2 className="text-lg font-black text-slate-900">Uma entrada mais clara</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          O cadastro agora segue por paginas proprias. Isso deixa os dados mais organizados e reduz erros logo na primeira etapa.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex gap-3">
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
          <p>Termos, privacidade e conduta ficam visiveis e obrigatorios no proprio fluxo.</p>
        </div>
        <div className="flex gap-3">
          <ClipboardIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
          <p>O cadastro profissional ja sai pronto para a analise administrativa, sem depender de login automatico.</p>
        </div>
      </div>
    </div>
  );
}

function RegistrationOption({
  title,
  description,
  href,
  icon: Icon,
  benefits,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof SparkleIcon;
  benefits: string[];
}) {
  return (
    <Link
      className="group rounded-lg border border-slate-200 bg-slate-50/70 p-5 transition hover:border-cyan-200 hover:bg-cyan-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
      to={href}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm transition group-hover:bg-cyan-100">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black leading-6 text-slate-900">{title}</h3>
            <ArrowRightIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {benefits.map((benefit) => (
              <span key={benefit} className="rounded-lg border border-cyan-100 bg-white px-3 py-1 text-xs font-black text-cyan-800">
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
