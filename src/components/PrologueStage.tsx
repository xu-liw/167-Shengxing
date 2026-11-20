import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface PrologueStageProps {
  onComplete: () => void;
}

export function PrologueStage({ onComplete }: PrologueStageProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const completedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);

  const triggerExit = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    soundEngine.unlock();
    setIsFadingOut(true);
    exitTimerRef.current = window.setTimeout(() => {
      onComplete();
    }, 750);
  }, [onComplete]);

  useEffect(() => {
    // Line 1: delay 0.4s + duration 2.15s -> finishes at ~2.55s
    // Line 2: delay 2.5s + duration 2.15s -> finishes at ~4.65s
    // Line 3: delay 4.6s + duration 2.15s -> finishes at ~6.75s (all 3 lines fully visible)
    // Hold for 3 seconds after all 3 lines have appeared -> 6.75s + 3s = ~9.8s
    const autoTimer = window.setTimeout(() => {
      triggerExit();
    }, 9800);

    return () => {
      window.clearTimeout(autoTimer);
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, [triggerExit]);

  return (
    <section
      aria-label="開場序幕"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0C0C0C] text-[#FCFAF2] px-6 py-10 transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle atmospheric vignette evoking night mountain mist */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(240,94,28,0.08)_0%,rgba(12,12,12,0.96)_62%,#0C0C0C_100%)]"
      />

      {/* Quiet exhibition date index at top-left */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-10 flex items-center gap-3 text-xs tracking-[0.22em] text-[#FCFAF2]/55 font-mono tabular-nums">
        <span>1998.09.23</span>
        <span aria-hidden="true">/</span>
        <span>21:10</span>
      </div>

      {/* Main vertical-rl typography stage */}
      <div className="relative z-10 flex items-center justify-center w-full max-w-4xl h-[74vh] max-h-[600px]">
        <div
          className="writing-vertical-rl flex flex-col justify-center gap-8 sm:gap-12 md:gap-16 h-full py-4"
          style={{ writingMode: 'vertical-rl' }}
        >
          {/* Line 1 (Rightmost column in vertical-rl) */}
          <p
            className="animate-prologue-line text-[15px] sm:text-lg md:text-[21px] leading-[2.2] tracking-[0.22em] text-[#FCFAF2]/90 max-h-[68vh]"
            style={{ animationDelay: '0.4s' }}
          >
            1998年9月23日，
            <br />
            167次莒光號最後一次停靠勝興，
            <br />
            舊山線從此走入歷史。
          </p>

          {/* Line 2 (Middle column) */}
          <p
            className="animate-prologue-line flex flex-nowrap items-center whitespace-nowrap text-base sm:text-xl md:text-2xl leading-[2] tracking-[0.26em] text-[#FFBA84] self-center"
            style={{ animationDelay: '2.5s' }}
          >
            <span className="whitespace-nowrap">這次，讓我們一起回到那一天晚上</span>
            <span className="sr-only">……</span>
            <span
              aria-hidden="true"
              className="inline-flex flex-col items-center justify-center gap-[3.5px] sm:gap-[4.5px] shrink-0 mt-1"
              style={{ writingMode: 'horizontal-tb' }}
            >
              {[0, 1, 2, 3, 4, 5].map((dot) => (
                <span
                  key={dot}
                  className="block w-[2.5px] h-[2.5px] sm:w-[3px] sm:h-[3px] rounded-full bg-current"
                />
              ))}
            </span>
          </p>

          {/* Line 3 (Leftmost focal title) */}
          <div
            className="animate-prologue-line flex items-center gap-4 self-center"
            style={{ animationDelay: '4.6s' }}
          >
            <span
              aria-hidden="true"
              className="block w-px h-10 sm:h-14 bg-[#F05E1C]/80"
            />
            <h1 className="inline-flex items-center text-2xl sm:text-3xl md:text-4xl tracking-[0.25em] text-[#FCFAF2] font-normal whitespace-nowrap">
              <span>167次</span>
              <span className="sr-only">-</span>
              <span
                aria-hidden="true"
                className="inline-block w-[2px] h-[0.42em] bg-[#F05E1C] mt-[0.1em] mb-[0.35em] shrink-0"
              />
              <span>勝興</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Bottom control bar with Skip button (>=44px touch target) */}
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 z-10 flex items-center gap-6">
        <button
          type="button"
          onClick={triggerExit}
          className="group inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 text-sm tracking-[0.18em] text-[#FCFAF2]/75 border border-[#FCFAF2]/25 hover:border-[#FFBA84] hover:text-[#FFBA84] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F05E1C] transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>略過序幕</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
