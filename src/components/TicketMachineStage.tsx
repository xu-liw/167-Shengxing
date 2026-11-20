import { useCallback, useEffect, useRef, useState } from 'react';
import { HelpCircle, RotateCcw, X } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface TicketMachineStageProps {
  onComplete: () => void;
  onSkip: () => void;
  onReplayPrologue: () => void;
}

export function TicketMachineStage({
  onComplete,
  onSkip,
  onReplayPrologue,
}: TicketMachineStageProps) {
  // 5 Guided Steps:
  // Step 1: Click '一張'
  // Step 2: Click '莒光'
  // Step 3: Click '全票'
  // Step 4: Click '勝興' (LED reveals '238')
  // Step 5: Click Coin Slot (Pay and enter website)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isExiting, setIsExiting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  // Play button click sound (sfx_btn_click.mp3 with synth fallback) and unlock ambient BGM
  const playClickSound = useCallback(() => {
    soundEngine.startAmbient();
    soundEngine.playSelectClick();
  }, []);

  // Play locked/disabled button buzz (sfx_btn_locked.mp3 with synth fallback)
  const handleLockedClick = useCallback(() => {
    soundEngine.startAmbient();
    soundEngine.playRejectBuzz();
  }, []);

  // Handler for Step 1: Click '一張'
  const handleSelectQuantity = () => {
    if (currentStep !== 1) {
      handleLockedClick();
      return;
    }
    playClickSound();
    setCurrentStep(2);
  };

  // Handler for Step 2: Click '莒光'
  const handleSelectTrain = () => {
    if (currentStep !== 2) {
      handleLockedClick();
      return;
    }
    playClickSound();
    setCurrentStep(3);
  };

  // Handler for Step 3: Click '全票'
  const handleSelectType = () => {
    if (currentStep !== 3) {
      handleLockedClick();
      return;
    }
    playClickSound();
    setCurrentStep(4);
  };

  // Handler for Step 4: Click '勝興'
  const handleSelectStation = () => {
    if (currentStep !== 4) {
      handleLockedClick();
      return;
    }
    playClickSound();
    setCurrentStep(5);
  };

  // Handler for Step 5: Click Coin Slot (Pay & smooth exit)
  const handleInsertCoin = () => {
    if (isExiting) return;
    if (currentStep !== 5) {
      handleLockedClick();
      return;
    }
    playClickSound();
    soundEngine.playTicketDispense();
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onComplete();
    }, 700);
  };

  // Skip ticket machine directly (via 取消 button or subtle orange close dot)
  const handleSkipMachine = useCallback(() => {
    if (isExiting) return;
    playClickSound();
    setIsHelpOpen(false);
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(() => {
      onSkip();
    }, 450);
  }, [isExiting, onSkip, playClickSound]);

  // Open help prompt (via 呼叫 button)
  const handleOpenHelp = () => {
    if (isExiting) return;
    playClickSound();
    setIsHelpOpen(true);
  };

  useEffect(() => {
    if (!isHelpOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsHelpOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen]);

  // 10 Station names on the panel
  const STATIONS_ROW_1 = ['台北', '板橋', '新竹', '苗栗', '三義'];
  const STATIONS_ROW_2 = ['勝興', '泰安', '后里', '豐原', '台中'];

  return (
    <main
      aria-label="台鐵經典按鍵式自動售票機"
      className={`fixed inset-0 z-50 w-full h-[100dvh] bg-[#0C0C0C] text-[#FCFAF2] overflow-y-auto overscroll-contain select-none transition-opacity duration-700 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start sm:justify-center px-2.5 py-3 sm:p-4">
        {/* Top Breadcrumb Utility */}
        <div className="w-full max-w-[480px] flex items-center justify-between gap-4 mb-2 px-1 text-[11px] tracking-[0.14em] text-[#FCFAF2]/60 shrink-0">
          <button
            type="button"
            onClick={onReplayPrologue}
            className="inline-flex items-center gap-1.5 min-h-[36px] hover:text-[#FFBA84] transition-colors cursor-pointer"
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

        {/* Upright Ticket Machine Chassis (Clean responsive sizing + smooth scroll on shorter viewports) */}
        <div
          className="relative w-full max-w-[480px] flex flex-col gap-2 sm:gap-2.5 bg-[#0B346E] border-4 border-[#C8CCD4] shadow-[0_0_0_2px_#343842,0_20px_50px_rgba(0,0,0,0.95)] rounded-lg p-2.5 sm:p-3 shrink-0"
        >
        {/* Machine Head Fascia */}
        <header className="bg-[#082652] border border-[#FCFAF2]/20 rounded-t-sm px-3 py-1.5 flex items-center justify-between text-[#FCFAF2] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkipMachine}
              aria-label="關閉售票機並略過購票"
              title="略過售票機"
              className="group w-3.5 h-3.5 rounded-full bg-[#F05E1C] shadow-[0_0_6px_#F05E1C] inline-flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#FFBA84]"
            >
              <X
                className="w-2.5 h-2.5 text-[#082652]/55 group-hover:text-[#0C0C0C]/90 transition-colors"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </button>
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
                aria-disabled={currentStep !== 5 || isExiting}
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
                  {currentStep >= 5 ? '238' : '000'}
                </span>
                <span className="text-[9px] font-mono text-[#FF8080] ml-1">元</span>
              </div>
              <span className="text-[8px] font-mono text-[#0C0C0C]/50 mt-0.5">
                {currentStep >= 5 ? '請投入 238 元' : '應付票價'}
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
                aria-disabled={currentStep !== 1}
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

              {/* 二張、三張、四張 (Unpowered - plays sfx_btn_locked.mp3 on press) */}
              {['二張', '三張', '四張'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={handleLockedClick}
                  aria-disabled="true"
                  className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed active:scale-95 transition-transform flex items-center justify-center"
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
                onClick={handleLockedClick}
                aria-disabled="true"
                className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed active:scale-95 transition-transform flex items-center justify-center"
              >
                自強
              </button>

              {/* 莒光 (STEP 2 TARGET) */}
              <button
                type="button"
                onClick={handleSelectTrain}
                aria-disabled={currentStep !== 2}
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
                  onClick={handleLockedClick}
                  aria-disabled="true"
                  className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed active:scale-95 transition-transform flex items-center justify-center"
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
              aria-disabled={currentStep !== 3}
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
                onClick={handleLockedClick}
                aria-disabled="true"
                className="min-h-[42px] rounded-xs text-xs bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed active:scale-95 transition-transform flex items-center justify-center"
              >
                {label}
              </button>
            ))}

            {/* Right: Auxiliary Functional Buttons (取消 / 呼叫) */}
            <button
              type="button"
              onClick={handleSkipMachine}
              className="min-h-[42px] rounded-xs text-[10px] bg-[#9E2A2B] hover:bg-[#B83233] text-[#FCFAF2] border border-[#721C24] cursor-pointer active:scale-95 transition-all flex items-center justify-center font-medium"
              title="略過售票機直接進入展覽"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleOpenHelp}
              className="min-h-[42px] rounded-xs text-[10px] bg-[#2E4A62] hover:bg-[#3A5D7B] text-[#FCFAF2] border border-[#1C3042] cursor-pointer active:scale-95 transition-all flex items-center justify-center font-medium"
              title="查看購票說明與提示"
            >
              呼叫
            </button>
          </div>
        </section>

        {/* 4. FOURTH ROW: Large Station Panel (第四排：4 請按到達站鍵後付費) */}
        <section
          aria-label="4 請按到達站鍵後付費"
          className="bg-[#FCFAF2] text-[#0C0C0C] rounded-md p-2.5 shadow-inner border border-[#082652]/40 flex flex-col"
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
          <div className="grid grid-rows-2 gap-2">
            {/* Station Row 1: 台北、板橋、新竹、苗栗、三義 */}
            <div className="grid grid-cols-5 gap-1.5">
              {STATIONS_ROW_1.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={handleLockedClick}
                  aria-disabled="true"
                  className="w-full h-full min-h-[44px] rounded-xs text-xs font-serif bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed active:scale-95 transition-transform flex flex-col items-center justify-center"
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
                    onClick={isShengxing ? handleSelectStation : handleLockedClick}
                    aria-disabled={!isShengxing || currentStep !== 4}
                    className={`w-full h-full min-h-[44px] rounded-xs text-xs font-serif transition-all flex flex-col items-center justify-center ${
                      isShengxing && currentStep === 4
                        ? 'bg-[#FFF8E7] text-[#0C0C0C] border-2 border-[#F05E1C] shadow-[0_0_14px_rgba(240,94,28,0.9)] animate-pulse cursor-pointer scale-105 font-bold'
                        : isShengxing && currentStep > 4
                          ? 'bg-[#F05E1C] text-[#FCFAF2] border border-[#FFBA84] shadow-sm font-bold'
                          : 'bg-[#181818] text-[#555555] border border-[#2A2A2A] opacity-50 cursor-not-allowed active:scale-95'
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
      </div>

      {/* 站務呼叫提示框（點擊「呼叫」開啟） */}
      {isHelpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-help-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0C0C0C]/80 backdrop-blur-xs animate-stage-fade-in"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#FCFAF2] text-[#0C0C0C] border-2 border-[#FFBA84] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2 bg-[#0B346E]" />
            <div className="h-1 bg-[#F05E1C]" />
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-[#0B346E]">
                  <HelpCircle className="w-4 h-4 text-[#F05E1C] shrink-0" aria-hidden="true" />
                  <h2
                    id="ticket-help-title"
                    className="text-base font-serif font-semibold tracking-[0.12em]"
                  >
                    站務員提示
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  aria-label="關閉提示視窗"
                  className="inline-flex items-center justify-center w-8 h-8 text-[#0C0C0C]/65 hover:text-[#F05E1C] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-3 text-sm leading-[1.85] text-[#0C0C0C]/85">
                只要依照機台上<span className="font-semibold text-[#F05E1C]">發亮的按鈕</span>依序操作並完成投幣，就能獲得專屬的 167 次莒光號車票，進入舊山線地圖後還有互動驚喜可以體驗喔！
              </p>
              <p className="mt-2 text-xs leading-[1.7] text-[#0C0C0C]/65">
                若想先直接瀏覽展覽，也可以按下「取消」關閉售票機略過此環節。
              </p>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleSkipMachine}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs tracking-[0.1em] border border-[#0C0C0C]/25 text-[#0C0C0C]/75 hover:border-[#9E2A2B] hover:text-[#9E2A2B] transition-colors cursor-pointer"
                >
                  取消並略過
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsHelpOpen(false);
                  }}
                  className="min-h-[38px] px-4 py-1.5 text-xs tracking-[0.12em] bg-[#0B346E] hover:bg-[#F05E1C] text-[#FCFAF2] transition-colors cursor-pointer font-medium"
                >
                  繼續購票
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
