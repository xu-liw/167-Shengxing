import { useEffect, useState } from 'react';
import { Menu, Moon, RotateCcw, Sun, Ticket, Volume2, VolumeX, X } from 'lucide-react';
import { ExhibitionTabId, NAV_ITEMS } from '../data/exhibitionData';
import { soundEngine } from '../utils/soundEngine';

const THEME_STORAGE_KEY = 'shengxing-167-theme';

interface TopNavbarProps {
  activeTab: ExhibitionTabId;
  onSelectTab: (tab: ExhibitionTabId) => void;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onReplayPrologue: () => void;
  onOpenTicketMachine: () => void;
  shouldNudgeMenu?: boolean;
}

export function TopNavbar({
  activeTab,
  onSelectTab,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  isMuted,
  onToggleMute,
  onReplayPrologue,
  onOpenTicketMachine,
  shouldNudgeMenu = false,
}: TopNavbarProps) {
  // 預設為深色模式（dark），並從 localStorage 讀取使用者先前偏好
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore storage access restrictions
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const handleToggleTheme = () => {
    soundEngine.playSelectClick();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, onCloseMenu]);

  const handleNavigate = (tab: ExhibitionTabId) => {
    onSelectTab(tab);
    onCloseMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Fixed 3-Zone Top Navigation Bar */}
      <header className="theme-adaptive fixed top-0 left-0 right-0 z-40 h-16 bg-[#FCFAF2]/95 backdrop-blur-sm border-b border-[#0C0C0C]/12">
        <div className="max-w-[1240px] h-full mx-auto px-4 sm:px-8 grid grid-cols-3 items-center">
          {/* Left Zone: Hamburger Menu Button (with top-right orange dot hint after 1 minute) */}
          <div className="relative flex items-center justify-start">
            <button
              type="button"
              onClick={onToggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="exhibition-nav-drawer"
              aria-label={isMenuOpen ? '關閉導覽選單' : '開啟導覽選單'}
              className="relative inline-flex items-center gap-2.5 min-h-[44px] min-w-[44px] px-2 -ml-2 text-[#0C0C0C] hover:text-[#F05E1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05E1C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="relative inline-flex items-center justify-center">
                {isMenuOpen ? (
                  <X className="w-5 h-5 shrink-0" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5 shrink-0" aria-hidden="true" />
                )}
                {shouldNudgeMenu && !isMenuOpen && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 flex h-2.5 w-2.5"
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05E1C] opacity-80" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05E1C]" />
                  </span>
                )}
              </span>
              <span className="hidden sm:inline text-sm tracking-[0.18em]">選單</span>
            </button>
          </div>

          {/* Center Zone: Centered Brand Title 「167次-勝興」 */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'explore') {
                  onSelectTab('explore');
                }
                window.dispatchEvent(new CustomEvent('center-shengxing'));
              }}
              className="min-h-[44px] px-2 text-lg sm:text-xl tracking-[0.22em] text-[#0C0C0C] hover:text-[#F05E1C] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05E1C]"
              title="回首頁並置中勝興車站"
            >
              167次<span className="text-[#F05E1C]">-</span>勝興
            </button>
          </div>

          {/* Right Zone: Theme Toggle (Dark/Light) & Mute Toggle */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-pressed={theme === 'light'}
              aria-label={theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'}
              title={theme === 'dark' ? '切換為淺色模式' : '切換為深色模式'}
              className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center sm:justify-end px-2 text-[#0C0C0C] hover:text-[#F05E1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05E1C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="hidden md:inline text-sm tracking-[0.14em]">
                {theme === 'dark' ? '深色' : '淺色'}
              </span>
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 text-[#FFBA84]" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 text-[#F05E1C]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={isMuted}
              aria-label={isMuted ? '開啟環境音' : '靜音'}
              className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center sm:justify-end px-2 -mr-2 text-[#0C0C0C] hover:text-[#F05E1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05E1C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="hidden sm:inline text-sm tracking-[0.14em]">
                {isMuted ? '靜音' : '音效'}
              </span>
              {isMuted ? (
                <VolumeX className="w-5 h-5 shrink-0 text-[#0C0C0C]/55" aria-hidden="true" />
              ) : (
                <Volume2 className="w-5 h-5 shrink-0 text-[#F05E1C]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop Overlay for Slide-Out Drawer */}
      <div
        aria-hidden={!isMenuOpen}
        onClick={onCloseMenu}
        className={`fixed inset-0 z-40 bg-[#0C0C0C]/55 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-Out Exhibition Navigation Drawer */}
      <aside
        id="exhibition-nav-drawer"
        aria-label="展覽分頁選單"
        aria-hidden={!isMenuOpen}
        className={`fixed top-0 left-0 bottom-0 z-50 w-full max-w-sm bg-[#0C0C0C] text-[#FCFAF2] flex flex-col justify-between px-7 py-6 shadow-2xl transition-transform duration-300 ease-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[#FCFAF2]/15">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-[#FFBA84]">「回憶舊山線」線上展覽</p>
              <p className="text-lg tracking-[0.2em] mt-0.5 text-[#FCFAF2]">167次-勝興</p>
            </div>
            <button
              type="button"
              onClick={onCloseMenu}
              aria-label="關閉選單"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-[#FCFAF2]/75 hover:text-[#FFBA84] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* 4 Main Exhibition Pages */}
          <nav className="mt-6 flex flex-col">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group text-left py-4 border-b border-[#FCFAF2]/10 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05E1C] ${
                    isActive ? 'text-[#FFBA84]' : 'text-[#FCFAF2]/85 hover:text-[#FCFAF2]'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="flex items-baseline gap-3">
                      <span
                        className={`text-xs font-mono tabular-nums tracking-[0.16em] ${
                          isActive ? 'text-[#F05E1C]' : 'text-[#FCFAF2]/45 group-hover:text-[#FFBA84]'
                        }`}
                      >
                        {item.index}
                      </span>
                      <span className="text-xl tracking-[0.16em]">{item.label}</span>
                    </span>
                    {isActive && (
                      <span className="text-xs tracking-[0.14em] text-[#F05E1C] whitespace-nowrap">
                        當前頁
                      </span>
                    )}
                  </div>
                  <p className="text-xs tracking-[0.08em] text-[#FCFAF2]/55 mt-1.5 pl-7">
                    {item.subtitle}
                  </p>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Utilities: Replay Intro / Ticket Machine */}
        <div className="pt-6 border-t border-[#FCFAF2]/15 space-y-2">
          <p className="text-[11px] tracking-[0.18em] text-[#FCFAF2]/45 mb-2">重溫序曲</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onCloseMenu();
                onReplayPrologue();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs tracking-[0.12em] border border-[#FCFAF2]/20 text-[#FCFAF2]/80 hover:border-[#FFBA84] hover:text-[#FFBA84] transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>開場序幕</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onCloseMenu();
                onOpenTicketMachine();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs tracking-[0.12em] border border-[#FCFAF2]/20 text-[#FCFAF2]/80 hover:border-[#FFBA84] hover:text-[#FFBA84] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Ticket className="w-3.5 h-3.5" aria-hidden="true" />
              <span>售票機</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
