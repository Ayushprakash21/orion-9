import React, { useState } from 'react';
import { 
  CheckCircle2, Eye, Clock, Activity, ArrowRight,
  TrendingUp, Compass, Sparkles, Filter, ChevronRight, HelpCircle 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const OutcomesView: React.FC = () => {
  const outcomes = [
    {
      id: 'OUT-01',
      decision: 'Airfreight alternate route for PO-2026-0012',
      expected: 'Arrive by Sept 12th. Production assembly retained with zero stockouts.',
      actual: 'Arrived Sept 11th. Assembly remained active. Siemens SLA saved.',
      gap: '-1.1 days ahead of target clearance projections.',
      accuracy: 98,
      learned: 'Revised custom clearance velocity models for Delhi Airport by +8.4%.'
    },
    {
      id: 'OUT-02',
      decision: 'Delhi Warehouse Pallet Reroute (Alpha to Backup Transit)',
      expected: 'Clear dock queue backlog within 48 hours. Average truck wait down to 45 mins.',
      actual: 'Dock queue cleared in 54 hours. Average wait dropped to 52 mins.',
      gap: '+6.2 hours delay against expectations due to temporary forklift fuel shortage.',
      accuracy: 89,
      learned: 'Added active warehouse materials staging capability as a secondary constraint.'
    }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-[#30D158] border border-[#30D158]/20 rounded font-bold">
              OUTCOME VERIFICATION
            </span>
            <span className="text-xs font-mono text-slate-500">CLOSED-LOOP ACCURACY AUDITS</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Outcome Engine</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Auditing previous AI and human decisions to verify realized outcomes, analyze prediction gaps, and dynamically tune the underlying supply chain world model.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Outcomes list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase">
              Closed-Loop Decision Audits
            </div>

            <div className="divide-y divide-slate-900">
              {outcomes.map((out) => (
                <div key={out.id} className="p-5 space-y-4 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary text-xs uppercase block">{out.decision}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-800 text-[#30D158]">
                      Verified Accuracy {out.accuracy}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-os-text-muted text-[11px] leading-relaxed font-sans">
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[9px] font-bold block">EXPECTED MODEL OUTCOME:</span>
                      <p className="text-os-text-secondary mt-1">{out.expected}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[9px] font-bold block">ACTUAL MEASURED OUTCOME:</span>
                      <p className="text-os-text-secondary mt-1">{out.actual}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-os-text-muted text-[10px] bg-slate-900/20 p-3 rounded-lg border border-slate-900 font-mono">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">MODEL TO ACTUATOR GAP:</span>
                      <span className="text-amber-500 font-bold">{out.gap}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">SYSTEMIC MODEL LEARNED CORRECTION:</span>
                      <span className="text-[#30D158] font-bold">{out.learned}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Closed-loop outcome engine ledger"
            freshness="Audited daily"
            confidence={99}
            method="Deterministic expected vs realized comparison"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#30D158]" />
              ACCURACY SCORES
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Closed-loop verifying decision outcomes allows Orion to maintain **93.5% model fidelity**, dynamically adjusting transit corridors and custom clearance weights based on actual performance data.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
