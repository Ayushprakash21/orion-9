import React, { useState } from 'react';
import { 
  Users, Sliders, Clock, Activity, ArrowRight,
  TrendingUp, Compass, Sparkles, Filter, ChevronRight, HelpCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { OrionDataTrust, OrionConfidence, OrionMetric } from './OrionIntelligenceComponents';
import { cn } from '../../lib/utils';

export const HumanAiView: React.FC = () => {
  const [level, setLevel] = useState<number>(3);

  const handoffLogs = [
    {
      id: 'HND-01',
      time: 'Yesterday 4:21 PM',
      action: 'Airfreight alternate route for PO-2026-0012 proposed by AI.',
      status: 'APPROVED BY DIRECTOR',
      user: 'Ayush Prakash',
      overrideNotes: 'Confirmed FedEx slot availability directly with terminal lead.'
    },
    {
      id: 'HND-02',
      time: 'Sept 4, 10:15 AM',
      action: 'Delhi stock rebalance recommended by AI (Redirection to backup depot).',
      status: 'OVERRIDDEN BY USER',
      user: 'Ayush Prakash',
      overrideNotes: 'Kept in Alpha staging due to upcoming labor shift additions.'
    }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-muted">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-bold">
              HUMAN-AI COLLABORATION
            </span>
            <span className="text-xs font-mono text-slate-500">AUTONOMY & HANDOFF SYSTEMS</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Human-AI Collaboration Center</h1>
          <p className="text-xs text-os-text-muted mt-1">
            Manage handoff boundaries between human decision-makers and the autonomous AI autopilot, auditing overrides, and adjusting delegation levels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Autonomy Controls & Logs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-6 font-mono text-[11px]">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
              <Sliders size={16} className="text-cyan-400" />
              <span className="font-bold text-os-text-primary uppercase">SYSTEM DELEGATION LEVEL</span>
            </div>

            {/* Visual Sliders or Level Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { lvl: 1, name: 'Level 1: Manual', desc: 'All decisions are manual, AI serves only analytics.' },
                { lvl: 2, name: 'Level 2: Advisory', desc: 'AI proposes alternative routes, human approves.' },
                { lvl: 3, name: 'Level 3: Conditional', desc: 'AI proposes and holds options, human overrides if needed.' },
                { lvl: 4, name: 'Level 4: Autonomous', desc: 'AI executes decisions up to $15k without intervention.' }
              ].map((item) => (
                <button
                  key={item.lvl}
                  onClick={() => setLevel(item.lvl)}
                  className={cn(
                    "p-4 rounded-xl border text-left flex flex-col justify-between space-y-2 transition-all",
                    level === item.lvl 
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-400" 
                      : "bg-slate-900/40 border-slate-900 text-slate-500 hover:border-slate-800 hover:text-os-text-secondary"
                  )}
                >
                  <span className="text-[10px] font-bold">{item.name}</span>
                  <p className="font-sans text-[10px] leading-relaxed text-os-text-muted">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Override logs */}
            <div className="border-t border-slate-900 pt-6 space-y-4">
              <span className="text-slate-500 uppercase font-bold text-[9px] block">COLLABORATION HANDOFF LOGS:</span>
              <div className="divide-y divide-slate-900">
                {handoffLogs.map((log) => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px]">{log.time}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                          log.status.includes('APPROVED') ? 'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        )}>{log.status}</span>
                      </div>
                      <span className="text-os-text-primary font-bold block">{log.action}</span>
                      <p className="text-os-text-muted font-sans text-xs mt-0.5">Override reasoning: {log.overrideNotes}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Operator: {log.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6">
          <OrionDataTrust 
            source="Autopilot handoff log"
            freshness="Updated continuously"
            confidence={99}
            method="Governance event audit checks"
          />

          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 space-y-4 font-mono text-[11px]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-os-text-primary border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" />
              SENSE REASONING
            </h3>
            <p className="text-xs text-os-text-muted font-sans leading-relaxed">
              Delegating authority to Orion autopilot allows the system to expedite operational remediation cycles while keeping a secure audit record of every human intervention.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
