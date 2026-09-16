import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { Sparkles, Shield, Play, Pause, CheckCircle2, AlertTriangle, Activity, Settings2, RefreshCw } from 'lucide-react';

export const Autopilot: React.FC = () => {
  const [autonomyLevel, setAutonomyLevel] = useState<number>(4);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [workflows, setWorkflows] = useState([
    { id: 'wf-1', name: 'Supplier Delay Recovery Automation', active: true, level: 'Level 4 (Execute)', lastRun: '4 mins ago', successRate: '98.4%' },
    { id: 'wf-2', name: 'Inventory Replenishment & Buffer Tuning', active: true, level: 'Level 4 (Execute)', lastRun: '12 mins ago', successRate: '99.1%' },
    { id: 'wf-3', name: 'Shipment Route Disruption Rerouting', active: true, level: 'Level 3 (Prepare)', lastRun: '1 hour ago', successRate: '96.8%' },
    { id: 'wf-4', name: 'Automated Supplier Communication Dispatch', active: false, level: 'Level 2 (Recommend)', lastRun: '3 hours ago', successRate: '95.0%' },
    { id: 'wf-5', name: 'PO Preparation & Compliance Check', active: true, level: 'Level 4 (Execute)', lastRun: '30 mins ago', successRate: '99.8%' }
  ]);

  const toggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AUTONOMY ENGINE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">ORION Autopilot & Automation</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Continuous closed-loop orchestration, predictive detection, policy governance, and automated execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-colors ${isPaused ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-primary'}`}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume Autopilot' : 'Pause Autopilot'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Events Monitored</span>
          <div className="text-2xl font-bold font-mono text-os-text-primary">14,284</div>
          <span className="text-[11px] text-emerald-400 font-medium">Real-time event bus active</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Decisions Generated</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">47</div>
          <span className="text-[11px] text-os-text-secondary">Last 24 operating hours</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Actions Executed</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">23</div>
          <span className="text-[11px] text-emerald-400 font-medium">100% policy compliant</span>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase text-os-text-muted">Outcomes Verified</span>
          <div className="text-2xl font-bold font-mono text-os-text-primary">19</div>
          <span className="text-[11px] text-cyan-400 font-medium">Positive business impact</span>
        </div>
      </div>

      {/* Autonomy Level Slider */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-os-text-primary">System Autonomy Level</h3>
            <p className="text-xs text-os-text-secondary mt-0.5">Control how autonomously ORION executes recommended supply chain workflows.</p>
          </div>
          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono font-bold rounded">
            LEVEL {autonomyLevel} — {autonomyLevel === 4 ? 'AUTONOMOUS EXECUTION' : autonomyLevel === 3 ? 'PREPARE & APPROVE' : 'RECOMMEND ONLY'}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2 pt-2">
          {[0, 1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setAutonomyLevel(lvl)}
              className={`p-3 rounded-lg border text-left transition-all ${autonomyLevel === lvl ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300' : 'bg-os-surface-secondary border-os-border text-os-text-secondary hover:border-os-border/80'}`}
            >
              <div className="font-mono text-xs font-bold">Lvl {lvl}</div>
              <div className="text-[10px] mt-1 text-os-text-muted truncate">
                {lvl === 0 ? 'Observe' : lvl === 1 ? 'Explain' : lvl === 2 ? 'Recommend' : lvl === 3 ? 'Prepare' : lvl === 4 ? 'Execute' : 'Full OS'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Workflows */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-os-border pb-4">
          <div>
            <h3 className="text-sm font-semibold text-os-text-primary">Orchestration Workflows</h3>
            <p className="text-xs text-os-text-secondary mt-0.5">Configured autonomous pipelines reacting to live operational signals.</p>
          </div>
          <span className="text-xs font-mono text-os-text-muted">{workflows.filter(w => w.active).length} of {workflows.length} Active</span>
        </div>

        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf.id} className="flex items-center justify-between p-4 bg-os-surface-secondary border border-os-border rounded-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${wf.active ? 'bg-emerald-400' : 'bg-os-text-muted'}`} />
                  <h4 className="text-xs font-semibold text-os-text-primary">{wf.name}</h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-os-text-muted pl-4">
                  <span>Policy: {wf.level}</span>
                  <span>•</span>
                  <span>Last run: {wf.lastRun}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Success: {wf.successRate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleWorkflow(wf.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${wf.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-os-surface border border-os-border text-os-text-muted hover:text-os-text-primary'}`}
                >
                  {wf.active ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
