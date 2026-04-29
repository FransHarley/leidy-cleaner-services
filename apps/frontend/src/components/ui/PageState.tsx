import type { ReactNode } from 'react';

type PageStateTone = 'neutral' | 'loading' | 'empty' | 'success';

type PageStateProps = {
  title: string;
  description?: string;
  tone?: PageStateTone;
  children?: ReactNode;
  className?: string;
};

const toneClassName: Record<PageStateTone, string> = {
  neutral: 'border-slate-100 bg-white text-slate-900',
  loading: 'border-green-100 bg-green-50 text-green-900',
  empty: 'border-slate-100 bg-white text-slate-900',
  success: 'border-green-100 bg-green-50 text-green-900',
};

export function PageState({ title, description, tone = 'neutral', children, className = '' }: PageStateProps) {
  return (
    <section
      className={`rounded-lg border p-6 text-center shadow-sm ${toneClassName[tone]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center">
        {tone === 'loading' && (
          <span className="mb-4 flex items-center gap-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-700" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-600 [animation-delay:120ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500 [animation-delay:240ms]" />
          </span>
        )}
        <h3 className="font-black text-current">{title}</h3>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </section>
  );
}

export function LoadingState(props: Omit<PageStateProps, 'tone'>) {
  return <PageState tone="loading" {...props} />;
}

export function EmptyState(props: Omit<PageStateProps, 'tone'>) {
  return <PageState tone="empty" {...props} />;
}

export function StateBox(props: PageStateProps) {
  return <PageState {...props} />;
}
