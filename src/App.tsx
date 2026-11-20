import { useCallback, useEffect, useRef, useState } from 'react';
import { ExhibitionMain } from './components/ExhibitionMain';
import { PrologueStage } from './components/PrologueStage';
import { TicketMachineStage } from './components/TicketMachineStage';
import { TopNavbar } from './components/TopNavbar';
import { ExhibitionTabId } from './data/exhibitionData';
import {
  AppRoute,
  getDocumentTitle,
  INITIAL_ROUTE,
  isSameRoute,
  isValidRoute,
} from './utils/router';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  const [route, setRoute] = useState<AppRoute>(INITIAL_ROUTE);
  const routeRef = useRef<AppRoute>(route);
  routeRef.current = route;
  const closingModalRef = useRef(false);

  const [prologueRunId, setPrologueRunId] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);

  // Sync browser document title whenever route changes
  useEffect(() => {
    document.title = getDocumentTitle(route);
  }, [route]);

  // Anchor initial history entry at prologue & subscribe to browser Back / Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({ route: INITIAL_ROUTE }, '', cleanUrl);

    const handlePopState = (event: PopStateEvent) => {
      closingModalRef.current = false;
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
  }, []);

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

  const handleCloseMapModal = useCallback(() => {
    const current = routeRef.current;
    if (!current.modalId || closingModalRef.current) return;

    // If modal was opened via pushState from the map, pop it so Back/Forward stays clean
    if (typeof window !== 'undefined' && window.history.state?.fromModal) {
      closingModalRef.current = true;
      window.history.back();
      return;
    }

    // Direct-URL entry fallback: replace URL back to #/explore without leaving the site
    navigateTo({ stage: 'main', tab: 'explore', modalId: null }, { replace: true });
  }, [navigateTo]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

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
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onCloseMenu={() => setIsMenuOpen(false)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReplayPrologue={handleReplayPrologue}
            onOpenTicketMachine={handleOpenTicketMachine}
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
