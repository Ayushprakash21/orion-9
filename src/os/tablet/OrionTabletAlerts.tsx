/**
 * ORION-9 TABLET ALERTS & RISK RADAR
 * Priority-ranked exceptions and automated containment alerts for tablet screens.
 */

import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useTabletNavigation } from './OrionTabletNavigation';
import { ExceptionSeverity } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle2, 
  Filter,
  ArrowUpRight,
  Zap
} from 'lucide-react';

export const OrionTabletAlerts: React.FC = () => {
  const { exceptions, currency } = useSupplyChain();
  const { openEntityDetail } = useTabletNavigation();
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredExceptions = useMemo(() => {
    if (selectedSeverity === 'ALL') return exceptions;
    return exceptions.filter(e => e.severity.toUpperCase() === selectedSeverity);
  }, [exceptions, selectedSeverity]);

  const severityCounts = useMemo(() => ({
    all: exceptions.length,
    critical: exceptions.filter(e => e.severity === 'Critical').length,
    high: exceptions.filter(e => e.severity === 'High').length,
    medium: exceptions.filter(e => e.severity === 'Medium').length,
    low: exceptions.filter(e => e.severity === 'Low').length,
  }), [exceptions]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-6">
      {/* 1. HEADER */}
      <div className="bg-os-surface border border-os-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-os-text-primary">Operational Alerts &amp; Risks</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
              {severityCounts.critical} CRITICAL
            </span>
          </div>
          <p className="text-xs text-os-text-muted mt-0.5">
            Priority-ranked exceptions and automated containment alerts across all SCM nodes.
          </p>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 bg-os-surface-secondary p-1 rounded-xl border border-os-border overflow-x-auto no-scrollbar">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedSeverity === sev
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-xs'
                  : 'text-os-text-muted hover:text-os-text-primary'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ALERTS 2-COLUMN RESPONSIVE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredExceptions.map(exc => {
          const isCritical = exc.severity === 'Critical';
          const isHigh = exc.severity === 'High';

          return (
            <div
              key={exc.id}
              onClick={() => openEntityDetail({ type: 'exception', id: exc.id, data: exc })}
              className="bg-os-surface hover:bg-os-surface/90 border border-os-border hover:border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      isCritical
                        ? 'bg-red-500/15 text-red-400 border-red-500/40'
                        : isHigh
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                    }`}>
                      {exc.severity}
                    </span>
                    <span className="text-xs font-bold text-os-text-primary truncate">
                      {exc.type}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-red-400 shrink-0">
                    {formatCurrency(exc.estimatedImpact || 0, currency)}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-os-text-muted flex items-center justify-between">
                  <span>Entity: {exc.entityId}</span>
                  <span>{exc.date || 'Active'}</span>
                </div>

                <p className="text-xs text-os-text-secondary leading-relaxed line-clamp-2">
                  {exc.description}
                </p>

                {exc.recommendedAction && (
                  <div className="bg-os-surface-secondary/70 border border-os-border/50 rounded-xl p-2.5 text-[11px] text-cyan-300">
                    <span className="font-mono font-bold text-cyan-400 block text-[9px] uppercase tracking-wider mb-0.5">
                      RECOMMENDED ACTION:
                    </span>
                    {exc.recommendedAction}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-os-border/60 text-xs font-mono">
                <span className="text-os-text-muted flex items-center gap-1">
                  <Zap size={12} className="text-cyan-400" />
                  {exc.status}
                </span>
                <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                  Review &amp; Execute <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
