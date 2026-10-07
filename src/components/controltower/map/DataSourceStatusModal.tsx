/**
 * ORION-9 GLOBAL OPERATIONS MAP — DATA SOURCE STATUS MODAL
 * Transparent governance modal reporting real provider connection health,
 * latency, and explicit simulation vs live telemetry states.
 */

import React from 'react';
import { ShieldCheck, AlertCircle, X, Radio, Activity, CheckCircle2 } from 'lucide-react';
import { TrackingProviderMetadata } from './TrackingProvider';

interface DataSourceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: TrackingProviderMetadata[];
}

export const DataSourceStatusModal: React.FC<DataSourceStatusModalProps> = ({
  isOpen,
  onClose,
  providers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-os-surface border border-os-border rounded-xl shadow-2xl p-5 font-mono text-xs animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-os-border mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-os-text-primary">
                DATA SOURCE TRUTHFULNESS & PROVIDERS
              </h3>
              <p className="text-[10px] text-os-text-muted">
                Governed Telemetry & Provider Connection Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-os-text-muted hover:text-os-text-primary cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Truthfulness Notice Banner */}
        <div className="p-3 mb-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <div className="flex items-start gap-2">
            <Radio size={15} className="shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Non-Negotiable Honesty Policy:</strong> When external real-world feeds (e.g. Spire AIS, FlightAware ADS-B) are disconnected, Orion explicitly labels synthetic tracks as <span className="underline font-bold">SIMULATION / DEMO</span>. Fake "LIVE" timestamps are never fabricated.
            </div>
          </div>
        </div>

        {/* Providers Table */}
        <div className="space-y-2 mb-4">
          {providers.map((p) => (
            <div
              key={p.providerId}
              className="p-3 rounded-lg bg-os-hover/60 border border-os-border flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-os-text-primary">{p.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    p.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : p.status === 'SIMULATION'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-os-text-muted">
                <span>Active Tracked Entities: <strong className="text-os-text-primary">{p.activeEntityCount}</strong></span>
                <span>Latency: <strong className="text-os-text-primary">{p.latencyMs} ms</strong></span>
              </div>
              <p className="text-[10px] text-os-text-muted/80">{p.notes}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-os-border">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-os-hover text-os-text-primary hover:bg-os-border transition-colors font-medium cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
