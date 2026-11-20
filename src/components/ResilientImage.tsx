import { ReactNode } from 'react';
import { useResolvedImage } from '../utils/assetResolver';

interface ResilientImageProps {
  /** Preferred image filename under /public/images/ (auto-tries .png and .jpg) or full URL */
  src: string;
  /** Optional bundled fallback image if neither .png nor .jpg exists in /public/images/ yet */
  fallbackSrc?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

export function ResilientImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  fallbackTitle = '167次-勝興',
  fallbackSubtitle = '舊山線影像檔案',
}: ResilientImageProps) {
  const { resolvedUrl, isChecking } = useResolvedImage(src, fallbackSrc);

  if (!resolvedUrl) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1A18] via-[#0C0C0C] to-[#0B346E]/60 text-[#FCFAF2] p-6 text-center ${
          isChecking ? 'animate-pulse' : ''
        } ${className}`}
      >
        <div className="w-8 h-px bg-[#F05E1C] mb-3" />
        <p className="text-base tracking-[0.18em] text-[#FCFAF2]">{fallbackTitle}</p>
        <p className="text-xs tracking-[0.14em] text-[#FFBA84]/80 mt-1">{fallbackSubtitle}</p>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}

interface MapIconImageProps {
  /** Expected filename under /public/images/ (auto-tries .png, .jpg, .jpeg) */
  iconFile?: string;
  alt: string;
  className?: string;
  /** Fallback visual element rendered cleanly until the user uploads the icon image */
  fallback: ReactNode;
}

/**
 * Pure icon renderer for map markers & UI instruments.
 * Automatically renders the uploaded .png or .jpg once present in /public/images/,
 * and displays the clean geometric placeholder fallback without flicker before upload.
 */
export function MapIconImage({
  iconFile,
  alt,
  className = 'w-12 h-12 object-contain',
  fallback,
}: MapIconImageProps) {
  const { resolvedUrl } = useResolvedImage(iconFile);

  if (!resolvedUrl) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      draggable={false}
      className={className}
    />
  );
}
