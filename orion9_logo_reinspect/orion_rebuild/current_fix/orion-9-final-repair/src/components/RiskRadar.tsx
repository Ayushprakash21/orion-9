import React from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { ShieldAlert, AlertTriangle, Shield, TrendingDown } from 'lucide-react';

export const RiskRadar: React.FC = () => {
  const { suppliers, inventory, shipments } = useSupplyChain();

  const risks = [
    { category: 'Supplier Disruption Risk', score: 'Low (14%)', trend: 'Stable', owner: 'Procurement Engine' },
    { category: 'Demand Volatility Risk', score: 'Medium (38%)', trend: 'Rising', owner: 'Demand Intelligence' },
    { category: 'Inventory Stockout Risk', score: 'Low (8%)', trend: 'Declining', owner: 'Inventory Optimization' },
    { category: 'Logistics Route Delay Risk', score: 'Medium (42%)', trend: 'Rising', owner: 'Logistics Autopilot' },
    { category: 'Contract Compliance Risk', score: 'Low (5%)', trend: 'Stable', owner: 'Legal & Contract Intelligence' },
    { category: 'Financial Exposure', score: 'Low (12%)', trend: 'Stable', owner: 'Working Capital Engine' },
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              RISK ENGINE
            </span>
            <span className="text-xs font-mono text-os-text-muted">GLOBAL EXPOSURE MATRIX</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Supply Chain Risk Radar</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Continuous multi-category vulnerability assessment, exposure analysis, and automated mitigation policies.
          </p>
        </div>
      </div>

      {/* Risk Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {risks.map((risk, idx) => (
          <div key={idx} className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4 shadow-sm hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-os-text-muted">{risk.owner}</span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                {risk.trend}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-os-text-primary">{risk.category}</h3>
              <div className="text-2xl font-bold font-mono text-os-text-primary mt-1">{risk.score}</div>
            </div>

            <div className="pt-3 border-t border-os-border/50 flex items-center justify-between text-xs text-os-text-secondary">
              <span>Mitigation Status:</span>
              <span className="font-mono text-emerald-400">Policy Protected</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
