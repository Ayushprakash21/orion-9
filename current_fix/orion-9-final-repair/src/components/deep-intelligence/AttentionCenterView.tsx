import React, { useState } from 'react';
import { 
  Eye, AlertTriangle, ShieldCheck, Clock, Activity, ArrowRight,
  TrendingUp, Compass, Sparkles, Filter, ChevronRight, HelpCircle 
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const AttentionCenterView: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<'critical' | 'ignored' | 'quiet'>('critical');

  const topics = {
    critical: [
      { id: 'ATT-01', title: 'Mumbai Ocean Corridor delay (Shipment SHP-0044)', focus: 'Urgent Rerouting Needed', why: 'Delay exceeds 4-day threshold. Affected stockout triggers in 3 days.', priority: 'High (0.94 score)', action: 'Propose alternate airline shipping route' },
      { id: 'ATT-02', title: 'SKU-402 Regional Quality Stoppage (Delhi WMS)', focus: 'Component quarantine hold', why: 'Material defect rate hit 4.2%. Safety threshold breached.', priority: 'High (0.88 score)', action: 'Switch to pre-packaged secondary supplier stock' }
    ],
    ignored: [
      { id: 'ATT-03', title: 'Automated Supplier Apex late-alert override', focus: 'Ignored Overrides Log', why: 'Manual planner override marked alert as "resolved" without routing modification.', priority: 'Medium (0.64 score)', action: 'Audit and restore automated SLA tracking' },
      { id: 'ATT-04', title: 'Carrier FedEx Express route deviation', focus: 'Ignored transit alerts', why: 'Route detour around regional weather ignored for 48 hours.', priority: 'Low (0.42 score)', action: 'Acknowledge detour and adjust arrival ETA coordinates' }
    ],
    quiet: [
      { id: 'ATT-05', title: 'Supplier Core Promise Strength decay', focus: 'Quiet deterioration', why: 'On-time delivery index drifted from 94% to 72% over 60 days without hitting alert thresholds.', priority: 'Medium (0.75 score)', action: 'Initiate Supplier Performance Audit cycle' },
      { id: 'ATT-06', title: 'Delhi Warehouse labor dwell time creep', focus: 'Quiet bottlenecking', why: 'Average dock unloading times crawled from 35 mins to 54 mins over 3 weeks.', priority: 'Medium (0.68 score)', action: 'Adjust dock shift staging plans' }
    ]
  };

  const activeItems = topics[selectedTopic];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 rounded font-bold">
              ORION ATTENTION ENGINE
            </span>
            <span className="text-xs font-mono text-slate-500">OPERATIONAL FOCUS FILTERING</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Orion Attention Center</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Isolate crucial operational signals from ambient noise. Track what needs urgent focus, what was overridden or ignored, and what is quietly degrading in the background.
          </p>
        </div>

        <div className="flex gap-2">
          {(Object.keys(topics) as Array<keyof typeof topics>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTopic(key)}
              className={cn(
                "px-3 py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border",
                selectedTopic === key 
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-400/40" 
                  : "bg-slate-950 border-slate-900 text-slate-500 hover:text-os-text-secondary"
              )}
            >
              {key === 'critical' ? 'Urgent Attention' : key === 'ignored' ? 'Missed / Ignored' : 'Quietly Deteriorating'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Attention Focus List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden font-mono text-[11px]">
            <div className="p-3 border-b border-slate-900 bg-slate-950/60 font-bold text-os-text-primary uppercase flex items-center justify-between">
              <span>Active Attention Log</span>
              <span className="text-[9px] text-slate-500 font-normal">Sensing active telemetry stream</span>
            </div>

            <div className="divide-y divide-slate-900">
              {activeItems.map((item) => (
                <div key={item.id} className="p-5 space-y-4 hover:bg-slate-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-os-text-primary text-xs uppercase">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 border border-slate-800 text-cyan-400">
                      {item.focus}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-os-text-muted text-[11px] leading-relaxed font-sans">
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[9px] font-bold block">WHY THIS WAS PRIORITIZED:</span>
                      <p className="text-os-text-secondary mt-1">{item.why}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono uppercase text-[9px] font-bold block">RECOMMENDED REMEDIATION:</span>
                      <p className="text-[#30D158] font-bold mt-1">{item.action}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[9px] text-slate-500 uppercase font-bold">
                    <span>Priority Score: <strong className="text-os-text-secondary">{item.priority}</strong></span>
                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                      <span>ENGAGE WITH RECOMMENDATION</span>
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
            source="Orion Attention Sensing matrix"
            freshness="Synchronized continuously"
            confidence={96}
            method="Multivariate priority weighting"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              SENSE REASONING
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              The Attention Engine calculates priorities by weighting **disruption velocity**, **cost severity**, and **decision decay rates** to filter out standard telemetry and bubble up critical concerns.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
