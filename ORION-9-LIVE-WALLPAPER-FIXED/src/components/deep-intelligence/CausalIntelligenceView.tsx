import React, { useState } from 'react';
import { 
  GitCommit, ChevronDown, CheckCircle2, ShieldAlert, ArrowRight,
  Zap, Info, RefreshCw, BarChart2, Server, TrendingUp, Cpu
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionEvidencePanel, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const CausalIntelligenceView: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<'delay' | 'quality' | 'weather'>('delay');

  const cases = {
    delay: {
      title: 'Supplier Late Delivery Delay Chain',
      confidence: 96,
      dataConfidence: 94,
      chain: [
        { title: 'ROOT CAUSE', desc: 'Labor strikes at port of dispatch', active: true },
        { title: 'PRIMARY EVENT', desc: 'Shipment delayed by 8 days', active: true },
        { title: 'CONSEQUENCE', desc: 'Inbound raw materials stock stockout', active: true },
        { title: 'SECOND-ORDER EFFECT', desc: 'Product assembly Batch 42 suspended', active: true },
        { title: 'BUSINESS IMPACT', desc: 'Siemens SLA exposure of $140,000', active: true }
      ],
      evidences: [
        'Port dispatch logs indicating 84% dwell-time expansion.',
        'WMS real-time inventory checks showing on-hand safety stocks at 1.2 days.',
        'Production schedules verifying Siemens assembly constraints.'
      ]
    },
    quality: {
      title: 'Copper Core Batch Defect Chain',
      confidence: 88,
      dataConfidence: 91,
      chain: [
        { title: 'ROOT CAUSE', desc: 'Impure ore mix at sub-tier smelter', active: true },
        { title: 'PRIMARY EVENT', desc: 'Material defect rate exceeds 4%', active: true },
        { title: 'CONSEQUENCE', desc: 'Quality hold issued on 1,200 components', active: true },
        { title: 'SECOND-ORDER EFFECT', desc: 'Secondary supplier sourcing active', active: true },
        { title: 'BUSINESS IMPACT', desc: 'Freight expedite cost surge of $12,500', active: true }
      ],
      evidences: [
        'Supplier QA reporting 4.2% metallurgical defect rates.',
        'Material reservation system triggering automated quality quarantines.',
        'Awaiting alternate supplier lead-time confirmations.'
      ]
    },
    weather: {
      title: 'Severe Midwest Storm Sourcing Interruption',
      confidence: 92,
      dataConfidence: 89,
      chain: [
        { title: 'ROOT CAUSE', desc: 'Midwest Blizzard Category 4', active: true },
        { title: 'PRIMARY EVENT', desc: 'Road corridors closed for 48 hours', active: true },
        { title: 'CONSEQUENCE', desc: 'Carrier pickup failures at regional hub', active: true },
        { title: 'SECOND-ORDER EFFECT', desc: 'Cross-docking operations delayed', active: true },
        { title: 'BUSINESS IMPACT', desc: 'Customer delivery delays for 4 distribution centers', active: true }
      ],
      evidences: [
        'National weather corridors under severe storm warnings.',
        'Carrier dispatch GPS feeds indicating zero vehicle velocities.'
      ]
    }
  };

  const activeCase = cases[selectedCase];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
              CAUSAL INTELLIGENCE
            </span>
            <span className="text-xs font-mono text-slate-500">ROOT-CAUSE & DOWNSTREAM PROPAGATION</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Causal Intelligence Chain</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Analyzing causal relationships rather than simple correlations to outline exact disruption pathways and second-order impacts.
          </p>
        </div>

        <div className="flex gap-2">
          {(Object.keys(cases) as Array<keyof typeof cases>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedCase(key)}
              className={cn(
                "px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border",
                selectedCase === key 
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/40" 
                  : "bg-slate-950 border-slate-900 text-slate-500 hover:text-os-text-secondary"
              )}
            >
              {cases[key].title.split(' ')[0]} Case
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Causal Chain Diagram */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-20" />
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 relative z-10">
              <span className="font-mono text-xs font-bold text-os-text-primary uppercase">{activeCase.title}</span>
              <div className="flex items-center gap-4">
                <OrionConfidence score={activeCase.confidence} label="CAUSAL CONFIDENCE" color="text-purple-400" />
              </div>
            </div>

            {/* Horizontal or Vertical Flow list */}
            <div className="flex flex-col space-y-4 relative z-10">
              {activeCase.chain.map((node, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/35 border border-slate-900 hover:border-slate-800 rounded-xl gap-4">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      0{i + 1}
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">{node.title}</span>
                      <span className="text-sm font-bold text-os-text-primary font-sans">{node.desc}</span>
                    </div>
                  </div>
                  {i < activeCase.chain.length - 1 && (
                    <div className="hidden sm:block text-slate-700 font-bold px-4">
                      <ArrowRight size={14} className="animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Causal Verification Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Gemini Cognitive Inference Layer"
            freshness="Calculated real-time"
            confidence={activeCase.dataConfidence}
            method="Causal inference verification"
          />

          <OrionEvidencePanel evidences={activeCase.evidences} />
        </div>

      </div>

    </div>
  );
};
