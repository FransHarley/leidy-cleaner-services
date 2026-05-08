import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

type ConsentCheckboxProps = {
  label: ReactNode;
  error?: string;
  helperText?: string;
  registration: UseFormRegisterReturn;
};

export function ConsentCheckbox({ label, error, helperText, registration }: ConsentCheckboxProps) {
  return (
    <label
      className={[
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition',
        error ? 'border-red-200 bg-red-50/80' : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40',
      ].join(' ')}
    >
      <input
        className="mt-1 h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-700"
        type="checkbox"
        {...registration}
      />
      <span className="min-w-0">
        <span className="block font-bold text-slate-900">{label}</span>
        {(error || helperText) && <span className={`mt-1 block leading-5 ${error ? 'text-red-700' : 'text-slate-500'}`}>{error ?? helperText}</span>}
      </span>
    </label>
  );
}
