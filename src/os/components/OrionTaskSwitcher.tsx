import React, { useEffect, useState } from 'react';
import { useWindowManager, AppWindow } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { cn } from '../../lib/utils';
import { X, Layers } from 'lucide-react';

interface OrionTaskSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrionTaskSwitcher({ isOpen, onClose }: OrionTaskSwitcherProps) {
  const { windows, activeAppId, focusApplication, restoreApplication } = useWindowManager();
  
  // Filter running/open windows
  const openWindows = Object.values(windows).filter(w => w.state !== 'closed');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const idx = openWindows.findIndex(w => w.id === activeAppId);
      setSelectedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, activeAppId, openWindows.length]);

  // Keyboard Navigation: Alt+Tab, Escape, Arrow keys, Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, openWindows.length));
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + openWindows.length) % Math.max(1, openWindows.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (openWindows[selectedIndex]) {
          handleSelectWindow(openWindows[selectedIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, openWindows, onClose]);

  if (!isOpen) return null;

  const handleSelectWindow = (id: string) => {
    const win = windows[id];
    if (win) {
      if (win.state === 'minimized') {
        restoreApplication(id);
      } else {
        focusApplication(id);
      }
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[2147483640] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-label="Orion Task Switcher"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#12151a]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)] p-6 overflow-hidden flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="text-[15px] font-semibold text-white tracking-wide">
              Task Switcher
            </h2>
            <span className="text-[11px] font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-md border border-white/[0.08]">
              {openWindows.length} Open {openWindows.length === 1 ? 'App' : 'Apps'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Task Switcher"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {openWindows.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <p className="text-[14px] font-medium text-white">No Open Applications</p>
            <p className="text-[12px] text-slate-400 mt-1">Use the Start Menu or Search to launch an Orion application.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {openWindows.map((win, idx) => {
              const app = ORION_REGISTRY[win.id];
              const isSelected = idx === selectedIndex;
              const isFocused = win.id === activeAppId;
              const isMinimized = win.state === 'minimized';

              return (
                <button
                  key={win.id}
                  onClick={() => handleSelectWindow(win.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer outline-none relative group",
                    isSelected 
                      ? "bg-sky-500/15 border-sky-500/50 shadow-lg shadow-sky-500/10 scale-[1.02]" 
                      : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15]"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <OrionAppIcon app={win.id} size={36} className="transition-transform group-hover:scale-105" />
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md",
                      isMinimized 
                        ? "bg-amber-500/20 text-amber-300" 
                        : isFocused 
                        ? "bg-sky-500/25 text-sky-300 font-semibold"
                        : "bg-white/[0.06] text-slate-300"
                    )}>
                      {isMinimized ? 'Minimized' : isFocused ? 'Active' : 'Running'}
                    </span>
                  </div>

                  <div className="mt-3 w-full min-w-0">
                    <h3 className="text-[13px] font-semibold text-white truncate">
                      {app ? app.name : win.id}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {app ? app.category : 'Application'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[11px] text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-white border border-white/[0.1]">Tab</kbd> to cycle</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-white/[0.08] rounded text-white border border-white/[0.1]">Enter</kbd> to switch</span>
        </div>
      </div>
    </div>
  );
}
