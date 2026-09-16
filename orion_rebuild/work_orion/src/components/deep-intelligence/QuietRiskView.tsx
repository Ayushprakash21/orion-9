import React, { useState } from 'react';
import { 
  Eye, AlertTriangle, ShieldCheck, Clock, Activity, ArrowRight,
  TrendingUp, Compass, Sparkles, Filter, ChevronRight, HelpCircle 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const QuietRiskView: React.FC = () => {
  const quietRisks = [
    {
      id: 'QRSK-01',
      title: 'Supplier Apex Components Promise strength decay',
      drift: 'On-time delivery (OTIF) rate has drifted downwards from 94% to 72% over 60 days.',
      exposure: 'No immediate alert breached, but likelihood of shipping delay on next 3 POs rose by 42%.',
      remediation: 'Initiate dynamic supplier lead-time buffer adjustments (+2 days) in ERP system.'
    },
    {
      id: 'QRSK-02',
      title: 'Delhi Warehouse labor unloading dwell time creep',
      drift: 'Average container staging dock unloading times crawled from 35 mins to 54 mins over 3 weeks.',
      exposure: 'Staging buffers will deplete 1.4 days faster than simulated, increasing warehouse congestion hazard.',
      remediation: 'Reallocate 2 forklift operators to inbound dock shifts starting tomorrow.'
    }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
              NEGATIVE SPACE INTELLIGENCE
            </span>
            <span className="text-xs font-mono text-slate-500">SLOW-BURNING DECAY DETECTOR</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Quiet Risk (Negative Space)</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Detecting slow operational drifts and decay patterns that bypass traditional hard alerts but quietly compromise long-term supply chain resilience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Quiet Risks list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase">
              Surfaced Negative Space Drifts & Quiet Risks
            </div>

            <div className="divide-y divide-slate-900">
              {quietRisks.map((risk) => (
                <div key={risk.id} className="p-5 space-y-4 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary text-xs uppercase block">{risk.title}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Quiet Drift Detected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-os-text-muted text-[11px] leading-relaxed font-sans">
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[9px] font-bold block">SLOW SLIPPERY DRIFT:</span>
                      <p className="text-os-text-secondary mt-1">{risk.drift}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[9px] font-bold block">FUTURE RISK EXPOSURE:</span>
                      <p className="text-red-400 font-bold mt-1">{risk.exposure}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[9px] text-slate-500 uppercase font-bold">
                    <span>RECOMMENDED DAMPENING RESPONSE: <strong className="text-os-text-secondary">{risk.remediation}</strong></span>
                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <span>ENGAGE</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Negative Space sensor"
            freshness="Audited daily"
            confidence={95}
            method="Drift analytics modeling"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              SENSE REASONING
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Negative Space Intelligence indexes the "quiet space" of your logistics network. Traditional telemetry monitors high-volume spikes, whereas Orion monitors the slow, silent decay rates to prevent silent disruptions.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
