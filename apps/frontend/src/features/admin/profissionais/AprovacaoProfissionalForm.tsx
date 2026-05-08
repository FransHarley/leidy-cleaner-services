import { useEffect, useState, type FormEvent } from 'react';

import { statusAprovacaoProfissionalOptions } from './profissionalLabels';
import type { StatusAprovacaoProfissional } from './types';

type AprovacaoProfissionalFormProps = {
  profissionalId: number;
  initialStatus?: StatusAprovacaoProfissional;
  isSubmitting: boolean;
  onSubmit: (values: { profissionalId: number; statusAprovacao: StatusAprovacaoProfissional }) => void;
};

export function AprovacaoProfissionalForm({
  profissionalId,
  initialStatus = 'EM_ANALISE',
  isSubmitting,
  onSubmit,
}: AprovacaoProfissionalFormProps) {
  const [statusAprovacao, setStatusAprovacao] = useState<StatusAprovacaoProfissional>(initialStatus);

  useEffect(() => {
    setStatusAprovacao(initialStatus);
  }, [initialStatus]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ profissionalId, statusAprovacao });
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Status de aprovação
        <select
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          disabled={isSubmitting}
          value={statusAprovacao}
          onChange={(event) => setStatusAprovacao(event.target.value as StatusAprovacaoProfissional)}
        >
          {statusAprovacaoProfissionalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="min-h-11 w-full rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Enviando...' : 'Salvar aprovação'}
      </button>
    </form>
  );
}
