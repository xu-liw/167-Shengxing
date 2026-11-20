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
  BLOCK_INSTRUMENT_DATA,
  BLOCK_SECTIONS,
  BlockSection,
  MAP_OBJECTS,
  MapObject,
  TRAIN_167_OBJECT,
} from '../data/exhibitionData';
import { PUBLIC_ASSETS, useResolvedImage } from '../utils/assetResolver';
import { soundEngine } from '../utils/soundEngine';
import { MapIconImage } from './ResilientImage';
import { StoryCardModal } from './StoryCardModal';
import { TicketDaterModal } from './TicketDaterModal';

interface InteractiveMapProps {
  onSelectStation?: (stationId: string) => void;
}

// Active scrollable railway length from Sanyi (0%) to Fengyuan (100%)
const ROUTE_LENGTH_LANDSCAPE = 2600;
const ROUTE_LENGTH_PORTRAIT = 2200;

// 5 station milestones along normalized progress t ∈ [0, 1] with distances from Sanyi (km)
const ROUTE_MILESTONES = [
  { t: 0.0, distanceKm: 0.0, label: '三義車站' },
  { t: 0.36, distanceKm: 5.0, label: '勝興車站' },
  { t: 0.7, distanceKm: 10.9, label: '泰安車站' },
  { t: 0.86, distanceKm: 13.5, label: '后里車站' },
  { t: 1.0, distanceKm: 20.2, label: '豐原車站' },
] as const;

/**
 * Gentle Old Mountain Line S-curve across the cross-axis (percent 0..100).
 * Strictly equals 50% with zero slope at t = 0 (三義) and t = 1 (豐原) so
 * the faded north/south straight extensions connect seamlessly without kinks.
 */
function getTrackCrossPercent(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 50 + Math.sin(clamped * Math.PI * 2) * 3.5 * Math.sin(clamped * Math.PI);
}

/** Smoothly interpolate distance from Sanyi (km) along the 5 station milestones */
function getDistanceKmAtProgress(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  for (const m of ROUTE_MILESTONES) {
    if (Math.abs(clamped - m.t) < 0.008) return m.distanceKm;
  }

  for (let i = 0; i < ROUTE_MILESTONES.length - 1; i++) {
    const a = ROUTE_MILESTONES[i];
    const b = ROUTE_MILESTONES[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const ratio = (clamped - a.t) / (b.t - a.t);
      return a.distanceKm + (b.distanceKm - a.distanceKm) * ratio;
    }
  }
  return ROUTE_MILESTONES[ROUTE_MILESTONES.length - 1].distanceKm;
}

