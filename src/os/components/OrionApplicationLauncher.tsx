import React, { useState, useEffect, useRef } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY} from '../OrionApplicationRegistry';
import { Search, X, Play, Square, Grid2X2, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrionContextMenu } from '../contextMenu/OrionContextMenuContext';
import { useAuth } from '../../store/AuthContext';
import OrionAppIcon from '../../components/brand/OrionAppIcon';

export function OrionApplicationLauncher() {
  const { launcherOpen, setLauncherOpen, openApplication, focusApplication, windows, dockPinnedApps, pinToDock, unpinFromDock } = useWindowManager();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try { return (localStorage.getItem('orion.launcher.viewMode') as 'list' | 'grid') || 'list'; } catch { return 'list'; }
  });

  useEffect(() => {
    try { localStorage.setItem('orion.launcher.viewMode', viewMode); } catch {}
  }, [viewMode]);
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

  // User launcher exposes the User Manual only to standard users. Admins use the dedicated Admin Manual in the Admin Console.
  const apps = Object.values(ORION_REGISTRY).filter(app => !(app.id === 'user-manual' && isAdmin));
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
      className="fixed inset-0 z-[2147483620] flex items-end justify-center pointer-events-auto"
      onClick={() => setLauncherOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" />
      
      <div 
        ref={containerRef}
        className="relative w-[calc(100%-16px)] sm:w-full max-w-3xl max-h-[82vh] mb-16 md:mb-20 flex flex-col bg-[#12151a]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-6 duration-200"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Application Launcher"
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.08] shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search applications, modules, intelligence..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 focus:bg-white/[0.08] transition-all"
              onKeyDown={e => {
                if (e.key === 'Enter' && filteredApps.length > 0) {
                  handleOpen(filteredApps[0].id);
                }
              }}
            />
          </div>
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.04] p-0.5 shrink-0" role="group" aria-label="Application view">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-colors cursor-pointer", viewMode === 'list' ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white")}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-colors cursor-pointer", viewMode === 'grid' ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white")}
              title="Grid view"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setLauncherOpen(false)}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 scroll-smooth">
          {search ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredApps.map(app => (
                  <AppGridCard key={app.id} app={app} onClick={() => handleOpen(app.id)} isPinned={dockPinnedApps.includes(app.id)} pinToDock={() => pinToDock(app.id)} unpinFromDock={() => unpinFromDock(app.id)} isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredApps.map(app => <AppRow key={app.id} app={app} onClick={() => handleOpen(app.id)} isPinned={dockPinnedApps.includes(app.id)} pinToDock={() => pinToDock(app.id)} unpinFromDock={() => unpinFromDock(app.id)} isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} />)}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-6 pb-6">
              {categories.map(category => {
                const categoryApps = apps.filter(a => a.category === category);
                if (categoryApps.length === 0) return null;
                return (
                  <div key={category} className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-1">{category}</h3>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                        {categoryApps.map(app => <AppGridCard key={app.id} app={app} onClick={() => handleOpen(app.id)} isPinned={dockPinnedApps.includes(app.id)} pinToDock={() => pinToDock(app.id)} unpinFromDock={() => unpinFromDock(app.id)} isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} />)}
                      </div>
                    ) : categoryApps.map(app => <AppRow key={app.id} app={app} onClick={() => handleOpen(app.id)} isPinned={dockPinnedApps.includes(app.id)} pinToDock={() => pinToDock(app.id)} unpinFromDock={() => unpinFromDock(app.id)} isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} />)}
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
  app: any;
  onClick: () => void;
  isPinned: boolean;
  pinToDock: () => void;
  unpinFromDock: () => void;
  isOpen: boolean;
}

function AppGridCard({ app, onClick, isPinned, pinToDock, unpinFromDock, isOpen }: AppRowProps) {
  const { openContextMenu } = useOrionContextMenu();
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    openContextMenu({ x: e.clientX, y: e.clientY, targetType: 'dock', targetId: app.id, items: [
      { id: 'open', label: 'Open Application', icon: Play, action: onClick },
      { id: 'pin', label: isPinned ? 'Remove from Dock' : 'Pin to Dock', icon: Square, action: isPinned ? unpinFromDock : pinToDock }
    ]});
  };
  return (
    <button type="button" onClick={onClick} onContextMenu={handleContextMenu} className="min-h-[114px] rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left hover:bg-white/[0.07] hover:border-white/[0.15] transition-all outline-none group cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <OrionAppIcon app={app.id} size={38} className="transition-transform duration-200 group-hover:scale-105" />
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", isOpen ? "bg-sky-500/20 text-sky-300" : "text-slate-400 bg-white/[0.04]")}>{isOpen ? 'Running' : 'Open'}</span>
      </div>
      <div className="mt-2.5 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">{app.name}</div>
        <div className="text-[11px] leading-relaxed text-slate-400 line-clamp-2 mt-0.5">{app.description}</div>
      </div>
    </button>
  );
}

function AppRow({ app, onClick, isPinned, pinToDock, unpinFromDock, isOpen }: AppRowProps) {
  const { openContextMenu } = useOrionContextMenu();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: app.id,
      items: [
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
    ]});
  };

  return (
    <button 
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className="flex items-center gap-3.5 group outline-none w-full px-3 py-2.5 hover:bg-white/[0.06] focus:bg-white/[0.08] rounded-xl transition-all duration-150 cursor-pointer text-left"
    >
      <OrionAppIcon app={app.id} size={36} className="transition-transform duration-200 group-hover:scale-105" />
      
      <div className="flex flex-col items-start min-w-0 flex-1 text-left">
        <span className="text-[13px] font-semibold text-white group-hover:text-white transition-colors truncate w-full">
          {app.name}
        </span>
        <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors truncate w-full">
          {app.description}
        </span>
      </div>

      <div className="shrink-0 flex items-center pr-1">
        <span className={cn(
          "text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-md transition-colors",
          isOpen ? "text-sky-300 bg-sky-500/20" : "text-slate-400 group-hover:text-slate-200"
        )}>
          {isOpen ? 'Running' : 'Open'}
        </span>
      </div>
    </button>
  );
}
