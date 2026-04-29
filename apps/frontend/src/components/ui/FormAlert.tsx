type FormAlertProps = {
  tone?: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  details?: string[];
};

const toneClassName = {
  error: 'border-red-100 bg-red-50 text-red-800',
  success: 'border-green-100 bg-green-50 text-green-800',
  info: 'border-slate-100 bg-slate-50 text-slate-700',
};

export function FormAlert({ tone = 'info', title, message, details = [] }: FormAlertProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${toneClassName[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {title && <p className="font-black">{title}</p>}
      <p className={title ? 'mt-1 leading-6' : 'leading-6'}>{message}</p>
      {details.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
