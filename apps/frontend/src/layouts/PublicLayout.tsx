import { Link, Outlet } from 'react-router-dom';

import { BrandMark } from '../components/public/BrandMark';
import { MailIcon, PhoneIcon, PinIcon, SparkleIcon } from '../components/public/PublicIcons';
import { PublicButton } from '../components/public/PublicButton';

const navItems = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Profissionais', href: '/#profissionais' },
  { label: 'Entrar', to: '/entrar' },
];

const footerColumns = [
  {
    title: 'Navegacao',
    items: [
      { label: 'Inicio', href: '/#inicio' },
      { label: 'Como funciona', href: '/#como-funciona' },
      { label: 'Profissionais', href: '/#profissionais' },
    ],
  },
  {
    title: 'Institucional',
    items: [
      { label: 'Sobre nos', href: '/#sobre-nos' },
      { label: 'Politica de privacidade', to: '/privacidade' },
      { label: 'Termos de uso', to: '/termos-de-uso' },
      { label: 'Codigo de conduta', to: '/codigo-de-conduta' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { label: 'Perguntas frequentes', href: '/#faq' },
      { label: 'Suporte', href: '/#suporte' },
      { label: 'Contato', href: '/#contato' },
    ],
  },
];

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f6f7f4] text-slate-900">
      <div className="mx-auto min-h-screen w-full max-w-[1120px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[980px] items-center justify-between gap-4 px-5 py-5 md:px-8">
            <BrandMark />
            <nav className="hidden items-center gap-9 text-sm font-semibold text-slate-700 lg:flex" aria-label="Navegacao publica">
              {navItems.map((item) => (
                <PublicNavItem key={item.label} {...item} />
              ))}
            </nav>
            <PublicButton href="/cadastro" className="hidden md:inline-flex">
              Cadastrar
              <SparkleIcon />
            </PublicButton>
          </div>
          <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 md:hidden">
            {navItems.slice(0, 3).map((item) => (
              <a key={item.label} href={item.href} className="whitespace-nowrap">
                {item.label}
              </a>
            ))}
            <Link to="/entrar" className="whitespace-nowrap">
              Entrar
            </Link>
            <Link to="/cadastro" className="whitespace-nowrap text-cyan-500">
              Cadastrar
            </Link>
          </nav>
        </header>

        <Outlet />

        <footer className="border-t border-slate-100 bg-slate-50/70 px-5 pb-8 pt-10 md:px-8 md:pt-12">
          <div className="mx-auto max-w-[980px]">
            <div className="grid gap-9 lg:grid-cols-[1fr_2fr]">
              <div className="max-w-sm">
                <BrandMark compact />
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Plataforma operacional para conectar clientes a profissionais de limpeza verificadas.
                </p>
              </div>

              <div className="grid gap-8">
                <div className="grid gap-7 sm:grid-cols-3">
                  {footerColumns.map((column) => (
                    <FooterColumn key={column.title} {...column} />
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h2 className="text-sm font-bold text-slate-900">Contato</h2>
                  <ul className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
                    <li className="flex items-start gap-3">
                      <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
                      <span>(11) 99999-9999</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
                      <span className="break-all">contato@leidycleaner.com.br</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
                      <span>Sao Paulo - SP</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
              Copyright 2024 Leidy Cleaner Services. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function PublicNavItem({ label, href, to }: { label: string; href?: string; to?: string }) {
  const className = 'border-b-2 border-transparent py-2 transition hover:border-cyan-500 hover:text-cyan-500';

  if (to) {
    return (
      <Link className={className} to={to}>
        {label}
      </Link>
    );
  }

  return (
    <a className={className} href={href}>
      {label}
    </a>
  );
}

function FooterColumn({ title, items }: { title: string; items: Array<{ label: string; href?: string; to?: string }> }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item.label}>
            {item.to ? (
              <Link to={item.to} className="transition hover:text-cyan-700">
                {item.label}
              </Link>
            ) : (
              <a href={item.href} className="transition hover:text-cyan-700">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
