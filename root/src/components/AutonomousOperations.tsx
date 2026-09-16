import React from 'react';
import { useWindowManager } from '../os/WindowManagerContext';
import { ArrowRight, BrainCircuit, Network, Zap, FlaskConical, Bot, PlugZap, Dna, CircleDollarSign, ShieldAlert, Workflow, ShieldCheck, LineChart, MessageSquare, History, Activity, Sparkles } from 'lucide-react';

const groups = [
  { title: 'Intelligence', items: [
    { id: 'world-model', name: 'Supply Chain Digital Twin', desc: 'Live network model, dependencies and alternate operational realities.', icon: Network },
    { id: 'event-fabric', name: 'Event Fabric', desc: 'Real-time operational signals and event streams.', icon: Zap },
    { id: 'decisions', name: 'Decision Engine', desc: 'Prioritize and review AI-generated operational decisions.', icon: BrainCircuit },
    { id: 'scenarios', name: 'Scenario Lab', desc: 'What-if simulations and plan comparisons.', icon: FlaskConical },
  ]},
  { title: 'AI Workforce', items: [
    { id: 'intelligence-center', name: 'Specialized AI Agents', desc: 'Demand, inventory, procurement, logistics, risk and control agents.', icon: Bot },
    { id: 'integrations', name: 'Integration Fabric', desc: 'Operational connectivity across ERP, WMS, TMS, MES and CRM.', icon: PlugZap },
    { id: 'data-quality', name: 'Master Data Intelligence', desc: 'Data quality, anomalies, gaps and remediation signals.', icon: Dna },
    { id: 'decision-economics', name: 'Financial Intelligence', desc: 'Decision economics, value-at-risk and operational cost impact.', icon: CircleDollarSign },
  ]},
  { title: 'Control & Learning', items: [
    { id: 'network-intelligence', name: 'Supply Chain Risk Graph', desc: 'Network dependencies, exposure and propagation paths.', icon: ShieldAlert },
    { id: 'autopilot', name: 'Closed-loop Automation', desc: 'Policy-governed execution with human approval boundaries.', icon: Workflow },
    { id: 'human-ai', name: 'AI Governance', desc: 'Manual, Copilot and Autopilot delegation controls.', icon: ShieldCheck },
    { id: 'outcomes', name: 'Learning & Outcome Loop', desc: 'Compare decisions with outcomes and improve future recommendations.', icon: LineChart },
    { id: 'orion-ai', name: 'Ask ORION', desc: 'Natural-language access to supply-chain intelligence.', icon: MessageSquare },
    { id: 'decision-replay', name: 'Decision History', desc: 'Replay decisions, reasoning, approvals and outcomes.', icon: History },
  ]},
];

export const AutonomousOperations: React.FC = () => {
  const { openApplication } = useWindowManager();
  const open = (id: string) => openApplication(id);
  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 lg:p-8 text-os-text-primary">
      <div className="max-w-[1500px] mx-auto space-y-7">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-os-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-os-accent font-mono"><Sparkles size={13}/> Autonomous Operations</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-light tracking-tight">ORION-9 User Operating System</h1>
            <p className="mt-2 text-sm text-os-text-secondary max-w-3xl">One command surface for sensing, reasoning, simulation, decision-making, governed automation and learning across the supply chain.</p>
          </div>
          <button onClick={() => open('intelligence-center')} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-os-border bg-os-surface hover:bg-os-surface-hover text-sm transition-colors">Open Deep Intelligence <ArrowRight size={15}/></button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Mission', 'Command Center', 'command-center', Activity],
            ['Decisions', 'Decision Center', 'decisions', BrainCircuit],
            ['Actions', 'Action Center', 'action-center', Workflow],
            ['AI', 'Ask ORION', 'orion-ai', MessageSquare],
          ].map(([label, name, id, Icon]: any) => (
            <button key={id} onClick={() => open(id)} className="text-left p-4 rounded-xl border border-os-border bg-os-bg hover:bg-os-surface transition-colors">
              <Icon size={17} className="text-os-accent mb-3"/><div className="text-[10px] uppercase tracking-wider text-os-text-muted">{label}</div><div className="mt-1 text-sm font-medium">{name}</div>
            </button>
          ))}
        </div>

        {groups.map(group => (
          <section key={group.title}>
            <div className="flex items-center gap-3 mb-3"><h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-os-text-secondary">{group.title}</h2><div className="h-px bg-os-border flex-1"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {group.items.map(item => { const Icon = item.icon; return (
                <button key={item.id} onClick={() => open(item.id)} className="group text-left p-4 rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover hover:border-os-accent/30 transition-all min-h-[142px]">
                  <div className="flex items-start justify-between gap-3"><div className="w-9 h-9 rounded-lg border border-os-border bg-os-bg flex items-center justify-center"><Icon size={18} className="text-os-accent"/></div><ArrowRight size={15} className="text-os-text-muted group-hover:text-os-accent transition-colors"/></div>
                  <div className="mt-4 text-sm font-medium">{item.name}</div><p className="mt-1 text-xs leading-5 text-os-text-muted">{item.desc}</p>
                </button>
              )})}
            </div>
          </section>
        ))}

        <div className="rounded-xl border border-os-border bg-os-surface p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-os-text-secondary">Autonomy lifecycle</div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-os-text-secondary">
            {['Sense events','Understand state','Simulate options','Decide','Policy check','Approve / Autopilot','Execute','Measure outcome','Learn'].map((x,i) => <React.Fragment key={x}><span className="px-3 py-2 rounded-lg border border-os-border bg-os-bg">{x}</span>{i < 8 && <ArrowRight size={13} className="text-os-text-muted"/>}</React.Fragment>)}
          </div>
        </div>
      </div>
    </div>
  );
};
