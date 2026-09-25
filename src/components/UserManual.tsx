import React from 'react';
import { BookOpen, CheckCircle2, ShieldCheck, Smartphone, ArrowRight, Navigation, WalletCards, PlugZap, Bot, History, Repeat2 } from 'lucide-react';
import { useWindowManager } from '../os/WindowManagerContext';

const sections = [
  ['Mission Control', 'Start here. Review supply-chain health, critical exceptions, AI recommendations and actions requiring your attention.', 'command-center'],
  ['Ask ORION', 'Ask natural-language questions about demand, inventory, suppliers, logistics, risk, cost and decisions. Use Simulate before high-impact actions.', 'orion-ai'],
  ['Digital Twin', 'Inspect the network, dependencies and operational state. Use it as the starting point for impact analysis and what-if planning.', 'digital-twin'],
  ['Events & Exceptions', 'Use Event Fabric and Exceptions to understand what changed, why it matters and what ORION recommends.', 'event-fabric'],
  ['Decision Center', 'Review AI decisions, confidence, impact and approvals. Use Decision Replay and Outcomes to understand previous decisions.', 'decisions'],
  ['Scenario Lab', 'Model demand, supply, capacity, logistics or financial changes before committing to a plan.', 'scenarios'],
  ['AI Workforce', 'Use specialized intelligence across planning, procurement, inventory, logistics, risk and control. Agent execution remains governed by policy.', 'intelligence-center'],
  ['Automation & Governance', 'Use Autopilot, Policies and Human-AI Teaming to choose Manual, Copilot or Autopilot operating boundaries.', 'autopilot'],
  ['Risk & Finance', 'Use Risk Radar / Network Intelligence and Decision Economics / Working Capital to connect operational risk with financial impact.', 'network-intelligence'],
  ['Learning Loop', 'Use Outcomes, Decision Replay and Decision DNA to compare predictions with actual outcomes and improve future decisions.', 'outcomes'],
  ['Integrations', 'Check ERP, WMS, TMS and other connector status and synchronization health.', 'integrations'],
  ['User Profile & Organization', 'Manage your operator profile and view your assigned organization context.', 'profile'],
];

const navigationMap = [
  ['Command', 'Mission Control • Ask ORION • Decision Center • Decision History'],
  ['Intelligence', 'Digital Twin • Event Fabric • AI Workforce • Risk Graph • Learning Loop'],
  ['Planning', 'Scenario Lab • Demand Planning • Inventory Intelligence • Financial Intelligence'],
  ['Execution', 'Autonomous Operations • Autopilot • Integrations • AI Governance • Human-AI Teaming'],
];

export const UserManual: React.FC = () => {
  const { openApplication } = useWindowManager();
  return <div className="w-full h-full overflow-y-auto p-3 sm:p-6 lg:p-8 pb-28 sm:pb-12"><div className="max-w-5xl mx-auto text-os-text-primary">
    <header className="border-b border-os-border pb-6"><div className="flex items-center gap-2 text-os-accent text-[10px] uppercase tracking-[0.2em] font-mono"><BookOpen size={14}/> User Manual</div><h1 className="mt-2 text-2xl sm:text-3xl font-light">ORION-9 User Operating Guide</h1><p className="mt-2 text-sm text-os-text-secondary">How to operate ORION-9 as an intelligent, governed supply-chain command environment.</p></header>
    <section className="mt-6 rounded-2xl border border-os-accent/15 bg-os-accent/[0.025] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono text-os-accent"><Navigation size={14}/> User Navigation Map</div>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">{navigationMap.map(([title, desc]) => <div key={title} className="rounded-xl border border-os-border bg-os-bg/60 p-3"><div className="text-xs font-semibold text-os-text-primary">{title}</div><div className="mt-1 text-[11px] leading-5 text-os-text-muted">{desc}</div></div>)}</div>
      <div className="mt-3 text-[11px] text-os-text-muted">Open <b className="text-os-text-secondary">Applications</b> from the ORION Dock/Launcher to use these navigation groups, or use the Command Palette to search any module.</div>
    </section>
    <div className="mt-5 space-y-3">{sections.map(([title, desc, id], i) => <button key={title} onClick={() => openApplication(id)} className="w-full text-left p-4 rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover transition-colors flex gap-4"><div className="shrink-0 w-7 h-7 rounded-full border border-os-border flex items-center justify-center text-xs text-os-accent">{i+1}</div><div className="flex-1"><div className="font-medium text-sm">{title}</div><p className="mt-1 text-xs leading-5 text-os-text-muted">{desc}</p></div><ArrowRight size={16} className="mt-1 text-os-text-muted shrink-0"/></button>)}</div>
    <div className="mt-7 grid md:grid-cols-3 gap-3">{[['Governance','Follow approval and autonomy policies before executing material decisions.',ShieldCheck],['Mobile','The operating model is responsive across desktop, tablet and mobile.',Smartphone],['Best practice','Ask → Simulate → Review impact → Approve/Autopilot → Measure outcome.',CheckCircle2]].map(([t,d,I]:any)=><div key={t} className="p-4 rounded-xl border border-os-border bg-os-bg"><I size={17} className="text-os-accent"/><div className="mt-3 text-sm font-medium">{t}</div><div className="mt-1 text-xs text-os-text-muted leading-5">{d}</div></div>)}</div>
  </div></div>;
};
