import React, { useState } from 'react';
import { 
  HelpCircle, Search, Filter, HelpCircle as HelpIcon, ArrowRight,
  ShieldCheck, AlertTriangle, RefreshCw, BarChart2, Info, Sparkles 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const InformationGapsView: React.FC = () => {
  const [selectedGap, setSelectedGap] = useState<number>(0);

  const gaps = [
    {
      id: 'GAP-001',
      title: 'Unconfirmed Carrier final road-haul arrival window',
      source: 'Carrier FedEx Express (GPS stream offline)',
      impact: 'Reduces arrival confidence from 94% to 65%. Staging dock plans cannot be pre-assigned.',
      remediation: 'Dispatch automatic REST API ping or SMS callback request to dispatch terminal.',
      resolvedConfidence: 94,
      complexity: 'Low (Automated ping)',
      category: 'Logistics'
    },
    {
      id: 'GAP-002',
      title: 'Missing Sub-tier metallurgical copper certifications',
      source: 'Supplier Apex Components (Batch QA Portal)',
      impact: 'Delays quality release by 24 hours. Inventory remains quarantined at port dock.',
      remediation: 'Trigger supplier Portal notification request with high-priority SLA penalty warning.',
      resolvedConfidence: 98,
      complexity: 'Medium (Supplier action needed)',
      category: 'Quality'
    },
    {
      id: 'GAP-003',
      title: 'Unverified custom clearance duration estimates',
      source: 'Port of Mumbai Custom Broker (Inbound Ocean)',
      impact: 'Forces 3-day worst-case buffer pre-allocation, locking up alternate stock orders.',
      remediation: 'Verify historical broker clearance times or ping broker terminal agent manually.',
      resolvedConfidence: 91,
      complexity: 'High (Manual communication)',
      category: 'Procurement'
    }
  ];

  const activeGap = gaps[selectedGap];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
              INFORMATION GAPS
            </span>
            <span className="text-xs font-mono text-slate-500">KNOWLEDGE FIDELITY TRACKER</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Information Intelligence</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Map, monitor, and resolve information gaps where lack of real-time data or confirmations degrades overall system decision confidence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Interactive Gap Ledger */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase flex items-center justify-between">
              <span>Active Information Gaps</span>
              <span className="text-[9px] text-slate-500 font-normal">Sensing live ERP & IoT feeds</span>
            </div>

            <div className="divide-y divide-slate-900">
              {gaps.map((gap, idx) => (
                <div 
                  key={gap.id} 
                  onClick={() => setSelectedGap(idx)}
                  className={cn(
                    "p-5 space-y-3 cursor-pointer transition-colors",
                    selectedGap === idx ? "bg-slate-900/30" : "hover:bg-slate-900/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary text-xs uppercase flex items-center gap-2">
                      <span className="text-amber-400">▪</span>
                      {gap.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-800 text-slate-500">
                      {gap.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-os-text-muted text-[10px] pt-1">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">SOURCE OF GAP:</span>
                      <span className="text-os-text-secondary">{gap.source}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">COMPLEXITY TO RESOLVE:</span>
                      <span className="text-os-text-secondary">{gap.complexity}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">TARGET CONFIDENCE IF RESOLVED:</span>
                      <span className="text-emerald-400 font-bold">↑ {gap.resolvedConfidence}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Gap Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Data trust mapping engine"
            freshness="Calculated real-time"
            confidence={84}
            method="Fidelity gap identification metrics"
            mode="insufficient"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              RESOLVING GAP {activeGap.id}
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">OPERATIONAL IMPACT:</span>
                <p className="text-os-text-secondary font-sans text-xs leading-relaxed">{activeGap.impact}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">REMEDIATION PATHWAY:</span>
                <p className="text-emerald-400 font-sans text-xs font-bold leading-relaxed">{activeGap.remediation}</p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-end">
                <button className="px-3 py-1.5 bg-[#00F2FE]/10 hover:bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/30 rounded-lg text-[10px] font-bold uppercase transition-all">
                  TRIGGER GAP DISCOVERY
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
