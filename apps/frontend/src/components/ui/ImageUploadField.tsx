import { Capacitor } from '@capacitor/core';
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
  const isNativePlatform = Capacitor.isNativePlatform();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isNativePlatform) {
      setIsCameraSupported(true);
      return;
    }

    setIsCameraSupported(typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function');
  }, [isNativePlatform]);

  const validateImageSelection = (mimeType: string | null | undefined, sizeInBytes: number) => {
    if (!mimeType?.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return false;
    }

    if (sizeInBytes > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho maximo permitido e 10 MB.');
      return false;
    }

    return true;
  };

  const handleDataUrlSelect = (dataUrl: string) => {
    const mimeType = extrairMimeType(dataUrl);
    const sizeInBytes = estimarTamanhoDataUrl(dataUrl);

    if (!validateImageSelection(mimeType, sizeInBytes)) {
      return;
    }

    onChange(dataUrl);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) {
      return;
    }

    if (!validateImageSelection(file.type, file.size)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleDataUrlSelect(base64);
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

  const handleCameraButtonClick = async () => {
    if (!isNativePlatform) {
      cameraInputRef.current?.click();
      return;
    }

    setIsCapturingImage(true);
    try {
      const { Camera, CameraDirection, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        allowEditing: false,
        correctOrientation: true,
        direction: capture === 'user' ? CameraDirection.Front : CameraDirection.Rear,
        quality: 85,
        resultType: CameraResultType.DataUrl,
        saveToGallery: false,
        source: CameraSource.Camera,
      });

      if (photo.dataUrl) {
        handleDataUrlSelect(photo.dataUrl);
      }
    } catch (error) {
      if (isCameraCancellation(error)) {
        return;
      }

      alert('Nao foi possivel abrir a camera agora. Tente novamente.');
    } finally {
      setIsCapturingImage(false);
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
                disabled={isCapturingImage}
                onClick={() => void handleCameraButtonClick()}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-black text-white transition hover:bg-cyan-700"
              >
                {isCapturingImage ? 'Abrindo camera...' : cameraButtonLabel}
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

function extrairMimeType(dataUrl: string) {
  const correspondencia = dataUrl.match(/^data:([^;,]+)[;,]/i);
  return correspondencia?.[1] ?? null;
}

function estimarTamanhoDataUrl(dataUrl: string) {
  const indiceVirgula = dataUrl.indexOf(',');
  if (indiceVirgula === -1) {
    return 0;
  }

  const base64 = dataUrl.slice(indiceVirgula + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function isCameraCancellation(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalizedMessage = message.toLowerCase();

  return normalizedMessage.includes('cancel');
}
