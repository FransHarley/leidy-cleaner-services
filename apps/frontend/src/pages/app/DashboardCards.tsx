import { Link } from 'react-router-dom';

type DashboardCard = {
  title: string;
  description: string;
  href?: string;
};

type DashboardCardsProps = {
  items: DashboardCard[];
};

type DashboardSummaryCard = {
  title: string;
  value: number;
  description: string;
  tone?: 'red' | 'yellow' | 'green' | 'neutral';
};

const summaryToneClassName: Record<NonNullable<DashboardSummaryCard['tone']>, string> = {
  red: 'border-red-100 bg-red-50 text-red-900',
  yellow: 'border-amber-100 bg-amber-50 text-amber-950',
  green: 'border-green-100 bg-green-50 text-green-900',
  neutral: 'border-slate-100 bg-white text-slate-900',
};

export function DashboardCards({ items }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <DashboardCardItem key={item.title} item={item} />
      ))}
    </div>
  );
}

function DashboardCardItem({ item }: { item: DashboardCard }) {
  const content = (
    <>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-lg font-black text-cyan-700">
        {item.title.charAt(0)}
      </div>
      <h2 className="mt-4 text-lg font-black text-slate-900">{item.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
    </>
  );

  if (item.href) {
    return (
      <Link
        className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-cyan-100 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
        to={item.href}
      >
        {content}
      </Link>
    );
  }

  return <article className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">{content}</article>;
}

export function DashboardSummaryCards({ items }: { items: DashboardSummaryCard[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
      {items.map((item) => {
        const tone = item.tone ?? 'neutral';

        return (
          <article key={item.title} className={`rounded-lg border p-5 shadow-sm ${summaryToneClassName[tone]}`}>
            <p className="text-3xl font-black tracking-normal">{item.value}</p>
            <h2 className="mt-2 text-sm font-black uppercase tracking-[0.12em]">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 opacity-80">{item.description}</p>
          </article>
        );
      })}
    </section>
  );
}

export function DashboardActionAlert({
  cta,
  description,
  href,
  title,
}: {
  cta: string;
  description: string;
  href: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-red-100 bg-red-50 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-700">Ação pendente</p>
          <h2 className="mt-2 text-2xl font-black text-red-950">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-red-900">{description}</p>
        </div>
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-red-700 px-5 text-sm font-black text-white transition hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-700 md:w-auto"
          to={href}
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}

export function DashboardHeader({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-lg border border-cyan-100 bg-white p-5 shadow-sm md:p-7">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Resumo</p>
      <h1 className="mt-3 text-3xl font-black tracking-normal text-slate-900 md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
    </section>
  );
}
