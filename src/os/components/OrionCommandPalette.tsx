import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useWindowManager, WorkspaceId } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { useAuth } from '../../store/AuthContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer, EntityType } from '../../store/EntityDrawerContext';
import { 
  Search, ChevronRight, Lock, Moon, RotateCcw, 
  Layers, Package, Truck, Users, AlertTriangle, ArrowRight,
  Sparkles, ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Applications' | 'System Commands' | 'Operational Intent' | 'Entities';
  icon: any;
  color: string;
  action: () => void;
  badge?: string;
}

export function OrionCommandPalette() {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    openApplication, 
    focusApplication, 
    windows,
    setWorkspace 
  } = useWindowManager();

  const { triggerLock, triggerSleep, triggerRestart, logout } = useAuth();
  const { suppliers, shipments, products, exceptions } = useSupplyChain();
  const { openEntity } = useEntityDrawer();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Cmd/Ctrl + K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Build Results
  const results = useMemo<SearchResultItem[]>(() => {
    const q = search.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // Helper: Execute and close
    const exec = (fn: () => void) => () => {
      fn();
      setCommandPaletteOpen(false);
    };

    // 1. System Commands
    const systemCommands: SearchResultItem[] = [
      {
        id: 'cmd-lock',
        title: 'Lock ORION',
        subtitle: 'Secure workstation and hide application state',
        category: 'System Commands',
        icon: Lock,
        color: '#38BDF8',
        action: exec(() => triggerLock()),
      },
      {
        id: 'cmd-sleep',
        title: 'Sleep ORION',
        subtitle: 'Enter low-power standby mode',
        category: 'System Commands',
        icon: Moon,
        color: '#818CF8',
        action: exec(() => triggerSleep()),
      },
      {
        id: 'cmd-restart',
        title: 'Restart ORION',
        subtitle: 'Reboot session environment and re-awaken AI core',
        category: 'System Commands',
        icon: RotateCcw,
        color: '#F59E0B',
        action: exec(() => triggerRestart()),
      },
      {
        id: 'cmd-ws-ops',
        title: 'Switch Workspace: Operations',
        subtitle: 'Switch to live supply chain operations view',
        category: 'System Commands',
        icon: Layers,
        color: '#10B981',
        action: exec(() => setWorkspace('operations')),
      },
      {
        id: 'cmd-ws-intel',
        title: 'Switch Workspace: Intelligence',
        subtitle: 'Switch to predictive and deep intelligence models',
        category: 'System Commands',
        icon: Layers,
        color: '#00F2FE',
        action: exec(() => setWorkspace('intelligence')),
      },
      {
        id: 'cmd-ws-ctrl',
        title: 'Switch Workspace: Control',
        subtitle: 'Switch to autonomy, exceptions, and decision policies',
        category: 'System Commands',
        icon: Layers,
        color: '#8B5CF6',
        action: exec(() => setWorkspace('control')),
      },
    ];

    // If query is empty: suggest top apps and essential system commands
    if (!q) {
      // Pinned default apps
      const topAppIds = ['command-center', 'inventory', 'procurement', 'suppliers', 'shipments', 'exceptions', 'approval-center', 'master-data', 'world-model', 'orion-ai'];
      topAppIds.forEach(id => {
        const app = ORION_REGISTRY[id];
        if (app) {
          items.push({
            id: `app-${app.id}`,
            title: app.name,
            subtitle: app.description,
            category: 'Applications',
            icon: app.icon,
            color: app.color,
            badge: windows[app.id] ? 'Open' : undefined,
            action: exec(() => {
              if (windows[app.id]) focusApplication(app.id);
              else openApplication(app.id);
            }),
          });
        }
      });

      // Quick system commands
      items.push(systemCommands[0]); // Lock
      items.push(systemCommands[4]); // Ops WS
      items.push(systemCommands[5]); // Intel WS
      return items;
    }

    // 2. Operational Intent Recognition
    if (q.includes('delayed') || q.includes('late shipment') || q.includes('shipment delay')) {
      items.push({
        id: 'intent-delayed-shipments',
        title: 'Show Delayed Shipments',
        subtitle: 'Open Shipments application filtered to delayed logistics',
        category: 'Operational Intent',
        icon: Truck,
        color: '#F97316',
        badge: 'Intent',
        action: exec(() => openApplication('shipments')),
      });
    }

    if (q.includes('supplier risk') || q.includes('high risk') || q.includes('vendor risk')) {
      items.push({
        id: 'intent-supplier-risk',
        title: 'Inspect Supplier Risk Exposures',
        subtitle: 'Open Risk Radar and Supplier Health intelligence',
        category: 'Operational Intent',
        icon: AlertTriangle,
        color: '#EF4444',
        badge: 'Intent',
        action: exec(() => openApplication('risk-radar')),
      });
    }

    if (q.includes('attention') || q.includes('what needs attention') || q.includes('focus')) {
      items.push({
        id: 'intent-attention',
        title: 'View Prioritized Operational Attention',
        subtitle: 'Review immediate human-in-the-loop bottlenecks',
        category: 'Operational Intent',
        icon: Sparkles,
        color: '#F59E0B',
        badge: 'Intent',
        action: exec(() => openApplication('attention-center')),
      });
    }

    // 3. Search Applications
    Object.values(ORION_REGISTRY).forEach(app => {
      const matchName = app.name.toLowerCase().includes(q);
      const matchDesc = app.description.toLowerCase().includes(q);
      const matchCategory = app.category.toLowerCase().includes(q);

      if (matchName || matchDesc || matchCategory) {
        items.push({
          id: `app-${app.id}`,
          title: app.name,
          subtitle: app.description,
          category: 'Applications',
          icon: app.icon,
          color: app.color,
          badge: windows[app.id] ? 'Open' : undefined,
          action: exec(() => {
            if (windows[app.id]) focusApplication(app.id);
            else openApplication(app.id);
          }),
        });
      }
    });

    // 4. Search System Commands
    systemCommands.forEach(cmd => {
      if (cmd.title.toLowerCase().includes(q) || cmd.subtitle.toLowerCase().includes(q)) {
        items.push(cmd);
      }
    });

    // 5. Deterministic Real Entity Search (Suppliers, Shipments, Products, Exceptions)
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach(s => {
        if (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.region && s.region.toLowerCase().includes(q))) {
          items.push({
            id: `entity-sup-${s.id}`,
            title: s.name,
            subtitle: `Supplier • ID: ${s.id} • Region: ${s.region || 'Global'} • Risk: ${s.riskLevel || 'Normal'}`,
            category: 'Entities',
            icon: Users,
            color: '#3B82F6',
            badge: 'Supplier',
            action: exec(() => openEntity('supplier', s.id)),
          });
        }
      });
    }

    if (shipments && shipments.length > 0) {
      shipments.forEach(shp => {
        const track = (shp.trackingNumber || shp.id).toLowerCase();
        const origin = (shp.origin || '').toLowerCase();
        const dest = (shp.destination || '').toLowerCase();
        if (track.includes(q) || origin.includes(q) || dest.includes(q)) {
          items.push({
            id: `entity-shp-${shp.id}`,
            title: `Shipment ${shp.trackingNumber || shp.id}`,
            subtitle: `${shp.origin || 'Origin'} → ${shp.destination || 'Destination'} • ${shp.status}`,
            category: 'Entities',
            icon: Truck,
            color: '#F97316',
            badge: 'Shipment',
            action: exec(() => openEntity('shipment', shp.id)),
          });
        }
      });
    }

    if (products && products.length > 0) {
      products.forEach(p => {
        if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))) {
          items.push({
            id: `entity-prod-${p.id}`,
            title: p.name,
            subtitle: `SKU: ${p.id} • Category: ${p.category || 'General'}`,
            category: 'Entities',
            icon: Package,
            color: '#10B981',
            badge: 'Product',
            action: exec(() => openEntity('product', p.id)),
          });
        }
      });
    }

    if (exceptions && exceptions.length > 0) {
      exceptions.forEach(exc => {
        if (exc.type.toLowerCase().includes(q) || (exc.description && exc.description.toLowerCase().includes(q)) || exc.entityId.toLowerCase().includes(q)) {
          items.push({
            id: `entity-exc-${exc.id}`,
            title: exc.type,
            subtitle: `${exc.severity} Severity • Entity: ${exc.entityId} • ${exc.description}`,
            category: 'Entities',
            icon: AlertTriangle,
            color: exc.severity === 'Critical' ? '#EF4444' : '#F59E0B',
            badge: 'Exception',
            action: exec(() => openEntity('exception', exc.id)),
          });
        }
      });
    }

    return items.slice(0, 16);
  }, [search, windows, triggerLock, triggerSleep, triggerRestart, logout, setWorkspace, openApplication, focusApplication, openEntity, suppliers, shipments, products, exceptions, setCommandPaletteOpen]);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[12vh] p-4 animate-in fade-in duration-150 select-none"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-os-surface/95 backdrop-blur-2xl border border-os-border rounded-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
          <Search className="w-5 h-5 text-os-accent mr-3.5 shrink-0 drop-shadow-sm" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search applications, entities, or commands (e.g. 'delayed shipments', 'lock', 'inventory')..."
            className="flex-1 bg-transparent border-none outline-none text-os-text-primary font-sans text-base placeholder:text-slate-500"
          />
          <div className="flex items-center gap-1.5 ml-3 text-[11px] text-slate-500 font-mono shrink-0">
            <kbd className="px-1.5 py-0.5 rounded border border-os-border bg-os-surface-hover text-[10px]">ESC</kbd>
            <span className="hidden sm:inline">close</span>
          </div>
        </div>
        
        {/* Results List */}
        <div className="overflow-y-auto py-2 px-2 divide-y divide-white/[0.03]">
          {results.length > 0 ? (
            results.map((item, i) => {
              const Icon = item.icon;
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    "w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all text-left outline-none cursor-pointer",
                    isSelected 
                      ? "bg-white/[0.08] text-os-text-primary shadow-sm ring-1 ring-white/10" 
                      : "hover:bg-white/[0.04] text-os-text-secondary"
                  )}
                >
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center mr-3.5 shrink-0 border border-os-border"
                    style={{ 
                      backgroundColor: `${item.color}15`, 
                      color: item.color,
                      backgroundImage: `linear-gradient(180deg, ${item.color}20 0%, transparent 100%)`
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-os-text-primary truncate">
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider bg-os-surface-active border border-os-border text-os-text-secondary uppercase">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-os-text-muted line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 pl-2 shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline">
                      {item.category}
                    </span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-colors",
                      isSelected ? "text-os-accent" : "text-slate-600"
                    )} />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-os-text-muted text-sm font-medium mb-1">
                No matching applications, entities, or commands found
              </p>
              <p className="text-slate-600 text-xs font-mono">
                Try searching for 'inventory', 'suppliers', 'shipments', 'exceptions', or 'lock'
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-white/[0.05] bg-os-surface-active flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-os-surface-hover border border-os-border text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-os-surface-hover border border-os-border text-[10px]">↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-os-surface-hover border border-os-border text-[10px]">↵</kbd> execute</span>
          </div>
          <span className="text-os-text-muted">ORION Supply Chain Intelligence</span>
        </div>
      </div>
    </div>
  );
}
