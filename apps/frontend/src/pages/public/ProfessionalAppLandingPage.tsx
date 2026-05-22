import { Link } from 'react-router-dom';

import { BrandMark } from '../../components/public/BrandMark';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardIcon,
  HeadsetIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from '../../components/public/PublicIcons';
import {
  buildProfessionalAppLoginPath,
  PROFESSIONAL_APP_HOME_PATH,
  PROFESSIONAL_APP_LANDING_PATH,
} from '../../features/native/professionalApp';

const howItWorksSteps = [
  {
    title: 'Crie seu cadastro',
    description: 'Informe seus dados basicos para entrar na plataforma.',
  },
  {
    title: 'Envie sua documentacao',
    description: 'A equipe da Leidy Cleaner analisa suas informacoes para liberar seu perfil.',
  },
  {
    title: 'Escolha regioes e horarios',
    description: 'Defina onde voce atende e quando esta disponivel.',
  },
  {
    title: 'Receba convites de faxina',
    description: 'Quando surgir uma solicitacao compativel, voce recebe o convite no app.',
  },
  {
    title: 'Aceite ou recuse',
    description: 'Voce decide se quer aceitar o chamado. Se aceitar, o atendimento aparece na sua area.',
  },
  {
    title: 'Execute e acompanhe o servico',
    description: 'Veja os detalhes, marque inicio, finalize e abra ocorrencia se precisar.',
  },
] as const;

const benefitCards = [
  {
    title: 'Convites organizados',
    description: 'Receba novas oportunidades de faxina e responda pelo app.',
    icon: SparkleIcon,
  },
  {
    title: 'Horarios e regioes',
    description: 'Informe onde voce atende e em quais dias esta disponivel.',
    icon: ClipboardIcon,
  },
  {
    title: 'Atendimentos acompanhados',
    description: 'Veja endereco, horario, detalhes do servico e status do atendimento.',
    icon: CheckCircleIcon,
  },
  {
    title: 'Inicio e fim do servico',
    description: 'Registre quando comecou e quando finalizou cada atendimento.',
    icon: ArrowRightIcon,
  },
  {
    title: 'Status da verificacao',
    description: 'Acompanhe se seu cadastro esta pendente, aprovado ou precisa de ajuste.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Ocorrencias',
    description: 'Avise a equipe caso aconteca algum problema no atendimento.',
    icon: HeadsetIcon,
  },
] as const;

const startChecklist = [
  {
    title: 'Cadastro analisado pela equipe',
    description: 'A aprovacao nao e automatica.',
  },
  {
    title: 'Voce controla sua disponibilidade',
    description: 'Pode ativar ou desativar o recebimento de chamados quando precisar.',
  },
  {
    title: 'App exclusivo para profissionais',
    description: 'Clientes e administracao continuam usando suas proprias areas.',
  },
] as const;

const loginHref = buildProfessionalAppLoginPath(PROFESSIONAL_APP_HOME_PATH);
const publicSiteHref = import.meta.env.VITE_PUBLIC_SITE_URL?.trim() || '/';
const publicSiteIsExternal = /^https?:\/\//.test(publicSiteHref);

