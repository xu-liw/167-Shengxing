import { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle = '167次-勝興',
  fallbackSubtitle = '舊山線影像檔案',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1A18] via-[#0C0C0C] to-[#0B346E]/60 text-[#FCFAF2] p-6 text-center ${className}`}
      >
        <div className="w-8 h-px bg-[#F05E1C] mb-3" />
        <p className="text-base tracking-[0.18em] text-[#FCFAF2]">{fallbackTitle}</p>
        <p className="text-xs tracking-[0.14em] text-[#FFBA84]/80 mt-1">{fallbackSubtitle}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
