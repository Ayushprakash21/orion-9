/**
 * ORION-9 TABLET ENTERPRISE APP LAUNCHER
 * Structured 3-column tablet application grid with full registry search.
 */

import React, { useState, useMemo } from 'react';
import { ORION_REGISTRY, OrionApp } from '../OrionApplicationRegistry';
import { useTabletNavigation } from './OrionTabletNavigation';
import { useAuth } from '../../store/AuthContext';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { Search, ChevronRight, Sparkles, Layers } from 'lucide-react';

const CATEGORY_NAMES: Record<string, string> = {
  Operations: 'Operations & Execution',
  Intelligence: 'Deep SCM Intelligence',
  Control: 'Control & Governance',
  AI: 'Governed AI & Automation',
  Platform: 'Platform Administration'
};

export const OrionTabletAppLauncher: React.FC = () => {
  const { openApp, openOrionAI } = useTabletNavigation();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = useMemo(() => {
    return Object.values(ORION_REGISTRY).filter(app => {
      // Filter out Platform/Admin apps for non-admins
      if (app.category === 'Platform' && !isAdmin) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        app.name.toLowerCase().includes(query) ||
        (app.description && app.description.toLowerCase().includes(query)) ||
        app.id.toLowerCase().includes(query) ||
        (app.category && app.category.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, isAdmin]);

  const appsByCategory = useMemo(() => {
    const grouped: Record<string, OrionApp[]> = {
      Operations: [],
      Intelligence: [],
      Control: [],
      AI: [],
      Platform: []
    };

    filteredApps.forEach(app => {
      const cat = app.category || 'Operations';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(app);
    });

    return grouped;
  }, [filteredApps]);

  const handleLaunchApp = (appId: string) => {
    if (appId === 'orion-ai' || appId === 'ai-copilot') {
      openOrionAI();
    } else {
      openApp(appId);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* 1. SEARCH BAR */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-os-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search 100+ Enterprise Apps..."
            className="w-full bg-os-surface-secondary border border-os-border focus:border-cyan-400 rounded-xl pl-11 pr-4 py-3 text-sm text-os-text-primary placeholder:text-os-text-muted focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-os-text-muted hover:text-os-text-primary cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 2. CATEGORY SECTIONS */}
      {Object.entries(appsByCategory).map(([catKey, apps]) => {
        if (apps.length === 0) return null;

        return (
          <div key={catKey} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-primary">
                {CATEGORY_NAMES[catKey] || catKey} ({apps.length})
              </h2>
            </div>

            {/* 3-COLUMN TABLET GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {apps.map(app => (
                <div
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id)}
                  className="bg-os-surface hover:bg-os-surface/90 border border-os-border hover:border-cyan-500/40 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer group min-h-[72px]"
                  role="button"
                  aria-label={`Open ${app.name}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-os-surface-secondary border border-os-border/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <OrionAppIcon app={app.id} size={28} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-os-text-primary truncate group-hover:text-cyan-400 transition-colors">
                        {app.name}
                      </h3>
                      <ChevronRight size={14} className="text-os-text-muted group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-[11px] text-os-text-muted truncate mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
