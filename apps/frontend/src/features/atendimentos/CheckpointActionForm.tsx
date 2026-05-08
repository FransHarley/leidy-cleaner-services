import type { FormEvent } from 'react';

import type { CheckpointServicoRequest } from './types';

type CheckpointActionFormProps = {
  actionLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: CheckpointServicoRequest) => void;
  tone?: 'start' | 'finish';
};

export function CheckpointActionForm({ actionLabel, isSubmitting, onSubmit, tone = 'start' }: CheckpointActionFormProps) {
  const description =
    tone === 'finish'
      ? 'Confirme a finalização apenas quando o serviço tiver sido concluído.'
      : 'Confirme o início apenas quando estiver pronta para começar o atendimento no local.';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({});
  }

  return (
    <form className="grid gap-5 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-xl font-black text-slate-900">{actionLabel}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <button
        className={[
          'min-h-11 rounded-lg px-5 text-sm font-black text-white transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-slate-300 md:min-w-48',
          tone === 'finish'
            ? 'bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-700'
            : 'bg-cyan-700 hover:bg-cyan-800 focus-visible:ring-cyan-700',
        ].join(' ')}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Enviando...' : actionLabel}
      </button>
    </form>
  );
}
