import { useCallback, useEffect, useState } from 'react';
import { ExhibitionMain } from './components/ExhibitionMain';
import { PrologueStage } from './components/PrologueStage';
import { TicketMachineStage } from './components/TicketMachineStage';
import { TopNavbar } from './components/TopNavbar';
import { ExhibitionTabId } from './data/exhibitionData';
import { soundEngine } from './utils/soundEngine';

type ExhibitionStage = 'prologue' | 'ticket-machine' | 'main';

export default function App() {
  const [stage, setStage] = useState<ExhibitionStage>('prologue');
  const [prologueRunId, setPrologueRunId] = useState(0);
  const [activeTab, setActiveTab] = useState<ExhibitionTabId>('explore');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    return () => {
      soundEngine.dispose();
    };
  }, []);

  const handlePrologueComplete = useCallback(() => {
    setStage('ticket-machine');
  }, []);

  const handleTicketComplete = useCallback(() => {
    setActiveTab('explore');
    setStage('main');
    window.scrollTo({ top: 0 });
  }, []);

  const handleReplayPrologue = useCallback(() => {
    setIsMenuOpen(false);
    setPrologueRunId((prev) => prev + 1);
    setStage('prologue');
  }, []);

  const handleOpenTicketMachine = useCallback(() => {
    setIsMenuOpen(false);
    setStage('ticket-machine');
    window.scrollTo({ top: 0 });
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#0C0C0C]">
      {stage === 'prologue' && (
        <PrologueStage
          key={`prologue-${prologueRunId}`}
          onComplete={handlePrologueComplete}
        />
      )}

      {stage === 'ticket-machine' && (
        <TicketMachineStage
          onComplete={handleTicketComplete}
          onReplayPrologue={handleReplayPrologue}
        />
      )}

      {stage === 'main' && (
        <>
          <TopNavbar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onCloseMenu={() => setIsMenuOpen(false)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReplayPrologue={handleReplayPrologue}
            onOpenTicketMachine={handleOpenTicketMachine}
          />
          <ExhibitionMain
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onReplayPrologue={handleReplayPrologue}
            onOpenTicketMachine={handleOpenTicketMachine}
          />
        </>
      )}
    </div>
  );
}
