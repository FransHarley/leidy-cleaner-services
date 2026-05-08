import { useState, type FormEvent } from 'react';

import { statusVerificacaoOptions } from './verificacaoLabels';
import type { AnalisarDocumentoVerificacaoRequest, StatusVerificacao } from './types';

type AnaliseVerificacaoFormProps = {
  initialStatus: StatusVerificacao;
  isSubmitting: boolean;
  onSubmit: (payload: AnalisarDocumentoVerificacaoRequest) => void;
};

export function AnaliseVerificacaoForm({ initialStatus, isSubmitting, onSubmit }: AnaliseVerificacaoFormProps) {
  const [statusVerificacao, setStatusVerificacao] = useState<StatusVerificacao>(initialStatus);
  const [observacaoAnalise, setObservacaoAnalise] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      statusVerificacao,
      observacaoAnalise: emptyToNull(observacaoAnalise),
    });
  }

  return (
    <form className="grid gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-sm md:p-6" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-xl font-black text-slate-900">Analisar verificação</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">A decisão será enviada para o backend de verificação.</p>
      </div>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Status
        <select
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          disabled={isSubmitting}
          value={statusVerificacao}
          onChange={(event) => setStatusVerificacao(event.target.value as StatusVerificacao)}
        >
          {statusVerificacaoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Observação da análise
        <textarea
          className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          disabled={isSubmitting}
          value={observacaoAnalise}
          onChange={(event) => setObservacaoAnalise(event.target.value)}
        />
      </label>

      <button
        className="min-h-11 w-full rounded-lg bg-cyan-700 px-5 text-sm font-black text-white transition hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Enviando...' : 'Salvar análise'}
      </button>
    </form>
  );
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
