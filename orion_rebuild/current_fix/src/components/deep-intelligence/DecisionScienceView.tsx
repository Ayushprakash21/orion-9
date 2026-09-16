import React, { useState } from 'react';
import { Compass, Scale, GitBranch, ArrowRight, ShieldCheck, AlertCircle, DollarSign, Clock } from 'lucide-react';

export const DecisionScienceView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'do_nothing' | 'expedite' | 'switch_supplier' | 'reallocate'>('expedite');

  const scenarios = {
    do_nothing: {
      name: 'Option A: Do Nothing',
      cost: '₹0 (Immediate)',
      lossAvoided: '₹0',
      serviceImpact: '-18% Stockout Risk',
      workingCapital: 'No Impact',
      reversibility: 'High',
      secondOrder: 'Customer SLA penalties, revenue loss of ₹1.4M in 14 days.',
      regretScore: '84/100 (High Regret)'
    },
    expedite: {
      name: 'Option B: Expedite Air Freight',
      cost: '₹140,000',
      lossAvoided: '₹1,250,000',
      serviceImpact: '100% SLA Maintained',
      workingCapital: '-₹140,000 Immediate',
      reversibility: 'Irreversible',
      secondOrder: 'Freight budget overrun, minor receiving dock congestion.',
      regretScore: '12/100 (Low Regret)'
    },
    switch_supplier: {
      name: 'Option C: Switch to Secondary Supplier (Zenith)',
      cost: '₹210,000',
      lossAvoided: '₹1,100,000',
      serviceImpact: '95% SLA Maintained',
      workingCapital: '-₹210,000',
      reversibility: 'Moderate',
      secondOrder: 'Requires quality sampling signoff (+12 hours).',
      regretScore: '28/100 (Medium Regret)'
    },
    reallocate: {
      name: 'Option D: Inter-Warehouse Buffer Reallocation',
      cost: '₹45,000',
      lossAvoided: '₹800,000',
      serviceImpact: '82% SLA Maintained',
      workingCapital: 'Neutral',
      reversibility: 'High',
      secondOrder: 'Leaves Regional DC with reduced safety buffer.',
      regretScore: '35/100 (Medium Regret)'
    }
  };

  const current = scenarios[selectedScenario];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-secondary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              DECISION SCIENCE
            </span>
            <span className="text-xs font-mono text-os-text-muted">COUNTERFACTUAL LAB & TOURNAMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Counterfactual Lab & Decision Arbitration</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Evaluate second-order consequences, decision collisions, strategic regret, and economic trade-offs before execution.
          </p>
        </div>
      </div>

      {/* Counterfactual Lab Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios List / Selector */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
            <GitBranch size={16} className="text-cyan-400" /> Scenario Tournament
          </h3>
          {(['do_nothing', 'expedite', 'switch_supplier', 'reallocate'] as const).map((scKey) => {
            const sc = scenarios[scKey];
            const isSelected = selectedScenario === scKey;
            return (
              <div
                key={scKey}
                onClick={() => setSelectedScenario(scKey)}
                className={`p-4 border rounded-xl bg-os-surface cursor-pointer transition-all duration-200 hover:border-[#00F2FE] space-y-2
                  ${isSelected ? 'border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.1)] bg-os-surface-hover' : 'border-os-border'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-os-text-primary">{sc.name}</span>
                  {scKey === 'expedite' && (
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      ORION Rank #1
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-os-text-muted">
                  <span>Cost: {sc.cost}</span>
                  <span className="text-cyan-400">Avoided: {sc.lossAvoided}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Scenario Analysis Workspace */}
        <div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-os-border pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-os-text-muted">Active Simulation Analysis</span>
              <h2 className="text-lg font-bold text-os-text-primary">{current.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-os-text-muted">Strategic Regret Score</span>
              <div className="text-sm font-mono font-bold text-amber-400">{current.regretScore}</div>
            </div>
          </div>

          {/* Decision Economics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg space-y-1">
              <div className="text-os-text-muted text-[10px] uppercase">Direct Cost</div>
              <div className="font-bold text-os-text-primary">{current.cost}</div>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg space-y-1">
              <div className="text-os-text-muted text-[10px] uppercase">Avoided Loss</div>
              <div className="font-bold text-emerald-400">{current.lossAvoided}</div>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg space-y-1">
              <div className="text-os-text-muted text-[10px] uppercase">Service Level</div>
              <div className="font-bold text-cyan-400">{current.serviceImpact}</div>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg space-y-1">
              <div className="text-os-text-muted text-[10px] uppercase">Reversibility</div>
              <div className="font-bold text-purple-400">{current.reversibility}</div>
            </div>
          </div>

          {/* Second-Order Consequences & Collision */}
          <div className="space-y-4">
            <div className="p-4 bg-os-surface-secondary border border-os-border rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-os-text-primary flex items-center gap-2">
                <Scale size={14} className="text-amber-400" /> Second-Order Consequences & Trade-Offs
              </h4>
              <p className="text-xs text-os-text-secondary font-mono leading-relaxed">{current.secondOrder}</p>
            </div>

            <div className="p-4 bg-os-surface-secondary border border-os-border rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-os-text-primary flex items-center gap-2">
                <Compass size={14} className="text-cyan-400" /> Decision Arbitration & Objective Alignment
              </h4>
              <p className="text-xs text-os-text-secondary font-mono leading-relaxed">
                Working Capital Team objective (minimize immediate outlay) conflicts with Service SLA objective (100% fulfillment).
                ORION Arbitration Rule: <span className="text-cyan-400 font-bold">Revenue Protection Priority (&gt; ₹1M value threshold)</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
