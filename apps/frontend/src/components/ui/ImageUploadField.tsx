import { useEffect, useRef, useState, type ChangeEvent } from 'react';

type ImageUploadFieldProps = {
  label: string;
  error?: string;
  helperText?: string;
  fileButtonLabel?: string;
  cameraButtonLabel?: string;
  allowCamera?: boolean;
  capture?: 'user' | 'environment';
  onChange: (value: string | null) => void;
  value?: string | null;
};

export function ImageUploadField({
  label,
  error,
  helperText,
  fileButtonLabel = 'Selecionar arquivo',
  cameraButtonLabel = 'Usar camera',
  allowCamera = false,
  capture,
  onChange,
  value,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsCameraSupported(
      typeof navigator !== 'undefined' &&
        Boolean(navigator.mediaDevices) &&
        typeof navigator.mediaDevices.getUserMedia === 'function',
    );
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho maximo permitido e 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const handleCameraCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const removeImage = () => {
    onChange(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {value && (
        <div className="relative">
          <img alt="Preview" className="h-32 max-w-full rounded-lg border object-cover" src={value} />
          <button
            type="button"
            onClick={removeImage}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-black text-white hover:bg-red-600"
          >
            x
          </button>
        </div>
      )}

      {!value && (
        <div className="flex flex-wrap gap-3">
          <input ref={fileInputRef} accept="image/*" className="hidden" type="file" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            {fileButtonLabel}
          </button>

          {allowCamera && isCameraSupported && (
            <>
              <input
                ref={cameraInputRef}
                accept="image/*"
                capture={capture}
                className="hidden"
                type="file"
                onChange={handleCameraCapture}
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-black text-white transition hover:bg-cyan-700"
              >
                {cameraButtonLabel}
              </button>
            </>
          )}
        </div>
      )}

      {helperText && !error && <p className="text-sm text-slate-500">{helperText}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
