import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  HelpCircle,
  Layers,
  Move,
  RotateCcw,
  Stamp,
  TrainFront,
  X,
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
  hasTicket?: boolean;
  onOpenTicketMachine?: () => void;
  activeModalId?: string | null;
  onOpenModal?: (modalId: string) => void;
  onCloseModal?: () => void;
}

// Active scrollable railway length from Sanyi (0%) to Fengyuan (100%)
const ROUTE_LENGTH_LANDSCAPE = 2600;
const ROUTE_LENGTH_PORTRAIT = 2200;

// Show the onboarding exploration hint only on the first entry to「探索舊山線」per visit
let hasShownExploreOnboarding = false;

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

export function InteractiveMap({
  onSelectStation,
  hasTicket = true,
  onOpenTicketMachine,
  activeModalId = null,
  onOpenModal,
  onCloseModal,
}: InteractiveMapProps) {
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

  // Local fallback modal state if used standalone; otherwise controlled via browser history
  const [localModalId, setLocalModalId] = useState<string | null>(null);
  const resolvedModalId = onOpenModal ? activeModalId : localModalId;

  const openModalById = useCallback(
    (id: string) => {
      if (onOpenModal) {
        onOpenModal(id);
      } else {
        setLocalModalId(id);
      }
    },
    [onOpenModal]
  );

  const closeActiveModal = useCallback(() => {
    if (onCloseModal) {
      onCloseModal();
    } else {
      setLocalModalId(null);
    }
  }, [onCloseModal]);

  const isDaterOpen = resolvedModalId === 'dater-machine';
  const activeStoryObject: MapObject | null = useMemo(() => {
    if (!resolvedModalId || resolvedModalId === 'dater-machine') return null;
    if (resolvedModalId === TRAIN_167_OBJECT.id) return TRAIN_167_OBJECT;
    if (resolvedModalId === BLOCK_INSTRUMENT_DATA.id) return BLOCK_INSTRUMENT_DATA;
    return objects.find((item) => item.id === resolvedModalId) ?? null;
  }, [resolvedModalId, objects]);

  // Auto-resolved map background texture (supports bg_map_texture.jpg or .png)
  const { resolvedUrl: bgTextureUrl } = useResolvedImage(PUBLIC_ASSETS.images.bgMapTexture);

  // Dynamic Distance-from-Sanyi Meter state (km)
  const [currentDistanceKm, setCurrentDistanceKm] = useState<number>(5.0);

  // Dynamic Block Section tracking state
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(1);
  const prevSectionIndexRef = useRef<number>(1);
  const hasInitializedScrollRef = useRef<boolean>(false);

  // Directional edge hints: both show for 4s on entry then fade out;
  // moving south reveals North (三義), moving north reveals South (豐原)
  const [showNorthHint, setShowNorthHint] = useState<boolean>(true);
  const [showSouthHint, setShowSouthHint] = useState<boolean>(true);
  const introHintTimerRef = useRef<number | null>(null);
  const lastScrollProgressRef = useRef<number>(0.36);
  const ignoreDirectionScrollRef = useRef<boolean>(true);
  const ignoreDirectionTimerRef = useRef<number | null>(null);

  // First-time onboarding fade-in / fade-out guide dialog (also toggleable via '?' icon)
  const [onboardingPhase, setOnboardingPhase] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>(
    () => (hasShownExploreOnboarding ? 'hidden' : 'entering')
  );
  const onboardingTimersRef = useRef<number[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
  });

  // DOM Refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeRouteRef = useRef<HTMLDivElement | null>(null);
  const trainButtonRef = useRef<HTMLButtonElement | null>(null);
  const trainOverlayRef = useRef<HTMLDivElement | null>(null);

  // Drag-to-pan state for desktop mouse dragging
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Active Block Section
  const activeBlockSection: BlockSection = useMemo(() => {
    return BLOCK_SECTIONS[currentSectionIndex] || BLOCK_SECTIONS[1];
  }, [currentSectionIndex]);

  // Exact half-viewport padding ensures scroll=0 centers 三義 (t=0), maxScroll centers 豐原 (t=1),
  // and the train stays locked to the exact center of the railway track across all viewport sizes
  const halfW = viewportSize.width / 2;
  const halfH = viewportSize.height / 2;

  const canvasWidth = isLandscape
    ? ROUTE_LENGTH_LANDSCAPE + viewportSize.width
    : viewportSize.width;
  const canvasHeight = isLandscape
    ? viewportSize.height
    : ROUTE_LENGTH_PORTRAIT + viewportSize.height;

  // Directly sync train DOM coordinates with exact container pixel geometry (zero-frame scroll lag)
  const syncTrainDomPosition = useCallback((t: number, landscape: boolean) => {
    const container = scrollContainerRef.current;
    const trainBtn = trainButtonRef.current;
    const overlay = trainOverlayRef.current;
    if (!container || !trainBtn) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (overlay) {
      overlay.style.width = `${w}px`;
      overlay.style.height = `${h}px`;
    }

    const crossFrac = getTrackCrossPercent(t) / 100;
    if (landscape) {
      trainBtn.style.left = `${w / 2}px`;
      trainBtn.style.top = `${crossFrac * h}px`;
    } else {
      trainBtn.style.left = `${crossFrac * w}px`;
      trainBtn.style.top = `${h / 2}px`;
    }
  }, []);

  // Observe container dimensions and window orientation
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    const updateSize = () => {
      const nextLandscape = window.innerWidth > window.innerHeight;
      setIsLandscape(nextLandscape);
      setIsTouchDevice(window.matchMedia?.('(pointer: coarse)').matches ?? false);

      if (container) {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || Math.max(480, window.innerHeight - 64);
        setViewportSize({ width: w, height: h });

        const rawT = nextLandscape
          ? container.scrollLeft / ROUTE_LENGTH_LANDSCAPE
          : container.scrollTop / ROUTE_LENGTH_PORTRAIT;
        const clampedT = Math.max(0, Math.min(1, rawT));
        syncTrainDomPosition(clampedT, nextLandscape);
      }
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
  }, [syncTrainDomPosition]);

  const clearOnboardingTimers = useCallback(() => {
    onboardingTimersRef.current.forEach((id) => window.clearTimeout(id));
    onboardingTimersRef.current = [];
  }, []);

  // First-time onboarding dialog lifecycle: fade in -> hold ~7s -> fade out -> unmount
  useEffect(() => {
    if (hasShownExploreOnboarding) {
      setOnboardingPhase('hidden');
      return;
    }
    hasShownExploreOnboarding = true;

    const enterTimer = window.setTimeout(() => {
      setOnboardingPhase('visible');
    }, 220);

    const leaveTimer = window.setTimeout(() => {
      setOnboardingPhase('leaving');
    }, 7200);

    const hideTimer = window.setTimeout(() => {
      setOnboardingPhase('hidden');
    }, 7950);

    onboardingTimersRef.current = [enterTimer, leaveTimer, hideTimer];

    return () => {
      clearOnboardingTimers();
    };
  }, [clearOnboardingTimers]);

  const dismissOnboarding = useCallback(() => {
    clearOnboardingTimers();
    setOnboardingPhase('leaving');
    const hideTimer = window.setTimeout(() => {
      setOnboardingPhase('hidden');
    }, 500);
    onboardingTimersRef.current = [hideTimer];
  }, [clearOnboardingTimers]);

  const toggleOnboardingGuide = useCallback(() => {
    soundEngine.playSelectClick();
    if (onboardingPhase === 'visible' || onboardingPhase === 'entering') {
      dismissOnboarding();
      return;
    }
    clearOnboardingTimers();
    hasShownExploreOnboarding = true;
    setOnboardingPhase('entering');
    const enterTimer = window.setTimeout(() => {
      setOnboardingPhase('visible');
    }, 20);
    onboardingTimersRef.current = [enterTimer];
  }, [onboardingPhase, clearOnboardingTimers, dismissOnboarding]);

  // Initial 4-second entry display for both North & South edge hints, then fade out
  useEffect(() => {
    setShowNorthHint(true);
    setShowSouthHint(true);
    introHintTimerRef.current = window.setTimeout(() => {
      setShowNorthHint(false);
      setShowSouthHint(false);
      introHintTimerRef.current = null;
    }, 4000);

    return () => {
      if (introHintTimerRef.current !== null) {
        window.clearTimeout(introHintTimerRef.current);
        introHintTimerRef.current = null;
      }
      if (ignoreDirectionTimerRef.current !== null) {
        window.clearTimeout(ignoreDirectionTimerRef.current);
        ignoreDirectionTimerRef.current = null;
      }
    };
  }, []);

  // Center scroll on Shengxing Station (t = 0.36)
  const centerOnShengxing = useCallback(
    (smooth = true) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const shengxingT = 0.36;
      ignoreDirectionScrollRef.current = true;
      if (ignoreDirectionTimerRef.current !== null) {
        window.clearTimeout(ignoreDirectionTimerRef.current);
      }

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
      lastScrollProgressRef.current = shengxingT;
      setCurrentDistanceKm(5.0);
      prevSectionIndexRef.current = 1;
      setCurrentSectionIndex(1);
      syncTrainDomPosition(shengxingT, isLandscape);

      ignoreDirectionTimerRef.current = window.setTimeout(
        () => {
          ignoreDirectionScrollRef.current = false;
          ignoreDirectionTimerRef.current = null;
        },
        smooth ? 650 : 180
      );
    },
    [isLandscape, syncTrainDomPosition]
  );

  // Initial auto-centering on mount & orientation switch
  useLayoutEffect(() => {
    centerOnShengxing(false);
    hasInitializedScrollRef.current = true;
  }, [isLandscape, centerOnShengxing]);

  // Listen for external center-shengxing event (e.g. from TopNavbar title click)
  useEffect(() => {
    const handleCenterEvent = () => {
      centerOnShengxing(true);
    };
    window.addEventListener('center-shengxing', handleCenterEvent);
    return () => window.removeEventListener('center-shengxing', handleCenterEvent);
  }, [centerOnShengxing]);

  // Handle mouse wheel horizontal scroll in landscape mode & re-enable directional hints on user input
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleUserScrollIntent = () => {
      if (hasInitializedScrollRef.current && ignoreDirectionScrollRef.current) {
        ignoreDirectionScrollRef.current = false;
        if (ignoreDirectionTimerRef.current !== null) {
          window.clearTimeout(ignoreDirectionTimerRef.current);
          ignoreDirectionTimerRef.current = null;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      handleUserScrollIntent();
      if (!isLandscape) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 1.15;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleUserScrollIntent, { passive: true });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleUserScrollIntent);
    };
  }, [isLandscape]);

  // Dynamic Train Tracking, Distance Meter, Directional Edge Hints & Block Section via scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rawT = isLandscape
      ? container.scrollLeft / ROUTE_LENGTH_LANDSCAPE
      : container.scrollTop / ROUTE_LENGTH_PORTRAIT;
    const clampedT = Math.max(0, Math.min(1, rawT));
    const percent = clampedT * 100;

    // Update train position synchronously before React re-render so it stays 0px locked to the rail center
    syncTrainDomPosition(clampedT, isLandscape);

    setScrollProgress(clampedT);
    setCurrentDistanceKm(getDistanceKmAtProgress(clampedT));

    // Directional hints: moving south reveals North (三義); moving north reveals South (豐原)
    if (hasInitializedScrollRef.current && !ignoreDirectionScrollRef.current) {
      const delta = clampedT - lastScrollProgressRef.current;
      if (Math.abs(delta) > 0.002) {
        if (introHintTimerRef.current !== null) {
          window.clearTimeout(introHintTimerRef.current);
          introHintTimerRef.current = null;
        }
        if (delta > 0) {
          setShowNorthHint(true);
          setShowSouthHint(false);
        } else {
          setShowNorthHint(false);
          setShowSouthHint(true);
        }
        lastScrollProgressRef.current = clampedT;
      }
    } else {
      lastScrollProgressRef.current = clampedT;
    }

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
  }, [isLandscape, syncTrainDomPosition]);

  // Desktop click-and-drag panning on map background
  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDebugMode || e.button !== 0) return;
    // Ignore clicks on interactive objects/buttons
    if ((e.target as HTMLElement).closest('[data-map-interactive="true"]')) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    // Re-enable directional hints immediately when user starts dragging the map
    if (hasInitializedScrollRef.current && ignoreDirectionScrollRef.current) {
      ignoreDirectionScrollRef.current = false;
      if (ignoreDirectionTimerRef.current !== null) {
        window.clearTimeout(ignoreDirectionTimerRef.current);
        ignoreDirectionTimerRef.current = null;
      }
    }

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
        if (isDebugMode && !activeStoryObject && !isDaterOpen) {
          setIsDebugMode(false);
        }
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

  // Click on centered train head: play whistle sound & open ⑫ 莒光167次 modal
  const handleTrainClick = () => {
    soundEngine.playTrainWhistle();
    openModalById(TRAIN_167_OBJECT.id);
  };

  // Compute exact pixel-coordinate SVG paths for the main track + faded north/south extensions
  // High-resolution sampling (200 steps) keeps the S-curve silky smooth with uniform rail borders & dashes
  const trackGeometry = useMemo(() => {
    const steps = 200;
    const activePoints: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const crossFrac = getTrackCrossPercent(t) / 100;
      if (isLandscape) {
        const px = halfW + t * ROUTE_LENGTH_LANDSCAPE;
        const py = crossFrac * canvasHeight;
        activePoints.push(`${px.toFixed(2)},${py.toFixed(2)}`);
      } else {
        const px = crossFrac * canvasWidth;
        const py = halfH + t * ROUTE_LENGTH_PORTRAIT;
        activePoints.push(`${px.toFixed(2)},${py.toFixed(2)}`);
      }
    }

    const activePathD = `M ${activePoints.join(' L ')}`;

    const northExtensionD = isLandscape
      ? `M 0,${(canvasHeight * 0.5).toFixed(2)} L ${halfW.toFixed(2)},${(canvasHeight * 0.5).toFixed(2)}`
      : `M ${(canvasWidth * 0.5).toFixed(2)},0 L ${(canvasWidth * 0.5).toFixed(2)},${halfH.toFixed(2)}`;

    const southExtensionD = isLandscape
      ? `M ${(halfW + ROUTE_LENGTH_LANDSCAPE).toFixed(2)},${(canvasHeight * 0.5).toFixed(2)} L ${canvasWidth.toFixed(2)},${(canvasHeight * 0.5).toFixed(2)}`
      : `M ${(canvasWidth * 0.5).toFixed(2)},${(halfH + ROUTE_LENGTH_PORTRAIT).toFixed(2)} L ${(canvasWidth * 0.5).toFixed(2)},${canvasHeight.toFixed(2)}`;

    const milestonePoints = ROUTE_MILESTONES.map((m) => {
      const crossFrac = getTrackCrossPercent(m.t) / 100;
      return isLandscape
        ? { x: halfW + m.t * ROUTE_LENGTH_LANDSCAPE, y: crossFrac * canvasHeight, label: m.label }
        : { x: crossFrac * canvasWidth, y: halfH + m.t * ROUTE_LENGTH_PORTRAIT, label: m.label };
    });

    return { activePathD, northExtensionD, southExtensionD, milestonePoints };
  }, [isLandscape, halfW, halfH, canvasWidth, canvasHeight]);

  // Exact pixel coordinate for the viewport-centered 莒光167次 train so it always rides dead-center on the track
  const trainCrossPx =
    (getTrackCrossPercent(scrollProgress) / 100) * (isLandscape ? canvasHeight : canvasWidth);

  return (
    <div className="relative w-full h-full bg-[#2b231d] text-[#FCFAF2] overflow-hidden select-none">
      {/* ================= FLOATING TOP-LEFT MAP GUIDE BUTTON ('?') ================= */}
      <button
        type="button"
        onClick={toggleOnboardingGuide}
        aria-expanded={onboardingPhase === 'visible' || onboardingPhase === 'entering'}
        aria-label="開啟地圖導覽指南"
        title="地圖導覽指南"
        className={`absolute top-4 left-4 z-30 inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 ${
          onboardingPhase === 'visible' || onboardingPhase === 'entering'
            ? 'bg-[#F05E1C] border-[#FFBA84] text-[#FCFAF2]'
            : 'bg-[#0C0C0C]/65 hover:bg-[#F05E1C] border-[#FCFAF2]/20 text-[#FFBA84] hover:text-[#FCFAF2]'
        }`}
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </button>

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
        <div className="absolute top-4 left-14 z-30 px-3.5 py-2 bg-[#FFBA84] text-[#0C0C0C] border border-[#0C0C0C]/40 rounded shadow-xl flex items-center gap-2.5 text-xs animate-notice-enter">
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

      {/* ================= DIRECTION INDICATORS AT VIEWPORT EDGES (4s intro fade + directional reveal) ================= */}
      {isLandscape ? (
        <>
          <div
            aria-hidden={!showNorthHint}
            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-20 px-2 py-3 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] writing-vertical-rl flex items-center justify-center transition-opacity duration-700 ease-out ${
              showNorthHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span>← 北 · 三義起點</span>
          </div>
          <div
            aria-hidden={!showSouthHint}
            className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 z-20 px-2 py-3 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] writing-vertical-rl flex items-center justify-center transition-opacity duration-700 ease-out ${
              showSouthHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span>南 · 豐原終點 →</span>
          </div>
        </>
      ) : (
        <>
          <div
            aria-hidden={!showNorthHint}
            className={`pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] whitespace-nowrap transition-opacity duration-700 ease-out ${
              showNorthHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span>↑ 北 · 三義起點</span>
          </div>
          <div
            aria-hidden={!showSouthHint}
            className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-[#0C0C0C]/75 backdrop-blur-xs border border-[#FCFAF2]/15 text-[11px] tracking-[0.16em] text-[#FFBA84] whitespace-nowrap transition-opacity duration-700 ease-out ${
              showSouthHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span>↓ 南 · 豐原終點</span>
          </div>
        </>
      )}

      {/* ================= FIRST-VISIT EXPLORATION ONBOARDING DIALOG (漸顯漸隱探索導引) ================= */}
      {onboardingPhase !== 'hidden' && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 z-40 w-[min(90vw,360px)] sm:w-[min(86vw,420px)] bg-[#0C0C0C]/92 backdrop-blur-md border border-[#FFBA84]/50 text-[#FCFAF2] shadow-[0_14px_40px_rgba(0,0,0,0.78)] transition-all duration-700 ease-out ${
            isLandscape ? 'top-5' : 'top-14'
          } ${
            onboardingPhase === 'visible'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className="h-[2px] bg-[#F05E1C]" />
          <div className="px-4 py-3 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-[#FFBA84] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs sm:text-[13px] leading-[1.7] tracking-[0.06em] text-[#FCFAF2]">
                {!isLandscape || isTouchDevice
                  ? '上下滑動畫面，沿著舊山線探索沿途風景。'
                  : '滑動滑鼠滾輪或拖曳畫面，沿著舊山線探索沿途風景。'}
              </p>
              <p className="text-[11px] sm:text-xs leading-[1.65] tracking-[0.05em] text-[#FFBA84]/90">
                點擊地圖上的站牌與物件，發掘歷史故事與意想不到的小彩蛋！
              </p>
            </div>
            <button
              type="button"
              onClick={dismissOnboarding}
              aria-label="關閉探索提示"
              className="shrink-0 inline-flex items-center justify-center w-6 h-6 text-[#FCFAF2]/55 hover:text-[#FFBA84] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ================= ⑫ CENTERED MOVING TRAIN (鎖定鐵路正中央 · 隨滑動沿鐵軌行駛) ================= */}
      <div
        ref={trainOverlayRef}
        className="pointer-events-none absolute top-0 left-0 z-25 overflow-hidden"
        style={{
          width: `${viewportSize.width}px`,
          height: `${viewportSize.height}px`,
        }}
        aria-live="off"
      >
        <button
          ref={trainButtonRef}
          type="button"
          data-map-interactive="true"
          onClick={handleTrainClick}
          title="莒光167次（點擊鳴笛並閱讀列車故事）"
          className="pointer-events-auto group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-0 m-0 border-0 leading-none cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-95 drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFBA84]"
          style={
            isLandscape
              ? { left: `${halfW}px`, top: `${trainCrossPx}px` }
              : { left: `${trainCrossPx}px`, top: `${halfH}px` }
          }
        >
          <MapIconImage
            iconFile={TRAIN_167_OBJECT.mapIcon || PUBLIC_ASSETS.images.uiTrain167}
            alt="莒光167次"
            className="block w-14 h-14 sm:w-16 sm:h-16 object-contain filter contrast-110"
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
          {/* Subtle Archival Surveyor Grid Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(252, 250, 242, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(252, 250, 242, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px, 80px 80px',
            }}
          />

          {/* ================= CONTINUOUS RAILWAY TRACK SVG (含北端三義外＆南端豐原外淡色延伸) ================= */}
          <svg
            width={canvasWidth}
            height={canvasHeight}
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          >
            <defs>
              {/* Crisp grounded shadow for refined railway depth */}
              <filter
                id="track-shadow"
                filterUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={canvasWidth}
                height={canvasHeight}
              >
                <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#070504" floodOpacity="0.72" />
              </filter>

              {/* North faded extension gradients (dark casing & cream dashes fade smoothly outward) */}
              <linearGradient
                id="north-casing-fade"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={isLandscape ? halfW : 0}
                y2={isLandscape ? 0 : halfH}
              >
                <stop offset="0%" stopColor="#12100E" stopOpacity="0.05" />
                <stop offset="65%" stopColor="#12100E" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#12100E" stopOpacity="0.62" />
              </linearGradient>
              <linearGradient
                id="north-dash-fade"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={isLandscape ? halfW : 0}
                y2={isLandscape ? 0 : halfH}
              >
                <stop offset="0%" stopColor="#F7F3E8" stopOpacity="0.05" />
                <stop offset="65%" stopColor="#F7F3E8" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#F7F3E8" stopOpacity="0.48" />
              </linearGradient>

              {/* South faded extension gradients */}
              <linearGradient
                id="south-casing-fade"
                gradientUnits="userSpaceOnUse"
                x1={isLandscape ? halfW + ROUTE_LENGTH_LANDSCAPE : 0}
                y1={isLandscape ? 0 : halfH + ROUTE_LENGTH_PORTRAIT}
                x2={isLandscape ? canvasWidth : 0}
                y2={isLandscape ? 0 : canvasHeight}
              >
                <stop offset="0%" stopColor="#12100E" stopOpacity="0.62" />
                <stop offset="35%" stopColor="#12100E" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#12100E" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient
                id="south-dash-fade"
                gradientUnits="userSpaceOnUse"
                x1={isLandscape ? halfW + ROUTE_LENGTH_LANDSCAPE : 0}
                y1={isLandscape ? 0 : halfH + ROUTE_LENGTH_PORTRAIT}
                x2={isLandscape ? canvasWidth : 0}
                y2={isLandscape ? 0 : canvasHeight}
              >
                <stop offset="0%" stopColor="#F7F3E8" stopOpacity="0.48" />
                <stop offset="35%" stopColor="#F7F3E8" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#F7F3E8" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* --- 1. NORTH FADED CONTINUOUS EXTENSION (三義以北 · 同寬 11px/6px 與等距 16/16 黑白節奏) --- */}
            <path
              d={trackGeometry.northExtensionD}
              fill="none"
              stroke="url(#north-casing-fade)"
              strokeWidth="11"
              strokeLinecap="butt"
            />
            <path
              d={trackGeometry.northExtensionD}
              fill="none"
              stroke="url(#north-dash-fade)"
              strokeWidth="6"
              strokeDasharray="16 16"
              strokeLinecap="butt"
            />

            {/* --- 2. SOUTH FADED CONTINUOUS EXTENSION (豐原以南 · 同寬 11px/6px 與等距 16/16 黑白節奏) --- */}
            <path
              d={trackGeometry.southExtensionD}
              fill="none"
              stroke="url(#south-casing-fade)"
              strokeWidth="11"
              strokeLinecap="butt"
            />
            <path
              d={trackGeometry.southExtensionD}
              fill="none"
              stroke="url(#south-dash-fade)"
              strokeWidth="6"
              strokeDasharray="16 16"
              strokeLinecap="butt"
            />

            {/* --- 3. ACTIVE OLD MOUNTAIN LINE TRACK (三義 ⟷ 豐原 · 精細對稱外框 2.5px + 16/16 等距黑白鐵道) --- */}
            {/* Subtle neutral hairline rim to separate dark rail casing cleanly from topographic ground */}
            <path
              d={trackGeometry.activePathD}
              fill="none"
              stroke="rgba(252, 250, 242, 0.1)"
              strokeWidth="12.5"
              strokeLinecap="butt"
              strokeLinejoin="round"
            />

            {/* Main dark rail bed casing with soft elevation + contact shadow (2.5px uniform border each side) */}
            <path
              d={trackGeometry.activePathD}
              fill="none"
              stroke="#12100E"
              strokeWidth="11"
              strokeLinecap="butt"
              strokeLinejoin="round"
              filter="url(#track-shadow)"
            />

            {/* Uniform 1:1 cartographic ivory/black alternating railway dashes (16px white / 16px dark) */}
            <path
              d={trackGeometry.activePathD}
              fill="none"
              stroke="#F7F3E8"
              strokeWidth="6"
              strokeDasharray="16 16"
              strokeLinecap="butt"
              strokeLinejoin="round"
            />

            {/* Subtle decorative station mileage nodes along the track (non-interactive) */}
            {trackGeometry.milestonePoints.map((pt) => (
              <g key={pt.label}>
                <circle cx={pt.x} cy={pt.y} r="7" fill="#12100E" stroke="#FFBA84" strokeWidth="2" />
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
                    openModalById(obj.id);
                    if (!isDater && onSelectStation) onSelectStation(obj.id);
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
                      className="w-[88px] sm:w-[104px] shrink-0 flex flex-col items-center select-none drop-shadow-md"
                      title={`${obj.name}（點擊閱讀介紹）`}
                    >
                      <MapIconImage
                        iconFile={obj.mapIcon}
                        alt={obj.name}
                        className="w-[88px] sm:w-[104px] h-auto max-w-none shrink-0 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)]"
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
            ? 'bottom-5 w-[132px] h-[68px] px-3.5 py-2.5'
            : 'bottom-14 w-[96px] h-[50px] px-2 py-1.5'
        }`}
      >
        <div
          className={`leading-none tracking-[0.1em] text-[#FFBA84] border-b border-[#FCFAF2]/15 whitespace-nowrap ${
            isLandscape ? 'text-xs pb-1.5' : 'text-[10px] pb-1'
          }`}
        >
          <span>距起點三義：</span>
        </div>

        <div className="flex items-baseline gap-1 leading-none whitespace-nowrap">
          <span
            className={`font-mono tabular-nums font-semibold tracking-tight text-[#FFBA84] ${
              isLandscape ? 'text-2xl' : 'text-base'
            }`}
          >
            {currentDistanceKm.toFixed(1)}
          </span>
          <span
            className={`font-mono text-[#FCFAF2]/70 ${
              isLandscape ? 'text-xs' : 'text-[10px]'
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
          openModalById(BLOCK_INSTRUMENT_DATA.id);
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
        onClose={closeActiveModal}
      />

      {/* ================= MODAL 2: TICKET DATER MACHINE (軋日機儀式) ================= */}
      <TicketDaterModal
        isOpen={isDaterOpen}
        onClose={closeActiveModal}
        hasTicket={hasTicket}
        onOpenTicketMachine={onOpenTicketMachine}
      />
    </div>
  );
}
