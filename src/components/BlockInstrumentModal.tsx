import { useEffect } from 'react';
import { Bell, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { BlockSection } from '../data/exhibitionData';
import { soundEngine } from '../utils/soundEngine';

interface BlockInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: BlockSection;
}

export function BlockInstrumentModal({
  isOpen,
  onClose,
  activeSection,
}: BlockInstrumentModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-instrument-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0C0C0C]/85 backdrop-blur-xs animate-stage-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FCFAF2] text-[#0C0C0C] w-full max-w-2xl max-h-[92vh] overflow-y-auto border-3 border-[#0B346E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top TRA Blue & Juguang Stripe */}
        <div className="h-3 bg-[#0B346E]" />
        <div className="h-1 bg-[#F05E1C]" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉科普卡片"
          className="absolute top-5 right-5 z-20 inline-flex items-center justify-center min-h-[40px] min-w-[40px] bg-[#FCFAF2]/90 hover:bg-[#FFBA84]/30 text-[#0C0C0C] hover:text-[#F05E1C] transition-colors border border-[#0C0C0C]/15 cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="pb-4 border-b border-[#0C0C0C]/15">
            <div className="flex items-center gap-2 text-xs font-mono tracking-[0.16em] text-[#0B346E]">
              <span>鐵道安全文史科普</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#F05E1C]">單軌運轉核心技術</span>
            </div>
            <h2
              id="block-instrument-modal-title"
              className="mt-1 text-2xl sm:text-3xl font-serif tracking-[0.12em] text-[#0C0C0C] font-normal"
            >
              電氣路牌閉塞器 · 單軌安全之鑰
            </h2>
            <p className="mt-1.5 text-xs text-[#0C0C0C]/60 font-mono">
              Webb & Thompson Electric Train Tablet System
            </p>
          </div>

          {/* Current Section Live Status Card */}
          <div className="mt-5 p-4 bg-[#0B346E]/5 border border-[#0B346E]/25">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#0B346E] font-semibold">當前地圖感應區間：</span>
              <span className="text-[#0C0C0C]/60">{activeSection.mileage}</span>
            </div>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    activeSection.status === 'occupied'
                      ? 'bg-[#E53935] animate-ping'
                      : 'bg-[#43A047]'
                  }`}
                />
                <div>
                  <p className="text-lg font-serif tracking-[0.08em] text-[#0C0C0C]">
                    {activeSection.name}
                  </p>
                  <p className="text-xs text-[#0C0C0C]/65">
                    路牌種類：
                    <span className="font-semibold text-[#0B346E]">
                      {activeSection.tokenName}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 text-xs font-medium border ${
                    activeSection.status === 'occupied'
                      ? 'bg-[#E53935]/10 text-[#C62828] border-[#E53935]'
                      : 'bg-[#43A047]/10 text-[#2E7D32] border-[#43A047]'
                  }`}
                >
                  {activeSection.statusText}
                </span>

                {/* Interactive Bell Ring Button */}
                <button
                  type="button"
                  onClick={() => soundEngine.playBlockBell()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0B346E] text-[#FCFAF2] hover:bg-[#092957] text-xs transition-colors cursor-pointer"
                  title="試聽站長敲擊閉塞電鈴之雙重音效"
                >
                  <Bell className="w-3.5 h-3.5 text-[#FFBA84]" aria-hidden="true" />
                  <span>試按閉塞鈴</span>
                </button>
              </div>
            </div>
          </div>

          {/* Educational Science Story Cards */}
          <div className="mt-6 space-y-4 text-sm leading-[1.85] text-[#0C0C0C]/85">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#F05E1C] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#0C0C0C]">為什麼單軌鐵路需要閉塞器？</p>
                <p className="mt-1 text-[14px]">
                  舊山線從三義到豐原均為「單線鐵路」，南下與北下列車共用同一副鐵軌。為了絕對防止列車迎頭正面對撞，鐵道上將相鄰兩站之間劃為一個「閉塞區間」。規定在同一時間內，一個區間「絕對只能容許一列火車行駛」。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#0B346E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#0C0C0C]">物理防呆的電氣連鎖機制</p>
                <p className="mt-1 text-[14px]">
                  閉塞器由英國鐵道工程師 Webb 與 Thompson 於 19 世紀末發明。相鄰兩站各置一台閉塞機，以專用電線互相聯鎖。當三義要把路牌扭出交給南下列車時，必須先由勝興站長按下電鈴確認閉塞開通；一旦三義取出一枚銅質路牌，兩站的機器會立即在電氣與機械上雙重死鎖，直到火車平安駛抵勝興將路牌塞回機器，才能再取出下一枚。
                </p>
              </div>
            </div>

            {/* 4 Token Shapes Diagram */}
            <div className="mt-4 p-4 bg-[#FCFAF2] border border-[#0C0C0C]/20 shadow-xs">
              <p className="text-xs font-semibold text-[#0C0C0C] tracking-[0.1em] mb-2.5">
                四種路牌形狀（防止相鄰區間誤用）
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 border border-[#0C0C0C]/15 bg-white">
                  <div className="text-xl text-[#0B346E] font-bold">○</div>
                  <p className="font-medium mt-1">第 1 種：圓形</p>
                  <p className="text-[11px] text-[#0C0C0C]/60">三義 ⟷ 勝興</p>
                </div>
                <div className="p-2 border border-[#F05E1C] bg-[#FFBA84]/20">
                  <div className="text-xl text-[#F05E1C] font-bold">☽</div>
                  <p className="font-medium mt-1 text-[#F05E1C]">第 2 種：半月形</p>
                  <p className="text-[11px] text-[#0C0C0C]/75">勝興 ⟷ 泰安</p>
                </div>
                <div className="p-2 border border-[#0C0C0C]/15 bg-white">
                  <div className="text-xl text-[#0B346E] font-bold">□</div>
                  <p className="font-medium mt-1">第 3 種：方形</p>
                  <p className="text-[11px] text-[#0C0C0C]/60">泰安 ⟷ 后里</p>
                </div>
                <div className="p-2 border border-[#0C0C0C]/15 bg-white">
                  <div className="text-xl text-[#0B346E] font-bold">△</div>
                  <p className="font-medium mt-1">第 4 種：三角形</p>
                  <p className="text-[11px] text-[#0C0C0C]/60">后里 ⟷ 豐原</p>
                </div>
              </div>
            </div>

            {/* High speed hoop exchange */}
            <div className="pt-2 text-[14px]">
              <p className="font-semibold text-[#0C0C0C]">勝興月台的高速路牌拋接（套圈）</p>
              <p className="mt-1">
                若列車不停靠勝興直接通過，站務員會將厚重銅質路牌裝入巨大的皮革「螺旋套圈（路牌套袋）」。當列車以四、五十公里時速通過月台時，司機員伸出右臂敏捷套進月台受動架上的新路牌圈，同時將舊路牌順勢拋落到月台受動桿上。這項響徹九十年的電氣拋接金屬撞擊聲，隨 1998 年 167 次末班車駛離，正式成為台灣鐵道史上最動人的絕響。
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-7 pt-4 border-t border-[#0C0C0C]/15 flex items-center justify-between text-xs">
            <span className="text-[#0C0C0C]/60 font-mono">
              文史典藏 · 國家鐵道博物館籌備處文獻
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-5 py-1.5 bg-[#0C0C0C] text-[#FCFAF2] hover:bg-[#F05E1C] transition-colors cursor-pointer"
            >
              關閉科普卡片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
