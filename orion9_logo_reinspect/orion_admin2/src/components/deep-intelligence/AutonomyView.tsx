import React, { useState } from 'react';
import { Cpu, ShieldCheck, UserCheck, AlertTriangle, CheckCircle2, ArrowUpRight, Lock } from 'lucide-react';

export const AutonomyView: React.FC = () => {
  const autonomyLevels = [
    { level: 'LEVEL 0', name: 'Observe', status: 'Active Systemwide', desc: 'Monitors and logs all supply chain events.' },
    { level: 'LEVEL 1', name: 'Detect', status: 'Active Systemwide', desc: 'Flags anomalies, bottleneck migrations, and risks.' },
    { level: 'LEVEL 2', name: 'Recommend', status: 'Active Systemwide', desc: 'Generates ranked options with cost/SLA trade-offs.' },
    { level: 'LEVEL 3', name: 'Prepare', status: 'Active for POs & Inventory', desc: 'Drafts PO releases and reroute tickets.' },
    { level: 'LEVEL 4', name: 'Execute Approved', status: 'Active with Human Sign-off', desc: 'Executes upon human authorization.' },
    { level: 'LEVEL 5', name: 'Autonomous', status: 'Policy Threshold Restricted', desc: 'Executes automatically under ₹50,000 threshold.' }
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans text-os-text-secondary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-os-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              AUTONOMY CENTER
            </span>
            <span className="text-xs font-mono text-os-text-muted">PROGRESSIVE AUTOPILOT & GOVERNANCE</span>
          </div>
          <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1">Autonomy Maturity & Human-AI Calibration</h1>
          <p className="text-xs text-os-text-secondary mt-1">
            Automation readiness scoring, human override history, AI agreement tracking, and policy approval thresholds.
          </p>
        </div>
      </div>

      {/* Autonomy Maturity Grid */}
      <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2 border-b border-os-border pb-3">
          <Cpu size={16} className="text-cyan-400" /> Autonomy Maturity Architecture (Levels 0 – 5)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {autonomyLevels.map((lvl, idx) => (
            <div key={idx} className="p-4 bg-os-surface-secondary border border-os-border rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-os-text-muted">{lvl.level}</span>
                <span className="px-2 py-0.5 text-[9px] uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                  {lvl.status}
                </span>
              </div>
              <div className="font-bold text-os-text-primary text-sm">{lvl.name}</div>
              <p className="text-[11px] text-os-text-secondary leading-relaxed font-sans">{lvl.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Human Value Map & AI Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2 border-b border-os-border pb-3">
            <UserCheck size={16} className="text-emerald-400" /> Human Value Map & Override Tracking
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-os-text-primary">AI Recommendation Agreement</span>
                <p className="text-[11px] text-os-text-muted">94.2% accepted without modification over 30 days.</p>
              </div>
              <span className="text-emerald-400 font-bold text-base">94.2%</span>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-os-text-primary">Human Overrides Analyzed</span>
                <p className="text-[11px] text-os-text-muted">6 overrides logged and incorporated into model calibration.</p>
              </div>
              <span className="text-amber-400 font-bold text-base">6 Logged</span>
            </div>
          </div>
        </div>

        <div className="bg-os-surface border border-os-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2 border-b border-os-border pb-3">
            <Lock size={16} className="text-purple-400" /> Autonomy Blockers & Policy Constraints
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-os-text-primary">
                <span>Contractual Exclusivity Policy</span>
                <span className="text-red-400">Blocker Active</span>
              </div>
              <p className="text-[11px] text-os-text-secondary">Vendor switch over ₹500,000 requires VP Procurement authorization.</p>
            </div>
            <div className="p-3 bg-os-surface-secondary border border-os-border rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-os-text-primary">
                <span>Unverified Supplier Quality Data</span>
                <span className="text-amber-400">Data Gate</span>
              </div>
              <p className="text-[11px] text-os-text-secondary">Supplier ISO certificate renewal pending validation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