export function InteractiveMap({ onSelectStation }: InteractiveMapProps) {
  // 11 map-placed clickable objects (can be fine-tuned via drag in Debug mode)
  const [objects, setObjects] = useState<MapObject[]>(() =>
    JSON.parse(JSON.stringify(MAP_OBJECTS))
  );

  // Orientation state: auto-detect from window
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight;
    }
    return true;
  });

  // Measured viewport dimensions (used so half-viewport north/south extensions keep the train centered)
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? Math.max(480, window.innerHeight - 64) : 720,
  }));

  // Normalized scroll progress along active route: 0 = 三義, 0.36 = 勝興, 1 = 豐原
  const [scrollProgress, setScrollProgress] = useState<number>(0.36);

  // Debug mode state (toggled via 'D' key)
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Modals (all 13 items open StoryCardModal or TicketDaterModal)
  const [activeStoryObject, setActiveStoryObject] = useState<MapObject | null>(null);
  const [isDaterOpen, setIsDaterOpen] = useState(false);

  // Auto-resolved map background texture (supports bg_map_texture.jpg or .png)
  const { resolvedUrl: bgTextureUrl } = useResolvedImage(PUBLIC_ASSETS.images.bgMapTexture);

  // Dynamic Distance-from-Sanyi Meter state (km)
  const [currentDistanceKm, setCurrentDistanceKm] = useState<number>(5.0);

  // Dynamic Block Section tracking state
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(1);
  const prevSectionIndexRef = useRef<number>(1);
  const hasInitializedScrollRef = useRef<boolean>(false);

  // DOM Refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeRouteRef = useRef<HTMLDivElement | null>(null);

  // Drag-to-pan state for desktop mouse dragging
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Active Block Section
  const activeBlockSection: BlockSection = useMemo(() => {
    return BLOCK_SECTIONS[currentSectionIndex] || BLOCK_SECTIONS[1];
  }, [currentSectionIndex]);

  // Half-viewport padding ensures scroll=0 centers 三義 (t=0) and maxScroll centers 豐原 (t=1)
  const halfW = Math.round(viewportSize.width / 2);
  const halfH = Math.round(viewportSize.height / 2);

  const canvasWidth = isLandscape
    ? ROUTE_LENGTH_LANDSCAPE + viewportSize.width
    : Math.max(360, viewportSize.width);
  const canvasHeight = isLandscape
    ? Math.max(460, viewportSize.height)
    : ROUTE_LENGTH_PORTRAIT + viewportSize.height;

  // Observe container dimensions and window orientation
  useEffect(() => {
    const container = scrollContainerRef.current;
    const updateSize = () => {
      if (container) {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || Math.max(480, window.innerHeight - 64);
        setViewportSize({ width: w, height: h });
      }
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    updateSize();
    const observer =
      typeof ResizeObserver !== 'undefined' && container
        ? new ResizeObserver(() => updateSize())
        : null;
    if (observer && container) {
      observer.observe(container);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Center scroll on Shengxing Station (t = 0.36)
  const centerOnShengxing = useCallback(
    (smooth = true) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const shengxingT = 0.36;
      if (isLandscape) {
        container.scrollTo({
          left: Math.round(shengxingT * ROUTE_LENGTH_LANDSCAPE),
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else {
        container.scrollTo({
          top: Math.round(shengxingT * ROUTE_LENGTH_PORTRAIT),
          behavior: smooth ? 'smooth' : 'auto',
        });
      }

      setScrollProgress(shengxingT);
      setCurrentDistanceKm(5.0);
      prevSectionIndexRef.current = 1;
      setCurrentSectionIndex(1);
    },
    [isLandscape]
  );

  // Initial auto-centering on mount & orientation switch
  useEffect(() => {
    const timer = setTimeout(() => {
      centerOnShengxing(false);
      hasInitializedScrollRef.current = true;
    }, 80);
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

  // Dynamic Train Tracking, Distance Meter & Block Section via scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rawT = isLandscape
      ? container.scrollLeft / ROUTE_LENGTH_LANDSCAPE
      : container.scrollTop / ROUTE_LENGTH_PORTRAIT;
    const clampedT = Math.max(0, Math.min(1, rawT));
    const percent = clampedT * 100;

    setScrollProgress(clampedT);
    setCurrentDistanceKm(getDistanceKmAtProgress(clampedT));

    // Track Block Section dynamically & ring block bell on section transition
    const matchedSecIdx = BLOCK_SECTIONS.findIndex((sec) => {
      const range = isLandscape ? sec.rangeLandscape : sec.rangePortrait;
      return percent >= range[0] && percent < range[1];
    });

    if (matchedSecIdx !== -1 && matchedSecIdx !== prevSectionIndexRef.current) {
      prevSectionIndexRef.current = matchedSecIdx;
      setCurrentSectionIndex(matchedSecIdx);
      if (hasInitializedScrollRef.current) {
        soundEngine.playBlockBell();
      }
    }
  }, [isLandscape]);

  // Desktop click-and-drag panning on map background
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDebugMode || e.button !== 0) return;
    // Ignore clicks on interactive objects/buttons
    if ((e.target as HTMLElement).closest('[data-map-interactive="true"]')) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isPanningRef.current || !scrollContainerRef.current) return;
      if (isLandscape) {
        const dx = moveEvent.clientX - panStartRef.current.x;
        scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      } else {
        const dy = moveEvent.clientY - panStartRef.current.y;
        scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
      }
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

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
        if (isDebugMode) setIsDebugMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDebugMode, activeStoryObject, isDaterOpen]);

  // Drag and drop handler in Debug mode (relative to the active route container 0..100%)
  const handlePointerDown = (e: React.PointerEvent, objId: string) => {
    if (!isDebugMode) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(objId);

    const routeBox = activeRouteRef.current;
    if (!routeBox) return;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = routeBox.getBoundingClientRect();
      const rawX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const rawY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.round(Math.max(0, Math.min(100, rawX)) * 10) / 10;
      const clampedY = Math.round(Math.max(5, Math.min(95, rawY)) * 10) / 10;

      setObjects((prev) =>
        prev.map((item) => {
          if (item.id !== objId) return item;
          if (isLandscape) {
            return { ...item, landscapePos: { x: clampedX, y: clampedY } };
          }
          return { ...item, portraitPos: { x: clampedX, y: clampedY } };
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

  // Click on centered train head: play whistle sound & open ⑫ 莒光號列車正面 modal
  const handleTrainClick = () => {
    soundEngine.playTrainWhistle();
    setActiveStoryObject(TRAIN_167_OBJECT);
  };

  // Compute exact pixel-coordinate SVG paths for the main track + faded north/south extensions
  const trackGeometry = useMemo(() => {
    const steps = 80;
    const activePoints: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const crossFrac = getTrackCrossPercent(t) / 100;
      if (isLandscape) {
        const px = halfW + t * ROUTE_LENGTH_LANDSCAPE;
        const py = crossFrac * canvasHeight;
        activePoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      } else {
        const px = crossFrac * canvasWidth;
        const py = halfH + t * ROUTE_LENGTH_PORTRAIT;
        activePoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
    }

    const activePathD = `M ${activePoints.join(' L ')}`;

    const northExtensionD = isLandscape
      ? `M 0,${(canvasHeight * 0.5).toFixed(1)} L ${halfW},${(canvasHeight * 0.5).toFixed(1)}`
      : `M ${(canvasWidth * 0.5).toFixed(1)},0 L ${(canvasWidth * 0.5).toFixed(1)},${halfH}`;

    const southExtensionD = isLandscape
      ? `M ${halfW + ROUTE_LENGTH_LANDSCAPE},${(canvasHeight * 0.5).toFixed(1)} L ${canvasWidth},${(canvasHeight * 0.5).toFixed(1)}`
      : `M ${(canvasWidth * 0.5).toFixed(1)},${halfH + ROUTE_LENGTH_PORTRAIT} L ${(canvasWidth * 0.5).toFixed(1)},${canvasHeight}`;

    const milestonePoints = ROUTE_MILESTONES.map((m) => {
      const crossFrac = getTrackCrossPercent(m.t) / 100;
      return isLandscape
        ? { x: halfW + m.t * ROUTE_LENGTH_LANDSCAPE, y: crossFrac * canvasHeight, label: m.label }
        : { x: crossFrac * canvasWidth, y: halfH + m.t * ROUTE_LENGTH_PORTRAIT, label: m.label };
    });

    return { activePathD, northExtensionD, southExtensionD, milestonePoints };
  }, [isLandscape, halfW, halfH, canvasWidth, canvasHeight]);

  // Current cross-axis percent for the viewport-centered 莒光號列車
  const trainCrossPercent = getTrackCrossPercent(scrollProgress);

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
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] whitespace-nowrap">
            <span>↑ 北 · 三義起點</span>
          </div>
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] whitespace-nowrap">
            <span>↓ 南 · 豐原終點</span>
          </div>
        </>
      )}

      {/* ================= ⑫ CENTERED MOVING TRAIN (保持畫面中心 · 隨滑動沿鐵軌行駛) ================= */}
      <div
        className="pointer-events-none absolute inset-0 z-25 overflow-hidden"
        aria-live="off"
      >
        <button
          type="button"
          data-map-interactive="true"
          onClick={handleTrainClick}
          title="莒光號列車正面（點擊鳴笛並閱讀列車故事）"
          className="pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-95 drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFBA84]"
          style={
            isLandscape
              ? { left: '50%', top: `${trainCrossPercent}%` }
              : { left: `${trainCrossPercent}%`, top: '50%' }
          }
        >
          <MapIconImage
            iconFile={TRAIN_167_OBJECT.mapIcon || PUBLIC_ASSETS.images.uiTrain167}
            alt="莒光號列車正面"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter contrast-110"
            fallback={
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#F05E1C] border-2 border-[#FFBA84] text-[#FCFAF2] shadow-[0_0_20px_rgba(240,94,28,0.85)] group-hover:bg-[#d85014] transition-colors">
                <TrainFront className="w-6 h-6 text-[#FCFAF2]" aria-hidden="true" />
              </div>
            }
          />
        </button>
      </div>

      {/* ================= SCROLLABLE MAP VIEWPORT ================= */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseDown={handleContainerMouseDown}
        className={`w-full h-full ${
          isLandscape ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden'
        } cursor-grab active:cursor-grabbing`}
      >
        {/* Full Map Canvas (Active Route + Half-Viewport Faded North & South Track Extensions) */}
        <div
          className="relative"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            backgroundColor: '#2b231d',
            backgroundImage: bgTextureUrl
              ? `url("${bgTextureUrl}"), radial-gradient(circle at 50% 50%, #46392f 0%, #2f251d 55%, #18120e 100%)`
              : 'radial-gradient(circle at 50% 50%, #46392f 0%, #2f251d 55%, #18120e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
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

          {/* ================= CONTINUOUS RAILWAY TRACK SVG (含北端三義外＆南端豐原外淡色延伸) ================= */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          >
            <defs>
              <filter id="track-shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0C0C0C" floodOpacity="0.8" />
              </filter>

              {/* North faded extension gradient (fades smoothly from outer edge to Sanyi) */}
              <linearGradient
                id="north-ext-fade"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={isLandscape ? halfW : 0}
                y2={isLandscape ? 0 : halfH}
              >
                <stop offset="0%" stopColor="#9B9085" stopOpacity="0.06" />
                <stop offset="65%" stopColor="#B8ACA0" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#D6CBC0" stopOpacity="0.38" />
              </linearGradient>

              {/* South faded extension gradient (fades smoothly from Fengyuan to outer edge) */}
              <linearGradient
                id="south-ext-fade"
                gradientUnits="userSpaceOnUse"
                x1={isLandscape ? halfW + ROUTE_LENGTH_LANDSCAPE : 0}
                y1={isLandscape ? 0 : halfH + ROUTE_LENGTH_PORTRAIT}
                x2={isLandscape ? canvasWidth : 0}
                y2={isLandscape ? 0 : canvasHeight}
              >
                <stop offset="0%" stopColor="#D6CBC0" stopOpacity="0.38" />
                <stop offset="35%" stopColor="#B8ACA0" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#9B9085" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            {/* --- 1. NORTH FADED CONTINUOUS EXTENSION (三義以北 · 較淡顏色不可再滑動) --- */}
            <path
              d={trackGeometry.northExtensionD}
              fill="none"
              stroke="url(#north-ext-fade)"
              strokeWidth="10"
              strokeLinecap="butt"
              opacity="0.45"
            />
            <path
              d={trackGeometry.northExtensionD}
              fill="none"
              stroke="url(#north-ext-fade)"
              strokeWidth="5"
              strokeDasharray="14 14"
              strokeLinecap="butt"
            />

            {/* --- 2. SOUTH FADED CONTINUOUS EXTENSION (豐原以南 · 較淡顏色不可再滑動) --- */}
            <path
              d={trackGeometry.southExtensionD}
              fill="none"
              stroke="url(#south-ext-fade)"
              strokeWidth="10"
              strokeLinecap="butt"
              opacity="0.45"
            />
            <path
              d={trackGeometry.southExtensionD}
              fill="none"
              stroke="url(#south-ext-fade)"
              strokeWidth="5"
              strokeDasharray="14 14"
              strokeLinecap="butt"
            />

            {/* --- 3. ACTIVE OLD MOUNTAIN LINE TRACK (三義 ⟷ 豐原) --- */}
            {/* Base ballast bed */}
            <path
              d={trackGeometry.activePathD}
              fill="none"
              stroke="#0C0C0C"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#track-shadow)"
            />

            {/* Rail foundation line */}
            <path
              d={trackGeometry.activePathD}
              fill="none"
              stroke="#2d2621"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Classic cartographic black-and-white railway dashes */}
            <path
              d={trackGeometry.activePathD}
              fill="none"
              stroke="#FCFAF2"
              strokeWidth="5.5"
              strokeDasharray="16 14"
              strokeLinecap="butt"
              strokeLinejoin="round"
            />

            {/* Subtle decorative station mileage nodes along the track (non-interactive) */}
            {trackGeometry.milestonePoints.map((pt) => (
              <g key={pt.label}>
                <circle cx={pt.x} cy={pt.y} r="7" fill="#0C0C0C" stroke="#FFBA84" strokeWidth="2" />
                <circle cx={pt.x} cy={pt.y} r="2.5" fill="#F05E1C" />
              </g>
            ))}
          </svg>

          {/* ================= ACTIVE ROUTE CONTAINER (定位 11 個可點擊地圖物件) ================= */}
          <div
            ref={activeRouteRef}
            className="absolute z-20"
            style={
              isLandscape
                ? {
                    left: `${halfW}px`,
                    top: 0,
                    width: `${ROUTE_LENGTH_LANDSCAPE}px`,
                    height: `${canvasHeight}px`,
                  }
                : {
                    left: 0,
                    top: `${halfH}px`,
                    width: `${canvasWidth}px`,
                    height: `${ROUTE_LENGTH_PORTRAIT}px`,
                  }
            }
          >
            {objects.map((obj) => {
              const pos = isLandscape ? obj.landscapePos : obj.portraitPos;
              const isDragging = draggingId === obj.id;
              const isDater = obj.id === 'dater-machine';
              const isSignpost = Boolean(obj.isSignpost);

              return (
                <div
                  key={obj.id}
                  data-map-interactive="true"
                  onPointerDown={(e) => handlePointerDown(e, obj.id)}
                  onClick={() => {
                    if (isDebugMode) return;
                    soundEngine.playSelectClick();
                    if (isDater) {
                      setIsDaterOpen(true);
                    } else {
                      setActiveStoryObject(obj);
                      if (onSelectStation) onSelectStation(obj.id);
                    }
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${
                    isDebugMode
                      ? 'cursor-move ring-2 ring-dashed ring-[#FFBA84] p-1.5 bg-[#0C0C0C]/85 backdrop-blur-xs rounded'
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

                  {/* --- ①–⑤ 各站站牌（可點擊開啟彈窗 · sign_*.png / .jpg） --- */}
                  {isSignpost ? (
                    <div
                      className="flex flex-col items-center select-none drop-shadow-md"
                      title={`${obj.name}（點擊閱讀介紹）`}
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-18 h-auto sm:w-22 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]"
                        fallback={
                          <>
                            <div className="bg-[#FCFAF2] border-2 border-[#0B346E] px-2.5 py-1 text-center min-w-[60px] shadow-md">
                              <p className="text-[11px] font-serif font-bold tracking-[0.12em] text-[#0C0C0C]">
                                {obj.shortName}
                              </p>
                            </div>
                            <div className="w-1 h-3 bg-[#423832]" />
                          </>
                        }
                      />
                    </div>
                  ) : isDater ? (
                    /* --- ⑪ 軋日機（點擊開啟軋日儀式 · icon_sx_dater.png / .jpg） --- */
                    <div
                      className="group relative flex items-center justify-center"
                      title="軋日機（點擊壓印紀念車票）"
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                        fallback={
                          <div className="relative flex items-center justify-center w-11 h-11 rounded-sm bg-[#1A251E] border-2 border-[#FFBA84] text-[#FFBA84] shadow-[0_4px_16px_rgba(0,0,0,0.85)] group-hover:border-[#F05E1C] group-hover:bg-[#25362b] transition-all">
                            <Stamp className="w-5 h-5 text-[#FFBA84]" aria-hidden="true" />
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05E1C] opacity-80" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05E1C]" />
                            </span>
                          </div>
                        }
                      />
                    </div>
                  ) : obj.id === 'shengxing' ? (
                    /* --- ⑥ 勝興木造車站（icon_sx_station.png / .jpg） --- */
                    <div
                      className="group relative flex items-center justify-center"
                      title="勝興木造車站 · 402.326m（點擊閱讀故事）"
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
                        fallback={
                          <>
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute -inset-2 rounded-full bg-[#F05E1C]/25 animate-pulse"
                            />
                            <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[#FCFAF2] border-3 border-[#0C0C0C] shadow-[0_0_16px_rgba(240,94,28,0.85)] group-hover:scale-110 transition-transform">
                              <div className="w-4 h-4 rounded-full bg-[#F05E1C]" />
                            </div>
                          </>
                        }
                      />
                    </div>
                  ) : obj.id === 'switchback-track' ? (
                    /* --- ⑦ 折返式軌道與加掛補機（icon_sx_switchback.png / .jpg） --- */
                    <div
                      className="group relative flex items-center justify-center"
                      title="折返式軌道與加掛補機（點擊閱讀故事）"
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                        fallback={
                          <div className="flex items-center justify-center w-8 h-8 rounded bg-[#3A2A1E] border border-[#FFBA84] text-[#FFBA84] shadow-md group-hover:bg-[#4E3726] transition-colors">
                            <Layers className="w-4 h-4 text-[#FFBA84]" aria-hidden="true" />
                          </div>
                        }
                      />
                    </div>
                  ) : obj.id === 'elevation-monument' ? (
                    /* --- ⑨ 海拔 402.326m 紀念碑（icon_sx_monument.png / .jpg） --- */
                    <div
                      className="group relative flex items-center justify-center"
                      title="海拔 402.326m 紀念碑（點擊閱讀故事）"
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                        fallback={
                          <div className="flex items-center justify-center w-8 h-8 bg-[#242322] border-2 border-[#FFBA84] text-[#FFBA84] shadow-md group-hover:border-[#F05E1C] transition-colors">
                            <span className="text-[11px] font-serif font-bold">碑</span>
                          </div>
                        }
                      />
                    </div>
                  ) : obj.id === 'camphor-lodge' ? (
                    /* --- ⑩ 樟腦寮（icon_sx_camphor.png / .jpg） --- */
                    <div
                      className="group relative flex items-center justify-center"
                      title="樟腦寮（點擊閱讀故事）"
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                        fallback={
                          <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[#1E3022] border border-[#FFBA84] text-[#FFBA84] shadow-md group-hover:bg-[#28422E] transition-colors">
                            <span className="text-[11px] font-serif">寮</span>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    /* --- ⑧ 開天隧道口與警總哨亭（icon_sx_tunnel.png / .jpg） --- */
                    <div
                      className="group relative flex items-center justify-center"
                      title={`${obj.name}（點擊閱讀故事）`}
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
                        fallback={
                          <div className="flex items-center justify-center w-8 h-8 rounded-t-full bg-[#1A1816] border border-[#FFBA84]/70 text-[#FCFAF2] shadow-md group-hover:border-[#F05E1C] transition-colors">
                            <span className="text-[10px] font-serif text-[#FFBA84]">洞</span>
                          </div>
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= CORNER 1: DYNAMIC DISTANCE METER (貼齊視窗左側 · 距起點三義) ================= */}
      <div
        className={`absolute left-0 z-30 flex flex-col justify-between overflow-hidden bg-[#0C0C0C]/90 backdrop-blur-md border border-l-0 border-[#FFBA84]/35 shadow-2xl text-[#FCFAF2] ${
          isLandscape
            ? 'bottom-5 w-[108px] h-[56px] px-2.5 py-2'
            : 'bottom-14 w-[96px] h-[50px] px-2 py-1.5'
        }`}
      >
        <div className="text-[10px] leading-none tracking-[0.1em] text-[#FFBA84] border-b border-[#FCFAF2]/15 pb-1 whitespace-nowrap">
          <span>距起點三義：</span>
        </div>

        <div className="flex items-baseline gap-1 leading-none whitespace-nowrap">
          <span
            className={`font-mono tabular-nums font-semibold tracking-tight text-[#FFBA84] ${
              isLandscape ? 'text-xl' : 'text-base'
            }`}
          >
            {currentDistanceKm.toFixed(1)}
          </span>
          <span
            className={`font-mono text-[#FCFAF2]/70 ${
              isLandscape ? 'text-[11px]' : 'text-[10px]'
            }`}
          >
            公里
          </span>
        </div>
      </div>

      {/* ================= CORNER 2: ⑬ FIXED BLOCK INSTRUMENT (右下角 電氣路牌閉塞器圖樣預留) ================= */}
      <button
        type="button"
        onClick={() => {
          soundEngine.playSelectClick();
          setActiveStoryObject(BLOCK_INSTRUMENT_DATA);
        }}
        aria-label={`電氣路牌閉塞器（${
          activeBlockSection.status === 'occupied' ? '列車佔用' : '區間開通'
        }，點擊閱讀介紹）`}
        title="電氣路牌閉塞器（點擊閱讀介紹）"
        className="absolute bottom-5 right-5 z-30 group cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFBA84]"
      >
        <MapIconImage
          iconFile={PUBLIC_ASSETS.images.uiBlockInstrument}
          alt="電氣路牌閉塞器"
          className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-all duration-300 ${
            activeBlockSection.status === 'occupied'
              ? 'block-graphic-img-occupied'
              : 'block-graphic-img-clear'
          }`}
          fallback={
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#0C0C0C]/75 backdrop-blur-xs border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 ${
                activeBlockSection.status === 'occupied'
                  ? 'block-graphic-occupied'
                  : 'block-graphic-clear'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  activeBlockSection.status === 'occupied'
                    ? 'bg-[#EF4444] shadow-[0_0_12px_#EF4444]'
                    : 'bg-[#4ADE80] shadow-[0_0_12px_#4ADE80]'
                }`}
              />
              <span className="mt-1.5 text-[10px] tracking-[0.14em] text-[#FCFAF2]/80 font-serif">
                閉塞器預留
              </span>
            </div>
          }
        />
      </button>

      {/* ================= MODAL 1: STORY OBJECTS (#FFBA84 CARD · 統一規格彈出視窗) ================= */}
      <StoryCardModal
        object={activeStoryObject}
        onClose={() => setActiveStoryObject(null)}
      />

      {/* ================= MODAL 2: TICKET DATER MACHINE (軋日機儀式) ================= */}
      <TicketDaterModal
        isOpen={isDaterOpen}
        onClose={() => setIsDaterOpen(false)}
      />
    </div>
  );
}
