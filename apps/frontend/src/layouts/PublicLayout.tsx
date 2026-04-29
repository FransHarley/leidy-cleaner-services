import { Link, Outlet } from 'react-router-dom';

import { BrandMark } from '../components/public/BrandMark';
import { MailIcon, PhoneIcon, PinIcon, SparkleIcon } from '../components/public/PublicIcons';
import { PublicButton } from '../components/public/PublicButton';

const navItems = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Profissionais', href: '/#profissionais' },
  { label: 'Entrar', to: '/entrar' },
];

const footerColumns = [
  {
    title: 'Navegação',
    items: [
      { label: 'Início', href: '/#inicio' },
      { label: 'Como funciona', href: '/#como-funciona' },
      { label: 'Profissionais', href: '/#profissionais' },
    ],
  },
  {
    title: 'Acesso',
    items: [
      { label: 'Entrar', to: '/entrar' },
      { label: 'Cadastro cliente', to: '/cadastro/cliente' },
      { label: 'Cadastro profissional', to: '/cadastro/profissional' },
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
            <nav className="hidden items-center gap-9 text-sm font-semibold text-slate-700 lg:flex" aria-label="Navegação pública">
              {navItems.map((item) => (
                <PublicNavItem key={item.label} {...item} />
              ))}
            </nav>
            <PublicButton href="/cadastro/cliente" className="hidden md:inline-flex">
              Solicitar faxina
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
            <Link to="/cadastro/cliente" className="whitespace-nowrap text-green-700">
              Solicitar faxina
            </Link>
          </nav>
        </header>

        <Outlet />

        <footer className="border-t border-slate-100 px-5 pb-8 pt-8 md:px-8">
          <div className="mx-auto grid max-w-[980px] gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <BrandMark />
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
                Plataforma operacional para conectar clientes a profissionais de limpeza verificadas.
              </p>
            </div>
            {footerColumns.map((column) => (
              <FooterColumn key={column.title} {...column} />
            ))}
            <div>
              <h2 className="text-sm font-bold text-slate-900">Contato</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-slate-500" />
                  (11) 99999-9999
                </li>
                <li className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 text-slate-500" />
                  contato@leidycleaner.com.br
                </li>
                <li className="flex items-center gap-2">
                  <PinIcon className="h-4 w-4 text-slate-500" />
                  São Paulo - SP
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-slate-500">
            © 2024 Leidy Cleaner Services. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}

function PublicNavItem({ label, href, to }: { label: string; href?: string; to?: string }) {
  const className = 'border-b-2 border-transparent py-2 transition hover:border-green-700 hover:text-green-700';

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
              <Link to={item.to} className="transition hover:text-green-700">
                {item.label}
              </Link>
            ) : (
              <a href={item.href} className="transition hover:text-green-700">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
