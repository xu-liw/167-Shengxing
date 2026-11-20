import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Layers,
  Move,
  RotateCcw,
  Stamp,
  TrainFront,
} from 'lucide-react';
import {
  BLOCK_SECTIONS,
  BlockSection,
  MAP_OBJECTS,
  MapObject,
} from '../data/exhibitionData';
import { soundEngine } from '../utils/soundEngine';
import { BlockInstrumentModal } from './BlockInstrumentModal';
import { StoryCardModal } from './StoryCardModal';
import { TicketDaterModal } from './TicketDaterModal';

interface InteractiveMapProps {
  onSelectStation?: (stationId: string) => void;
}

export function InteractiveMap({ onSelectStation }: InteractiveMapProps) {
  // Map objects state (can be fine-tuned via drag in Debug mode)
  const [objects, setObjects] = useState<MapObject[]>(() =>
    JSON.parse(JSON.stringify(MAP_OBJECTS))
  );

  // Orientation state: auto-detect from window, but can be manually toggled
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return true;
  });

  const userToggledOrientationRef = useRef(false);

  // Debug mode state (toggled via 'D' key or UI button)
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Modal 1: 9 Story Objects Modal (#FFBA84 warm apricot card)
  const [activeStoryObject, setActiveStoryObject] = useState<MapObject | null>(null);

  // Modal 2: Ticket Dater Machine Modal (軋日機儀式)
  const [isDaterOpen, setIsDaterOpen] = useState(false);

  // Modal 3: Block Instrument Modal (電氣路牌閉塞器科普卡片)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Fallback states for images
  const [trainImgError, setTrainImgError] = useState(false);
  const [bgImgError, setBgImgError] = useState(false);
  const [blockImgError, setBlockImgError] = useState(false);

  // Dynamic Altitude Meter state
  const [currentElevation, setCurrentElevation] = useState<number>(402.326);
  const [currentNearestName, setCurrentNearestName] = useState<string>('勝興車站');

  // Dynamic Block Section tracking state
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(1); // Default to section 2 (Shengxing)

  // DOM Refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);

  // Shengxing Station reference object
  const shengxingObj = useMemo(
    () => objects.find((o) => o.id === 'shengxing') ?? objects[2],
    [objects]
  );

  // Active Block Section
  const activeBlockSection: BlockSection = useMemo(() => {
    return BLOCK_SECTIONS[currentSectionIndex] || BLOCK_SECTIONS[1];
  }, [currentSectionIndex]);

  // Auto-detect window orientation if not manually overridden
  useEffect(() => {
    const handleResize = () => {
      if (userToggledOrientationRef.current) return;
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Center scroll on Shengxing Station
  const centerOnShengxing = useCallback(
    (smooth = true) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const pos = isLandscape ? shengxingObj.landscapePos : shengxingObj.portraitPos;

      if (isLandscape) {
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const targetX = (pos.x / 100) * scrollWidth - clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, targetX),
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else {
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const targetY = (pos.y / 100) * scrollHeight - clientHeight / 2;
        container.scrollTo({
          top: Math.max(0, targetY),
          behavior: smooth ? 'smooth' : 'auto',
        });
      }

      setCurrentElevation(402.326);
      setCurrentNearestName('勝興車站');
      setCurrentSectionIndex(1); // Shengxing section
    },
    [isLandscape, shengxingObj]
  );

  // Initial auto-centering on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      centerOnShengxing(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [centerOnShengxing]);

  // Center when orientation changes
  useEffect(() => {
    const timer = setTimeout(() => {
      centerOnShengxing(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [isLandscape, centerOnShengxing]);

  // Listen for external center-shengxing event (e.g. from TopNavbar title click)
  useEffect(() => {
    const handleCenterEvent = () => {
      centerOnShengxing(true);
    };
    window.addEventListener('center-shengxing', handleCenterEvent);
    return () => window.removeEventListener('center-shengxing', handleCenterEvent);
  }, [centerOnShengxing]);

  // Handle mouse wheel horizontal scroll in landscape mode
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isLandscape) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 1.15;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isLandscape]);

  // Dynamic Altitude Meter & Block Section tracking via scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Viewport center percentage
    let centerPercent = 50;
    if (isLandscape) {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      centerPercent = ((scrollLeft + clientWidth / 2) / scrollWidth) * 100;
    } else {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      centerPercent = ((scrollTop + clientHeight / 2) / scrollHeight) * 100;
    }

    // 1. Find nearest station/object to current viewport center
    let closestObj = objects[0];
    let minDiff = 9999;

    objects.forEach((obj) => {
      if (obj.isSignpost) return; // skip signposts for elevation meter
      const objPercent = isLandscape ? obj.landscapePos.x : obj.portraitPos.y;
      const diff = Math.abs(objPercent - centerPercent);
      if (diff < minDiff) {
        minDiff = diff;
        closestObj = obj;
      }
    });

    if (closestObj) {
      setCurrentElevation(closestObj.elevation);
      setCurrentNearestName(closestObj.name);
    }

    // 2. Track Block Section dynamically
    const matchedSecIdx = BLOCK_SECTIONS.findIndex((sec) => {
      const range = isLandscape ? sec.rangeLandscape : sec.rangePortrait;
      return centerPercent >= range[0] && centerPercent < range[1];
    });

    if (matchedSecIdx !== -1) {
      setCurrentSectionIndex(matchedSecIdx);
    }
  }, [isLandscape, objects]);

  // Keyboard shortcut listener: 'D' key toggles Debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setIsDebugMode((prev) => !prev);
        soundEngine.playSelectClick();
      } else if (e.key === 'Escape') {
        if (activeStoryObject) setActiveStoryObject(null);
        if (isDaterOpen) setIsDaterOpen(false);
        if (isBlockModalOpen) setIsBlockModalOpen(false);
        if (isDebugMode) setIsDebugMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDebugMode, activeStoryObject, isDaterOpen, isBlockModalOpen]);

  // Drag and drop handler in Debug mode
  const handlePointerDown = (e: React.PointerEvent, objId: string) => {
    if (!isDebugMode) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(objId);

    const canvas = mapCanvasRef.current;
    if (!canvas) return;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const rawX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const rawY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.round(Math.max(1, Math.min(99, rawX)) * 10) / 10;
      const clampedY = Math.round(Math.max(1, Math.min(99, rawY)) * 10) / 10;

      setObjects((prev) =>
        prev.map((item) => {
          if (item.id !== objId) return item;
          if (isLandscape) {
            return {
              ...item,
              landscapePos: { x: clampedX, y: clampedY },
            };
          }
          return {
            ...item,
            portraitPos: { x: clampedX, y: clampedY },
          };
        })
      );
    };

    const handlePointerUp = () => {
      setDraggingId(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Copy JSON of current objects
  const handleCopyJSON = async () => {
    soundEngine.playSelectClick();
    const jsonString = JSON.stringify(objects, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopyFeedback('✓ 座標 JSON 已複製到剪貼簿！');
    } catch {
      setCopyFeedback('無法自動寫入剪貼簿，請於控制台查看。');
      console.log('Updated MAP_OBJECTS JSON:', jsonString);
    }
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Reset to default coordinates
  const handleResetCoordinates = () => {
    soundEngine.playSelectClick();
    setObjects(JSON.parse(JSON.stringify(MAP_OBJECTS)));
    setCopyFeedback('已重設為預設座標');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Click on train head: play whistle sound
  const handleTrainClick = (trainObj: MapObject) => {
    soundEngine.playTrainWhistle();
    setActiveStoryObject(trainObj);
  };

  // Generate SVG path for the central black-and-white railway track
  const trackPathD = useMemo(() => {
    // Only track stations along the main spine (excluding off-track signs and special icons)
    const spineIds = [
      'sanyi',
      'tunnel-1',
      'shengxing',
      'tunnel-2',
      'longteng',
      'tunnel-group',
      'daan-bridge',
      'taian',
      'houli',
      'fengyuan',
    ];

    const lineStations = spineIds
      .map((id) => objects.find((o) => o.id === id))
      .filter((o): o is MapObject => Boolean(o));

    if (lineStations.length === 0) return '';

    const points = lineStations.map((st) => {
      const pos = isLandscape ? st.landscapePos : st.portraitPos;
      return `${pos.x},${pos.y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [isLandscape, objects]);

  return (
    <div className="relative w-full h-full bg-[#2b231d] text-[#FCFAF2] overflow-hidden select-none">
      {/* ================= FLOATING LIGHTWEIGHT CENTER SHENGXING BUTTON ================= */}
      <button
        type="button"
        onClick={() => {
          centerOnShengxing(true);
          soundEngine.playSelectClick();
        }}
        className="absolute top-4 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0C0C0C]/65 hover:bg-[#F05E1C] text-[#FCFAF2] text-xs tracking-wider backdrop-blur-md border border-[#FCFAF2]/20 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
        title="視角立即置中勝興車站"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#FFBA84]" aria-hidden="true" />
        <span className="font-serif">置中勝興</span>
      </button>

      {/* ================= DEBUG MODE FLOATING BANNER (TOGGLED VIA 'D' KEY) ================= */}
      {isDebugMode && (
        <div className="absolute top-4 left-4 z-30 px-3.5 py-2 bg-[#FFBA84] text-[#0C0C0C] border border-[#0C0C0C]/40 rounded shadow-xl flex items-center gap-2.5 text-xs animate-notice-enter">
          <div className="flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#0B346E]" aria-hidden="true" />
            <span className="font-semibold font-mono">[DEBUG 拖曳模式]</span>
            <span className="font-mono text-[11px] text-[#0C0C0C]/75">
              {isLandscape ? '橫式' : '直式'}
            </span>
          </div>

          {copyFeedback && (
            <span className="font-mono text-[#0B346E] font-semibold text-[11px]">
              {copyFeedback}
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0C0C0C] text-[#FCFAF2] hover:bg-[#0B346E] transition-colors rounded text-[11px] font-mono cursor-pointer"
            >
              <Copy className="w-3 h-3" aria-hidden="true" />
              <span>複製 JSON</span>
            </button>
            <button
              type="button"
              onClick={handleResetCoordinates}
              className="px-2 py-1 border border-[#0C0C0C]/40 hover:bg-[#0C0C0C]/10 transition-colors rounded text-[11px] cursor-pointer"
            >
              重設
            </button>
            <button
              type="button"
              onClick={() => setIsDebugMode(false)}
              className="px-1.5 py-0.5 text-[#0C0C0C]/65 hover:text-[#0C0C0C] cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ================= DIRECTION INDICATORS AT VIEWPORT EDGES ================= */}
      {isLandscape ? (
        <>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-20 px-2 py-3 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] writing-vertical-rl flex items-center justify-center">
            <span>← 北 · 三義起點</span>
          </div>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-20 px-2 py-3 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] writing-vertical-rl flex items-center justify-center">
            <span>南 · 豐原終點 →</span>
          </div>
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84]">
            <span>↑ 北 · 三義起點</span>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84]">
            <span>↓ 南 · 豐原終點</span>
          </div>
        </>
      )}

      {/* ================= SCROLLABLE MAP VIEWPORT ================= */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`w-full h-full overflow-auto ${
          isLandscape ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'
        } scroll-smooth cursor-grab active:cursor-grabbing`}
      >
        {/* Map Canvas with Vintage Earth-Brown Background */}
        <div
          ref={mapCanvasRef}
          className="relative transition-all duration-300"
          style={{
            width: isLandscape ? '3400px' : '100%',
            minWidth: isLandscape ? '3400px' : '380px',
            height: isLandscape ? '100%' : '2600px',
            minHeight: isLandscape ? '580px' : '2600px',
            backgroundColor: '#2b231d',
            backgroundImage: bgImgError
              ? 'radial-gradient(circle at 50% 50%, #46392f 0%, #2f251d 55%, #18120e 100%)'
              : 'url("/images/bg_map_texture.jpg"), radial-gradient(circle at 50% 50%, #46392f 0%, #2f251d 55%, #18120e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Pre-reserved background image error detector */}
          <img
            src="/images/bg_map_texture.jpg"
            alt=""
            className="hidden"
            onError={() => setBgImgError(true)}
          />

          {/* Archival Topographic Contour & Surveyor Grid Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                radial-gradient(ellipse at 35% 40%, rgba(255, 186, 132, 0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 65% 65%, rgba(240, 94, 28, 0.1) 0%, transparent 65%),
                linear-gradient(to right, rgba(252, 250, 242, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(252, 250, 242, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 100% 100%, 80px 80px, 80px 80px',
            }}
          />

          {/* Central Black-and-White Railway Track (SVG) */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="track-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0C0C0C" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Base ballast bed (charcoal black) */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#0C0C0C"
              strokeWidth={isLandscape ? '0.85' : '1.1'}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#track-shadow)"
            />

            {/* Rail foundation line (dark bronze-gray) */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#2d2621"
              strokeWidth={isLandscape ? '0.65' : '0.85'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Retro Black-and-White Railway Dash (classic cartographic railway symbol) */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#FCFAF2"
              strokeWidth={isLandscape ? '0.42' : '0.55'}
              strokeDasharray={isLandscape ? '1.2 1.2' : '1.5 1.5'}
              strokeLinecap="butt"
              strokeLinejoin="round"
            />
          </svg>

          {/* ================= MAP OBJECTS ================= */}
          {objects.map((obj) => {
            const pos = isLandscape ? obj.landscapePos : obj.portraitPos;
            const isDragging = draggingId === obj.id;
            const isTrain = obj.id === 'train-167';
            const isDater = obj.id === 'dater-machine';
            const isSignpost = Boolean(obj.isSignpost);
            const isStoryObject = Boolean(obj.hasStory);

            return (
              <div
                key={obj.id}
                onPointerDown={(e) => handlePointerDown(e, obj.id)}
                onClick={() => {
                  if (isDebugMode) return;

                  if (isTrain) {
                    handleTrainClick(obj);
                  } else if (isDater) {
                    soundEngine.playSelectClick();
                    setIsDaterOpen(true);
                  } else if (isStoryObject) {
                    soundEngine.playSelectClick();
                    setActiveStoryObject(obj);
                    if (onSelectStation) onSelectStation(obj.id);
                  }
                  // Note: isSignpost items do not trigger popups, as requested!
                }}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${
                  isDebugMode
                    ? 'cursor-move ring-2 ring-dashed ring-[#FFBA84] p-1.5 bg-[#0C0C0C]/85 backdrop-blur-xs rounded'
                    : isSignpost
                      ? 'cursor-default pointer-events-none'
                      : 'cursor-pointer hover:scale-115 active:scale-95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]'
                } ${isDragging ? 'scale-125 z-40' : ''}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
              >
                {/* Debug Coordinate Label (Only in Debug Mode) */}
                {isDebugMode && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#0C0C0C]/95 text-[#FFBA84] text-[10px] font-mono whitespace-nowrap border border-[#FFBA84] rounded-xs shadow-lg pointer-events-none z-30">
                    {obj.id} ({pos.x}%, {pos.y}%)
                  </div>
                )}

                {/* --- CASE 1: 5 傳統月台站名牌 (純圖示 · 僅顯示不彈窗) --- */}
                {isSignpost ? (
                  <div
                    className="flex flex-col items-center select-none drop-shadow-md"
                    title={obj.name}
                  >
                    <div className="bg-[#FCFAF2] border-2 border-[#0B346E] px-2 py-0.5 text-center min-w-[56px] shadow-sm">
                      <p className="text-[11px] font-serif font-bold tracking-[0.1em] text-[#0C0C0C]">
                        {obj.shortName}
                      </p>
                    </div>
                    <div className="w-1 h-3 bg-[#423832]" />
                  </div>
                ) : isDater ? (
                  /* --- CASE 2: 軋日機圖示 (純圖示 · 點擊開啟軋日儀式) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title="勝興軋日機（點擊壓印車票）"
                  >
                    <div className="relative flex items-center justify-center w-11 h-11 rounded-sm bg-[#1A251E] border-2 border-[#FFBA84] text-[#FFBA84] shadow-[0_4px_16px_rgba(0,0,0,0.85)] group-hover:border-[#F05E1C] group-hover:bg-[#25362b] transition-all">
                      <Stamp className="w-5 h-5 text-[#FFBA84]" aria-hidden="true" />
                      {/* Pulsing indicator */}
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05E1C] opacity-80" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05E1C]" />
                      </span>
                    </div>
                  </div>
                ) : isTrain ? (
                  /* --- CASE 3: 167 次車頭圖示 (純圖示 · 點擊鳴笛並檢視列車故事) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title="莒光 167 次車頭（點擊鳴笛）"
                  >
                    {!trainImgError ? (
                      <div className="relative">
                        <img
                          src="/images/ui_train_167.png"
                          alt="莒光 167 次車頭"
                          onError={() => setTrainImgError(true)}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] filter contrast-110"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-full bg-[#F05E1C]/25 animate-ping opacity-60"
                        />
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-[#F05E1C] border-2 border-[#FFBA84] text-[#FCFAF2] shadow-[0_4px_14px_rgba(0,0,0,0.8)] group-hover:bg-[#d85014] transition-colors">
                        <TrainFront className="w-5 h-5 text-[#FCFAF2]" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                ) : obj.id === 'shengxing' ? (
                  /* --- CASE 4: 勝興車站 (純圖示 · 最高點 402.326m 故事物件) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title="勝興車站 · 402.326m（點擊閱讀故事）"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-2 rounded-full bg-[#F05E1C]/25 animate-pulse"
                    />
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#FCFAF2] border-3 border-[#0C0C0C] shadow-[0_0_16px_rgba(240,94,28,0.85)] group-hover:scale-110 transition-transform">
                      <div className="w-3.5 h-3.5 rounded-full bg-[#F05E1C]" />
                    </div>
                  </div>
                ) : obj.id === 'switchback-track' ? (
                  /* --- CASE 5: 折返式軌道 (純圖示) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title="勝興折返式軌道 · 防衝安全側線（點擊閱讀故事）"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded bg-[#3A2A1E] border border-[#FFBA84] text-[#FFBA84] shadow-md group-hover:bg-[#4E3726] transition-colors">
                      <Layers className="w-4 h-4 text-[#FFBA84]" aria-hidden="true" />
                    </div>
                  </div>
                ) : obj.id === 'elevation-monument' ? (
                  /* --- CASE 6: 402.326m 紀念碑 (純圖示) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title="402.326m 紀念碑（點擊閱讀故事）"
                  >
                    <div className="flex items-center justify-center w-7 h-7 bg-[#242322] border-2 border-[#FFBA84] text-[#FFBA84] shadow-md group-hover:border-[#F05E1C] transition-colors">
                      <span className="text-[10px] font-serif font-bold">碑</span>
                    </div>
                  </div>
                ) : obj.id === 'camphor-lodge' ? (
                  /* --- CASE 7: 樟腦寮 (純圖示) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title="十六份樟腦寮（點擊閱讀故事）"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-[#1E3022] border border-[#FFBA84] text-[#FFBA84] shadow-md group-hover:bg-[#28422E] transition-colors">
                      <span className="text-[11px] font-serif">寮</span>
                    </div>
                  </div>
                ) : obj.type === 'station' ? (
                  /* --- CASE 8: 其他車站 (純圖示) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title={`${obj.name}（點擊閱讀故事）`}
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FCFAF2] border-2 border-[#0C0C0C] shadow-md group-hover:border-[#FFBA84] transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0B346E]" />
                    </div>
                  </div>
                ) : obj.type === 'bridge' ? (
                  /* --- CASE 9: 橋樑 (純圖示) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title={`${obj.name}（點擊閱讀故事）`}
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-[#6E2E1D] border border-[#FFBA84] text-[#FCFAF2] shadow-md group-hover:bg-[#8D3A25] transition-colors">
                      <span className="text-[10px] font-serif">橋</span>
                    </div>
                  </div>
                ) : (
                  /* --- CASE 10: 隧道 (純圖示) --- */
                  <div
                    className="group relative flex items-center justify-center"
                    title={`${obj.name}（點擊閱讀故事）`}
                  >
                    <div className="flex items-center justify-center w-5 h-5 rounded-t-full bg-[#1A1816] border border-[#FCFAF2]/30 text-[#FCFAF2] shadow-md group-hover:border-[#FFBA84] transition-colors">
                      <span className="text-[9px] font-serif text-[#FFBA84]">洞</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CORNER 1: DYNAMIC ALTIMETER (左下角 海拔高度計) ================= */}
      <div className="absolute bottom-5 left-5 z-30 bg-[#0C0C0C]/90 backdrop-blur-md border border-[#FFBA84]/35 shadow-2xl p-3.5 sm:p-4 text-[#FCFAF2] max-w-[250px]">
        <div className="flex items-center justify-between gap-3 text-[10px] tracking-[0.2em] text-[#FFBA84] border-b border-[#FCFAF2]/15 pb-1.5 mb-2">
          <span>舊山線 海拔高度計</span>
          <span className="font-mono">ALTIMETER</span>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold tracking-tight text-[#FFBA84]">
              {currentElevation.toFixed(currentElevation % 1 !== 0 ? 3 : 1)}
            </span>
            <span className="text-xs font-mono text-[#FCFAF2]/70">公尺</span>
          </div>
          <button
            type="button"
            onClick={() => {
              centerOnShengxing(true);
              soundEngine.playSelectClick();
            }}
            className="text-[10px] px-2 py-0.5 border border-[#F05E1C] text-[#FFBA84] hover:bg-[#F05E1C] hover:text-[#FCFAF2] transition-colors cursor-pointer whitespace-nowrap"
            title="視角置中至勝興最高點 (402.326m)"
          >
            勝興最高點
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-[#FCFAF2]/10 flex items-center justify-between text-[11px] text-[#FCFAF2]/75">
          <span className="truncate">鄰近：{currentNearestName}</span>
          <span className="text-[10px] font-mono text-[#F05E1C] shrink-0">
            坡度 25‰
          </span>
        </div>
      </div>

      {/* ================= CORNER 2: FIXED BLOCK INSTRUMENT (右下角 電氣路牌閉塞器) ================= */}
      {/* Non-blocking pointer events on wrapper, active click on button */}
      <div className="pointer-events-none absolute bottom-5 right-5 z-30 flex flex-col items-end">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSelectClick();
            setIsBlockModalOpen(true);
          }}
          className="pointer-events-auto group bg-[#0C0C0C]/90 hover:bg-[#0C0C0C] backdrop-blur-md border-2 border-[#0B346E] hover:border-[#FFBA84] p-3 shadow-2xl text-left transition-all duration-200 cursor-pointer max-w-[280px]"
          title="點擊展開單軌電氣路牌閉塞器科普卡片"
        >
          {/* Header row with light and instrument label */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#FCFAF2]/15 text-[10px] tracking-[0.14em]">
            <span className="text-[#FFBA84] font-serif">電氣路牌閉塞器</span>
            <span className="font-mono text-[#FCFAF2]/50">BLOCK TOKEN</span>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            {/* Visual Block Instrument Icon with Fallback */}
            <div className="w-11 h-11 shrink-0 bg-[#251F1B] border border-[#FFBA84]/40 flex items-center justify-center overflow-hidden relative">
              {!blockImgError ? (
                <img
                  src="/images/ui_block_instrument.png"
                  alt="電氣路牌閉塞器"
                  onError={() => setBlockImgError(true)}
                  className="w-full h-full object-contain filter contrast-125"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-1">
                  <div className="w-4 h-4 rounded-full border-2 border-[#FFBA84] flex items-center justify-center text-[8px] font-bold text-[#FFBA84]">
                    {activeBlockSection.tokenShape.split(' ')[1] || '○'}
                  </div>
                  <span className="text-[7px] font-mono text-[#FFBA84] mt-0.5">WEBB</span>
                </div>
              )}
            </div>

            {/* Dynamic Status Display */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    activeBlockSection.status === 'occupied'
                      ? 'bg-[#E53935] animate-pulse shadow-[0_0_8px_#E53935]'
                      : 'bg-[#43A047] shadow-[0_0_8px_#43A047]'
                  }`}
                />
                <span className="text-xs font-serif text-[#FCFAF2] truncate font-medium">
                  {activeBlockSection.name}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-[#FCFAF2]/70 font-mono">
                <span className={activeBlockSection.status === 'occupied' ? 'text-[#FF8A80]' : 'text-[#81C784]'}>
                  {activeBlockSection.statusText}
                </span>
                <span className="text-[#FFBA84]">{activeBlockSection.tokenShape}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-[#FCFAF2]/10 flex items-center justify-between text-[10px] text-[#FFBA84]/80">
            <span>隨地圖滑動自動連鎖切換</span>
            <span className="text-[#F05E1C] group-hover:underline">看科普卡片 →</span>
          </div>
        </button>
      </div>

      {/* ================= MODAL 1: 9 STORY OBJECTS (#FFBA84 CARD) ================= */}
      <StoryCardModal
        object={activeStoryObject}
        onClose={() => setActiveStoryObject(null)}
      />

      {/* ================= MODAL 2: TICKET DATER MACHINE (軋日機儀式) ================= */}
      <TicketDaterModal
        isOpen={isDaterOpen}
        onClose={() => setIsDaterOpen(false)}
      />

      {/* ================= MODAL 3: BLOCK INSTRUMENT CARD (閉塞器科普卡片) ================= */}
      <BlockInstrumentModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        activeSection={activeBlockSection}
      />
    </div>
  );
}
