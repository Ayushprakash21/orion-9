import React from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { DollarSign, TrendingUp, ArrowUpRight, BarChart3 } from 'lucide-react';

export const CostOptimizer: React.FC = () => {
  const { inventory } = useSupplyChain();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              FINANCIAL INTELLIGENCE
            </span>
            <span className="text-xs font-mono text-os-text-muted">COST OPTIMIZER</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Supply Chain Cost Optimizer</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Analyze procurement, freight, carrying costs, and identify data-driven savings opportunities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono text-os-text-muted uppercase">Current Monthly Procurement</span>
          <div className="text-2xl font-bold font-mono text-os-text-primary">₹42,850,000</div>
          <span className="text-xs text-emerald-400 font-medium">+1.4% vs previous period</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono text-os-text-muted uppercase">Optimized Estimate</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">₹39,120,000</div>
          <span className="text-xs text-cyan-400 font-medium">Potential Savings identified</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-2">
          <span className="text-xs font-mono text-os-text-muted uppercase">Inventory Carrying Cost</span>
          <div className="text-2xl font-bold font-mono text-os-text-primary">₹6,420,000</div>
          <span className="text-xs text-os-text-secondary">Optimizing safety buffers</span>
        </div>
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-os-text-primary">Identified Cost Reduction Opportunities</h3>
        <div className="space-y-3">
          <div className="p-4 bg-os-surface-secondary border border-os-border rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-os-text-primary">Consolidate Supplier Batches for High-Volume SKUs</h4>
              <p className="text-[11px] text-os-text-secondary mt-0.5">Reduce freight frequency by grouping orders into weekly consolidated shipments.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded">
              Est. Saving: ₹1,850,000
            </span>
          </div>
          <div className="p-4 bg-os-surface-secondary border border-os-border rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-os-text-primary">Safety Stock Rebalancing across Regional Hubs</h4>
              <p className="text-[11px] text-os-text-secondary mt-0.5">Reallocate excess buffer stock from Hub A to Hub B to prevent expedite fees.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold rounded">
              Est. Saving: ₹940,000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
