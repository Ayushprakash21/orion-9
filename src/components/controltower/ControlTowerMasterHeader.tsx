import React, { useState } from 'react';
import { 
  Network, 
  Clock, 
  Zap, 
  Search, 
  RefreshCw, 
  Layers, 
  Box, 
  TrendingUp, 
  Target, 
  Truck, 
  ShieldAlert, 
  Factory, 
  DollarSign, 
  BrainCircuit, 
  Compass, 
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { TruthfulConnectionState } from '../../core/visualization';

export type ControlTowerPrimaryView =
  | 'executive'
  | 'network'
  | 'inventory'
  | 'demand-supply'
  | 'procurement'
  | 'orders'
  | 'logistics'
  | 'risks'
  | 'suppliers'
  | 'finance'
  | 'ai-decisions';

export interface GlobalFilterState {
  timeRange: '7D' | '14D' | '30D' | '90D';
  location: string; // 'ALL' or warehouse/city name
  supplier: string; // 'ALL' or supplier name
  sku: string; // 'ALL' or sku
  riskLevel: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

interface ControlTowerMasterHeaderProps {
  activeView: ControlTowerPrimaryView;
  onViewChange: (view: ControlTowerPrimaryView) => void;
  connectionStatus: TruthfulConnectionState;
  onRefresh: () => void;
  onInspectSystemStatus: () => void;
  isLoading: boolean;
  filters: GlobalFilterState;
  onFiltersChange: (filters: Partial<GlobalFilterState>) => void;
  locationOptions: string[];
  supplierOptions: string[];
  dataMode: 'live' | 'demo';
}

export const ControlTowerMasterHeader: React.FC<ControlTowerMasterHeaderProps> = ({
  activeView,
  onViewChange,
  connectionStatus,
  onRefresh,
  onInspectSystemStatus,
  isLoading,
  filters,
  onFiltersChange,
  locationOptions,
  supplierOptions,
  dataMode,
}) => {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-os-border/70 select-none">
      {/* TOP ROW: TITLE, ENV, SEARCH, SYNC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-os-surface-elevated border border-os-border text-cyan-400 font-mono font-bold text-sm shadow-xs">
            C3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-os-text-primary tracking-tight">
                Orion Control Tower
              </h1>
              <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                dataMode === 'live' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {dataMode === 'live' ? 'LIVE DATA' : 'DEMO MODE'}
              </span>
            </div>
            <p className="text-[11px] text-os-text-muted font-mono flex items-center gap-1.5">
              <span>Operating Command Center for Autonomous SCM</span>
            </p>
          </div>
        </div>

        {/* Global Filter Pills & Sync */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-os-surface border border-os-border text-xs font-mono">
            {(['7D', '14D', '30D', '90D'] as const).map((r) => (
              <button
                key={r}
                onClick={() => onFiltersChange({ timeRange: r })}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  filters.timeRange === r
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'text-os-text-muted hover:text-os-text-primary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Quick Filter: Location */}
          <select
            value={filters.location}
            onChange={(e) => onFiltersChange({ location: e.target.value })}
            className="bg-os-surface border border-os-border rounded-lg px-2 py-1 text-xs text-os-text-secondary focus:outline-hidden focus:border-cyan-500/50"
          >
            <option value="ALL">All Facilities</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Quick Filter: Supplier */}
          <select
            value={filters.supplier}
            onChange={(e) => onFiltersChange({ supplier: e.target.value })}
            className="bg-os-surface border border-os-border rounded-lg px-2 py-1 text-xs text-os-text-secondary focus:outline-hidden focus:border-cyan-500/50"
          >
            <option value="ALL">All Suppliers</option>
            {supplierOptions.map((supp) => (
              <option key={supp} value={supp}>{supp}</option>
            ))}
          </select>

          {/* Connection Fabric Indicator */}
          <button
            onClick={onInspectSystemStatus}
            title="Inspect Orion System Health Fabric"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border hover:brightness-110 cursor-pointer transition-all ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                : connectionStatus === 'LOADING'
                ? 'bg-blue-950/70 text-blue-400 border-blue-500/40'
                : connectionStatus === 'STALE'
                ? 'bg-purple-950/70 text-purple-400 border-purple-500/40'
                : 'bg-os-surface text-os-text-muted border-os-border'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'LOADING'
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="uppercase text-[10px] tracking-wider">{connectionStatus}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Telemetry Refresh"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-os-border hover:bg-os-surface-hover text-xs text-os-text-secondary transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline text-[11px]">Sync</span>
          </button>
        </div>
      </div>

      {/* BOTTOM ROW: PRIMARY 11 VIEWS SELECTOR */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-os-border/50 pt-2 custom-scrollbar">
        {[
          { id: 'executive', label: 'Executive Overview', icon: Layers },
          { id: 'network', label: 'Network / Mission Control', icon: Network },
          { id: 'inventory', label: 'Inventory Intelligence', icon: Box },
          { id: 'demand-supply', label: 'Demand & Supply', icon: TrendingUp },
          { id: 'procurement', label: 'Procurement', icon: Target },
          { id: 'orders', label: 'Orders & Fulfillment', icon: Compass },
          { id: 'logistics', label: 'Logistics', icon: Truck },
          { id: 'risks', label: 'Risk & Exceptions', icon: ShieldAlert },
          { id: 'suppliers', label: 'Supplier Intelligence', icon: Factory },
          { id: 'finance', label: 'Financial Impact', icon: DollarSign },
          { id: 'ai-decisions', label: 'AI Decision Center', icon: BrainCircuit },
        ].map((view) => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id as ControlTowerPrimaryView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold shadow-xs'
                  : 'text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover border border-transparent'
              }`}
            >
              <Icon size={13} />
              <span>{view.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
