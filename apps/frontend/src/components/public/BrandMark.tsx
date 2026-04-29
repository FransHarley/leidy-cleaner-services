import logoUrl from '../../assets/branding/logo_300.png';

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <a href="/" className="flex items-center gap-3" aria-label="Leidy Cleaner Services - início">
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className={`${compact ? 'h-10 max-w-[130px]' : 'h-12 max-w-[150px]'} w-auto object-contain`}
      />
    </a>
  );
}
