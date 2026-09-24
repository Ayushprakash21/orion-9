import React, { useState } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { 
  Home, 
  LayoutGrid, 
  Search, 
  Sparkles, 
  Layers, 
  Activity,
  MoreHorizontal,
  X,
  ChevronUp
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const OrionMobileNavBar: React.FC = () => {
  const {
    windows,
    activeAppId,
    activeWorkspaceId,
    openApplication,
    focusApplication,
    closeApplication,
    setLauncherOpen,
    setCommandPaletteOpen,
  } = useWindowManager();

  const [activeSwitcherOpen, setActiveSwitcherOpen] = useState(false);

  // Active open applications
  const openWindowsList = Object.values(windows).filter(
    w => w.id !== 'orion-ai' && w.state !== 'closed' && w.workspace === activeWorkspaceId
  );

  const activeApp = activeAppId ? ORION_REGISTRY[activeAppId] : null;

  return (
    <>
      {/* Active App Quick Switcher Modal (Mobile) */}
      {activeSwitcherOpen && (
        <div 
          className="fixed inset-0 z-[2147483500] bg-black/70 backdrop-blur-md flex flex-col justify-end p-4 pb-20 animate-in fade-in select-none"
          onClick={() => setActiveSwitcherOpen(false)}
        >
          <div 
            className="w-full max-w-md mx-auto bg-os-surface/95 border border-os-border rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-os-border">
              <span className="text-xs font-mono uppercase tracking-wider text-os-text-primary font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-os-accent" />
                Active Tasks & Tools ({openWindowsList.length})
              </span>
              <button 
                type="button"
                onClick={() => setActiveSwitcherOpen(false)}
                className="p-1 rounded-md text-os-text-muted hover:text-os-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions in More drawer */}
            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSwitcherOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-os-surface-hover/80 border border-os-border text-xs font-medium text-os-text-primary hover:bg-os-surface-active cursor-pointer"
              >
                <Search className="w-4 h-4 text-os-accent" />
                Search & Palette
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSwitcherOpen(false);
                  openApplication('settings');
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-os-surface-hover/80 border border-os-border text-xs font-medium text-os-text-primary hover:bg-os-surface-active cursor-pointer"
              >
                <Activity className="w-4 h-4 text-os-accent" />
                System Settings
              </button>
            </div>

            {openWindowsList.length === 0 ? (
              <div className="py-4 text-center text-xs text-os-text-muted">
                No active background applications
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 py-1 custom-scrollbar">
                {openWindowsList.map(win => {
                  const app = ORION_REGISTRY[win.id];
                  if (!app) return null;
                  const isActive = win.id === activeAppId;

                  return (
                    <div 
                      key={`switcher-${win.id}`}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer",
                        isActive 
                          ? "bg-os-accent/15 border-os-accent/50 text-os-text-primary" 
                          : "bg-os-surface-hover/50 border-os-border text-os-text-secondary hover:bg-os-surface-hover"
                      )}
                      onClick={() => {
                        focusApplication(win.id);
                        setActiveSwitcherOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <OrionAppIcon app={win.id} size={32} />
                        <div className="truncate">
                          <div className="text-xs font-medium text-os-text-primary truncate">{app.name}</div>
                          <div className="text-[10px] text-os-text-muted truncate">{app.category}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeApplication(win.id);
                        }}
                        className="p-1.5 text-os-text-muted hover:text-red-400 rounded-md transition-colors"
                        title="Close App"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent Bottom Mobile Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="orion-mobile-bottom-bar fixed bottom-0 left-0 right-0 z-[2147483400] h-14 bg-[#080A0E]/95 backdrop-blur-xl border-t border-os-border/80 flex items-center justify-around px-2 text-os-text-secondary select-none pointer-events-auto md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => {
            if (activeAppId) {
              focusApplication('');
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center min-w-[54px] h-full py-1 gap-1 text-[10px] font-medium transition-colors cursor-pointer",
            !activeAppId ? "text-os-accent font-semibold" : "text-os-text-muted hover:text-os-text-primary"
          )}
          title="Home Desktop"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        {/* 2. Apps (103 Launcher) */}
        <button
          type="button"
          onClick={() => setLauncherOpen(true)}
          className="flex flex-col items-center justify-center min-w-[54px] h-full py-1 gap-1 text-[10px] font-medium text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer"
          title="All Applications (103)"
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Apps</span>
        </button>

        {/* 3. Control (Control Tower / Command Center) */}
        <button
          type="button"
          onClick={() => openApplication('command-center')}
          className={cn(
            "flex flex-col items-center justify-center min-w-[54px] h-full py-1 gap-1 text-[10px] font-medium transition-colors cursor-pointer",
            activeAppId === 'command-center' ? "text-os-accent font-semibold" : "text-os-text-muted hover:text-os-text-primary"
          )}
          title="Control Tower"
        >
          <Activity className="w-5 h-5" />
          <span>Control</span>
        </button>

        {/* 4. AI (Orion AI Copilot) */}
        <button
          type="button"
          onClick={() => openApplication('ai-copilot')}
          data-testid="orion-mobile-copilot-button"
          aria-label="Open Orion AI Copilot"
          className={cn(
            "flex flex-col items-center justify-center min-w-[54px] h-full py-1 gap-1 text-[10px] font-medium transition-colors cursor-pointer",
            activeAppId === 'orion-ai' ? "text-os-accent font-semibold" : "text-os-text-muted hover:text-os-text-primary"
          )}
          title="Orion AI Copilot"
        >
          <Sparkles className="w-5 h-5" />
          <span>AI</span>
        </button>

        {/* 5. More (Search, Tasks, & Settings) */}
        <button
          type="button"
          onClick={() => setActiveSwitcherOpen(!activeSwitcherOpen)}
          className={cn(
            "relative flex flex-col items-center justify-center min-w-[54px] h-full py-1 gap-1 text-[10px] font-medium transition-colors cursor-pointer",
            activeSwitcherOpen ? "text-os-accent" : "text-os-text-muted hover:text-os-text-primary"
          )}
          title="More & Tasks"
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {openWindowsList.length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-os-accent text-black font-bold text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {openWindowsList.length}
              </span>
            )}
          </div>
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