export function ProfessionalAppLandingPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <BrandMark compact href={PROFESSIONAL_APP_LANDING_PATH} />
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
              to={loginHref}
            >
              Entrar
            </Link>
          </div>
        </header>

        <main className="flex-1">
          <section className="px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
            <div className="mx-auto grid w-full max-w-[1040px] gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="rounded-[2rem] bg-[#f7fcfd] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
                <span className="inline-flex min-h-10 items-center rounded-full bg-cyan-50 px-4 text-sm font-black text-cyan-700">
                  App exclusivo para profissionais
                </span>

                <h1 className="mt-5 text-[2rem] font-black leading-tight tracking-[-0.03em] text-slate-900 sm:text-[2.75rem]">
                  Receba convites de faxina direto no celular.
                </h1>

                <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                  Acompanhe seus chamados, aceite ou recuse convites, veja seus atendimentos e registre inicio e fim do
                  servico pelo app.
                </p>

                <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  O app da Leidy Cleaner foi criado para profissionais cadastradas acompanharem sua rotina de trabalho
                  com mais clareza, seguranca e praticidade.
                </p>

                <div className="mt-6 grid gap-3 sm:max-w-[360px]">
                  <PrimaryActionLink to="/cadastro/profissional">Cadastrar como profissional</PrimaryActionLink>
                  <SecondaryActionLink to={loginHref}>Entrar na minha conta</SecondaryActionLink>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                  Seu cadastro passa por analise antes de voce comecar a receber chamados.
                </p>
              </div>

              <div className="grid gap-4">
                <HeroStatusCard
                  eyebrow="Convites"
                  title="Receba e responda no app"
                  description="Novos convites aparecem de forma organizada para voce aceitar ou recusar com clareza."
                />
                <HeroStatusCard
                  eyebrow="Atendimentos"
                  title="Acompanhe sua rotina"
                  description="Veja horario, endereco, detalhes do servico e o status atual de cada atendimento."
                />
                <HeroStatusCard
                  eyebrow="Execucao"
                  title="Registre o que acontece em campo"
                  description="Marque inicio, finalize o servico e abra ocorrencia quando precisar de apoio."
                />
              </div>
            </div>
          </section>

          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-[1040px]">
              <SectionHeading
                title="Como comecar a usar"
                description="Tudo o que voce precisa para sair do cadastro inicial e chegar pronta para receber convites."
              />

              <ol className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {howItWorksSteps.map((step, index) => (
                  <li key={step.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <h3 className="mt-4 text-lg font-black text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="bg-slate-50/70 px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-[1040px]">
              <SectionHeading
                title="Tudo em um lugar para facilitar sua rotina"
                description="A area profissional foi pensada para reduzir duvidas, organizar o dia e deixar os passos importantes mais visiveis."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {benefitCards.map((card) => (
                  <article key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <card.icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-black text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-[1040px] rounded-[2rem] border border-cyan-100 bg-[#f7fcfd] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-8">
              <SectionHeading
                title="Antes de comecar"
                description="Para receber chamados, seu perfil precisa estar aprovado, com documentacao validada, regioes atendidas configuradas e disponibilidade cadastrada."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {startChecklist.map((item) => (
                  <article key={item.title} className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-sm">
                    <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 pb-10 pt-6 sm:px-6">
            <div className="mx-auto w-full max-w-[1040px] rounded-[2rem] bg-cyan-600 px-6 py-7 text-white shadow-[0_20px_48px_rgba(8,145,178,0.28)] sm:px-8">
              <h2 className="text-2xl font-black sm:text-3xl">Pronta para comecar?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50 sm:text-base">
                Crie seu cadastro profissional ou entre para acompanhar seus convites e atendimentos.
              </p>

              <div className="mt-6 grid gap-3 sm:max-w-[360px]">
                <LightActionLink to="/cadastro/profissional">Cadastrar como profissional</LightActionLink>
                <OutlineActionLink to={loginHref}>Entrar na minha conta</OutlineActionLink>
              </div>

              <p className="mt-5 text-sm leading-6 text-cyan-50">
                Se voce e cliente e deseja solicitar uma faxina, acesse o site da Leidy Cleaner Services.
              </p>

              <div className="mt-3">
                <a
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-white underline decoration-white/50 underline-offset-4 transition hover:text-cyan-50"
                  href={publicSiteHref}
                  target={publicSiteIsExternal ? '_blank' : undefined}
                  rel={publicSiteIsExternal ? 'noreferrer' : undefined}
                >
                  Ir para o site publico
                  <ArrowRightIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

function HeroStatusCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">{eyebrow}</p>
      <h2 className="mt-3 text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function PrimaryActionLink({ children, to }: { children: string; to: string }) {
  return (
    <Link
      className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-cyan-600 px-6 text-sm font-black text-white shadow-[0_16px_34px_rgba(8,145,178,0.22)] transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
      to={to}
    >
      {children}
    </Link>
  );
}

function SecondaryActionLink({ children, to }: { children: string; to: string }) {
  return (
    <Link
      className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
      to={to}
    >
      {children}
    </Link>
  );
}

function LightActionLink({ children, to }: { children: string; to: string }) {
  return (
    <Link
      className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-cyan-700 shadow-[0_16px_34px_rgba(15,23,42,0.12)] transition hover:bg-cyan-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-600"
      to={to}
    >
      {children}
    </Link>
  );
}

function OutlineActionLink({ children, to }: { children: string; to: string }) {
  return (
    <Link
      className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/35 bg-transparent px-6 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-cyan-600"
      to={to}
    >
      {children}
    </Link>
  );
}
