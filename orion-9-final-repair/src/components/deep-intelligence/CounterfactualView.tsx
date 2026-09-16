import React, { useState } from 'react';
import { 
  BarChart2, Play, GitBranch, ArrowRight, TrendingUp, HelpCircle,
  TrendingDown, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle as HelpIcon, Sparkles
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const CounterfactualView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<'shipment_delay' | 'supplier_failure'>('shipment_delay');
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('B');

  const options = {
    A: { name: 'Do Nothing', cost: '$0', exposure: '$140,000', service: 'Critical Low (42%)', cash: 'Normal', recovery: '14 Days', confidence: 98 },
    B: { name: 'Expedite via Airfreight', cost: '+$14,500', exposure: '$5,000', service: 'Saves SLA (96%)', cash: '-$14,500 Buffer', recovery: '3 Days', confidence: 92 },
    C: { name: 'Route to Alternate Supplier', cost: '+$18,200', exposure: '$12,000', service: 'High (91%)', cash: '-$18,200 Balance', recovery: '6 Days', confidence: 85 },
    D: { name: 'Reallocate Delhi Warehouse Buffer', cost: '+$2,200', exposure: '$35,000', service: 'Medium (80%)', cash: 'Normal', recovery: '8 Days', confidence: 89 },
    E: { name: 'Adjust Customer Priority Allocation', cost: '+$5,000', exposure: '$80,000', service: 'Saves Siemens Only', cash: 'Stable', recovery: '10 Days', confidence: 94 }
  };

  const runSimulation = () => {
    // mock trigger
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 rounded font-bold">
              COUNTERFACTUAL DECISION ENGINE
            </span>
            <span className="text-xs font-mono text-slate-500">WHAT-IF SCENARIO STRESS LABORATORY</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Counterfactual Scenario Planner</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Evaluate alternative responses to operational events, weighing exact financial exposures, cash buffers, and customer service indices before committing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scenario Config & Comparisons */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-900 pb-4">
              <div className="space-y-1 font-mono text-xs">
                <span className="text-slate-500 uppercase font-bold text-[9px] block">SELECT DISRUPTION SEED:</span>
                <select 
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 text-os-text-primary px-3 py-1.5 rounded-lg outline-none uppercase font-bold text-[11px]"
                >
                  <option value="shipment_delay">Shipment delayed by 7 days (Mumbai ocean corridor)</option>
                  <option value="supplier_failure">Supplier Quality quarantine hold (SKU-402 defect)</option>
                </select>
              </div>

              <button 
                onClick={runSimulation}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2"
              >
                <Play size={12} fill="white" />
                <span>Run Simulation</span>
              </button>
            </div>

            {/* Strategy Select Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(Object.keys(options) as Array<keyof typeof options>).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedOption(opt)}
                  className={cn(
                    "p-3 rounded-xl border text-left font-mono transition-all flex flex-col justify-between space-y-2",
                    selectedOption === opt 
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.05)]" 
                      : "bg-slate-900/40 border-slate-900 text-os-text-muted hover:border-slate-800 hover:text-os-text-primary"
                  )}
                >
                  <span className="text-[9px] text-slate-500 uppercase font-bold">OPTION {opt}</span>
                  <div className="text-[11px] font-bold uppercase line-clamp-2 leading-tight h-8">{options[opt].name}</div>
                </button>
              ))}
            </div>

            {/* Visual Comparison Telemetry */}
            <div className="border-t border-slate-900 pt-6 space-y-4 font-mono text-[11px]">
              <span className="text-slate-500 uppercase font-bold text-[9px] block">STRATEGY MATRIX COMPARISON:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">STRATEGY EXTRA COST:</span>
                    <span className="text-sm font-bold text-os-text-primary">{options[selectedOption].cost}</span>
                  </div>
                  <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">REVENUE EXPOSURE:</span>
                    <span className={cn("text-sm font-bold", options[selectedOption].exposure !== '$0' ? 'text-red-400' : 'text-os-text-primary')}>
                      {options[selectedOption].exposure}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">CUSTOMER SERVICE INDEX:</span>
                    <span className="text-sm font-bold text-os-text-primary">{options[selectedOption].service}</span>
                  </div>
                  <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg">
                    <span className="text-slate-500 block text-[8px] uppercase font-bold">RECOVERY TIME WINDOW:</span>
                    <span className="text-sm font-bold text-os-text-primary">{options[selectedOption].recovery}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-strategy Comparison Bar Charts (HTML-based representation) */}
            <div className="border-t border-slate-900 pt-6 space-y-3 font-mono text-[10px]">
              <span className="text-slate-500 uppercase font-bold text-[9px] block">REVENUE RISK REDUCTION % COMPARISON:</span>
              <div className="space-y-2">
                {[
                  { opt: 'A', label: 'Do Nothing', pct: 0, color: 'bg-red-500' },
                  { opt: 'B', label: 'Expedite via Air', pct: 96, color: 'bg-cyan-400' },
                  { opt: 'C', label: 'Alternate Supplier', pct: 91, color: 'bg-cyan-400/80' },
                  { opt: 'D', label: 'Warehouse Reallocate', pct: 75, color: 'bg-purple-400' },
                  { opt: 'E', label: 'Customer Priority Swap', pct: 42, color: 'bg-amber-400' }
                ].map((item) => (
                  <div key={item.opt} className="flex items-center gap-3">
                    <span className="w-24 text-os-text-muted font-bold uppercase shrink-0 truncate">{item.opt} - {item.label}</span>
                    <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="w-8 text-os-text-secondary text-right font-bold">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 font-mono text-[9px] font-bold uppercase pt-4 border-t border-slate-900">
              <button className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-cyan-400">
                APPLY TO SCENARIO PLANNER
              </button>
              <button className="px-3 py-2 bg-[#30D158]/10 hover:bg-[#30D158]/20 border border-[#30D158]/30 rounded-lg text-[#30D158]">
                CREATE DECISION BLOCK
              </button>
              <button className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-purple-400">
                REQUEST DISPATCH APPROVAL
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Data Trust & Confidence */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Stochastic modeling engine"
            freshness="Simulated context"
            confidence={94}
            method="Counterfactual scenario comparison matrix"
            mode="simulated"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              ORION INSIGHT
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Based on historical memory index **MEM-001**, expediting shipping pathways reduces total recovery window by **11 days**, retaining **96% Siemens SLA integrity** at a margin reduction of only **$14,500**. Do nothing results in immediate exception.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
