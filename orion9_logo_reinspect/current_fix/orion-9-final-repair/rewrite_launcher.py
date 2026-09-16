with open('src/os/components/OrionApplicationLauncher.tsx', 'r') as f:
    content = f.read()

new_content = """import React, { useState, useEffect, useRef } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY, OrionApplication } from '../OrionApplicationRegistry';
import { Search, X, Play, Square, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';

export function OrionApplicationLauncher() {
  const { launcherOpen, setLauncherOpen, openApplication, focusApplication, windows, dockPinnedApps, pinToDock, unpinFromDock } = useWindowManager();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (launcherOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (!launcherOpen) {
      setSearch('');
    }
  }, [launcherOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (launcherOpen && e.key === 'Escape') {
        setLauncherOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [launcherOpen, setLauncherOpen]);

  if (!launcherOpen) return null;

  const apps = Object.values(ORION_REGISTRY);
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.description.toLowerCase().includes(search.toLowerCase()) ||
    app.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['Operations', 'Intelligence', 'Control', 'AI', 'Platform', 'Administration'];

  const handleOpen = (id: string) => {
    if (windows[id] && windows[id].state !== 'closed') {
      focusApplication(id);
    } else {
      openApplication(id);
    }
    setLauncherOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-auto"
      onClick={() => setLauncherOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" />
      
      <div 
        ref={containerRef}
        className="relative w-full max-w-3xl max-h-[85vh] mb-20 flex flex-col bg-[#05070D]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Application Launcher"
      >
        <div className="flex items-center p-4 border-b border-white/10 shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F2FE]/50 focus:bg-white/10 transition-all font-sans"
              onKeyDown={e => {
                if (e.key === 'Enter' && filteredApps.length > 0) {
                  handleOpen(filteredApps[0].id);
                }
              }}
            />
          </div>
          <button 
            onClick={() => setLauncherOpen(false)}
            className="ml-3 p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 scroll-smooth">
          {search ? (
            <div className="flex flex-col gap-1">
              {filteredApps.map(app => (
                <AppRow 
                  key={app.id} 
                  app={app} 
                  onClick={() => handleOpen(app.id)} 
                  isPinned={dockPinnedApps.includes(app.id)}
                  pinToDock={() => pinToDock(app.id)}
                  unpinFromDock={() => unpinFromDock(app.id)}
                  isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-8">
              {categories.map(category => {
                const categoryApps = apps.filter(a => a.category === category);
                if (categoryApps.length === 0) return null;
                return (
                  <div key={category} className="flex flex-col gap-1">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-2 px-3">{category}</h3>
                    {categoryApps.map(app => (
                      <AppRow 
                        key={app.id} 
                        app={app} 
                        onClick={() => handleOpen(app.id)} 
                        isPinned={dockPinnedApps.includes(app.id)}
                        pinToDock={() => pinToDock(app.id)}
                        unpinFromDock={() => unpinFromDock(app.id)}
                        isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AppRowProps {
  app: OrionApplication;
  onClick: () => void;
  isPinned: boolean;
  pinToDock: () => void;
  unpinFromDock: () => void;
  isOpen: boolean;
}

function AppRow({ app, onClick, isPinned, pinToDock, unpinFromDock, isOpen }: AppRowProps) {
  const { openContextMenu } = useOrionContextMenu();
  const Icon = app.icon;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    openContextMenu(e, [
      {
        id: 'open',
        label: 'Open Application',
        icon: Play,
        action: onClick,
      },
      {
        id: 'pin',
        label: isPinned ? 'Remove from Dock' : 'Pin to Dock',
        icon: Square,
        action: isPinned ? unpinFromDock : pinToDock,
      }
    ]);
  };

  return (
    <button 
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className="flex items-center gap-4 group outline-none w-full px-3 py-2.5 hover:bg-white/5 focus:bg-white/5 rounded-xl transition-all duration-200"
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(0,242,254,0.15)]"
        style={{ 
          backgroundColor: `${app.color}15`, 
          border: `1px solid ${app.color}30`
        }}
      >
        <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", app.id === 'command-center' && 'group-hover:animate-pulse')} style={{ color: app.color }} />
      </div>
      
      <div className="flex flex-col items-start min-w-0 flex-1 text-left">
        <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate w-full">
          {app.name}
        </span>
        <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors truncate w-full">
          {app.description}
        </span>
      </div>

      <div className="shrink-0 flex items-center pr-2">
        <span className={cn(
          "text-[10px] font-mono tracking-wider px-2 py-1 rounded transition-colors uppercase",
          isOpen ? "text-[#00F2FE] bg-[#00F2FE]/10" : "text-slate-500 group-hover:text-slate-300"
        )}>
          {isOpen ? 'Running' : 'Open'}
        </span>
      </div>
    </button>
  );
}
"""

with open('src/os/components/OrionApplicationLauncher.tsx', 'w') as f:
    f.write(new_content)
