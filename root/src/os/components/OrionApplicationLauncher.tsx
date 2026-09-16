import React, { useState, useEffect, useRef } from 'react';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY} from '../OrionApplicationRegistry';
import { Search, X, Play, Square, Circle, Activity, Home, BrainCircuit, Globe2, Target, FlaskConical, Bot, PlugZap, Dna, WalletCards, Network, Repeat2, ShieldCheck, LineChart, Sparkles, History, BookOpen } from 'lucide-react';
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

  // Curated operating-system navigation: the capability map is intentionally
  // task-oriented so users can reach the flagship ORION-9 experiences without
  // having to know the underlying component/module names.
  const navigationGroups = [
    {
      title: 'Command',
      items: [
        ['Mission Control', 'command-center', Home],
        ['Ask ORION', 'orion-ai', Sparkles],
        ['Decision Center', 'decisions', Target],
        ['Decision History', 'decision-replay', History],
      ],
    },
    {
      title: 'Intelligence',
      items: [
        ['Digital Twin', 'digital-twin', Globe2],
        ['Event Fabric', 'event-fabric', Activity],
        ['AI Workforce', 'intelligence-center', Bot],
        ['Risk Graph', 'network-intelligence', Network],
        ['Learning Loop', 'outcomes', LineChart],
      ],
    },
    {
      title: 'Planning',
      items: [
        ['Scenario Lab', 'scenarios', FlaskConical],
        ['Demand Planning', 'demand-forecasting', LineChart],
        ['Inventory Intelligence', 'inventory-optimization', Dna],
        ['Financial Intelligence', 'decision-economics', WalletCards],
      ],
    },
    {
      title: 'Execution',
      items: [
        ['Autonomous Operations', 'autonomous-operations', Sparkles],
        ['Autopilot', 'autopilot', Repeat2],
        ['Integrations', 'integrations', PlugZap],
        ['AI Governance', 'policies', ShieldCheck],
        ['Human-AI Teaming', 'human-ai', Bot],
      ],
    },
  ];


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
        className="relative w-full max-w-3xl max-h-[85vh] mb-20 flex flex-col bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-8 duration-200"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Application Launcher"
      >
        <div className="flex items-center p-4 border-b border-os-border shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-os-surface-hover border border-os-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-os-text-primary placeholder:text-slate-500 focus:outline-none focus:border-[#00F2FE]/50 focus:bg-os-surface-active transition-all font-sans"
              onKeyDown={e => {
                if (e.key === 'Enter' && filteredApps.length > 0) {
                  handleOpen(filteredApps[0].id);
                }
              }}
            />
          </div>
          <button 
            onClick={() => setLauncherOpen(false)}
            className="ml-3 p-2 rounded-lg hover:bg-os-surface-active text-os-text-primary/70 hover:text-os-text-primary transition-colors border border-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 scroll-smooth">
          {!search && (
            <section className="mb-7 rounded-2xl border border-os-accent/15 bg-os-accent/[0.025] p-3 sm:p-4" aria-label="ORION navigation">
              <div className="flex items-center justify-between gap-3 px-1 mb-3">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.2em] text-os-accent uppercase">ORION Navigation</div>
                  <div className="text-[11px] text-os-text-muted mt-1">Flagship operating paths</div>
                </div>
                <BookOpen size={15} className="text-os-text-muted" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {navigationGroups.map(group => (
                  <div key={group.title} className="rounded-xl border border-os-border/80 bg-black/20 p-2.5">
                    <div className="px-2 pb-1.5 text-[9px] font-bold tracking-[0.18em] text-slate-500 uppercase">{group.title}</div>
                    <div className="grid grid-cols-1 gap-1">
                      {group.items.map(([label, id, Icon]: any) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleOpen(id)}
                          className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left hover:bg-os-surface-hover focus:bg-os-surface-hover transition-colors"
                        >
                          <Icon size={15} className="text-os-accent shrink-0" />
                          <span className="text-xs font-medium text-os-text-primary truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
  app: any;
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
      className="flex items-center gap-4 group outline-none w-full px-3 py-2.5 hover:bg-os-surface-hover focus:bg-os-surface-hover rounded-xl transition-all duration-200"
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
        <span className="text-sm font-semibold text-os-text-primary group-hover:text-os-text-primary transition-colors truncate w-full">
          {app.name}
        </span>
        <span className="text-[11px] text-slate-500 group-hover:text-os-text-muted transition-colors truncate w-full">
          {app.description}
        </span>
      </div>

      <div className="shrink-0 flex items-center pr-2">
        <span className={cn(
          "text-[10px] font-mono tracking-wider px-2 py-1 rounded transition-colors uppercase",
          isOpen ? "text-os-accent bg-os-accent/10" : "text-slate-500 group-hover:text-os-text-secondary"
        )}>
          {isOpen ? 'Running' : 'Open'}
        </span>
      </div>
    </button>
  );
}
