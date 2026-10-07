import React from 'react';
import { Anchor, Clock, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { MissionControlCardItem } from './missionControlTypes';

interface ControlTowerTimelineProps {
  selectedMission: MissionControlCardItem | null;
}

export const ControlTowerTimeline: React.FC<ControlTowerTimelineProps> = ({
  selectedMission,
}) => {
  const milestones = selectedMission?.milestones || [];

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-3.5 space-y-2.5 select-none overflow-hidden">
      {/* TIMELINE HEADER: DATES & MILESTONE INDICATOR */}
      <div className="flex items-center justify-between border-b border-os-border/70 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-os-text-primary">
            <Anchor size={13} className="text-cyan-400" />
            <span>Operational Port Milestones</span>
          </div>
          <span className="text-[10px] font-mono text-os-text-muted px-1.5 py-0.5 rounded bg-os-surface-elevated border border-os-border">
            Transit Gantt
          </span>
        </div>

        {/* Global date scale markers */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-os-text-muted">
          <span>Jan 10, 2026</span>
          <span>Jan 13, 2026</span>
          <span>Jan 18, 2026</span>
          <span>Jan 22, 2026</span>
          <span>Jan 26, 2026</span>
        </div>
      </div>

      {/* HORIZONTAL GANTT BARS CONTAINER */}
      <div className="space-y-2 pt-1">
        {milestones.map((milestone, index) => {
          const isDelayed = milestone.status === 'DELAYED';
          const isCompleted = milestone.status === 'COMPLETED';
          const isInTransit = milestone.status === 'IN_TRANSIT';

          // Visual bar widths based on duration
          const durationDays = milestone.actualOrPredictedDays || milestone.plannedDays || 4;
          // Approximate relative offset to create realistic stepped cascade
          const offsetPercent = index * 22;
          const barWidthPercent = Math.min(100 - offsetPercent, Math.max(15, durationDays * 3.5));

          return (
            <div key={milestone.name + index} className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs">
              {/* Port Name & Tag */}
              <div className="w-28 shrink-0 flex items-center justify-between pr-2 text-os-text-secondary font-mono text-[11px]">
                <span className="truncate font-medium">{milestone.name}</span>
                {isDelayed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                )}
              </div>

              {/* Progress/Transit Bar Track */}
              <div className="flex-1 relative h-6 bg-os-surface-secondary/40 rounded border border-os-border/60 overflow-hidden flex items-center">
                {/* Milestone Bar */}
                <div
                  className={`h-full rounded flex items-center justify-between px-2 text-[10px] font-mono font-medium transition-all ${
                    isDelayed
                      ? 'bg-gradient-to-r from-red-500/80 to-red-600/90 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : isCompleted
                      ? 'bg-cyan-600/70 text-cyan-100'
                      : isInTransit
                      ? 'bg-blue-600/80 text-blue-100 animate-pulse'
                      : 'bg-os-border/80 text-os-text-muted'
                  }`}
                  style={{
                    marginLeft: `${offsetPercent}%`,
                    width: `${barWidthPercent}%`,
                  }}
                >
                  <span className="truncate">{durationDays} days</span>
                  {isDelayed && (
                    <span className="flex items-center gap-0.5 text-red-100 font-bold">
                      <AlertTriangle size={10} />
                      {`+${milestone.delayDays}d`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div className="text-center py-4 text-xs text-os-text-muted font-mono">
            No transit milestones recorded for selected mission.
          </div>
        )}
      </div>
    </div>
  );
};
