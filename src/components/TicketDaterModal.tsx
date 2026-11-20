import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Download, RotateCcw, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface TicketDaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDaterModal({ isOpen, onClose }: TicketDaterModalProps) {
  // Date options: 1998.09.23 (ROC 87.09.23) vs Today's ROC date
  const [selectedDateType, setSelectedDateType] = useState<'historical' | 'today'>('historical');

  // Stamping animation states
  const [isPressing, setIsPressing] = useState(false);
  const [isStamped, setIsStamped] = useState(false);
  const [stampFeedback, setStampFeedback] = useState<string | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute Today's ROC Date string (e.g. 115.11.20)
  const todayRocDate = (() => {
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${rocYear}.${month}.${day}`;
  })();

  const activeDateString = selectedDateType === 'historical' ? '87.09.23' : todayRocDate;
  const activeDateDisplay =
    selectedDateType === 'historical'
      ? '87.09.23（末班車行駛夜）'
      : `今日日期（${todayRocDate} 參訪紀念）`;

  // Draw Ticket onto Canvas whenever date or stamped state changes
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // 1. Cardboard Background (Vintage Ivory #F7F4EB)
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
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Thin inner hairline
    ctx.strokeStyle = 'rgba(12, 12, 12, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 2. Top Juguang Orange Double Stripes
    ctx.fillStyle = '#F05E1C';
    ctx.fillRect(16, 16, width - 32, 28);
    ctx.fillStyle = '#FFBA84';
    ctx.fillRect(16, 44, width - 32, 10);

    // 3. Header Typography
    ctx.fillStyle = '#0C0C0C';
    ctx.font = '600 24px "Cactus Classical Serif", "Noto Serif TC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('臺灣鐵路管理局 · 莒光號特等客車', width / 2, 92);

    // Dotted separator line
    ctx.strokeStyle = 'rgba(12, 12, 12, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, 112);
    ctx.lineTo(width - 40, 112);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Ticket Serial & Code
    ctx.font = '500 16px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(12, 12, 12, 0.7)';
    ctx.fillText('NO. 980923-167', 48, 142);
    ctx.textAlign = 'right';
    ctx.fillText('山線單程票', width - 48, 142);

    // 5. Origin & Destination Section
    // Origin: 台北
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(12, 12, 12, 0.55)';
    ctx.font = '500 16px "Noto Serif TC", serif';
    ctx.fillText('起站', 70, 185);
    ctx.fillStyle = '#0C0C0C';
    ctx.font = '700 58px "Cactus Classical Serif", "Noto Serif TC", serif';
    ctx.fillText('台北', 70, 248);

    // Center Train Info
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F05E1C';
    ctx.font = '700 24px "IBM Plex Mono", monospace';
    ctx.fillText('167 次 莒光', width / 2, 205);

    ctx.strokeStyle = '#0C0C0C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 80, 222);
    ctx.lineTo(width / 2 + 80, 222);
    ctx.stroke();

    ctx.fillStyle = 'rgba(12, 12, 12, 0.75)';
    ctx.font = '500 17px "Noto Serif TC", serif';
    ctx.fillText('經由舊山線（縱貫線）', width / 2, 248);

    // Destination: 勝興
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(12, 12, 12, 0.55)';
    ctx.font = '500 16px "Noto Serif TC", serif';
    ctx.fillText('迄站', width - 70, 185);
    ctx.fillStyle = '#0C0C0C';
    ctx.font = '700 58px "Cactus Classical Serif", "Noto Serif TC", serif';
    ctx.fillText('勝興', width - 70, 248);

    // Dotted separator line
    ctx.strokeStyle = 'rgba(12, 12, 12, 0.35)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, 280);
    ctx.lineTo(width - 40, 280);
    ctx.stroke();
    ctx.setLineDash([]);

    // 6. Ticket Fare & Conditions
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0C0C0C';
    ctx.font = '600 20px "Noto Serif TC", serif';
    ctx.fillText('全票 1 張 · 票價 NT$ 265 元', 48, 316);

    ctx.fillStyle = 'rgba(12, 12, 12, 0.65)';
    ctx.font = '400 15px "Noto Serif TC", serif';
    ctx.fillText('限當日當次車有效 · 標高 402.326m 縱貫鐵路最高點紀念', 48, 344);

    // 7. If Stamped, Render Ink Stamp Date & Station Seal
    if (isStamped) {
      // Save canvas state for rotated stamped elements
      ctx.save();

      // --- Ink Stamped Date (軋日機鋼印油墨效果) ---
      // Authentic TRA Edmondson tickets had the date stamped at top right or bottom left in purple/black steel ink
      ctx.translate(140, 410);
      ctx.rotate(-0.02); // Slightly authentic human tilt

      // Deep vintage purple-black ink
      ctx.fillStyle = '#231834';
      ctx.font = '700 36px "IBM Plex Mono", "Courier New", monospace';
      ctx.textAlign = 'left';

      // Slight ink bleed shadow
      ctx.shadowColor = 'rgba(40, 20, 60, 0.35)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 0.5;

      // Render dots matrix steel stamp look
      ctx.fillText(`- ${activeDateString} -`, 0, 0);

      ctx.restore();

      // --- Red Station Cancellation Seal (勝興站剪票章) ---
      ctx.save();
      ctx.translate(width - 150, 365);
      ctx.rotate(0.04);

      ctx.strokeStyle = '#B32418';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#B32418';
      ctx.font = '700 15px "Cactus Classical Serif", "Noto Serif TC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('勝興車站', 0, -22);

      ctx.font = '700 13px "IBM Plex Mono", monospace';
      ctx.fillText(activeDateString, 0, 2);

      ctx.font = '600 15px "Cactus Classical Serif", "Noto Serif TC", serif';
      ctx.fillText('剪票訖', 0, 26);

      ctx.restore();
    } else {
      // Placeholder dashed stamp zone indicating where date will be stamped
      ctx.save();
      ctx.strokeStyle = 'rgba(240, 94, 28, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(100, 375, 260, 50);
      ctx.fillStyle = 'rgba(240, 94, 28, 0.7)';
      ctx.font = '400 15px "Noto Serif TC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('【軋日機油墨壓印處】', 230, 406);
      ctx.restore();
    }
  }, [isOpen, selectedDateType, isStamped, activeDateString]);

  // Execute heavy press stamping animation & audio
  const handleExecutePress = () => {
    if (isPressing) return;
    setIsPressing(true);
    soundEngine.playMechanicalStamp();

    // Heavy lever downward compression animation
    setTimeout(() => {
      setIsStamped(true);
      setIsPressing(false);
      setStampFeedback('✓ 軋日完成！復古鋼印油墨已烙印至車票，可立即下載紀念卡。');
      setTimeout(() => setStampFeedback(null), 3500);
    }, 600);
  };

  // Download Generated Ticket PNG
  const handleDownloadTicketPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    soundEngine.playSelectClick();

    const link = document.createElement('a');
    link.download = `167次勝興_莒光號紀念車票_${activeDateString}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Reset stamping to try other date
  const handleResetStamp = () => {
    soundEngine.playSelectClick();
    setIsStamped(false);
    setStampFeedback(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dater-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0C0C0C]/85 backdrop-blur-xs animate-stage-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FCFAF2] text-[#0C0C0C] w-full max-w-3xl max-h-[94vh] overflow-y-auto border-3 border-[#0B346E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Juguang Orange Double Stripe */}
        <div className="h-3 bg-[#F05E1C]" />
        <div className="h-1.5 bg-[#FFBA84]" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉軋日儀式"
          className="absolute top-5 right-5 z-20 inline-flex items-center justify-center min-h-[40px] min-w-[40px] bg-[#FCFAF2]/90 hover:bg-[#FFBA84]/30 text-[#0C0C0C] hover:text-[#F05E1C] transition-colors border border-[#0C0C0C]/15 cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#0C0C0C]/15">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono tracking-[0.16em] text-[#0B346E]">
                <span>勝興車站 站務儀式</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#F05E1C]">名片式車票壓印</span>
              </div>
              <h2
                id="dater-modal-title"
                className="mt-1 text-2xl sm:text-3xl font-serif tracking-[0.12em] text-[#0C0C0C] font-normal"
              >
                台鐵鑄鐵軋日機 · 壓印儀式
              </h2>
            </div>
            <span className="text-xs text-[#0C0C0C]/60 self-start sm:self-center font-mono">
              1998 歷史重現
            </span>
          </div>

          {/* Operation Guide */}
          <p className="mt-4 text-sm leading-[1.8] text-[#0C0C0C]/80">
            昔日台鐵車站售票窗口均設有厚重的生鐵軋日機。售票員將硬紙卡車票插入機口、重重一壓，鋼字輪便會將出票日期以深紫色油墨深深壓印在票面上。請於下方選擇要壓印的歷史日期或今日日期：
          </p>

          {/* Date Selection Segmented Control */}
          <div className="mt-5 p-3 bg-[#0B346E]/5 border border-[#0B346E]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-[0.14em] text-[#0B346E] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#F05E1C]" aria-hidden="true" />
              <span>選擇壓印鋼印日期：</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDateType('historical');
                  setIsStamped(false);
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
              <span>當前設定日期：</span>
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
                disabled={isPressing}
                className={`inline-flex items-center gap-2 min-h-[42px] px-6 py-2 text-sm tracking-[0.16em] transition-all duration-200 cursor-pointer shadow-md font-medium text-[#FCFAF2] ${
                  isPressing
                    ? 'bg-[#0C0C0C] translate-y-1 scale-95 ring-4 ring-[#FFBA84]'
                    : isStamped
                      ? 'bg-[#0B346E] hover:bg-[#092957]'
                      : 'bg-[#0C0C0C] hover:bg-[#F05E1C]'
                }`}
              >
                <span>{isPressing ? '壓印重擊中⋯⋯' : isStamped ? '重新壓印鋼字' : '執行重壓壓印'}</span>
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

          {/* Canvas Ticket Container with Mechanical Press Animation */}
          <div className="mt-6 flex flex-col items-center">
            <div
              className={`w-full max-w-xl transition-transform duration-300 ${
                isPressing ? 'scale-[0.98] translate-y-2' : ''
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-auto aspect-[800/480] shadow-[0_12px_32px_rgba(12,12,12,0.25)] border border-[#0C0C0C]/30 bg-[#F8F5EC]"
              />
            </div>
          </div>

          {/* UNLOCKED: Juguang Orange (#F05E1C) "一鍵保存專屬車票圖片" PNG Download Button */}
          <div className="mt-8 pt-6 border-t border-[#0C0C0C]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#0C0C0C]/70 text-center sm:text-left">
              {isStamped ? (
                <span className="text-[#0B346E] font-medium">
                  ✓ 車票已成功壓印專屬鋼印與勝興站剪票訖戳章。
                </span>
              ) : (
                <span>請先點擊上方「執行重壓壓印」，即可解鎖高畫質紀念車票下載。</span>
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
                <span>一鍵保存專屬車票圖片</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
