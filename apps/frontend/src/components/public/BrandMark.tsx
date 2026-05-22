import logoUrl from '../../assets/branding/logo_300.png';

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
};

export function BrandMark({ compact = false, href = '/' }: BrandMarkProps) {
  return (
    <a href={href} className="flex items-center gap-3" aria-label="Leidy Cleaner Services - inicio">
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className={`${
          compact
            ? 'h-10 max-w-[112px] sm:h-14 sm:max-w-[180px]'
            : 'h-14 max-w-[190px] sm:h-[84px] sm:max-w-[280px]'
        } w-auto object-contain`}
      />
    </a>
  );
}
