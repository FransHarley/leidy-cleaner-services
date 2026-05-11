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
import faxineiraHeroUrl from '../../assets/images/faxineira-hero.png';
import iconeCasaUrl from '../../assets/images/icone_casa.png';
import profissionalCtaUrl from '../../assets/images/prof_peq.png';

const trustItems = [
  { label: 'Profissionais verificadas', icon: ShieldCheckIcon },
  { label: 'Pagamento seguro', icon: LockIcon },
  { label: 'Atendimento organizado', icon: HeadsetIcon },
];

const steps = [
  {
    title: 'Solicite sua faxina',
    description: 'Informe o que você precisa, endereço, data e duração.',
    icon: ClipboardIcon,
  },
  {
    title: 'Escolha profissionais',
    description: 'Veja profissionais elegíveis e selecione até 3 opções.',
    icon: UserIcon,
  },
  {
    title: 'Acompanhe e pague',
    description: 'Após o aceite, acompanhe o atendimento e pague com segurança.',
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
      <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-4 pb-8 pt-5 sm:px-5 lg:grid-cols-[1fr_1.08fr] lg:px-10 lg:pb-4 lg:pt-8">
  <div className="z-10">
    <div className="inline-flex items-center gap-2 rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-500">
      <ShieldCheckIcon className="h-5 w-5" />
      Profissionais verificadas
    </div>

    <h1 className="mt-6 max-w-[620px] text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-slate-900 sm:text-5xl md:text-[60px]">
      Sua casa limpa, <span className="text-cyan-500">seu tempo leve.</span>
    </h1>

    <p className="mt-4 max-w-[560px] text-lg leading-7 text-slate-600 sm:mt-5 sm:text-xl sm:leading-8">
      Faxina residencial, comercial, condominial e eventos com praticidade, confiança e cuidado em cada detalhe.
    </p>

    <p className="mt-4 inline-flex max-w-[560px] rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-700">
      Atendemos em Porto Alegre, Tramandaí, Capão da Canoa e Xangri-lá.
    </p>

    <div id="solicitar" className="mt-7 flex flex-col gap-4 sm:flex-row">
      <PublicButton href="/cadastro/cliente" className="w-full sm:w-auto">
        Solicitar faxina
        <SparkleIcon />
      </PublicButton>

      <PublicButton href="/cadastro/profissional" variant="secondary" className="w-full sm:w-auto">
        <UserIcon className="h-5 w-5" />
        Quero ser profissional
      </PublicButton>
    </div>

    <div className="mt-8 grid gap-5 sm:grid-cols-3">
      {trustItems.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500">
            <item.icon className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold leading-5 text-slate-600">{item.label}</span>
        </div>
      ))}
    </div>
  </div>

  <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-slate-50 sm:min-h-[380px] lg:-mt-8 lg:min-h-[450px] lg:rounded-bl-[72px]">
  <img
    src={faxineiraHeroUrl}
    alt="Profissional de limpeza Leidy Cleaner Services com materiais de faxina"
    className="absolute bottom-0 right-[-18px] h-[115%] w-[115%] object-contain object-bottom sm:right-[-24px] sm:h-[120%] sm:w-[120%] lg:right-[-38px] lg:h-[125%] lg:w-[125%]"
  />
</div>
</section>

      <section className="mx-auto max-w-[980px] px-4 py-3 sm:px-5 md:px-8">
        <div className="grid gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-3 md:p-6">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-500">
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

      <section id="como-funciona" className="mx-auto max-w-[980px] px-4 py-3 sm:px-5 md:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Como funciona</h2>
          <p className="mt-4 text-lg text-slate-600">
            Processo simples e seguro para sua faxina residencial.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard key={step.title} index={index + 1} {...step} />
          ))}
        </div>
      </section>

      <section id="profissionais" className="mx-auto max-w-[980px] px-4 py-3 sm:px-5 md:px-8">
        <div className="grid items-center gap-5 overflow-hidden rounded-lg bg-cyan-600 px-5 py-5 text-white md:px-8 lg:grid-cols-[180px_1fr_auto] lg:py-0">
          <div className="hidden self-end md:block">
            <img
              src={profissionalCtaUrl}
              alt="Profissional de limpeza cadastrada"
              className="h-32 w-auto object-contain"
            />
          </div>
          <div className="relative">
            <SparkleIcon className="absolute -left-12 top-1 hidden h-8 w-8 text-sky-300 md:block" />
            <h2 className="text-2xl font-black">É profissional de limpeza?</h2>
            <p className="mt-2 max-w-xl font-medium leading-6 text-cyan-50">
              Cadastre-se na Leidy Cleaner Services e tenha mais oportunidades de trabalho.
            </p>
          </div>
          <PublicButton href="/cadastro/profissional" variant="light" className="w-full lg:w-auto">
            <UserIcon className="h-5 w-5" />
            Quero me cadastrar
          </PublicButton>
        </div>
      </section>

      <section id="cadastro" className="mx-auto max-w-[980px] px-4 py-3 sm:px-5 md:px-8">
        <div className="grid items-center gap-5 rounded-lg border border-slate-100 bg-white px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:px-8 lg:grid-cols-[180px_1fr_auto]">
          <div className="flex h-24 w-28 items-center justify-center rounded-lg bg-cyan-50">
            <img src={iconeCasaUrl} alt="Ícone de casa" className="h-16 w-16 object-contain" />
          </div>
          <h2 className="text-2xl font-black leading-tight text-cyan-500 md:text-3xl">
            Transforme sua rotina com mais tempo e tranquilidade.
          </h2>
          <PublicButton href="/cadastro/cliente" className="w-full lg:w-auto">
            Solicitar faxina
            <SparkleIcon />
          </PublicButton>
        </div>
      </section>

      <section id="entrar" className="mx-auto max-w-[980px] px-4 pb-8 pt-3 sm:px-5 md:px-8">
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
    <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-500">
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-500 shadow-sm transition hover:bg-cyan-50"
          aria-label={`${title}: continuar`}
        >
          <ArrowRightIcon className="h-6 w-6" />
        </a>
      </div>
    </article>
  );
}
