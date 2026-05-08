import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { BrandMark } from '../components/public/BrandMark';

type AuthPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthPageLayout({ eyebrow, title, description, children }: AuthPageLayoutProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f4] px-4 py-4 text-slate-900 sm:px-5 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:min-h-[calc(100vh-3rem)]">
        <header className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-5 md:px-8">
          <BrandMark />
          <Link className="text-sm font-bold text-cyan-500 transition hover:text-cyan-600" to="/">
            Voltar ao inicio
          </Link>
        </header>

        <div className="grid flex-1 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="flex flex-col justify-center bg-cyan-600 px-5 py-8 text-white md:px-10 md:py-10">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">{eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-normal md:mt-5 md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-cyan-50 md:mt-5 md:text-lg md:leading-8">{description}</p>
            <div className="mt-8 grid gap-3 text-sm font-semibold text-cyan-50">
              <span className="rounded-lg bg-white/10 px-4 py-3">Profissionais verificadas e fluxo acompanhado</span>
              <span className="rounded-lg bg-white/10 px-4 py-3">Contratacao organizada com seguranca operacional</span>
              <span className="rounded-lg bg-white/10 px-4 py-3">Dados protegidos em cada etapa da jornada</span>
            </div>
          </section>

          <section className="flex items-center justify-center px-4 py-6 sm:px-5 md:px-10 md:py-8">
            <div className="w-full max-w-xl">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
