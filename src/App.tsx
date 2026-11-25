import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ExhibitionMain } from './components/ExhibitionMain';
import { PrologueStage } from './components/PrologueStage';
import { TicketMachineStage } from './components/TicketMachineStage';
import { TopNavbar } from './components/TopNavbar';
import { ExhibitionTabId, MAINTENANCE_MODE } from './data/exhibitionData';
import {
  AppRoute,
  getDocumentTitle,
  INITIAL_ROUTE,
  isSameRoute,
  isValidRoute,
} from './utils/router';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  // 網址加上 ?preview=1 可在維護期間繞過公告直接預覽全站
  const isBypassPreview =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  const isUnderMaintenance = Boolean(MAINTENANCE_MODE) && !isBypassPreview;
  const [showMaintenanceAbout, setShowMaintenanceAbout] = useState(false);

  const [route, setRoute] = useState<AppRoute>(INITIAL_ROUTE);
  const routeRef = useRef<AppRoute>(route);
  routeRef.current = route;

  const [prologueRunId, setPrologueRunId] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [shouldNudgeMenu, setShouldNudgeMenu] = useState(false);
  const [hasClickedMenu, setHasClickedMenu] = useState(false);
  const hasClickedMenuRef = useRef(false);
  const nudgeTimerRef = useRef<number | null>(null);

  // Sync browser document title whenever route changes
  useEffect(() => {
    if (isUnderMaintenance) {
      document.title = '展覽調整中｜《167次-勝興》「回憶舊山線」線上展覽';
      return;
    }
    document.title = getDocumentTitle(route);
  }, [route, isUnderMaintenance]);

  // Anchor initial history entry at prologue & subscribe to browser Back / Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined' || isUnderMaintenance) return;

    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({ route: INITIAL_ROUTE }, '', cleanUrl);

    const handlePopState = (event: PopStateEvent) => {
      const next = isValidRoute(event.state?.route) ? event.state.route : INITIAL_ROUTE;
      const prev = routeRef.current;

      setIsMenuOpen(false);

      if (!isSameRoute(prev, next)) {
        if (next.stage === 'prologue' && prev.stage !== 'prologue') {
          setPrologueRunId((id) => id + 1);
        }
        setRoute(next);
        if (next.stage !== 'main' || next.tab !== prev.tab) {
          window.scrollTo({ top: 0 });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      soundEngine.dispose();
    };
  }, [isUnderMaintenance]);

  // After 1 minute from entering the website, show the orange dot on the menu icon
  // ONLY if the user has never clicked the menu or visited another tab within that first minute
  useEffect(() => {
    if (isUnderMaintenance) return;
    if (hasClickedMenu) {
      if (nudgeTimerRef.current !== null) {
        window.clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
      setShouldNudgeMenu(false);
      return;
    }

    nudgeTimerRef.current = window.setTimeout(() => {
      nudgeTimerRef.current = null;
      if (!hasClickedMenuRef.current) {
        setShouldNudgeMenu(true);
      }
    }, 60_000);

    return () => {
      if (nudgeTimerRef.current !== null) {
        window.clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    };
  }, [hasClickedMenu, isUnderMaintenance]);

  // If user switches to any other exhibition tab (e.g. via footer), mark menu/tabs as explored
  useEffect(() => {
    if (route.stage === 'main' && route.tab !== 'explore' && !hasClickedMenuRef.current) {
      hasClickedMenuRef.current = true;
      setHasClickedMenu(true);
      setShouldNudgeMenu(false);
    }
  }, [route.stage, route.tab]);

  // Push a new entry onto browser history so Back / Forward work naturally without trapping reloads on a stale hash
  const navigateTo = useCallback(
    (next: AppRoute, options?: { replace?: boolean; fromModal?: boolean }) => {
      const prev = routeRef.current;
      if (isSameRoute(prev, next)) return;

      if (typeof window !== 'undefined') {
        const statePayload = { route: next, fromModal: Boolean(options?.fromModal) };
        if (options?.replace) {
          window.history.replaceState(statePayload, '');
        } else {
          window.history.pushState(statePayload, '');
        }
      }

      if (next.stage === 'prologue') {
        setPrologueRunId((id) => id + 1);
      }

      setRoute(next);

      if (next.stage !== 'main' || next.tab !== prev.tab) {
        window.scrollTo({ top: 0 });
      }
    },
    []
  );

  const handlePrologueComplete = useCallback(() => {
    navigateTo({ stage: 'ticket-machine', tab: 'explore', modalId: null });
  }, [navigateTo]);

  const handleTicketComplete = useCallback(() => {
    setHasTicket(true);
    soundEngine.startAmbient();
    soundEngine.playTrainWhistle();
    navigateTo({ stage: 'main', tab: 'explore', modalId: null });
  }, [navigateTo]);

  const handleTicketSkip = useCallback(() => {
    soundEngine.startAmbient();
    navigateTo({ stage: 'main', tab: 'explore', modalId: null });
  }, [navigateTo]);

  const handleSelectTab = useCallback(
    (tab: ExhibitionTabId) => {
      navigateTo({ stage: 'main', tab, modalId: null });
    },
    [navigateTo]
  );

  const handleReplayPrologue = useCallback(() => {
    setIsMenuOpen(false);
    navigateTo({ stage: 'prologue', tab: 'explore', modalId: null });
  }, [navigateTo]);

  const handleOpenTicketMachine = useCallback(() => {
    setIsMenuOpen(false);
    navigateTo({ stage: 'ticket-machine', tab: 'explore', modalId: null });
  }, [navigateTo]);

  const handleOpenMapModal = useCallback(
    (modalId: string) => {
      navigateTo(
        { stage: 'main', tab: 'explore', modalId },
        { fromModal: true }
      );
    },
    [navigateTo]
  );

  // Directly clear modalId synchronously so X / 返回地圖 / backdrop never stall in iframes or rapid clicks
  const handleCloseMapModal = useCallback(() => {
    const current = routeRef.current;
    if (!current.modalId) return;
    navigateTo({ stage: 'main', tab: current.tab, modalId: null }, { replace: true });
  }, [navigateTo]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // ================= 隱藏的「展覽調整中」頁面（序幕同款夜黑極簡版） =================
  if (isUnderMaintenance) {
    if (showMaintenanceAbout) {
      return (
        <div className="min-h-screen bg-[#FCFAF2] text-[#0C0C0C]">
          <header className="fixed top-0 inset-x-0 z-40 h-16 bg-[#0C0C0C] text-[#FCFAF2] border-b border-[#FCFAF2]/15">
            <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowMaintenanceAbout(false);
                  window.scrollTo({ top: 0 });
                }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.16em] text-[#FFBA84] hover:text-[#FCFAF2] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>返回</span>
              </button>
              <span className="text-xs tracking-[0.2em] text-[#FCFAF2]/60">
                167次<span className="text-[#F05E1C]">-</span>勝興
              </span>
            </div>
          </header>

          <ExhibitionMain
            activeTab="about"
            onSelectTab={() => {}}
            onReplayPrologue={() => {}}
            onOpenTicketMachine={() => {}}
            hasTicket={false}
            activeMapModalId={null}
            onOpenMapModal={() => {}}
            onCloseMapModal={() => {}}
            maintenanceMode={true}
          />
        </div>
      );
    }

    return (
      <main className="min-h-[100dvh] bg-[#0C0C0C] text-[#FCFAF2] flex flex-col items-center justify-center px-6 text-center select-none animate-stage-fade-in">
        <div className="space-y-6">
          <p className="text-xs sm:text-sm tracking-[0.28em] text-[#FFBA84]/85">
            《167次<span className="text-[#F05E1C]">-</span>勝興》
          </p>

          <h1 className="text-2xl sm:text-4xl font-normal tracking-[0.24em] text-[#FCFAF2]">
            展覽調整中
          </h1>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                setShowMaintenanceAbout(true);
                window.scrollTo({ top: 0 });
              }}
              className="min-h-[42px] px-7 py-2 border border-[#FCFAF2]/30 hover:border-[#F05E1C] text-xs sm:text-sm tracking-[0.2em] text-[#FCFAF2]/85 hover:text-[#FFBA84] transition-colors cursor-pointer"
            >
              關於本展
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#0C0C0C]">
      {route.stage === 'prologue' && (
        <PrologueStage
          key={`prologue-${prologueRunId}`}
          onComplete={handlePrologueComplete}
        />
      )}

      {route.stage === 'ticket-machine' && (
        <TicketMachineStage
          onComplete={handleTicketComplete}
          onSkip={handleTicketSkip}
          onReplayPrologue={handleReplayPrologue}
        />
      )}

      {route.stage === 'main' && (
        <>
          <TopNavbar
            activeTab={route.tab}
            onSelectTab={handleSelectTab}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => {
              hasClickedMenuRef.current = true;
              setHasClickedMenu(true);
              setShouldNudgeMenu(false);
              setIsMenuOpen((prev) => !prev);
            }}
            onCloseMenu={() => setIsMenuOpen(false)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReplayPrologue={handleReplayPrologue}
            onOpenTicketMachine={handleOpenTicketMachine}
            shouldNudgeMenu={shouldNudgeMenu && !hasClickedMenu && route.tab === 'explore'}
          />
          <ExhibitionMain
            activeTab={route.tab}
            onSelectTab={handleSelectTab}
            onReplayPrologue={handleReplayPrologue}
            onOpenTicketMachine={handleOpenTicketMachine}
            hasTicket={hasTicket}
            activeMapModalId={route.modalId}
            onOpenMapModal={handleOpenMapModal}
            onCloseMapModal={handleCloseMapModal}
          />
        </>
      )}
    </div>
  );
}
