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
  const { openApp } = useMobileNavigation();
  const [searchQuery, setSearchQuery] = useState('');

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
      name: 'Platform, Observability & Admin',
      appIds: [
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
    const q = searchQuery.toLowerCase();
    return Object.values(ORION_REGISTRY).filter(app => 
      app.name.toLowerCase().includes(q) || 
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="w-full max-w-full space-y-4 pb-12 select-none">
      {/* 1. APP LAUNCHER SEARCH BAR */}
      <div className="relative sticky top-13 z-20 bg-os-bg/90 backdrop-blur-md pt-1 pb-2">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-os-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 100+ Enterprise Apps..."
            className="w-full bg-os-surface border border-os-border focus:border-os-accent rounded-xl pl-9.5 pr-9 py-2.5 text-xs text-os-text-primary placeholder:text-os-text-muted focus:outline-none min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-os-text-muted hover:text-os-text-primary min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. SEARCH RESULTS VIEW (IF ACTIVE) */}
      {filteredApps !== null ? (
        <div className="space-y-3">
          <div className="text-xs font-mono text-os-text-muted px-1">
            Found {filteredApps.length} applications matching "{searchQuery}"
          </div>

          <div className="grid grid-cols-3 xs:grid-cols-4 gap-3">
            {filteredApps.map(app => (
              <button
                key={app.id}
                onClick={() => openApp(app.id)}
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-os-surface/60 border border-os-border/60 active:scale-95 transition-all text-center group cursor-pointer min-h-[88px]"
              >
                <div className="w-14 h-14 flex items-center justify-center">
                  <OrionAppIcon app={app.id} size={50} active={false} />
                </div>
                <span className="mt-1.5 text-[11px] font-medium text-os-text-primary line-clamp-2 px-0.5 leading-tight">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* 3. CATEGORIZED APP GRID */
        <div className="space-y-6">
          {categories.map(cat => {
            const validApps = cat.appIds
              .map(id => ORION_REGISTRY[id])
              .filter((app): app is OrionApp => Boolean(app));

            if (validApps.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-os-text-muted px-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-os-accent" />
                  <span>{cat.name}</span>
                </div>

                <div className="grid grid-cols-3 xs:grid-cols-4 gap-2.5">
                  {validApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => openApp(app.id)}
                      className="flex flex-col items-center justify-center p-2 rounded-2xl bg-os-surface/40 hover:bg-os-surface border border-os-border hover:border-os-border-strong active:scale-95 transition-all text-center group cursor-pointer min-h-[92px]"
                    >
                      <div className="w-13 h-13 flex items-center justify-center">
                        <OrionAppIcon app={app.id} size={48} active={false} />
                      </div>
                      <span className="mt-1 text-[11px] font-medium text-os-text-primary line-clamp-2 px-0.5 leading-tight">
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
