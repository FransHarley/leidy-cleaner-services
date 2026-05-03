import { useEffect, useMemo, useState, type FormEvent } from 'react';

import type { RegiaoAtendimento } from '../perfil/types';

type ProfissionalRegioesFormProps = {
  regioes: RegiaoAtendimento[];
  selectedRegioes: RegiaoAtendimento[];
  isSubmitting?: boolean;
  onSubmit: (regiaoIds: number[]) => void | Promise<void>;
};

export function ProfissionalRegioesForm({
  regioes,
  selectedRegioes,
  isSubmitting = false,
  onSubmit,
}: ProfissionalRegioesFormProps) {
  const selectedIdsFromApi = useMemo(() => uniqueIds(selectedRegioes.map((regiao) => regiao.id)), [selectedRegioes]);
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedIdsFromApi);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds(selectedIdsFromApi);
  }, [selectedIdsFromApi]);

  function toggleRegion(regiaoId: number) {
    setValidationMessage(null);
    setSelectedIds((current) =>
      current.includes(regiaoId) ? current.filter((id) => id !== regiaoId) : uniqueIds([...current, regiaoId]),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const uniqueSelectedIds = uniqueIds(selectedIds);

    if (uniqueSelectedIds.length === 0) {
      setValidationMessage('Selecione ao menos uma região para salvar.');
      return;
    }

    setSelectedIds(uniqueSelectedIds);
    await onSubmit(uniqueSelectedIds);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      {validationMessage && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{validationMessage}</p>
      )}

      {regioes.length === 0 ? (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          Nenhuma região ativa foi retornada pela API.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {regioes.map((regiao) => (
            <label
              key={regiao.id}
              className={[
                'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition',
                selectedIds.includes(regiao.id) ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-white hover:bg-slate-50',
              ].join(' ')}
            >
              <input
                checked={selectedIds.includes(regiao.id)}
                className="mt-1 h-4 w-4 rounded border-green-300 text-green-700 focus:ring-green-700"
                type="checkbox"
                onChange={() => toggleRegion(regiao.id)}
              />
              <span>
                <span className="block font-black text-slate-900">{regiao.nome}</span>
                <span className="mt-1 block text-slate-500">{regiao.tipo === 'BAIRRO' ? 'Bairro' : regiao.tipo}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          className="min-h-11 rounded-lg bg-green-700 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(21,128,61,0.18)] transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          disabled={isSubmitting || regioes.length === 0}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar regiões'}
        </button>
      </div>
    </form>
  );
}

function uniqueIds(ids: number[]) {
  return Array.from(new Set(ids));
}
