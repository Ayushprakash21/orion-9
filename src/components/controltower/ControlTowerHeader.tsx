import React from 'react';
import { 
  Network, 
  Clock, 
  Zap, 
  Search, 
  RefreshCw, 
  Share2, 
  SlidersHorizontal,
  Activity,
  Layers
} from 'lucide-react';
import { TruthfulConnectionState } from '../../core/visualization';

interface ControlTowerHeaderProps {
  activeView: 'geospatial' | 'timegraph';
  onViewChange: (view: 'geospatial' | 'timegraph') => void;
  connectionStatus: TruthfulConnectionState;
  onRefresh: () => void;
  onInspectSystemStatus: () => void;
  isLoading: boolean;
  activeDomainName: string;
}

export const ControlTowerHeader: React.FC<ControlTowerHeaderProps> = ({
  activeView,
  onViewChange,
  connectionStatus,
  onRefresh,
  onInspectSystemStatus,
  isLoading,
  activeDomainName,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-os-border/70 select-none">
      {/* LEFT: TITLE & BREADCRUMB */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-os-surface-elevated border border-os-border text-cyan-400 font-mono font-bold text-sm shadow-xs">
          C3
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-os-text-primary tracking-tight">
              Control Tower
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
              Mission Control
            </span>
          </div>
          <p className="text-[11px] text-os-text-muted flex items-center gap-1.5 font-mono">
            <span>Enterprise Telemetry</span>
            <span>&bull;</span>
            <span className="text-os-text-secondary">{activeDomainName}</span>
          </p>
        </div>
      </div>

      {/* CENTER: VIEW MODES & TOOLS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Graph View Selector */}
        <div className="flex items-center p-0.5 rounded-lg bg-os-surface border border-os-border text-xs">
          <button
            onClick={() => onViewChange('geospatial')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'geospatial'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-xs'
                : 'text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover border border-transparent'
            }`}
          >
            <Network size={13} />
            <span>Geospatial</span>
          </button>
          <button
            onClick={() => onViewChange('timegraph')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'timegraph'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-xs'
                : 'text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover border border-transparent'
            }`}
          >
            <Clock size={13} />
            <span>Time Graph</span>
          </button>
        </div>
      </div>

      {/* RIGHT: LIVE TELEMETRY STATUS & REFRESH */}
      <div className="flex items-center gap-2">
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
  );
};
