import React, { useState, useMemo } from 'react';
import { useMobileNavigation } from './OrionMobileNavigation';
import { ORION_REGISTRY, OrionApp } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { Search, X, LayoutGrid } from 'lucide-react';

interface CategoryGroup {
  id: string;
  name: string;
  appIds: string[];
}

export const OrionMobileAppLauncher: React.FC = () => {
  const { openApp, openOrionAI } = useMobileNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLaunchApp = (appId: string) => {
    if (appId === 'orion-ai' || appId === 'ai-copilot') {
      openOrionAI();
    } else {
      openApp(appId);
    }
  };

  // Structured categories matching Orion-9 enterprise domains
  const categories: CategoryGroup[] = [
    {
      id: 'operations',
      name: 'Operations & Execution',
      appIds: [
        'command-center',
        'inventory',
        'procurement',
        'suppliers',
        'shipments',
        'inbound',
        'outbound',
        'warehouse-opt',
        'manufacturing',
        'returns',
        'atp-center',
        'delivery-pod'
      ]
    },
    {
      id: 'intelligence',
      name: 'Deep SCM Intelligence',
      appIds: [
        'decision-center',
        'orion-intelligence',
        'digital-twin',
        'scenarios',
        'predictions',
        'demand-forecasting',
        'inventory-optimization',
        'risk-radar',
        'cost-optimizer',
        'world-model',
        'causal-intelligence',
        'counterfactual'
      ]
    },
    {
      id: 'ai',
      name: 'Governed AI & Automation',
      appIds: [
        'orion-ai',
        'autopilot',
        'workflow-builder',
        'action-center',
        'decision-dna',
        'human-ai',
        'ai-workforce',
        'autonomy'
      ]
    },
    {
      id: 'finance',
      name: 'Finance & Trade',
      appIds: [
        'working-capital',
        'finance-matching',
        'finance-ledger',
        'customs-trade',
        'contract-intel',
        'decision-economics'
      ]
    },
    {
      id: 'platform',
      name: 'Platform, Workspace & Admin',
      appIds: [
        'file-manager',
        'notepad',
        'orion-computer',
        'observability',
        'data-quality',
        'data-center',
        'integrations',
        'reports',
        'sync',
        'control-center',
        'operations-center',
        'incident-center',
        'settings',
        'user-manual'
      ]
    }
  ];

  // Filter apps based on search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return Object.values(ORION_REGISTRY).filter(app => 
      app.name.toLowerCase().includes(q) || 
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      app.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalAppCount = Object.keys(ORION_REGISTRY).length;

  return (
    <div className="w-full max-w-full space-y-4 pb-16 select-none box-border">
      {/* 1. DEDICATED APPS LAUNCHER HEADER & SEARCH BAR */}
      <div className="w-full max-w-full space-y-3 pt-1 pb-1 box-border">
        {/* Launcher Identity & Metadata Header */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <LayoutGrid size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-mono font-bold text-os-text-primary tracking-wide uppercase truncate">
                Enterprise Apps
              </h2>
              <p className="text-[10px] font-mono text-os-text-muted truncate">
                100+ SCM Applications & Workspaces
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-os-surface-secondary border border-os-border text-cyan-400/90 font-semibold shrink-0">
            {`${totalAppCount} APPS`}
          </span>
        </div>

        {/* Mobile Search Bar Container */}
        <div className="relative w-full max-w-full box-border">
          <div className="relative flex items-center w-full min-w-0 max-w-full">
            <Search 
              size={18} 
              className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-os-text-muted pointer-events-none shrink-0" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enterprise apps..."
              className="w-full min-w-0 max-w-full h-[48px] min-h-[48px] bg-os-surface border border-os-border focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 rounded-[14px] sm:rounded-[16px] pl-11 pr-10 py-2.5 text-xs sm:text-sm text-os-text-primary placeholder:text-os-text-muted placeholder:truncate focus:outline-none transition-all shadow-inner box-border"
              aria-label="Search Enterprise Apps"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-os-text-muted hover:text-os-text-primary active:scale-95 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer rounded-lg hover:bg-os-surface-hover"
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SEARCH RESULTS VIEW (IF ACTIVE) */}
      {filteredApps !== null ? (
        <div className="space-y-3 w-full max-w-full box-border">
          <div className="text-xs font-mono text-os-text-muted px-0.5">
            Found {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </div>

          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 w-full max-w-full box-border">
              {filteredApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl bg-os-surface/60 border border-os-border/60 hover:border-cyan-500/40 active:scale-95 transition-all text-center group cursor-pointer min-h-[92px] w-full min-w-0 box-border"
                >
                  <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
                    <OrionAppIcon app={app.id} size={46} active={false} />
                  </div>
                  <span className="mt-1 text-[11px] font-medium text-os-text-primary line-clamp-2 px-0.5 leading-tight w-full">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full max-w-full py-10 px-4 rounded-2xl bg-os-surface/40 border border-os-border text-center space-y-2 select-none box-border">
              <div className="w-10 h-10 rounded-full bg-os-surface-hover flex items-center justify-center mx-auto text-os-text-muted">
                <Search size={20} />
              </div>
              <h3 className="text-xs font-mono font-bold text-os-text-primary">
                No applications found
              </h3>
              <p className="text-[11px] font-mono text-os-text-muted max-w-xs mx-auto">
                No matching apps found for "{searchQuery}". Try searching for another keyword or clear the search.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Clear Search</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 3. CATEGORIZED APP GRID */
        <div className="space-y-6 w-full max-w-full box-border">
          {categories.map(cat => {
            const validApps = cat.appIds
              .map(id => ORION_REGISTRY[id])
              .filter((app): app is OrionApp => Boolean(app));

            if (validApps.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2.5 w-full max-w-full box-border">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-muted px-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-os-accent shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 w-full max-w-full box-border">
                  {validApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => handleLaunchApp(app.id)}
                      className="flex flex-col items-center justify-center p-2 rounded-2xl bg-os-surface/40 hover:bg-os-surface border border-os-border hover:border-os-border-strong active:scale-95 transition-all text-center group cursor-pointer min-h-[92px] w-full min-w-0 box-border"
                    >
                      <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
                        <OrionAppIcon app={app.id} size={46} active={false} />
                      </div>
                      <span className="mt-1 text-[11px] font-medium text-os-text-primary line-clamp-2 px-0.5 leading-tight w-full">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
