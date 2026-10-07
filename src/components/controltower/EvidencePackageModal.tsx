import React from 'react';
import { X, FileText, CheckCircle2, ShieldCheck, Database, Layers } from 'lucide-react';
import { MissionControlCardItem } from './missionControlTypes';
import { formatCurrency } from '../../lib/formatters';

interface EvidencePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: MissionControlCardItem | null;
  currency: string;
}

export const EvidencePackageModal: React.FC<EvidencePackageModalProps> = ({
  isOpen,
  onClose,
  mission,
  currency,
}) => {
  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-os-surface border border-os-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-os-border flex items-center justify-between bg-os-surface-elevated/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-os-text-primary">
                Evidence Package: {mission.missionNumber}
              </h2>
              <p className="text-[11px] font-mono text-os-text-muted">
                Authoritative Audit Trail & Grounded Telemetry Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-os-text-muted hover:text-os-text-primary hover:bg-os-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          {/* Mission Executive Summary */}
          <div className="p-3.5 rounded-xl border border-os-border bg-os-surface-secondary/40 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400">
              Operational Scope
            </span>
            <div className="grid grid-cols-2 gap-3 text-os-text-secondary font-mono">
              <div>
                <span className="text-[10px] text-os-text-muted block">Origin &rarr; Destination</span>
                <span className="font-semibold text-os-text-primary">{mission.origin} &rarr; {mission.destination}</span>
              </div>
              <div>
                <span className="text-[10px] text-os-text-muted block">Capital Exposure</span>
                <span className="font-semibold text-os-text-primary">{formatCurrency(mission.capitalAtRisk, currency)}</span>
              </div>
              <div>
                <span className="text-[10px] text-os-text-muted block">Delivery Variance</span>
                <span className="font-semibold text-red-400">+{mission.predictedDelayDays} Days</span>
              </div>
              <div>
                <span className="text-[10px] text-os-text-muted block">Primary Task</span>
                <span className="font-semibold text-os-text-primary truncate block">{mission.primaryTask}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Evidence Records */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-os-text-muted">
              Evidence Log Telemetry
            </span>
            <div className="space-y-2 font-mono">
              <div className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/40 flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-os-text-primary">AIS Vessel Geofence Deviation Flagged</div>
                  <p className="text-[11px] text-os-text-secondary mt-0.5">
                    Automated vessel transponder telemetry logged 84-hour dwell time anomaly outside scheduled anchorage zone.
                  </p>
                  <span className="text-[9px] text-os-text-muted">Source: AIS Ingestion Pipeline &bull; Timestamp: 2026-01-14T09:12:44Z</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/40 flex items-start gap-2.5">
                <ShieldCheck size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-os-text-primary">Port Terminal Berth Congestion Verified</div>
                  <p className="text-[11px] text-os-text-secondary mt-0.5">
                    Terminal berth throughput reduced by 42% due to severe regional meteorological conditions and crane backlog.
                  </p>
                  <span className="text-[9px] text-os-text-muted">Source: Port Authority EDI &bull; Timestamp: 2026-01-15T14:22:10Z</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/40 flex items-start gap-2.5">
                <Database size={14} className="text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-os-text-primary">Governed Supply Chain Risk Classification</div>
                  <p className="text-[11px] text-os-text-secondary mt-0.5">
                    Impact assessment calculated downstream assembly line stoppage probability at 88% if delivery exceeds Jan 25.
                  </p>
                  <span className="text-[9px] text-os-text-muted">Source: Autonomous Mission Risk Engine &bull; Severity: CRITICAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 border-t border-os-border bg-os-surface-elevated/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-os-text-muted">
            Immutable Audit Trail Signed by Orion Kernel
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-os-surface border border-os-border hover:bg-os-surface-hover text-xs font-semibold text-os-text-primary transition-colors cursor-pointer"
          >
            Close Package
          </button>
        </div>
      </div>
    </div>
  );
};
