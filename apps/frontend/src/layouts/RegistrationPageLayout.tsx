import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { BrandMark } from '../components/public/BrandMark';

type RegistrationPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  contentLayout?: 'split' | 'stacked';
  children: ReactNode;
};

export function RegistrationPageLayout({
  eyebrow,
  title,
  description,
  aside,
  contentLayout = 'split',
  children,
}: RegistrationPageLayoutProps) {
  const isStacked = contentLayout === 'stacked';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.22),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef6f7_100%)] px-4 py-6 text-slate-900 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col rounded-lg border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 md:px-8">
          <BrandMark />
          <Link className="text-sm font-bold text-cyan-700 transition hover:text-cyan-800" to="/">
            Voltar ao inicio
          </Link>
        </header>

        {isStacked ? (
          <div className="flex flex-1 flex-col gap-8 px-5 py-8 md:px-8 lg:gap-10 lg:py-12">
            <section className="grid gap-6">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">{eyebrow}</p>
                <h1 className="max-w-4xl text-3xl font-black leading-tight text-slate-950 md:text-5xl">{title}</h1>
                <p className="max-w-4xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>
              </div>
              {aside && <div>{aside}</div>}
            </section>

            <section className="w-full">{children}</section>
          </div>
        ) : (
          <div className="grid flex-1 gap-10 px-5 py-8 md:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-12 lg:py-12">
            <section className="grid content-start gap-6">
              <div className="space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">{eyebrow}</p>
                <h1 className="max-w-xl text-3xl font-black leading-tight text-slate-950 md:text-5xl">{title}</h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>
              </div>
              {aside}
            </section>

            <section className="flex justify-center">
              <div className="w-full max-w-2xl">{children}</div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
