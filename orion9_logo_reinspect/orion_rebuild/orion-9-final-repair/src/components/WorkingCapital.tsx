import React from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { DollarSign, BarChart3 } from 'lucide-react';

export const WorkingCapital: React.FC = () => {
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
            <span className="text-xs font-mono text-os-text-muted">WORKING CAPITAL</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Working Capital Intelligence</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Track cash tied in inventory, excess stock, slow-moving assets, and capital release opportunities.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Total Inventory Value</span>
          <div className="text-2xl font-bold font-mono text-os-text-primary">₹128,400,000</div>
          <span className="text-[11px] text-os-text-secondary">Across all regional warehouses</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Excess Capital</span>
          <div className="text-2xl font-bold font-mono text-amber-400">₹14,200,000</div>
          <span className="text-[11px] text-amber-400 font-medium">Above maximum safety threshold</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Slow-Moving Capital</span>
          <div className="text-2xl font-bold font-mono text-os-text-primary">₹8,900,000</div>
          <span className="text-[11px] text-os-text-secondary">No movement in 90 days</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Potential Release</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">₹11,500,000</div>
          <span className="text-[11px] text-emerald-400 font-medium">Actionable via Orion AI</span>
        </div>
      </div>
    </div>
  );
};
