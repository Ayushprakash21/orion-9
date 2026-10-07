import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Box, 
  AlertTriangle, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  ShieldAlert,
  Plane,
  Truck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { MissionControlCardItem } from './missionControlTypes';
import { formatCurrency } from '../../lib/formatters';

interface ControlTowerOperationsPanelProps {
  missions: MissionControlCardItem[];
  selectedMissionId: string | null;
  onSelectMission: (missionId: string) => void;
  activeQuickAction: 'missions' | 'facilities' | 'assets' | 'initiatives';
  onQuickActionChange: (action: 'missions' | 'facilities' | 'assets' | 'initiatives') => void;
  currency: string;
}

export const ControlTowerOperationsPanel: React.FC<ControlTowerOperationsPanelProps> = ({
  missions,
  selectedMissionId,
  onSelectMission,
  activeQuickAction,
  onQuickActionChange,
  currency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'lowToHigh' | 'highToLow'>('lowToHigh');
  const [viewTab, setViewTab] = useState<'summary' | 'list'>('list');

  // Filter & sort
  const filteredMissions = missions
    .filter((m) => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        m.missionNumber.toLowerCase().includes(lower) ||
        m.origin.toLowerCase().includes(lower) ||
        m.destination.toLowerCase().includes(lower) ||
        m.title.toLowerCase().includes(lower) ||
        m.primaryTask.toLowerCase().includes(lower)
      );
    })
    .sort((a, b) => {
      return sortOrder === 'lowToHigh' ? a.progress - b.progress : b.progress - a.progress;
    });

  const delayedCount = missions.filter((m) => m.status === 'DELAYED' || m.status === 'CRITICAL').length;

  return (
    <div className="flex flex-col h-full bg-os-surface border border-os-border rounded-xl p-3.5 space-y-3.5 select-none overflow-hidden">
      {/* QUICK ACTIONS ROW */}
      <div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-os-text-muted mb-2">
          Quick Actions
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => onQuickActionChange('missions')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              activeQuickAction === 'missions'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                : 'bg-os-surface-elevated/60 border-os-border/70 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center mb-1">
              <Layers size={13} className="text-cyan-400" />
            </div>
            <span className="text-[10px] font-medium leading-none">Missions</span>
          </button>

          <button
            onClick={() => onQuickActionChange('facilities')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              activeQuickAction === 'facilities'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-os-surface-elevated/60 border-os-border/70 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center mb-1">
              <Building2 size={13} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-medium leading-none">Facilities</span>
          </button>

          <button
            onClick={() => onQuickActionChange('assets')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              activeQuickAction === 'assets'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-os-surface-elevated/60 border-os-border/70 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
              <Box size={13} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-medium leading-none">Assets</span>
          </button>

          <button
            onClick={() => onQuickActionChange('initiatives')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              activeQuickAction === 'initiatives'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                : 'bg-os-surface-elevated/60 border-os-border/70 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center mb-1">
              <AlertTriangle size={13} className="text-purple-400" />
            </div>
            <span className="text-[10px] font-medium leading-none">Risks</span>
          </button>
        </div>
      </div>

      {/* MISSIONS AT RISK CARD */}
      <div className="p-2.5 rounded-lg border border-os-border bg-os-surface-elevated/40">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-os-text-secondary font-medium">No. of Missions at Risk</span>
          <span className="font-mono text-red-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {delayedCount}
          </span>
        </div>
        {/* Subtle trendline sparkline */}
        <div className="h-6 w-full flex items-end gap-1 pt-1 opacity-80">
          <div className="w-1/6 bg-emerald-500/30 rounded-t h-2" />
          <div className="w-1/6 bg-emerald-500/40 rounded-t h-3" />
          <div className="w-1/6 bg-amber-500/40 rounded-t h-4" />
          <div className="w-1/6 bg-amber-500/50 rounded-t h-3.5" />
          <div className="w-1/6 bg-red-500/50 rounded-t h-5" />
          <div className="w-1/6 bg-red-500/70 rounded-t h-6" />
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-os-text-muted mt-1">
          <span>Past 30 days</span>
          <span className="text-red-400">+5 (0.5%)</span>
        </div>
      </div>

      {/* TAB SELECTOR: SUMMARY VS LIST */}
      <div className="flex items-center p-0.5 rounded-lg bg-os-surface-secondary border border-os-border text-xs">
        <button
          onClick={() => setViewTab('summary')}
          className={`flex-1 py-1 text-center rounded-md font-medium text-[11px] transition-all ${
            viewTab === 'summary'
              ? 'bg-os-surface text-os-text-primary shadow-xs'
              : 'text-os-text-muted hover:text-os-text-secondary'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setViewTab('list')}
          className={`flex-1 py-1 text-center rounded-md font-medium text-[11px] transition-all ${
            viewTab === 'list'
              ? 'bg-os-surface text-os-text-primary shadow-xs'
              : 'text-os-text-muted hover:text-os-text-secondary'
          }`}
        >
          List of Missions ({missions.length})
        </button>
      </div>

      {/* SEARCH AND SORT BAR */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2 text-os-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search missions, routes..."
            className="w-full bg-os-surface-elevated border border-os-border rounded-md pl-7 pr-2.5 py-1 text-[11px] text-os-text-primary placeholder:text-os-text-muted focus:outline-hidden focus:border-cyan-500/50"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-os-text-muted font-mono">
          <span>Sort by progress:</span>
          <button
            onClick={() => setSortOrder(sortOrder === 'lowToHigh' ? 'highToLow' : 'lowToHigh')}
            className="flex items-center gap-1 hover:text-os-text-primary text-cyan-400"
          >
            <span>{sortOrder === 'lowToHigh' ? 'Low to High' : 'High to Low'}</span>
            <ArrowUpDown size={10} />
          </button>
        </div>
      </div>

      {/* MISSION CARDS LIST */}
      <div className="flex-1 min-h-[220px] max-h-[460px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredMissions.map((mission) => {
          const isSelected = selectedMissionId === mission.id;
          const isDelayed = mission.status === 'DELAYED' || mission.status === 'CRITICAL';

          return (
            <div
              key={mission.id}
              onClick={() => onSelectMission(mission.id)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-xs'
                  : 'bg-os-surface-elevated/40 border-os-border/70 hover:border-os-border-strong hover:bg-os-surface-hover'
              }`}
            >
              {/* Header: Mission # + Status Pill */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-os-text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{mission.missionNumber}</span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                    isDelayed
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isDelayed ? 'Delayed' : 'On Time'}
                </span>
              </div>

              {/* Route: Origin → Destination */}
              <div className="flex items-center justify-between font-mono text-xs text-os-text-secondary mb-2">
                <span className="font-bold text-os-text-primary">{mission.origin}</span>
                <div className="flex items-center gap-1 text-[10px] text-os-text-muted px-2">
                  <span className="w-6 border-t border-dashed border-os-border-strong" />
                  <Plane size={10} className="text-cyan-400" />
                  <span className="w-6 border-t border-dashed border-os-border-strong" />
                </div>
                <span className="font-bold text-os-text-primary">{mission.destination}</span>
              </div>

              {/* Progress & Milestone */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-os-text-muted">
                  <span className="truncate max-w-[140px]">{mission.primaryTask}</span>
                  <span className="font-mono text-cyan-400 font-semibold">{mission.progress}%</span>
                </div>
                <div className="w-full bg-os-border/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDelayed ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}
                    style={{ width: `${Math.max(5, mission.progress)}%` }}
                  />
                </div>
              </div>

              {/* Delay banner if applicable */}
              {isDelayed && (
                <div className="mt-2 pt-1.5 border-t border-os-border/50 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-red-400 flex items-center gap-1">
                    <Clock size={10} />
                    Predicted delay: +{mission.predictedDelayDays}d
                  </span>
                  <span className="text-os-text-muted">
                    {formatCurrency(mission.capitalAtRisk, currency)}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredMissions.length === 0 && (
          <div className="text-center py-8 text-xs text-os-text-muted font-mono">
            No active missions matching filter.
          </div>
        )}
      </div>
    </div>
  );
};
