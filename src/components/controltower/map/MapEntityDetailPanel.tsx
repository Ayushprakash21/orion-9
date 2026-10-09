/**
 * ORION-9 GLOBAL OPERATIONS MAP — CONTEXTUAL ENTITY DETAIL DRAWER
 * Right-side operational panel displaying real-time entity metrics,
 * great-circle transit progress, follow mode, and Copilot integration.
 */

import React from 'react';
import { 
  Anchor, 
  Plane, 
  Truck, 
  TrainTrack, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  Navigation, 
  Compass, 
  Activity, 
  Sparkles, 
  Eye, 
  X,
  Clock,
  DollarSign,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { SelectedMapEntity } from './types';
import { formatCurrency, formatNumber } from '../../../lib/formatters';

interface MapEntityDetailPanelProps {
  selectedEntity: SelectedMapEntity | null;
  onClose: () => void;
  onAskCopilot: (query: string) => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  currency?: string;
  totalStats: {
    activeShipments: number;
    oceanCount: number;
    airCount: number;
    roadCount: number;
    railCount: number;
    exceptionsCount: number;
    capitalAtRisk: number;
  };
}

export const MapEntityDetailPanel: React.FC<MapEntityDetailPanelProps> = ({
  selectedEntity,
  onClose,
  onAskCopilot,
  isFollowing,
  onToggleFollow,
  currency = 'USD',
  totalStats,
}) => {
  // 1. DEFAULT VIEW: Nothing selected -> Global Operations Summary
  if (!selectedEntity) {
    return (
      <div 
        data-testid="map-entity-detail-panel"
        className="w-full lg:w-72 xl:w-80 h-full p-3.5 rounded-xl bg-os-surface/95 backdrop-blur-md border border-os-border shadow-lg flex flex-col justify-between font-mono text-xs select-none overflow-hidden"
      >
        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1">
          <div className="flex items-center justify-between pb-2 border-b border-os-border shrink-0">
            <span className="text-[11px] font-bold text-os-text-primary tracking-wider uppercase">
              NETWORK TELEMETRY
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                GLOBAL VIEW
              </span>
              <button
                onClick={onClose}
                title="Close Inspector"
                data-testid="close-map-inspector-btn"
                className="text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer p-0.5 rounded hover:bg-white/[0.08]"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* SCM Fleet Counts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-os-hover/60 border border-os-border/50">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-blue-400" />
                <span className="text-os-text-secondary">Active Shipments</span>
              </div>
              <span className="font-bold text-os-text-primary">{formatNumber(totalStats.activeShipments)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-os-hover/60 border border-os-border/50">
              <div className="flex items-center gap-2">
                <Anchor size={13} className="text-cyan-400" />
                <span className="text-os-text-secondary">Ocean Vessels</span>
              </div>
              <span className="font-bold text-os-text-primary">{totalStats.oceanCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-os-hover/60 border border-os-border/50">
              <div className="flex items-center gap-2">
                <Plane size={13} className="text-purple-400" />
                <span className="text-os-text-secondary">Air Cargo Aircraft</span>
              </div>
              <span className="font-bold text-os-text-primary">{totalStats.airCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-os-hover/60 border border-os-border/50">
              <div className="flex items-center gap-2">
                <Truck size={13} className="text-emerald-400" />
                <span className="text-os-text-secondary">Intermodal Trucks</span>
              </div>
              <span className="font-bold text-os-text-primary">{totalStats.roadCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-os-hover/60 border border-os-border/50">
              <div className="flex items-center gap-2">
                <TrainTrack size={13} className="text-amber-400" />
                <span className="text-os-text-secondary">Rail Units</span>
              </div>
              <span className="font-bold text-os-text-primary">{totalStats.railCount}</span>
            </div>
          </div>

          {/* Capital at Risk */}
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-[10px] text-os-text-muted uppercase font-bold block mb-1">
              Active Network Exposure
            </span>
            <span className="text-lg font-light text-red-400">
              {formatCurrency(totalStats.capitalAtRisk, currency)}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-os-text-muted mt-1">
              <ShieldAlert size={11} className="text-red-400" />
              <span>{totalStats.exceptionsCount} Exceptions Geographically Isolated</span>
            </div>
          </div>
        </div>

        {/* Copilot Prompt Trigger */}
        <button
          data-testid="inspector-ask-copilot-btn"
          onClick={() => onAskCopilot('Perform global supply chain multi-modal disruption and risk assessment across all active lanes.')}
          className="w-full mt-3 shrink-0 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all font-semibold cursor-pointer shadow-sm"
        >
          <Sparkles size={14} />
          <span>Ask Orion Copilot</span>
        </button>
      </div>
    );
  }

  // 2. CONTEXTUAL VIEW: Specific entity selected
  const { type, entity } = selectedEntity;

  const renderContent = () => {
    switch (type) {
      case 'vessel':
        return (
          <>
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Anchor size={16} />
              <span className="font-bold uppercase tracking-wider">{entity.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Carrier</span>
                <span className="font-semibold text-os-text-primary">{entity.carrier}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Speed / Heading</span>
                <span className="font-semibold text-os-text-primary">{entity.speed} kn / {entity.heading}°</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Route</span>
                <span className="font-semibold text-os-text-primary">{entity.origin} &rarr; {entity.destination}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Predicted ETA</span>
                <span className="font-semibold text-os-text-primary">{entity.eta}</span>
              </div>
            </div>
            <div className="p-2 rounded bg-os-hover border border-os-border/50 text-[10px] space-y-1">
              <div>IMO / MMSI: <span className="font-bold">{entity.imo} / {entity.mmsi}</span></div>
              <div>Vessel Type: <span>{entity.vessel_type}</span></div>
              <div>Telemetry Source: <span className="text-amber-400 font-bold">{entity.data_source}</span></div>
            </div>
          </>
        );

      case 'aircraft':
        return (
          <>
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Plane size={16} />
              <span className="font-bold uppercase tracking-wider">{entity.airline} ({entity.callsign})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Altitude</span>
                <span className="font-semibold text-os-text-primary">{entity.altitude.toLocaleString()} ft</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Ground Speed</span>
                <span className="font-semibold text-os-text-primary">{entity.ground_speed} kn</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Corridor</span>
                <span className="font-semibold text-os-text-primary">{entity.origin} &rarr; {entity.destination}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Airframe</span>
                <span className="font-semibold text-os-text-primary">{entity.aircraft_type}</span>
              </div>
            </div>
          </>
        );

      case 'port':
        return (
          <>
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <MapPin size={16} />
              <span className="font-bold uppercase tracking-wider">{entity.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">UN/LOCODE</span>
                <span className="font-semibold text-os-text-primary">{entity.unlocode}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Vessels in Port</span>
                <span className="font-semibold text-os-text-primary">{entity.vesselsInPort}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Congestion Status</span>
                <span className={`font-semibold ${entity.congestion === 'CRITICAL' || entity.congestion === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {entity.congestion}
                </span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Avg Berth Delay</span>
                <span className="font-semibold text-os-text-primary">{entity.delayAverageHours} hrs</span>
              </div>
            </div>
          </>
        );

      case 'shipment':
        return (
          <>
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Activity size={16} />
              <span className="font-bold uppercase tracking-wider">{entity.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Carrier</span>
                <span className="font-semibold text-os-text-primary">{entity.carrier}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Capital At Risk</span>
                <span className="font-semibold text-red-400">{formatCurrency(entity.capitalAtRisk, currency)}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Lane</span>
                <span className="font-semibold text-os-text-primary">{entity.origin.code} &rarr; {entity.destination.code}</span>
              </div>
              <div className="p-2 rounded bg-os-hover border border-os-border/50">
                <span className="text-os-text-muted text-[9px] block">Delay</span>
                <span className={`font-semibold ${entity.delayDays > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {entity.delayDays > 0 ? `+${entity.delayDays} days` : 'On Schedule'}
                </span>
              </div>
            </div>
          </>
        );

      default:
        return (
          <div className="p-2 text-os-text-secondary">
            Operational details for {type}: {JSON.stringify(entity).slice(0, 100)}...
          </div>
        );
    }
  };

  return (
    <div 
      data-testid="map-entity-detail-panel"
      className="w-full lg:w-72 xl:w-80 h-full p-3.5 rounded-xl bg-os-surface/95 backdrop-blur-md border border-os-border shadow-lg flex flex-col justify-between font-mono text-xs select-none animate-fade-in overflow-hidden"
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between pb-2 border-b border-os-border mb-2.5 shrink-0">
          <span className="text-[10px] text-os-text-muted font-bold tracking-wider uppercase">
            ENTITY TELEMETRY
          </span>
          <button
            onClick={onClose}
            title="Close Inspector"
            data-testid="close-map-inspector-btn"
            className="text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer p-0.5 rounded hover:bg-white/[0.08]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1 space-y-2">
          {renderContent()}
        </div>
      </div>

      <div className="space-y-2 mt-2 pt-2 border-t border-os-border shrink-0">
        {/* Follow Mode Toggle */}
        {(type === 'vessel' || type === 'aircraft' || type === 'truck' || type === 'shipment') && (
          <button
            data-testid="inspector-follow-btn"
            onClick={onToggleFollow}
            className={`w-full shrink-0 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border transition-all font-semibold cursor-pointer ${
              isFollowing
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-os-hover border-os-border text-os-text-primary hover:border-os-border-strong'
            }`}
          >
            <Navigation size={13} className={isFollowing ? 'text-amber-400 animate-spin' : ''} />
            <span>{isFollowing ? 'Stop Following' : 'Follow Moving Entity'}</span>
          </button>
        )}

        {/* Copilot Deep Link */}
        <button
          data-testid="inspector-ask-copilot-btn"
          onClick={() => onAskCopilot(`Provide operational root-cause analysis and mitigation strategies for ${type} ${('name' in entity && entity.name) || ('id' in entity && entity.id)}.`)}
          className="w-full shrink-0 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all font-semibold cursor-pointer shadow-sm"
        >
          <Sparkles size={13} />
          <span>Ask Orion Copilot</span>
        </button>
      </div>
    </div>
  );
};
