import React, { useState } from 'react';
import { 
  ShieldCheck, Eye, Clock, Activity, ArrowRight,
  TrendingUp, Compass, Sparkles, Filter, ChevronRight, HelpCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const PoliciesView: React.FC = () => {
  const [policies, setPolicies] = useState([
    {
      id: 'POL-01',
      title: 'Automated Airfreight Expediting (Siemens SLA Protect)',
      trigger: 'Shipment Delayed AND Carrier === "Inbound Ocean" AND Days >= 4',
      condition: 'Remaining safety buffer <= 3.2 days AND Product in Critical Customers list',
      action: 'Automatically propose FedEx alternate flight and pre-hold reservation',
      autonomyLevel: 'Level 4 (Full Autopilot Proposed)',
      active: true,
      lastExecuted: 'Yesterday'
    },
    {
      id: 'POL-02',
      title: 'Dynamic Warehouse Stock Rebalancing',
      trigger: 'Warehouse Capacity >= 85% AND Inbound Scheduled Volume >= 1,200 pallets',
      condition: 'Backup Depot (Delhi Transit) capacity utilization <= 45%',
      action: 'Automatically redirect secondary carriers to backup transit coordinates',
      autonomyLevel: 'Level 3 (Human-in-the-loop approval)',
      active: true,
      lastExecuted: '3 days ago'
    },
    {
      id: 'POL-03',
      title: 'Supplier Delay Performance Escalation Protocol',
      trigger: 'Supplier Defect Rate >= 4.0% OR On-time delivery <= 75%',
      condition: 'Total Open PO volume >= $50,000 with Supplier Apex',
      action: 'Automate formal quality warning email dispatch with legal contract SLAs attached',
      autonomyLevel: 'Level 4 (Full Autopilot Proposed)',
      active: false,
      lastExecuted: 'Never'
    }
  ]);

  const togglePolicy = (id: string) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 rounded font-bold">
              POLICY CENTER
            </span>
            <span className="text-xs font-mono text-slate-500">AUTONOMY PROTOCOL MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Orion Policy Engine</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Configure system operational boundaries and define Level 4 triggers, conditions, and autonomous actions for the AI autopilot.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Policies Ledger */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase flex items-center justify-between">
              <span>Configured System Policies</span>
              <button className="px-2.5 py-1 bg-[#30D158]/10 hover:bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30 rounded text-[10px] font-bold uppercase transition-all">
                + ADD POLICY
              </button>
            </div>

            <div className="divide-y divide-slate-900">
              {policies.map((pol) => (
                <div key={pol.id} className="p-5 space-y-4 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-os-text-primary text-xs uppercase block">{pol.title}</span>
                      <span className="text-[10px] text-cyan-400 font-bold">{pol.autonomyLevel}</span>
                    </div>

                    <button 
                      onClick={() => togglePolicy(pol.id)}
                      className="p-1 hover:bg-slate-900 rounded transition-colors"
                    >
                      {pol.active ? (
                        <ToggleRight size={28} className="text-[#30D158]" />
                      ) : (
                        <ToggleLeft size={28} className="text-slate-600" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-os-text-muted text-[10px] bg-slate-900/20 p-3 rounded-lg border border-slate-900 leading-relaxed font-mono">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">TRIGGER:</span>
                      <span className="text-os-text-secondary font-bold">{pol.trigger}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">CONDITIONS:</span>
                      <span className="text-os-text-secondary font-bold">{pol.condition}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">ACTION DISPATCH:</span>
                      <span className="text-[#30D158] font-bold">{pol.action}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[9px] text-slate-500 uppercase font-bold">
                    <span>Last Autonomous Execution: <strong className="text-os-text-secondary">{pol.lastExecuted}</strong></span>
                    <span>Status: <strong className={pol.active ? 'text-[#30D158]' : 'text-slate-500'}>{pol.active ? 'ACTIVE' : 'INACTIVE'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Orion Autopilot Core rules"
            freshness="Sensing continuously"
            confidence={99}
            method="Deterministic rules-engine routing"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#30D158]" />
              AUTONOMY STATS
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Orion Policy Engine enables Level 4 autonomy by mapping **strictly deterministic triggers** with complex conditional checks. The active policy pool has prevented **2 potential disruptions** over the past 30 days.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
