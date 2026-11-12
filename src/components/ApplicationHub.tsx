import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  Search, 
  Filter, 
  Play, 
  Pin, 
  PinOff, 
  CheckCircle2, 
  Shield, 
  Sliders, 
  Layers, 
  Info, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useWindowManager } from '../os/WindowManagerContext';
import { ORION_REGISTRY, OrionApp } from '../os/OrionApplicationRegistry';
import { cn } from '../lib/utils';
import { ORION_OS_METADATA } from '../os/constants/OrionOsMetadata';
import OrionAppIcon from './brand/OrionAppIcon';

export const ApplicationHub: React.FC = () => {
  const { openApplication, windows, dockPinnedApps, pinToDock, unpinFromDock, focusApplication } = useWindowManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(ORION_REGISTRY).forEach((app) => cats.add(app.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const appsList = useMemo(() => {
    return Object.values(ORION_REGISTRY).filter((app) => {
      if (selectedCategory !== 'all' && app.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          app.name.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white select-none overflow-hidden font-sans">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">Orion Application Hub</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-sky-300 font-semibold border border-white/10">
                MODULE CATALOG
              </span>
            </div>
            <div className="text-[11px] text-white/50">Centralized enterprise application directory, lifecycle management, and dock pinning</div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications..."
              className="pl-8 pr-3 py-1 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 w-48"
            />
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.08] bg-[#0d1117] shrink-0 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap",
              selectedCategory === cat
                ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-xs"
                : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Applications Grid */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {appsList.map((app) => {
            const isOpen = !!windows[app.id];
            const isPinned = dockPinnedApps.includes(app.id);

            return (
              <div
                key={app.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 group",
                  isOpen
                    ? "bg-white/[0.04] border-sky-500/40 shadow-sm"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center p-1 shrink-0 shadow-sm">
                        <OrionAppIcon app={app.id} size={32} theme="dark" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">{app.name}</span>
                          {isOpen && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 font-mono uppercase block">{app.category}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => (isPinned ? unpinFromDock(app.id) : pinToDock(app.id))}
                      title={isPinned ? 'Unpin from Dock' : 'Pin to Dock'}
                      className={cn(
                        "p-1.5 rounded-lg border transition-colors cursor-pointer",
                        isPinned
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-white/60 mt-2.5 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-[10px] text-white/40 font-mono">
                    ID: {app.id}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (isOpen) {
                        focusApplication(app.id);
                      } else {
                        openApplication(app.id);
                      }
                    }}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs",
                      isOpen
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isOpen ? 'Focus' : 'Launch'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.08] bg-[#161b22] flex items-center justify-between text-xs text-white/50 shrink-0 font-mono">
        <div>ORION-9 APPLICATION HUB • {appsList.length} REGISTERED ENTERPRISE MODULES</div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Catalog Verified</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHub;
