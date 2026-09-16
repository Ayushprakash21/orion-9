import React, { useState } from 'react';
import { 
  Lock, AlertTriangle, ShieldCheck, Clock, Activity, ArrowRight,
  TrendingUp, TrendingDown, RefreshCw, BarChart2, Info, Sparkles 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const ConstraintsView: React.FC = () => {
  const [selectedConstraint, setSelectedConstraint] = useState<number>(0);

  const constraints = [
    {
      id: 'CON-01',
      title: 'Warehouse Staging Floor Capacity Limit',
      resource: 'Regional Warehouse Alpha (Delhi)',
      limit: '10,000 pallets',
      utilized: '8,420 pallets',
      rate: 84.2,
      effect: 'Breach results in immediate inbound container dock delays, causing truck queue times to spiral from 35 mins to +2.5 hours.',
      severity: 'High'
    },
    {
      id: 'CON-02',
      title: 'Supplier Weekly Component Production Cap',
      resource: 'Supplier Apex Components',
      limit: '5,000 units / week',
      utilized: '4,800 units / week',
      rate: 96.0,
      effect: 'Breach triggers automatic lead-time extensions (+4.5 days) on all future purchase orders for critical copper materials.',
      severity: 'Critical'
    },
    {
      id: 'CON-03',
      title: 'Carrier FedEx Express Cargo Flight Payload Limit',
      resource: 'Sourcing Route S-02 (Airfreight)',
      limit: '45,000 kg',
      utilized: '32,100 kg',
      rate: 71.3,
      effect: 'Breach forces shipments to split-manifest, resulting in split-lot arrival delays and customs processing mismatches.',
      severity: 'Medium'
    }
  ];

  const activeCon = constraints[selectedConstraint];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">
              CONSTRAINT ENGINE
            </span>
            <span className="text-xs font-mono text-slate-500">OPERATIONAL LIMITS & BOTTLENECKS</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Constraint Intelligence</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Map and monitor resource bottlenecks, tracking capacity utilization and modeling cascading second-order constraints across networks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Constraints list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase flex items-center justify-between">
              <span>Active Bottlenecks & Capacity Constraints</span>
              <span className="text-[9px] text-slate-500 font-normal">Sensing live physical warehouse & carrier signals</span>
            </div>

            <div className="divide-y divide-slate-900">
              {constraints.map((con, idx) => (
                <div 
                  key={con.id} 
                  onClick={() => setSelectedConstraint(idx)}
                  className={cn(
                    "p-5 space-y-4 cursor-pointer transition-colors",
                    selectedConstraint === idx ? "bg-slate-900/30" : "hover:bg-slate-900/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary text-xs uppercase flex items-center gap-2">
                      <Lock size={12} className={cn(
                        con.severity === 'Critical' ? 'text-red-400' : con.severity === 'High' ? 'text-amber-400' : 'text-cyan-400'
                      )} />
                      {con.title}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                      con.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      con.severity === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-900 text-slate-500 border-slate-800'
                    )}>
                      {con.severity} Limit
                    </span>
                  </div>

                  {/* Horizontal visual progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold">
                      <span>RESOURCE UTILIZATION %:</span>
                      <span className={cn(
                        "font-bold",
                        con.rate > 90 ? 'text-red-400' : con.rate > 80 ? 'text-amber-400' : 'text-cyan-400'
                      )}>{con.rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className={cn(
                        "h-full rounded-full transition-all duration-500",
                        con.rate > 90 ? 'bg-red-400' : con.rate > 80 ? 'bg-amber-400' : 'bg-cyan-400'
                      )} style={{ width: `${con.rate}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] text-os-text-muted pt-1">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">AFFECTED RESOURCE:</span>
                      <span className="text-os-text-secondary font-bold">{con.resource}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[8px]">MAX LIMIT VS UTILIZED:</span>
                      <span className="text-os-text-secondary">{con.utilized} / {con.limit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Constraint Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Physical Warehouse WMS + API Limits"
            freshness="Updated in real-time"
            confidence={98}
            method="Continuous limit telemetry checks"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-red-400" />
              CASCADING IMPACT
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">SECOND-ORDER EFFECTS:</span>
                <p className="text-os-text-secondary font-sans text-xs leading-relaxed">{activeCon.effect}</p>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-end">
                <button className="px-3 py-1.5 bg-[#FF453A]/10 hover:bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30 rounded-lg text-[10px] font-bold uppercase transition-all">
                  STRESS TEST CAPACITY BOUND
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
