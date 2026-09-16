import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BrainCircuit, Database, GitBranch, History, KeyRound, Network, PlugZap, ScrollText, Settings2, ShieldCheck, Users, Workflow, Sparkles } from 'lucide-react';

const controls = [
  ['Autonomous Operations', 'Unified mission view of autonomy, decisions, events and active controls.', '/admin/platform-intelligence', BrainCircuit],
  ['Digital Twin & Risk', 'Network model, topology, dependencies and systemic exposure.', '/admin/platform-intelligence', Network],
  ['Event Fabric', 'Signals, telemetry and event-driven operational triggers.', '/admin/platform-intelligence', Activity],
  ['Decision Governance', 'Decision thresholds, confidence, approvals and delegation boundaries.', '/admin/roles', ShieldCheck],
  ['AI Workforce', 'Agent permissions, roles and access boundaries.', '/admin/roles', Users],
  ['Integration Fabric', 'Platform connectivity and integration posture.', '/admin/platform-intelligence', PlugZap],
  ['Master Data Intelligence', 'Data quality, integrity and platform data controls.', '/admin/platform-intelligence', Database],
  ['Financial Intelligence', 'Decision economics, value controls and financial governance.', '/admin/platform-intelligence', Settings2],
  ['Closed-loop Automation', 'Workflow/autopilot governance and execution boundaries.', '/admin/settings', Workflow],
  ['Learning & Outcomes', 'Outcome history, model feedback and decision traceability.', '/admin/audit-logs', GitBranch],
  ['Decision History', 'Administrative audit trail and decision traceability.', '/admin/audit-logs', History],
  ['Security & Access', 'Users, organizations, roles and platform permissions.', '/admin/roles', KeyRound],
];

export const AdminAutonomousOperations: React.FC = () => {
  const navigate = useNavigate();
  return <div className="space-y-6 text-os-text-primary">
    <header className="border-b border-os-border pb-6"><div className="flex items-center gap-2 text-os-accent text-[10px] uppercase tracking-[0.2em] font-mono"><Sparkles size={14}/> Admin Control Plane</div><h1 className="mt-2 text-2xl sm:text-3xl font-light">Autonomous Operations Governance</h1><p className="mt-2 text-sm text-os-text-secondary max-w-4xl">Central administrative surface for the ORION-9 autonomous operating model. Configure access, governance and platform controls; users operate the intelligence and decisions through their workspace.</p></header>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Platform','Platform Intelligence', '/admin/platform-intelligence', BrainCircuit],['Security','Roles & Access','/admin/roles',KeyRound],['Audit','Audit Activity','/admin/audit-logs',ScrollText],['Settings','Platform Settings','/admin/settings',Settings2]].map(([a,b,p,I]:any)=><button key={a} onClick={()=>navigate(p)} className="p-4 text-left rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover"><I size={17} className="text-os-accent"/><div className="mt-2 text-[10px] uppercase tracking-wider text-os-text-muted">{a}</div><div className="mt-1 text-sm font-medium">{b}</div></button>)}</div>
    <section><div className="flex items-center gap-3 mb-3"><h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-os-text-secondary">Autonomous capability control map</h2><div className="h-px bg-os-border flex-1"/></div><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{controls.map(([title,desc,path,Icon]:any)=><button key={title} onClick={()=>navigate(path)} className="group p-4 text-left rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover transition-colors"><div className="flex justify-between"><div className="w-9 h-9 rounded-lg border border-os-border bg-os-bg flex items-center justify-center"><Icon size={18} className="text-os-accent"/></div><ArrowRight size={15} className="text-os-text-muted group-hover:text-os-accent"/></div><div className="mt-4 text-sm font-medium">{title}</div><p className="mt-1 text-xs leading-5 text-os-text-muted">{desc}</p></button>)}</div></section>
    <div className="rounded-xl border border-os-border bg-os-surface p-5"><div className="text-xs font-semibold uppercase tracking-wider text-os-text-secondary">Governance rule</div><p className="mt-2 text-sm text-os-text-secondary leading-6">Admin defines the boundaries; the user workspace consumes those boundaries. No external ERP/WMS/TMS mutation should be represented as completed unless the corresponding connector and execution policy actually authorizes it.</p></div>
  </div>;
};
