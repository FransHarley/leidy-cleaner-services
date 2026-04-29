import { BrandMark } from '../../components/public/BrandMark';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardIcon,
  HeadsetIcon,
  LockIcon,
  ShieldCheckIcon,
  SparkleIcon,
  UserIcon,
} from '../../components/public/PublicIcons';
import { PublicButton } from '../../components/public/PublicButton';
import { HomeSparkPlaceholder } from '../../components/public/PlaceholderVisuals';
import faxineiraHeroUrl from '../../assets/images/faxineira-hero.png';
import profissionalCtaUrl from '../../assets/images/prof_peq.png';

const trustItems = [
  { label: 'Profissionais verificadas', icon: ShieldCheckIcon },
  { label: 'Pagamento seguro', icon: LockIcon },
  { label: 'Atendimento organizado', icon: HeadsetIcon },
];

const steps = [
  {
    title: 'Solicite sua faxina',
    description: 'Informe o que você precisa e escolha a melhor data.',
    icon: ClipboardIcon,
  },
  {
    title: 'Receba uma profissional',
    description: 'Enviamos uma profissional verificada para o serviço.',
    icon: UserIcon,
  },
  {
    title: 'Acompanhe e pague',
    description: 'Acompanhe tudo pela plataforma e pague com segurança.',
    icon: CheckCircleIcon,
  },
];

const benefits = [
  {
    title: 'Profissionais verificadas',
    description: 'Perfis avaliados, documentação conferida e seleção cuidadosa.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Pagamento seguro',
    description: 'Pagamentos protegidos dentro da plataforma, com confirmação operacional.',
    icon: LockIcon,
  },
  {
    title: 'Suporte dedicado',
    description: 'Atendimento humano para acompanhar cada etapa quando precisar.',
    icon: HeadsetIcon,
  },
];

export function HomePage() {
  return (
    <main id="inicio">
      <section className="mx-auto grid max-w-[980px] items-center gap-8 px-5 pb-8 pt-8 md:grid-cols-[0.86fr_1.14fr] md:px-8 md:pb-4 md:pt-10">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            <ShieldCheckIcon className="h-5 w-5" />
            Profissionais verificadas
          </div>

          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[1.04] tracking-normal text-slate-900 md:text-6xl">
            Sua casa limpa, <span className="text-green-700">seu tempo leve.</span>
          </h1>
          <p className="mt-5 max-w-lg text-xl leading-8 text-slate-600">
            Faxina residencial com praticidade, confiança e cuidado em cada detalhe.
          </p>

          <div id="solicitar" className="mt-7 flex flex-col gap-4 sm:flex-row">
            <PublicButton href="/cadastro/cliente">
              Solicitar faxina
              <SparkleIcon />
            </PublicButton>
            <PublicButton href="/cadastro/profissional" variant="secondary">
              <UserIcon className="h-5 w-5" />
              Quero ser profissional
            </PublicButton>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                  <item.icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold leading-5 text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[340px] overflow-hidden rounded-bl-[64px] bg-green-50 md:min-h-[470px]">
          <img
            src={faxineiraHeroUrl}
            alt="Profissional de limpeza Leidy Cleaner Services com materiais de faxina"
            className="absolute bottom-0 right-0 h-full w-full object-contain object-bottom"
          />
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-[980px] px-5 py-4 md:px-8">
        <h2 className="text-center text-2xl font-black text-slate-900">Como funciona</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((step, index) => (
            <StepCard key={step.title} index={index + 1} {...step} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-5 py-3 md:px-8">
        <div className="grid gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-3 md:p-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <benefit.icon className="h-8 w-8" />
              </span>
              <div>
                <h3 className="font-black text-slate-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="profissionais" className="mx-auto max-w-[980px] px-5 py-3 md:px-8">
        <div className="grid items-center gap-5 overflow-hidden rounded-lg bg-green-700 px-5 py-5 text-white md:grid-cols-[180px_1fr_auto] md:px-8 md:py-0">
          <div className="hidden self-end md:block">
            <img
              src={profissionalCtaUrl}
              alt="Profissional de limpeza cadastrada"
              className="h-32 w-auto object-contain"
            />
          </div>
          <div className="relative">
            <SparkleIcon className="absolute -left-12 top-1 hidden h-8 w-8 text-lime-300 md:block" />
            <h2 className="text-2xl font-black">É profissional de limpeza?</h2>
            <p className="mt-2 max-w-xl font-medium leading-6 text-green-50">
              Cadastre-se na Leidy Cleaner Services e tenha mais oportunidades de trabalho.
            </p>
          </div>
          <PublicButton href="/cadastro/profissional" variant="light" className="w-full md:w-auto">
            <UserIcon className="h-5 w-5" />
            Quero me cadastrar
          </PublicButton>
        </div>
      </section>

      <section id="cadastro" className="mx-auto max-w-[980px] px-5 py-3 md:px-8">
        <div className="grid items-center gap-5 rounded-lg border border-slate-100 bg-white px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-[180px_1fr_auto] md:px-8">
          <HomeSparkPlaceholder />
          <h2 className="text-2xl font-black leading-tight text-green-700 md:text-3xl">
            Transforme sua rotina com mais tempo e tranquilidade.
          </h2>
          <PublicButton href="/cadastro/cliente" className="w-full md:w-auto">
            Solicitar faxina
            <SparkleIcon />
          </PublicButton>
        </div>
      </section>

      <section id="entrar" className="mx-auto max-w-[980px] px-5 pb-8 pt-3 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <AudienceCta
            title="Sou cliente"
            description="Quero organizar uma faxina com profissionais verificadas e pagamento seguro."
            href="/cadastro/cliente"
          />
          <AudienceCta
            title="Sou profissional"
            description="Quero receber oportunidades e atuar com acompanhamento operacional."
            href="/cadastro/profissional"
          />
        </div>
      </section>
    </main>
  );
}

function StepCard({
  index,
  title,
  description,
  icon: Icon,
}: {
  index: number;
  title: string;
  description: string;
  icon: typeof ClipboardIcon;
}) {
  return (
    <>
      <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
            <Icon className="h-9 w-9" />
          </span>
          <div>
            <h3 className="font-black text-slate-900">
              {index}. {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
      </article>
      {index < 3 && (
        <div className="hidden items-center justify-center text-green-700 lg:flex">
          <ArrowRightIcon className="h-8 w-8" />
        </div>
      )}
    </>
  );
}

function AudienceCta({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <article className="rounded-lg border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <a
          href={href}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-green-700 shadow-sm transition hover:bg-green-50"
          aria-label={`${title}: continuar`}
        >
          <ArrowRightIcon className="h-6 w-6" />
        </a>
      </div>
    </article>
  );
}
