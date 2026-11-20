import { useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface TicketMachineStageProps {
  onComplete: () => void;
  onReplayPrologue: () => void;
}

export function TicketMachineStage({
  onComplete,
  onReplayPrologue,
}: TicketMachineStageProps) {
  // 5 Guided Steps:
  // Step 1: Click '一張'
  // Step 2: Click '莒光'
  // Step 3: Click '全票'
  // Step 4: Click '勝興' (LED reveals '265')
  // Step 5: Click Coin Slot (Pay and enter website)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isExiting, setIsExiting] = useState(false);

  // Play button click sound with /audio/sfx_btn_click.mp3 and fallback to soundEngine
  const playClickSound = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/audio/sfx_btn_click.mp3');
        audio.volume = 0.7;
        const promise = audio.play();
        if (promise) {
          promise.catch(() => {
            soundEngine.playSelectClick();
          });
        }
      } catch {
        soundEngine.playSelectClick();
      }
    } else {
      soundEngine.playSelectClick();
    }
  }, []);

  // Handler for Step 1: Click '一張'
  const handleSelectQuantity = () => {
    if (currentStep !== 1) return;
    playClickSound();
    setCurrentStep(2);
  };

  // Handler for Step 2: Click '莒光'
  const handleSelectTrain = () => {
    if (currentStep !== 2) return;
    playClickSound();
    setCurrentStep(3);
  };

  // Handler for Step 3: Click '全票'
  const handleSelectType = () => {
    if (currentStep !== 3) return;
    playClickSound();
    setCurrentStep(4);
  };

  // Handler for Step 4: Click '勝興'
  const handleSelectStation = () => {
    if (currentStep !== 4) return;
    playClickSound();
    setCurrentStep(5);
  };

  // Handler for Step 5: Click Coin Slot (Pay & smooth exit)
  const handleInsertCoin = () => {
    if (currentStep !== 5 || isExiting) return;
    playClickSound();
    soundEngine.playTicketDispense();
    setIsExiting(true);
    window.setTimeout(() => {
      onComplete();
    }, 700);
  };

  // 10 Station names on the panel
  const STATIONS_ROW_1 = ['台北', '板橋', '新竹', '苗栗', '三義'];
  const STATIONS_ROW_2 = ['勝興', '泰安', '后里', '豐原', '台中'];

  return (
    <main
      aria-label="台鐵經典按鍵式自動售票機"
      className={`fixed inset-0 w-screen h-screen bg-[#0C0C0C] text-[#FCFAF2] flex flex-col items-center justify-center overflow-hidden p-2 sm:p-4 select-none transition-opacity duration-700 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Breadcrumb Utility */}
      <div className="w-full max-w-[480px] flex items-center justify-between gap-4 mb-1.5 px-2 text-[11px] tracking-[0.14em] text-[#FCFAF2]/60">
        <button
          type="button"
          onClick={onReplayPrologue}
          className="inline-flex items-center gap-1.5 hover:text-[#FFBA84] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>重溫序幕</span>
        </button>
        <span className="font-mono text-[#FFBA84]">
          {currentStep === 5
            ? '請點擊硬幣孔付費 ➜'
            : `步驟 ${currentStep} / 5 · 點選發光鍵`}
        </span>
      </div>

      {/* Upright Ticket Machine Chassis (Strictly constrained within h-[92dvh], NO scroll) */}
      <div
        className="relative w-full max-w-[480px] h-[92dvh] max-h-[820px] flex flex-col justify-between bg-[#0B346E] border-4 border-[#C8CCD4] shadow-[0_0_0_2px_#343842,0_20px_50px_rgba(0,0,0,0.95)] rounded-lg p-2.5 sm:p-3 overflow-hidden"
      >
        {/* Machine Head Fascia */}
        <header className="bg-[#082652] border border-[#FCFAF2]/20 rounded-t-sm px-3 py-1.5 flex items-center justify-between text-[#FCFAF2] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F05E1C] shadow-[0_0_6px_#F05E1C]" />
            <h1 className="text-xs sm:text-sm font-serif font-bold tracking-[0.18em]">
              
            </h1>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-[#FFBA84]">
            
          </span>
        </header>

        {/* 1. TOP ROW: Payment & Display Area (最上排 付款與金額區) */}
        <section
          aria-label="付款與金額區"
          className="bg-[#FCFAF2] text-[#0C0C0C] rounded-md p-2 shadow-inner border border-[#082652]/40 shrink-0"
        >
          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Left: Bill Slot Replica (紙鈔插入口) */}
            <div className="col-span-4 flex flex-col items-center">
              <span className="text-[9px] font-bold text-[#0B346E] tracking-[0.06em] mb-1">
                 NT$100元紙鈔插入口
              </span>
              <div className="w-full h-4 bg-[#181818] rounded-xs border border-[#0C0C0C] flex items-center justify-center shadow-inner">
                <div className="w-3/4 h-1 bg-[#2C2C2C] rounded-full" />
              </div>
              <span className="text-[8px] font-mono text-[#0C0C0C]/50 mt-0.5">
                只接受NT$100元紙鈔
              </span>
            </div>

            {/* Center: Coin Slot (5 投入硬幣口 - Interactive on Step 5!) */}
            <div className="col-span-4 flex flex-col items-center">
              <span className="text-[9px] font-bold text-[#0B346E] tracking-[0.06em] mb-1">
                硬幣投入口
              </span>
              <button
                type="button"
                onClick={handleInsertCoin}
                disabled={currentStep !== 5 || isExiting}
                aria-label="硬幣投入口，點擊完成付費"
                className={`relative w-11 h-11 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  currentStep === 5
                    ? 'bg-[#F05E1C] border-[#FFBA84] ring-4 ring-[#F05E1C]/60 shadow-[0_0_18px_#F05E1C] animate-pulse cursor-pointer scale-105'
                    : 'bg-[#9BA3AF] border-[#5E6470] shadow-inner cursor-not-allowed opacity-80'
                }`}
              >
                {/* Metallic coin slit */}
                <div className="w-1.5 h-6 bg-[#161616] rounded-xs shadow-inner" />
                {currentStep === 5 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBA84] opacity-80" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFBA84]" />
                  </span>
                )}
              </button>
              <span
                className={`text-[9px] font-bold tracking-tight mt-0.5 ${
                  currentStep === 5 ? 'text-[#F05E1C] animate-pulse' : 'text-[#0C0C0C]/50 font-mono'
                }`}
              >
                {currentStep === 5 ? '點擊投幣啟程' : '5 10 50 元'}
              </span>
            </div>

            {/* Right: Section 5 Payment & Red LED Display (5 付費模式) */}
            <div className="col-span-4 flex flex-col items-end">
              <span className="text-[9px] font-bold text-[#0B346E] tracking-[0.06em] mb-1">
                5 付費模式
              </span>
              {/* Red LED 7-Segment Display */}
              <div className="w-full bg-[#120000] border-2 border-[#330000] rounded-xs px-2 py-1 text-right shadow-[inset_0_0_8px_rgba(255,0,0,0.4)]">
                <span className="text-xl sm:text-2xl font-mono tabular-nums font-bold text-[#FF1A1A] drop-shadow-[0_0_6px_#FF0000]">
                  {currentStep >= 5 ? '265' : '000'}
                </span>
                <span className="text-[9px] font-mono text-[#FF8080] ml-1">元</span>
              </div>
              <span className="text-[8px] font-mono text-[#0C0C0C]/50 mt-0.5">
                {currentStep >= 5 ? '請投入 265 元' : '應付票價'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. SECOND ROW: Section 1 Quantity & Section 2 Train Class (第二排：1 張數鍵 與 2 車種鍵) */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {/* Section 1: Quantity (1 請按張數鍵) */}
          <section
            aria-label="1 請按張數鍵"
            className="bg-[#FCFAF2] text-[#0C0C0C] rounded-md p-2 shadow-inner border border-[#082652]/40"
          >
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#0C0C0C]/15">
              <span className="text-[10px] font-bold text-[#0B346E] tracking-[0.08em]">
                1 請按張數鍵
              </span>
              <span className="text-[8px] font-mono text-[#0C0C0C]/50">QTY</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {/* 一張 (STEP 1 TARGET) */}
              <button
                type="button"
                onClick={handleSelectQuantity}
                disabled={currentStep !== 1}
                className={`min-h-[42px] rounded-xs text-xs font-bold transition-all flex flex-col items-center justify-center ${
                  currentStep === 1
                    ? 'bg-[#FFF8E7] text-[#0C0C0C] border-2 border-[#F05E1C] shadow-[0_0_12px_rgba(240,94,28,0.85)] animate-pulse cursor-pointer scale-105'
                    : currentStep > 1
                      ? 'bg-[#0B346E] text-[#FCFAF2] border border-[#FFBA84] shadow-sm font-semibold'
                      : 'bg-[#181818] text-[#666666] border border-[#2A2A2A] opacity-60 cursor-not-allowed'
                }`}
              >
                <span>一張</span>
              </button>

              {/* 二張、三張、四張 (Unpowered) */}
              {['二張', '三張', '四張'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed flex items-center justify-center"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Section 2: Train Class (2 請按車種鍵) */}
          <section
            aria-label="2 請按車種鍵"
            className="bg-[#FCFAF2] text-[#0C0C0C] rounded-md p-2 shadow-inner border border-[#082652]/40"
          >
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#0C0C0C]/15">
              <span className="text-[10px] font-bold text-[#0B346E] tracking-[0.08em]">
                2 請按車種鍵
              </span>
              <span className="text-[8px] font-mono text-[#0C0C0C]/50">CLASS</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {/* 自強 (Unpowered) */}
              <button
                type="button"
                disabled
                className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed flex items-center justify-center"
              >
                自強
              </button>

              {/* 莒光 (STEP 2 TARGET) */}
              <button
                type="button"
                onClick={handleSelectTrain}
                disabled={currentStep !== 2}
                className={`min-h-[42px] rounded-xs text-xs font-bold transition-all flex flex-col items-center justify-center ${
                  currentStep === 2
                    ? 'bg-[#FFF8E7] text-[#0C0C0C] border-2 border-[#F05E1C] shadow-[0_0_12px_rgba(240,94,28,0.85)] animate-pulse cursor-pointer scale-105'
                    : currentStep > 2
                      ? 'bg-[#F05E1C] text-[#FCFAF2] border border-[#FFBA84] shadow-sm font-semibold'
                      : 'bg-[#181818] text-[#666666] border border-[#2A2A2A] opacity-60 cursor-not-allowed'
                }`}
              >
                <span>莒光</span>
              </button>

              {/* 復興、平快 (Unpowered) */}
              {['復興', '平快'].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed flex items-center justify-center"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* 3. THIRD ROW: Section 3 Ticket Type (第三排：3 請按票種鍵) */}
        <section
          aria-label="3 請按票種鍵"
          className="bg-[#FCFAF2] text-[#0C0C0C] rounded-md p-2 shadow-inner border border-[#082652]/40 shrink-0"
        >
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#0C0C0C]/15">
            <span className="text-[10px] font-bold text-[#0B346E] tracking-[0.08em]">
              3 請按票種鍵
            </span>
            <span className="text-[8px] font-mono text-[#0C0C0C]/50">TICKET TYPE</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {/* 全票 (STEP 3 TARGET) */}
            <button
              type="button"
              onClick={handleSelectType}
              disabled={currentStep !== 3}
              className={`min-h-[42px] rounded-xs text-xs font-bold transition-all flex flex-col items-center justify-center ${
                currentStep === 3
                  ? 'bg-[#FFF8E7] text-[#0C0C0C] border-2 border-[#F05E1C] shadow-[0_0_12px_rgba(240,94,28,0.85)] animate-pulse cursor-pointer scale-105'
                  : currentStep > 3
                    ? 'bg-[#0B346E] text-[#FCFAF2] border border-[#FFBA84] shadow-sm font-semibold'
                    : 'bg-[#181818] text-[#666666] border border-[#2A2A2A] opacity-60 cursor-not-allowed'
              }`}
            >
              <span>全票</span>
            </button>

            {/* 孩童、敬老、愛心 (Unpowered) */}
            {['孩童', '敬老', '愛心'].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed flex items-center justify-center"
              >
                {label}
              </button>
            ))}

            {/* Right: Auxiliary Small Buttons (呼叫 / 取消 裝飾鍵) */}
            <button
              type="button"
              disabled
              className="min-h-[42px] rounded-xs text-[10px] bg-[#9E2A2B] text-[#FCFAF2]/80 border border-[#721C24] opacity-75 cursor-not-allowed flex items-center justify-center"
            >
              取消
            </button>
            <button
              type="button"
              disabled
              className="min-h-[42px] rounded-xs text-[10px] bg-[#2E4A62] text-[#FCFAF2]/80 border border-[#1C3042] opacity-75 cursor-not-allowed flex items-center justify-center"
            >
              呼叫
            </button>
          </div>
        </section>

        {/* 4. FOURTH ROW: Large Station Panel (第四排：4 請按到達站鍵後付費) */}
        <section
          aria-label="4 請按到達站鍵後付費"
          className="bg-[#FCFAF2] text-[#0C0C0C] rounded-md p-2.5 shadow-inner border border-[#082652]/40 flex-1 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-1 mb-2 border-b border-[#0C0C0C]/15 shrink-0">
            <span className="text-[11px] font-bold text-[#0B346E] tracking-[0.08em]">
              4 請按到達站鍵後付費
            </span>
            <span className="text-[9px] font-mono text-[#F05E1C] font-semibold">
              {currentStep === 4 ? '請選擇目標站 ➜ 勝興' : 'DESTINATION'}
            </span>
          </div>

          {/* 10 Station Buttons (2 Rows x 5 Columns) */}
          <div className="grid grid-rows-2 gap-2 flex-1">
            {/* Station Row 1: 台北、板橋、新竹、苗栗、三義 */}
            <div className="grid grid-cols-5 gap-1.5">
              {STATIONS_ROW_1.map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled
                  className="w-full h-full min-h-[44px] rounded-xs text-xs font-serif bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed flex flex-col items-center justify-center"
                >
                  <span>{st}</span>
                </button>
              ))}
            </div>

            {/* Station Row 2: 勝興 (STEP 4 TARGET)、泰安、后里、豐原、台中 */}
            <div className="grid grid-cols-5 gap-1.5">
              {STATIONS_ROW_2.map((st) => {
                const isShengxing = st === '勝興';
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={isShengxing ? handleSelectStation : undefined}
                    disabled={!isShengxing || currentStep !== 4}
                    className={`w-full h-full min-h-[44px] rounded-xs text-xs font-serif transition-all flex flex-col items-center justify-center ${
                      isShengxing && currentStep === 4
                        ? 'bg-[#FFF8E7] text-[#0C0C0C] border-2 border-[#F05E1C] shadow-[0_0_14px_rgba(240,94,28,0.9)] animate-pulse cursor-pointer scale-105 font-bold'
                        : isShengxing && currentStep > 4
                          ? 'bg-[#F05E1C] text-[#FCFAF2] border border-[#FFBA84] shadow-sm font-bold'
                          : 'bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span>{st}</span>
                    {isShengxing && currentStep >= 4 && (
                      <span className="text-[9px] font-mono text-[#FFBA84] mt-0.5">
                        136.3km
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. BOTTOM ROW: Ticket & Change Dispenser Recess (最底部：6 車票及找零出口) */}
        <section
          aria-label="6 車票及找零出口"
          className="bg-[#071F42] border-2 border-[#051733] rounded-md p-2 text-[#FCFAF2] shrink-0"
        >
          <div className="flex items-center justify-between text-[9px] tracking-[0.1em] text-[#FFBA84] mb-1">
            <span>6 車票及找零出口</span>
            <span className="font-mono text-[#FCFAF2]/50">TICKETS & CHANGE</span>
          </div>

          {/* Deep Recessed Physical Metallic Slot Simulation */}
          <div className="h-8 bg-[#0C0C0C] rounded-xs border border-[#1A1A1A] shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)] flex items-center justify-center">
            <span className="text-[9px] font-mono text-[#FCFAF2]/30 tracking-widest">
              
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
