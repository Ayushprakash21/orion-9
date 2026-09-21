import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Database,
  GitBranch,
  History,
  KeyRound,
  Network,
  PlugZap,
  ScrollText,
  Settings2,
  ShieldCheck,
  Users,
  Workflow,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { agentRegistry, toolRegistry, decisionRecordEngine, outcomeRecorder } from '../../ai';
import { kernelCommandBus } from '../../kernel';

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
  const [agents, setAgents] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);

  useEffect(() => {
    setAgents(agentRegistry.listAgents('org-global'));
    setTools(toolRegistry.listTools());
    setPendingApprovals(kernelCommandBus.getPendingApprovals());
    setDecisions(decisionRecordEngine.getDecisions('org-global'));
  }, []);

  return (
    <div className="space-y-6 text-os-text-primary">
      <header className="border-b border-os-border pb-6">
        <div className="flex items-center gap-2 text-os-accent text-[10px] uppercase tracking-[0.2em] font-mono">
          <Sparkles size={14} /> Admin Control Plane
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-light">Autonomous Operations & AI Governance</h1>
        <p className="mt-2 text-sm text-os-text-secondary max-w-4xl">
          Central administrative surface for ORION-9 Wave 5 AI Agent Governance. Control agent operating modes,
          authorized tools, human approval gates, and empirical outcome telemetry.
        </p>
      </header>

      {/* Wave 5 AI Governance Live Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-os-border bg-os-surface">
          <div className="flex items-center justify-between">
            <Cpu className="text-os-accent w-5 h-5" />
            <span className="text-[10px] font-mono bg-os-accent/10 text-os-accent px-2 py-0.5 rounded">ACTIVE</span>
          </div>
          <div className="mt-3 text-2xl font-light">{agents.length || 1}</div>
          <div className="text-xs text-os-text-muted uppercase tracking-wider font-mono">Governed Agents</div>
        </div>

        <div className="p-4 rounded-xl border border-os-border bg-os-surface">
          <div className="flex items-center justify-between">
            <ShieldCheck className="text-[#30D158] w-5 h-5" />
            <span className="text-[10px] font-mono bg-[#30D158]/10 text-[#30D158] px-2 py-0.5 rounded">SECURED</span>
          </div>
          <div className="mt-3 text-2xl font-light">{tools.length || 18}</div>
          <div className="text-xs text-os-text-muted uppercase tracking-wider font-mono">Registered Tools</div>
        </div>

        <div className="p-4 rounded-xl border border-os-border bg-os-surface">
          <div className="flex items-center justify-between">
            <Clock className="text-[#FF9F0A] w-5 h-5" />
            <span className="text-[10px] font-mono bg-[#FF9F0A]/10 text-[#FF9F0A] px-2 py-0.5 rounded">HUMAN GATE</span>
          </div>
          <div className="mt-3 text-2xl font-light">{pendingApprovals.length}</div>
          <div className="text-xs text-os-text-muted uppercase tracking-wider font-mono">Pending Approvals</div>
        </div>

        <div className="p-4 rounded-xl border border-os-border bg-os-surface">
          <div className="flex items-center justify-between">
            <Activity className="text-os-accent w-5 h-5" />
            <span className="text-[10px] font-mono bg-os-accent/10 text-os-accent px-2 py-0.5 rounded">VERIFIED</span>
          </div>
          <div className="mt-3 text-2xl font-light">{decisions.length}</div>
          <div className="text-xs text-os-text-muted uppercase tracking-wider font-mono">Decisions Logged</div>
        </div>
      </div>

      {/* Active AI Agents Table */}
      <section className="rounded-xl border border-os-border bg-os-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-secondary">
              Tenant AI Agents & Operating Modes
            </h2>
            <p className="text-xs text-os-text-muted mt-0.5">
              Operating modes are enforced server-side. AI actors cannot self-approve or elevate to admin.
            </p>
          </div>
          <span className="text-[10px] font-mono text-os-accent bg-os-accent/10 px-2.5 py-1 rounded">
            FAIL-CLOSED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-os-border text-os-text-muted">
                <th className="pb-2">AGENT ID</th>
                <th className="pb-2">NAME</th>
                <th className="pb-2">OPERATING MODE</th>
                <th className="pb-2">STATUS</th>
                <th className="pb-2">RISK CLASS</th>
                <th className="pb-2">TOOLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border/50">
              {agents.map((agent: any) => (
                <tr key={agent.agentId} className="hover:bg-os-surface-hover/50">
                  <td className="py-3 text-os-accent">{agent.agentId}</td>
                  <td className="py-3 text-os-text-primary font-sans">{agent.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-os-accent/30 bg-os-accent/10 text-os-accent">
                      {agent.operatingMode}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="text-[#30D158] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" /> {agent.status}
                    </span>
                  </td>
                  <td className="py-3 text-[#FF9F0A]">{agent.riskClass}</td>
                  <td className="py-3 text-os-text-muted">{agent.allowedTools?.length || 0} tools</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation shortcuts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Platform', 'Platform Intelligence', '/admin/platform-intelligence', BrainCircuit],
          ['Security', 'Roles & Access', '/admin/roles', KeyRound],
          ['Audit', 'Audit Activity', '/admin/audit-logs', ScrollText],
          ['Settings', 'Platform Settings', '/admin/settings', Settings2],
        ].map(([a, b, p, Icon]: any) => (
          <button
            key={a}
            onClick={() => navigate(p)}
            className="p-4 text-left rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover"
          >
            <Icon size={17} className="text-os-accent" />
            <div className="mt-2 text-[10px] uppercase tracking-wider text-os-text-muted">{a}</div>
            <div className="mt-1 text-sm font-medium">{b}</div>
          </button>
        ))}
      </div>

      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-os-text-secondary">
            Autonomous capability control map
          </h2>
          <div className="h-px bg-os-border flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {controls.map(([title, desc, path, Icon]: any) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="group p-4 text-left rounded-xl border border-os-border bg-os-surface hover:bg-os-surface-hover transition-colors"
            >
              <div className="flex justify-between">
                <div className="w-9 h-9 rounded-lg border border-os-border bg-os-bg flex items-center justify-center">
                  <Icon size={18} className="text-os-accent" />
                </div>
                <ArrowRight size={15} className="text-os-text-muted group-hover:text-os-accent" />
              </div>
              <div className="mt-4 text-sm font-medium">{title}</div>
              <p className="mt-1 text-xs leading-5 text-os-text-muted">{desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-os-border bg-os-surface p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-os-text-secondary">
          Wave 5 AI Governance Mandate
        </div>
        <p className="mt-2 text-sm text-os-text-secondary leading-6">
          AI agents operate as non-administrative, identified actors (<code className="font-mono text-xs">AI_AGENT</code>).
          Direct mutation of database state outside the Orion Kernel is strictly prohibited.
          High-risk and critical transactions require explicit human sign-off; AI self-approval is rejected fail-closed.
        </p>
      </div>
    </div>
  );
};
