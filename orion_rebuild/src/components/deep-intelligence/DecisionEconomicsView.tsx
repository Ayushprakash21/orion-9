import React, { useState } from 'react';
import { 
  TrendingUp, Clock, AlertTriangle, ShieldCheck, ArrowRight,
  TrendingDown, Percent, Info, HelpCircle, Activity, Sparkles 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const DecisionEconomicsView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'delay' | 'stockout'>('delay');

  const economics = {
    delay: {
      title: 'Mumbai Logistics Delay Response Economics',
      actionCost: '$14,500',
      waitingCost: '$8,200 / day',
      opportunityCost: '$120,000 Siemens SLA',
      expectedLoss: '$54,000 (probability weighted)',
      expectedBenefit: 'Saves $115,000 in SLA penalties',
      reversibility: 'High (Can cancel airfreight within 12h)',
      window: '14 Hours remaining',
      decayRate: 'Exposures escalate by 14% daily after window decay'
    },
    stockout: {
      title: 'SKU-402 Regional Quality Stoppage Response',
      actionCost: '$18,200',
      waitingCost: '$12,000 / day',
      opportunityCost: 'Assembly downtime and line idle costs',
      expectedLoss: '$92,000 (probability weighted)',
      expectedBenefit: 'Avoids total factory stoppage',
      reversibility: 'Low (Once alternative PO released, capital bound)',
      window: '3 Hours remaining',
      decayRate: 'Factory idle penalties trigger immediately upon window expiration'
    }
  };

  const activeEcon = economics[selectedScenario];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-[#30D158] border border-[#30D158]/20 rounded font-bold">
              DECISION ECONOMICS
            </span>
            <span className="text-xs font-mono text-slate-500">PROBABILISTIC COST OF INACTION</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Decision Economics</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Analyze expected losses, opportunity decay, and the cost of waiting versus the immediate cost of action.
          </p>
        </div>

        <div className="flex gap-2">
          {['delay', 'stockout'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedScenario(s as any)}
              className={cn(
                "px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border",
                selectedScenario === s 
                  ? "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/40" 
                  : "bg-slate-950 border-slate-900 text-slate-500 hover:text-os-text-secondary"
              )}
            >
              {s === 'delay' ? 'Logistics Delay' : 'Material Stockout'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Economics HUD Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <span className="font-mono text-xs font-bold text-os-text-primary uppercase">{activeEcon.title}</span>
              <span className="text-amber-400 font-mono font-bold text-xs flex items-center gap-1.5">
                <Clock size={12} />
                {activeEcon.window}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[11px]">
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[9px] font-bold block uppercase">COST OF IMMEDIATE ACTION:</span>
                  <div className="text-lg font-bold text-os-text-primary mt-1">{activeEcon.actionCost}</div>
                  <p className="text-[10px] text-slate-500 font-sans mt-1">Expedite delivery freight overhead or setup costs.</p>
                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[9px] font-bold block uppercase">DAILY COST OF WAITING:</span>
                  <div className="text-lg font-bold text-red-400 mt-1">{activeEcon.waitingCost}</div>
                  <p className="text-[10px] text-slate-500 font-sans mt-1">Accumulating penalty or buffer depletion rates.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[9px] font-bold block uppercase">TOTAL OPPORTUNITY COST EXPOSURE:</span>
                  <div className="text-lg font-bold text-amber-500 mt-1">{activeEcon.opportunityCost}</div>
                  <p className="text-[10px] text-slate-500 font-sans mt-1">Total revenue SLA or customer trust boundaries at risk.</p>
                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl">
                  <span className="text-slate-500 text-[9px] font-bold block uppercase">DECISION REVERSIBILITY STATE:</span>
                  <div className="text-lg font-bold text-[#30D158] mt-1">{activeEcon.reversibility}</div>
                  <p className="text-[10px] text-slate-500 font-sans mt-1">Sunk cost risk matrix upon execution of decision.</p>
                </div>
              </div>
            </div>

            {/* Simulated Opportunity Decay Curve */}
            <div className="border-t border-slate-900 pt-6 space-y-3 font-mono text-[10px]">
              <div className="flex justify-between items-center text-slate-500 font-bold">
                <span>ESTIMATED DECISION WAITING COST DECAY CORRIDOR:</span>
                <span className="text-red-400 uppercase tracking-widest">{activeEcon.decayRate}</span>
              </div>
              
              <div className="relative pt-6 h-28 bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden flex items-end">
                {/* Visual bar chart representing decay timeline */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px)] bg-[size:16px_100%] opacity-30" />
                <div className="flex-1 flex items-end justify-between px-6 h-full pb-2 relative z-10">
                  {[
                    { day: 'Now', val: 10, label: 'Standard Cost' },
                    { day: '12h', val: 24, label: 'Escalation Peak' },
                    { day: '24h', val: 48, label: 'SLA Triggered' },
                    { day: '36h', val: 75, label: 'High Exposure' },
                    { day: '48h', val: 100, label: 'Factory Idle' }
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 w-16">
                      <div className="text-[8px] text-os-text-muted font-bold">{d.day}</div>
                      <div className="w-4 bg-red-500/25 border-t border-red-400 transition-all duration-500" style={{ height: `${d.val * 0.6}px` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Financial ledger mapping"
            freshness="Updated hourly"
            confidence={95}
            method="Deterministic exposure mapping curves"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#30D158]" />
              FINANCIAL AUDIT
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Orion calculates expected loss using: **Loss Probability (84%) x Financial SLA Severity**. Expediting now results in immediate return-on-investment of **+$100,500** saved in penalty exposure.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
