import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Footprints, X } from 'lucide-react';
import { MapObject } from '../data/exhibitionData';
import { ResilientImage } from './ResilientImage';

interface StoryCardModalProps {
  object: MapObject | null;
  onClose: () => void;
}

export function StoryCardModal({ object, onClose }: StoryCardModalProps) {
  // Local failsafe so clicking X / 返回地圖 / backdrop / Escape ALWAYS dismisses immediately,
  // even if parent history.back() fails or stalls inside an iframe / tab switch.
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    setDismissedId(null);
  }, [object?.id]);

  const handleClose = () => {
    if (object) {
      setDismissedId(object.id);
    }
    onClose();
  };

  useEffect(() => {
    if (!object || dismissedId === object.id) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (object) setDismissedId(object.id);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [object, dismissedId, onClose]);

  if (!object || dismissedId === object.id || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#0C0C0C]/80 backdrop-blur-xs animate-stage-fade-in"
      onClick={handleClose}
    >
      {/* #FFBA84 Warm Apricot Framed Card Modal */}
      <div
  className="theme-adaptive relative flex flex-col bg-[#FCFAF2] text-[#0C0C0C] w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-hidden border-3 border-[#FFBA84] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
  onClick={(e) => e.stopPropagation()}
>

        {/* Top Apricot & Juguang Dual Accent Stripe */}
        <div className="h-2.5 bg-[#FFBA84] shrink-0" />
        <div className="h-1 bg-[#F05E1C] shrink-0" />

        {/* Always-Accessible Modal Top Bar with Close Button */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-8 pt-4 pb-3 border-b border-[#0C0C0C]/15 bg-[#FCFAF2]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono tabular-nums text-[#0C0C0C]/70 min-w-0">
            {object.kmMark && (
              <span className="text-[#F05E1C] font-semibold">{object.kmMark}</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="關閉故事視窗"
            className="shrink-0 inline-flex items-center justify-center min-h-[40px] min-w-[40px] bg-[#FCFAF2] hover:bg-[#FFBA84]/30 text-[#0C0C0C] hover:text-[#F05E1C] transition-colors border border-[#0C0C0C]/20 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Smoothly Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 sm:py-6">
          {/* Title & Subtitle */}
          <h2
            id="story-modal-title"
            className="text-2xl sm:text-3xl font-serif tracking-[0.12em] text-[#0C0C0C] font-normal"
          >
            {object.name}
          </h2>
          {object.subtitle && (
            <p className="mt-1.5 text-sm sm:text-base tracking-[0.14em] text-[#F05E1C] font-medium">
              {object.subtitle}
            </p>
          )}

          {/* 4:3 Image Container with Resilient Fallback */}
          <div className="mt-4 sm:mt-5 aspect-[4/3] w-full overflow-hidden border border-[#0C0C0C]/15 bg-[#1C1A18] shadow-sm relative">
            <ResilientImage
              src={object.image || ''}
              fallbackSrc={object.fallbackImage}
              alt={object.imageAlt || object.name}
              className="w-full h-full object-cover"
              fallbackTitle={object.name}
              fallbackSubtitle={object.kmMark || ''}
            />
            {/* Subtle vintage photo corner vignette */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/60 via-transparent to-transparent"
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-[#FCFAF2]/90 font-mono">
              <span>{object.kmMark}</span>
              <span className="text-[#FFBA84] font-serif">{object.shortName}</span>
            </div>
          </div>

          {/* Story Narrative (故事內文) */}
          <div className="mt-5 sm:mt-6 space-y-3.5">
            <p className="text-sm sm:text-base leading-[1.9] text-[#0C0C0C]/85">
              {object.story || object.detail}
            </p>
          </div>

          {/* Modern Walking Tip (現代散步提示) */}
          {object.walkingTip && (
            <div className="mt-6 p-4 bg-[#FFBA84]/15 border-l-3 border-[#F05E1C] rounded-none">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#F05E1C]">
                <Footprints className="w-4 h-4" aria-hidden="true" />
                <span>現代散步提示</span>
              </div>
              <p className="mt-2 text-xs sm:text-sm leading-[1.8] text-[#0C0C0C]/85">
                {object.walkingTip}
              </p>
            </div>
          )}

          {/* Source / Citation (資料來源) */}
          {object.source && (
            <div className="mt-6 pt-4 border-t border-[#0C0C0C]/15 flex items-start gap-2 text-xs text-[#0C0C0C]/60">
              <BookOpen className="w-3.5 h-3.5 text-[#F05E1C] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">
                <span className="text-[#0C0C0C]/80 font-medium">資料來源：</span>
                {object.source}
              </p>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="mt-6 pt-4 border-t border-[#0C0C0C]/10 flex items-center justify-end text-xs">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[38px] px-5 py-1.5 bg-[#0C0C0C] text-[#FCFAF2] hover:bg-[#F05E1C] transition-colors cursor-pointer tracking-[0.1em]"
            >
              返回地圖
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}