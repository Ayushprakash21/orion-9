import React, { useState } from 'react';
import { 
  Activity, ArrowUpRight, TrendingUp, TrendingDown, Info, ShieldAlert, Sparkles, Database 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const VitalSignsView: React.FC = () => {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 rounded font-bold">
              SCM VITAL SIGNS
            </span>
            <span className="text-xs font-mono text-slate-500">REAL-TIME OPERATIONAL BIOMETRICS</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Supply Chain Vital Signs</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Continuous real-time telemetry streaming showing exact system health indexes, stock-out velocities, OTIF benchmarks, and transportation delays.
          </p>
        </div>
      </div>

      {/* DETAILED GAUGES / METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OrionMetric label="Global Health Index" value="82%" trend="up" trendLabel="1.2%" icon={<Activity size={16} />} />
        <OrionMetric label="Stockout Velocity" value="3.4 days" trend="down" trendLabel="0.5 days" icon={<ShieldAlert size={16} />} severity="warning" />
        <OrionMetric label="Supplier On-Time (OTIF)" value="91.2%" trend="stable" trendLabel="Stable" />
        <OrionMetric label="Custom Clearance Speed" value="1.4 days" trend="up" trendLabel="Fast" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Health Graphs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6 font-mono text-[11px]">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
              <Activity size={16} className="text-[#30D158]" />
              <span className="font-bold text-os-text-primary uppercase">HEALTH TREND LOG OVER TIME</span>
            </div>

            <div className="relative pt-6 h-40 bg-slate-900/10 border border-slate-900 rounded-xl overflow-hidden flex items-end">
              {/* Visual health progress */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px)] bg-[size:24px_100%] opacity-20" />
              <div className="flex-1 flex items-end justify-between px-8 h-full pb-3 relative z-10">
                {[
                  { m: 'Wk 1', h: 84 },
                  { m: 'Wk 2', h: 81 },
                  { m: 'Wk 3', h: 79 },
                  { m: 'Wk 4', h: 82 },
                  { m: 'Wk 5 (Live)', h: 82 }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 w-16 select-none">
                    <div className="text-[8px] text-os-text-muted font-bold">{item.m}</div>
                    <div className="w-6 bg-[#30D158]/20 border-t-2 border-[#30D158] transition-all duration-500" style={{ height: `${item.h}px` }} />
                    <span className="text-[9px] text-os-text-secondary font-bold">{item.h}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Data Trust */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Orion Biometrics sensor stream"
            freshness="Updated in real-time"
            confidence={98}
            method="Averaging live transactional and transit indicators"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#30D158]" />
              VITAL ANALYSIS
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Orion Supply Chain Vital Signs represents the operational pulse rate of your corporate logistics network, providing continuous assurance of business service level achievements.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
