import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  BrainCircuit, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  ZoomIn, 
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { MissionControlCardItem } from './missionControlTypes';
import { formatCurrency } from '../../lib/formatters';

interface ControlTowerDetailsPanelProps {
  selectedMission: MissionControlCardItem | null;
  onAskCopilot: (mission: MissionControlCardItem) => void;
  onViewEvidencePackage: (mission: MissionControlCardItem) => void;
  onExecuteGovernedAction: (mission: MissionControlCardItem) => void;
  currency: string;
}

export const ControlTowerDetailsPanel: React.FC<ControlTowerDetailsPanelProps> = ({
  selectedMission,
  onAskCopilot,
  onViewEvidencePackage,
  onExecuteGovernedAction,
  currency,
}) => {
  if (!selectedMission) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-xs text-os-text-muted font-mono bg-os-surface border border-os-border rounded-xl">
        <Clock size={24} className="mb-2 opacity-40" />
        <span>Select an active mission from the Operations panel to inspect contextual root cause intelligence.</span>
      </div>
    );
  }

  const { categoryContributions } = selectedMission;
  const isDelayed = selectedMission.status === 'DELAYED' || selectedMission.status === 'CRITICAL';

  // SVG Donut calculation
  const totalWeight =
    (categoryContributions.intelligence || 0) +
    (categoryContributions.anomalousAis || 0) +
    (categoryContributions.weather || 0) +
    (categoryContributions.capacity || 0) || 100;

  const intP = ((categoryContributions.intelligence || 35) / totalWeight) * 100;
  const aisP = ((categoryContributions.anomalousAis || 30) / totalWeight) * 100;
  const weaP = ((categoryContributions.weather || 20) / totalWeight) * 100;
  const capP = 100 - (intP + aisP + weaP);

  return (
    <div className="flex flex-col h-full bg-os-surface border border-os-border rounded-xl p-3.5 space-y-3.5 select-none overflow-y-auto custom-scrollbar">
      {/* HEADER: DETAILS WITH ZOOM IN */}
      <div className="flex items-center justify-between border-b border-os-border/70 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-os-text-primary">
          <span>&lsaquo; Details</span>
        </div>
        <button
          onClick={() => onViewEvidencePackage(selectedMission)}
          className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ZoomIn size={12} />
          <span>Zoom In</span>
        </button>
      </div>

      {/* TOP NOTIFICATION / CAUSE BANNER */}
      {isDelayed && (
        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-xs">
          <div className="flex items-start gap-2">
            <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-semibold text-red-400">
                {selectedMission.missionNumber} is predicted to be delayed by {selectedMission.predictedDelayDays} days.
              </span>
              <p className="text-[11px] text-red-200/80 mt-0.5">
                Suspected bottleneck: Anomalous Port Congestion & AIS dwell deviation at intermediate transshipment hub.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONTRIBUTION BY CATEGORY (DONUT CHART) */}
      <div className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-os-text-muted font-bold">
            Contribution by Category
          </span>
          <HelpCircle size={12} className="text-os-text-muted" />
        </div>

        <div className="flex items-center gap-4">
          {/* Donut SVG */}
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#1A202C"
                strokeWidth="3.8"
              />
              {/* Segment 1: Intelligence (Cyan) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="3.8"
                strokeDasharray={`${intP} ${100 - intP}`}
                strokeDashoffset="0"
              />
              {/* Segment 2: Anomalous AIS (Purple) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#A855F7"
                strokeWidth="3.8"
                strokeDasharray={`${aisP} ${100 - aisP}`}
                strokeDashoffset={`-${intP}`}
              />
              {/* Segment 3: Weather (Blue) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3.8"
                strokeDasharray={`${weaP} ${100 - weaP}`}
                strokeDashoffset={`-${intP + aisP}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-mono font-bold text-os-text-primary">03</span>
              <span className="text-[8px] text-os-text-muted uppercase">Projects</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-1 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-os-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Intelligence
              </span>
              <span className="text-os-text-muted font-bold">{Math.round(intP)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-os-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Anomalous AIS
              </span>
              <span className="text-os-text-muted font-bold">{Math.round(aisP)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-os-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Weather
              </span>
              <span className="text-os-text-muted font-bold">{Math.round(weaP)}%</span>
            </div>
          </div>
        </div>

        {/* Evidence package link button */}
        <button
          onClick={() => onViewEvidencePackage(selectedMission)}
          className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 rounded-md border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[11px] font-medium transition-all"
        >
          <FileText size={12} />
          <span>View Detail in Evidence Package</span>
          <ExternalLink size={10} />
        </button>
      </div>

      {/* MISSION DETAIL KEY-VALUES */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-os-text-muted font-bold block">
          Mission Detail
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-os-surface-elevated/40 border border-os-border/70">
            <div className="text-[9px] uppercase text-os-text-muted">Mission Number</div>
            <div className="font-bold text-os-text-primary mt-0.5">{selectedMission.missionNumber}</div>
          </div>
          <div className="p-2 rounded bg-os-surface-elevated/40 border border-os-border/70">
            <div className="text-[9px] uppercase text-os-text-muted">Primary Task</div>
            <div className="font-medium text-os-text-primary truncate mt-0.5">{selectedMission.primaryTask}</div>
          </div>
          <div className="p-2 rounded bg-os-surface-elevated/40 border border-os-border/70">
            <div className="text-[9px] uppercase text-os-text-muted">Delivery Status</div>
            <div className="font-semibold text-red-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Predicted delayed
            </div>
          </div>
          <div className="p-2 rounded bg-os-surface-elevated/40 border border-os-border/70">
            <div className="text-[9px] uppercase text-os-text-muted">Carrier / Mode</div>
            <div className="font-medium text-os-text-primary mt-0.5 truncate">{selectedMission.carrier || 'Multimodal Ocean'}</div>
          </div>
          <div className="p-2 rounded bg-os-surface-elevated/40 border border-os-border/70">
            <div className="text-[9px] uppercase text-os-text-muted">Requested Delivery Date</div>
            <div className="text-os-text-secondary mt-0.5">{selectedMission.requestedDeliveryDate}</div>
          </div>
          <div className="p-2 rounded bg-os-surface-elevated/40 border border-os-border/70">
            <div className="text-[9px] uppercase text-os-text-muted">Predicted Delivery Date</div>
            <div className="text-amber-400 font-bold mt-0.5">{selectedMission.predictedDeliveryDate}</div>
          </div>
        </div>
      </div>

      {/* DELIVERY PREDICTION OVER TIME BAR CHART */}
      <div className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/40 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="uppercase text-os-text-muted font-bold">Delivery Prediction Overtime</span>
          <span className="text-os-text-muted">Last 1 Month</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] font-mono text-os-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-slate-600" />
            Requested
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-purple-500" />
            Predicted
          </span>
        </div>

        {/* Miniature Bar Chart Visualizer */}
        <div className="h-20 w-full flex items-end gap-1.5 pt-2 border-b border-os-border/60">
          {[
            { month: 'Jan', req: 40, pred: 45 },
            { month: 'Feb', req: 55, pred: 60 },
            { month: 'Mar', req: 65, pred: 80 },
            { month: 'Apr', req: 50, pred: 75 },
            { month: 'May', req: 70, pred: 95 },
            { month: 'Jun', req: 45, pred: 70 },
          ].map((bar, i) => (
            <div key={bar.month} className="flex-1 flex items-end gap-0.5 h-full">
              <div
                className="w-1/2 bg-slate-600 rounded-t transition-all"
                style={{ height: `${bar.req}%` }}
              />
              <div
                className="w-1/2 bg-purple-500 rounded-t transition-all"
                style={{ height: `${bar.pred}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[8px] font-mono text-os-text-muted">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>

      {/* ACTION FOOTER: COPILOT & GOVERNED RECOVERY ACTION */}
      <div className="pt-2 border-t border-os-border space-y-2">
        <button
          onClick={() => onAskCopilot(selectedMission)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <Sparkles size={14} className="text-cyan-400" />
          <span>Ask Orion Copilot About This Mission</span>
        </button>

        <button
          onClick={() => onExecuteGovernedAction(selectedMission)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <BrainCircuit size={14} />
          <span>Formulate Governed Recovery Action</span>
        </button>
      </div>
    </div>
  );
};
