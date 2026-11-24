import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, Download, RotateCcw, X } from 'lucide-react';
import { useResolvedImage } from '../utils/assetResolver';
import { soundEngine } from '../utils/soundEngine';

interface TicketDaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasTicket?: boolean;
  onOpenTicketMachine?: () => void;
}

// Reserved custom vertical Edmondson railway ticket artwork (/public/images/ticket.png or .jpg)
const CUSTOM_VERTICAL_TICKET_ASSET = '/images/ticket.png';

export function TicketDaterModal({
  isOpen,
  onClose,
  hasTicket = true,
  onOpenTicketMachine,
}: TicketDaterModalProps) {
  // Local failsafe so clicking X / backdrop / Escape ALWAYS dismisses immediately,
  // even if parent history.back() stalls inside an iframe or tab switch.
  const [forceClosed, setForceClosed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForceClosed(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setForceClosed(true);
    onClose();
  };

  // Date options: 1998.09.23 (ROC 87.09.23) vs Today's ROC date
  const [selectedDateType, setSelectedDateType] = useState<'historical' | 'today'>('historical');

  // Stamping animation states
  const [isPressing, setIsPressing] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);

  // Canvas & Timer Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) {
        window.clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || forceClosed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setForceClosed(true);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, forceClosed, onClose]);

  // Auto-resolved custom vertical ticket artwork (public/images/ticket.png or .jpg)
  const { resolvedUrl: customTicketUrl } = useResolvedImage(CUSTOM_VERTICAL_TICKET_ASSET);
  const [loadedTicketArtwork, setLoadedTicketArtwork] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!customTicketUrl) {
      setLoadedTicketArtwork(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!cancelled) setLoadedTicketArtwork(img);
    };
    img.onerror = () => {
      if (!cancelled) setLoadedTicketArtwork(null);
    };
    img.src = customTicketUrl;
    return () => {
      cancelled = true;
    };
  }, [customTicketUrl]);

  // Compute Today's ROC Date string (e.g. 115.11.24)
  const todayRocDate = (() => {
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${rocYear}.${month}.${day}`;
  })();

  const activeDateString = selectedDateType === 'historical' ? '87.09.23' : todayRocDate;
  const activeDateDisplay = selectedDateType === 'historical' ? '87.09.23' : todayRocDate;

  // Draw Vertical Edmondson Ticket (480 x 800) onto Canvas whenever date or stamped state changes
  useEffect(() => {
    if (!isOpen || forceClosed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vertical old-style TRA Edmondson ticket dimensions (480 x 800)
    const width = 480;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    if (loadedTicketArtwork) {
      // Draw custom vertical /images/ticket.png scaled cleanly to fill 480x800
      ctx.fillStyle = '#F8F5EC';
      ctx.fillRect(0, 0, width, height);
      const scale = Math.max(
        width / loadedTicketArtwork.width,
        height / loadedTicketArtwork.height
      );
      const drawW = loadedTicketArtwork.width * scale;
      const drawH = loadedTicketArtwork.height * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = (height - drawH) / 2;
      ctx.drawImage(loadedTicketArtwork, offsetX, offsetY, drawW, drawH);
    } else {
      // Fallback vertical Edmondson cardboard ticket layout (before /images/ticket.png is uploaded)
      ctx.fillStyle = '#F8F5EC';
      ctx.fillRect(0, 0, width, height);

      // Subtle paper fibers & texture
      ctx.fillStyle = 'rgba(12, 12, 12, 0.02)';
      for (let i = 0; i < 2800; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.fillRect(rx, ry, 1.2, 1.2);
      }

      // Outer card border
      ctx.strokeStyle = '#26221F';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Thin inner hairline
      ctx.strokeStyle = 'rgba(12, 12, 12, 0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(18, 18, width - 36, height - 36);

      // Top Juguang Orange Double Stripes
      ctx.fillStyle = '#F05E1C';
      ctx.fillRect(18, 18, width - 36, 30);
      ctx.fillStyle = '#FFBA84';
      ctx.fillRect(18, 48, width - 36, 10);

      // Header Typography
      ctx.fillStyle = '#0C0C0C';
      ctx.font = '600 22px "Cactus Classical Serif", "Noto Serif TC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('臺灣鐵路管理局', width / 2, 102);

      ctx.fillStyle = '#F05E1C';
      ctx.font = '700 20px "IBM Plex Mono", monospace';
      ctx.fillText('167 次 · 莒光號', width / 2, 136);

      // Dotted separator
      ctx.strokeStyle = 'rgba(12, 12, 12, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(40, 158);
      ctx.lineTo(width - 40, 158);
      ctx.stroke();
      ctx.setLineDash([]);

      // Serial & Route
      ctx.font = '500 14px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(12, 12, 12, 0.65)';
      ctx.fillText('NO. 980923-167', 42, 186);
      ctx.textAlign = 'right';
      ctx.fillText('經由舊山線', width - 42, 186);

      // Origin: 台北
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(12, 12, 12, 0.5)';
      ctx.font = '500 15px "Noto Serif TC", serif';
      ctx.fillText('起站', width / 2, 234);
      ctx.fillStyle = '#0C0C0C';
      ctx.font = '700 62px "Cactus Classical Serif", "Noto Serif TC", serif';
      ctx.fillText('台北', width / 2, 302);

      // Vertical arrow
      ctx.strokeStyle = '#0C0C0C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 324);
      ctx.lineTo(width / 2, 378);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width / 2 - 7, 368);
      ctx.lineTo(width / 2, 378);
      ctx.lineTo(width / 2 + 7, 368);
      ctx.stroke();

      // Destination: 勝興
      ctx.fillStyle = 'rgba(12, 12, 12, 0.5)';
      ctx.font = '500 15px "Noto Serif TC", serif';
      ctx.fillText('迄站', width / 2, 412);
      ctx.fillStyle = '#0C0C0C';
      ctx.font = '700 62px "Cactus Classical Serif", "Noto Serif TC", serif';
      ctx.fillText('勝興', width / 2, 480);

      // Dotted separator
      ctx.strokeStyle = 'rgba(12, 12, 12, 0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(40, 514);
      ctx.lineTo(width - 40, 514);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fare & Elevation info
      ctx.fillStyle = '#0C0C0C';
      ctx.font = '600 18px "Noto Serif TC", serif';
      ctx.fillText('全票 1 張 · NT$ 238 元', width / 2, 552);

      ctx.fillStyle = 'rgba(12, 12, 12, 0.6)';
      ctx.font = '400 13px "Noto Serif TC", serif';
      ctx.fillText('限當日當次車有效 · 舊山線紀念硬票', width / 2, 580);
    }

    // Stamp Overlay (only the steel date stamp, no red station cancellation seal)
    if (isStamped) {
      // --- Ink Stamped Date (軋日機鋼印油墨效果) ---
      ctx.save();
      ctx.translate(width / 2, 650);
      ctx.rotate(-0.015);

      ctx.fillStyle = '#231834';
      ctx.font = '700 32px "IBM Plex Mono", "Courier New", monospace';
      ctx.textAlign = 'center';

      ctx.shadowColor = 'rgba(40, 20, 60, 0.35)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;

      ctx.fillText(`- ${activeDateString} -`, 0, 0);
      ctx.restore();
    } else {
      // Placeholder dashed stamp zone indicating where date will be stamped
      ctx.save();
      ctx.strokeStyle = 'rgba(240, 94, 28, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(width / 2 - 125, 616, 250, 48);
      ctx.fillStyle = 'rgba(240, 94, 28, 0.78)';
      ctx.font = '400 14px "Noto Serif TC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('【軋日機油墨壓印處】', width / 2, 645);
      ctx.restore();
    }
  }, [isOpen, forceClosed, selectedDateType, isStamped, activeDateString, loadedTicketArtwork]);

  // Execute heavy press stamping animation & audio
  const handleExecutePress = () => {
    if (!hasTicket) {
      soundEngine.playRejectBuzz();
      return;
    }
    if (isPressing) return;

    setIsPressing(true);
    setStampFeedback(null);
    soundEngine.playMechanicalStamp();

    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = window.setTimeout(() => {
      setIsPressing(false);
      setIsStamped(true);
      setStampFeedback(`已完成「${activeDateString}」鋼印壓印，可於下方下載紀念車票！`);
      pressTimerRef.current = null;
    }, 420);
  };

  // Download Generated Ticket PNG
  const handleDownloadTicketPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundEngine.playSelectClick();

    const link = document.createElement('a');
    link.download = `167次-勝興_舊山線線上策展紀念車票_${activeDateString}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Reset stamping to try other date
  const handleResetStamp = () => {
    soundEngine.playSelectClick();
    setIsStamped(false);
    setStampFeedback(null);
  };

  if (!isOpen || forceClosed || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dater-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#0C0C0C]/85 backdrop-blur-xs animate-stage-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col bg-[#FCFAF2] text-[#0C0C0C] w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh] overflow-hidden border-3 border-[#0B346E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Juguang Orange Double Stripe */}
        <div className="h-3 bg-[#F05E1C] shrink-0" />
        <div className="h-1.5 bg-[#FFBA84] shrink-0" />

        {/* Always-Accessible Top Header with Close Button */}
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-8 pt-4 pb-3 border-b border-[#0C0C0C]/15 bg-[#FCFAF2]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono tracking-[0.16em] text-[#0B346E]">
              <span>勝興車站 日期壓印</span>
            </div>
            <h2
              id="dater-modal-title"
              className="mt-1 text-xl sm:text-3xl font-serif tracking-[0.12em] text-[#0C0C0C] font-normal"
            >
              台鐵鑄鐵軋日機
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="關閉軋日儀式"
            className="shrink-0 inline-flex items-center justify-center min-h-[40px] min-w-[40px] bg-[#FCFAF2] hover:bg-[#FFBA84]/30 text-[#0C0C0C] hover:text-[#F05E1C] transition-colors border border-[#0C0C0C]/20 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8 py-5 sm:py-6">
          {/* Operation Guide */}
          <p className="text-sm leading-[1.8] text-[#0C0C0C]/80">
            昔日台鐵車站售票窗口均設有厚重的生鐵軋日機。售票員將硬紙卡車票插入機口、重重一壓，鋼字輪便會將出票日期以深紫色油墨深深壓印在票面上。請於下方選擇要壓印的歷史日期或今日日期：
          </p>

          {/* Hint notice when user skipped the ticket machine */}
          {!hasTicket && (
            <div className="mt-3 p-3.5 bg-[#FFBA84]/18 border-l-3 border-[#F05E1C] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs leading-[1.75] text-[#0C0C0C]/85">
              <p>
                <span className="font-semibold text-[#F05E1C]">提示：</span>
                您尚未在「自動售票機」完成購票取得車票，因此目前無法使用軋日機壓印日期。請先回到售票機完成操作，即可回來體驗壓印喔！
              </p>
              {onOpenTicketMachine && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSelectClick();
                    setForceClosed(true);
                    onOpenTicketMachine();
                  }}
                  className="shrink-0 self-start sm:self-center px-3 py-1.5 bg-[#0B346E] hover:bg-[#F05E1C] text-[#FCFAF2] text-xs tracking-[0.08em] transition-colors cursor-pointer whitespace-nowrap"
                >
                  前往售票機 →
                </button>
              )}
            </div>
          )}

          {/* Date Selection Segmented Control */}
          <div className="mt-5 p-3 bg-[#0B346E]/5 border border-[#0B346E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.14em] text-[#0B346E] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#F05E1C]" aria-hidden="true" />
              <span>選擇壓印日期：</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDateType('historical');
                  setIsStamped(false);
                  setStampFeedback(null);
                  soundEngine.playSelectClick();
                }}
                className={`min-h-[40px] px-4 py-1.5 text-xs sm:text-sm tracking-[0.08em] transition-colors cursor-pointer border ${
                  selectedDateType === 'historical'
                    ? 'bg-[#0B346E] text-[#FCFAF2] border-[#0B346E] font-medium'
                    : 'bg-[#FCFAF2] text-[#0C0C0C] border-[#0C0C0C]/25 hover:border-[#0B346E]'
                }`}
              >
                87.09.23（末班車當夜）
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDateType('today');
                  setIsStamped(false);
                  setStampFeedback(null);
                  soundEngine.playSelectClick();
                }}
                className={`min-h-[40px] px-4 py-1.5 text-xs sm:text-sm tracking-[0.08em] transition-colors cursor-pointer border ${
                  selectedDateType === 'today'
                    ? 'bg-[#0B346E] text-[#FCFAF2] border-[#0B346E] font-medium'
                    : 'bg-[#FCFAF2] text-[#0C0C0C] border-[#0C0C0C]/25 hover:border-[#0B346E]'
                }`}
              >
                今日日期（{todayRocDate}）
              </button>
            </div>
          </div>

          {/* Interactive Mechanical Press Trigger */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#0C0C0C]/65">
              <span>指定日期：</span>
              <span className="font-mono font-bold text-[#F05E1C] ml-1">
                {activeDateDisplay}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isStamped && (
                <button
                  type="button"
                  onClick={handleResetStamp}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-3 py-2 text-xs border border-[#0C0C0C]/30 hover:border-[#0C0C0C] text-[#0C0C0C] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>更換日期重壓</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExecutePress}
                disabled={isPressing || !hasTicket}
                className={`inline-flex items-center gap-2 min-h-[42px] px-6 py-2 text-sm tracking-[0.16em] transition-all duration-200 font-medium ${
                  !hasTicket
                    ? 'bg-[#0C0C0C]/20 text-[#0C0C0C]/45 border border-[#0C0C0C]/15 cursor-not-allowed shadow-none'
                    : isPressing
                      ? 'bg-[#0C0C0C] text-[#FCFAF2] translate-y-1 scale-95 ring-4 ring-[#FFBA84] shadow-md cursor-pointer'
                      : isStamped
                        ? 'bg-[#0B346E] hover:bg-[#092957] text-[#FCFAF2] shadow-md cursor-pointer'
                        : 'bg-[#0C0C0C] hover:bg-[#F05E1C] text-[#FCFAF2] shadow-md cursor-pointer'
                }`}
              >
                <span>
                  {!hasTicket
                    ? '請先至售票機購票'
                    : isPressing
                      ? '壓印中⋯⋯'
                      : isStamped
                        ? '重新壓印'
                        : '壓印'}
                </span>
              </button>
            </div>
          </div>

          {/* Stamping Feedback Notification */}
          {stampFeedback && (
            <div className="mt-3 p-2.5 bg-[#FFBA84]/25 border border-[#FFBA84] text-xs font-semibold text-[#0B346E] flex items-center gap-2 animate-notice-enter">
              <Check className="w-4 h-4 text-[#F05E1C]" aria-hidden="true" />
              <span>{stampFeedback}</span>
            </div>
          )}

          {/* Vertical Edmondson Ticket Canvas Container (預留 /images/ticket.png 直式車票位置) */}
          <div className="mt-6 flex flex-col items-center">
            <div
              className={`w-full max-w-[270px] sm:max-w-[300px] transition-transform duration-300 ${
                isPressing ? 'scale-[0.98] translate-y-2' : ''
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-auto aspect-[480/800] shadow-[0_12px_32px_rgba(12,12,12,0.25)] border border-[#0C0C0C]/30 bg-[#F8F5EC]"
              />
            </div>
          </div>

          {/* UNLOCKED: Juguang Orange (#F05E1C) "下載紀念車票" PNG Download Button */}
          <div className="mt-8 pt-6 border-t border-[#0C0C0C]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#0C0C0C]/70 text-center sm:text-left">
              {isStamped ? (
                <span className="text-[#0B346E] font-medium">
                  ✓ 您的車票已成功壓印
                </span>
              ) : (
                <span>點擊上方「壓印」，即可下載紀念車票。</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadTicketPNG}
                disabled={!isStamped}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 min-h-[48px] px-7 py-2.5 text-sm tracking-[0.16em] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05E1C] ${
                  isStamped
                    ? 'bg-[#F05E1C] text-[#FCFAF2] hover:bg-[#d85014] active:scale-98'
                    : 'bg-[#0C0C0C]/25 text-[#0C0C0C]/40 cursor-not-allowed border border-[#0C0C0C]/20 shadow-none'
                }`}
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>下載紀念車票</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}