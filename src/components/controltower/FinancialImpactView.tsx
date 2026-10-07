import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  PieChart
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../lib/formatters';

interface FinancialImpactViewProps {
  currency: string;
  onAskCopilot: (query: string) => void;
}

export const FinancialImpactView: React.FC<FinancialImpactViewProps> = ({
  currency,
  onAskCopilot,
}) => {
  return (
    <div className="space-y-4 select-none">
      {/* FINANCIAL OVERVIEW KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-os-border bg-os-surface/90">
          <div className="text-[10px] font-mono uppercase text-os-text-muted font-bold">
            Total Working Capital Deployed
          </div>
          <div className="text-2xl font-mono font-bold text-os-text-primary mt-1">
            {formatCurrency(412000000, currency)}
          </div>
          <div className="text-[10px] font-mono text-os-text-muted mt-1">
            Inventory & Committed Inbound POs
          </div>
        </div>

        <div className="p-4 rounded-xl border border-os-border bg-os-surface/90">
          <div className="text-[10px] font-mono uppercase text-os-text-muted font-bold">
            Working Capital Opportunity
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {formatCurrency(63800000, currency)}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 mt-1">
            Recoverable in 90 Days (52% Yield)
          </div>
        </div>

        <div className="p-4 rounded-xl border border-os-border bg-os-surface/90">
          <div className="text-[10px] font-mono uppercase text-os-text-muted font-bold">
            Carrying Cost Savings Potential
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
            {formatCurrency(14200000, currency)}
          </div>
          <div className="text-[10px] font-mono text-os-text-muted mt-1">
            Annualized Holding Cost Reductions
          </div>
        </div>

        <div className="p-4 rounded-xl border border-os-border bg-os-surface/90">
          <div className="text-[10px] font-mono uppercase text-os-text-muted font-bold">
            Revenue at Risk from Stockouts
          </div>
          <div className="text-2xl font-mono font-bold text-red-400 mt-1">
            {formatCurrency(8400000, currency)}
          </div>
          <div className="text-[10px] font-mono text-red-400 mt-1">
            Mitigated via Rebalancing Actions
          </div>
        </div>
      </div>

      {/* DETAILED WORKING CAPITAL STRATEGY BREAKDOWN */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-os-text-primary font-mono">
              Working Capital Optimization Pipeline
            </h3>
            <p className="text-xs text-os-text-secondary mt-0.5 font-mono">
              Deterministic balance-sheet impacts calculated across all governed optimization levers.
            </p>
          </div>
          <button
            onClick={() => onAskCopilot("Provide detailed CFO balance sheet impact model for inventory working capital release.")}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono transition-colors"
          >
            Ask CFO Copilot Analysis
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-os-border bg-os-surface-elevated/40 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block">
              1. Purchase Order Rescheduling
            </span>
            <div className="text-lg font-mono font-bold text-os-text-primary">
              +$41.2M Cash Deferral
            </div>
            <p className="text-xs text-os-text-secondary font-mono leading-relaxed">
              Deferring 23 supplier commitments prevents premature inventory build at destination warehouses without impacting customer deliveries.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-os-border bg-os-surface-elevated/40 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">
              2. Cross-Location Stock Rebalancing
            </span>
            <div className="text-lg font-mono font-bold text-os-text-primary">
              +$1.72M Net Procurement Avoidance
            </div>
            <p className="text-xs text-os-text-secondary font-mono leading-relaxed">
              Transferring existing safety stock between hubs avoids redundant PO issuance while eliminating urgent air-freight premiums.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-os-border bg-os-surface-elevated/40 space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-purple-400 block">
              3. Dynamic Buffer Recalibration
            </span>
            <div className="text-lg font-mono font-bold text-os-text-primary">
              +$22.6M Inventory Reduction
            </div>
            <p className="text-xs text-os-text-secondary font-mono leading-relaxed">
              Reducing post-peak safety buffers on 1,204 high-stability SKUs permanently decreases working capital tie-up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
