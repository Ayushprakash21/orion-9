import React, { useMemo, useState } from 'react';
import {
  Activity, Bot, CheckCircle2, ChevronRight, CircleDot, FileText,
  Gauge, Lock, Play, Search, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Users, Workflow, XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

type Mode = 'MANUAL' | 'AI COPILOT' | 'AI AUTOPILOT';

type Capability = {
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  defaultMode: Mode;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
};

type Domain = {
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
  icon: React.ElementType;
  capabilities: Capability[];
};

const DOMAINS: Domain[] = [
  { name: 'Users & RBAC', description: 'Identity, roles, access and session governance.', priority: 'P0', icon: Users, capabilities: [
    { name: 'User lifecycle', description: 'Create, suspend, activate and review users.', priority: 'P0', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Roles & permissions', description: 'Manage role assignments and least-privilege access.', priority: 'P0', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'MFA / SSO policies', description: 'Configure authentication requirements and identity providers.', priority: 'P0', defaultMode: 'AI COPILOT', risk: 'CRITICAL' },
  ]},
  { name: 'Security', description: 'Security posture, sessions, keys and protection controls.', priority: 'P0', icon: Lock, capabilities: [
    { name: 'Security policies', description: 'Centralize authentication, session and security rules.', priority: 'P0', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'API keys & secrets', description: 'Issue, rotate and revoke integration credentials.', priority: 'P0', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'Security monitoring', description: 'Detect anomalies and recommend remediation.', priority: 'P0', defaultMode: 'AI COPILOT', risk: 'HIGH' },
  ]},
  { name: 'Master Data', description: 'Canonical products, suppliers, customers, sites and units.', priority: 'P0', icon: Settings2, capabilities: [
    { name: 'Product / SKU master', description: 'Govern item attributes, lifecycle and classifications.', priority: 'P0', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Supplier & customer master', description: 'Maintain parties, locations and commercial attributes.', priority: 'P0', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'UoM / tax / currency', description: 'Maintain shared reference data used by calculations.', priority: 'P0', defaultMode: 'MANUAL', risk: 'HIGH' },
  ]},
  { name: 'Procurement', description: 'Sourcing, purchase orders, approvals and supplier performance.', priority: 'P0', icon: FileText, capabilities: [
    { name: 'Purchase orders', description: 'Create, approve, amend and close purchase orders.', priority: 'P0', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Sourcing & RFQ', description: 'Compare supplier offers and recommend awards.', priority: 'P0', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Three-way match', description: 'Validate PO, receipt and invoice alignment.', priority: 'P0', defaultMode: 'AI AUTOPILOT', risk: 'HIGH' },
  ]},
  { name: 'Inventory', description: 'Stock, replenishment, safety stock and inventory policy.', priority: 'P0', icon: Gauge, capabilities: [
    { name: 'Inventory policies', description: 'Set min/max, safety stock, reorder and service rules.', priority: 'P0', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Replenishment', description: 'Recommend or execute replenishment within policy limits.', priority: 'P0', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Inventory optimization', description: 'Balance availability, working capital and risk.', priority: 'P0', defaultMode: 'AI AUTOPILOT', risk: 'HIGH' },
  ]},
  { name: 'Order Management', description: 'Orders, pricing, fulfillment, returns and customer commitments.', priority: 'P0', icon: Workflow, capabilities: [
    { name: 'Order lifecycle', description: 'Govern order creation, allocation, fulfillment and closure.', priority: 'P0', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Pricing & promotions', description: 'Configure pricing rules and controlled recommendations.', priority: 'P0', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Returns / RMA', description: 'Control return authorization and disposition rules.', priority: 'P0', defaultMode: 'MANUAL', risk: 'MEDIUM' },
  ]},
  { name: 'Warehouse Management', description: 'Receiving, putaway, picking, packing and warehouse policies.', priority: 'P1', icon: Gauge, capabilities: [
    { name: 'Warehouse policies', description: 'Configure locations, handling and fulfillment rules.', priority: 'P1', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Wave / task optimization', description: 'Recommend efficient warehouse execution sequences.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'MEDIUM' },
    { name: 'Barcode / RFID controls', description: 'Govern scanning, traceability and device policies.', priority: 'P1', defaultMode: 'MANUAL', risk: 'MEDIUM' },
  ]},
  { name: 'Transportation', description: 'Routes, carriers, freight, docks and delivery execution.', priority: 'P1', icon: Activity, capabilities: [
    { name: 'Carrier policies', description: 'Configure carrier eligibility, service and cost rules.', priority: 'P1', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Route optimization', description: 'Recommend or optimize routes against operating constraints.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'MEDIUM' },
    { name: 'Dock scheduling', description: 'Coordinate appointments and capacity constraints.', priority: 'P1', defaultMode: 'AI AUTOPILOT', risk: 'MEDIUM' },
  ]},
  { name: 'Manufacturing', description: 'BOM, production planning, quality and maintenance.', priority: 'P1', icon: Settings2, capabilities: [
    { name: 'BOM / routing', description: 'Govern manufacturing structures and production routes.', priority: 'P1', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Production planning', description: 'Recommend schedules against demand and capacity.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Quality / maintenance', description: 'Monitor quality signals and maintenance policies.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'HIGH' },
  ]},
  { name: 'Forecasting & S&OP', description: 'Demand sensing, scenarios and planning governance.', priority: 'P1', icon: Sparkles, capabilities: [
    { name: 'Forecast models', description: 'Configure forecast horizons, models and overrides.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Demand sensing', description: 'Detect changes and recommend forecast adjustments.', priority: 'P1', defaultMode: 'AI AUTOPILOT', risk: 'MEDIUM' },
    { name: 'S&OP scenarios', description: 'Compare supply, demand and capacity alternatives.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'HIGH' },
  ]},
  { name: 'Analytics & Reporting', description: 'KPIs, reports, anomaly detection and executive intelligence.', priority: 'P1', icon: Activity, capabilities: [
    { name: 'KPI definitions', description: 'Govern calculation definitions and ownership.', priority: 'P1', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Anomaly detection', description: 'Identify unusual operational and financial patterns.', priority: 'P1', defaultMode: 'AI AUTOPILOT', risk: 'MEDIUM' },
    { name: 'Executive reporting', description: 'Generate evidence-backed management reports.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'MEDIUM' },
  ]},
  { name: 'Integrations', description: 'ERP, APIs, EDI, events, IoT and data mappings.', priority: 'P1', icon: Workflow, capabilities: [
    { name: 'ERP connectors', description: 'Configure and monitor ERP integrations.', priority: 'P1', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'API / EDI mappings', description: 'Govern interface contracts and field mappings.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'CRITICAL' },
    { name: 'Event / IoT ingestion', description: 'Monitor event streams and data quality.', priority: 'P1', defaultMode: 'AI AUTOPILOT', risk: 'HIGH' },
  ]},
  { name: 'Compliance', description: 'Regulatory, documentation, sanctions and sustainability controls.', priority: 'P1', icon: ShieldCheck, capabilities: [
    { name: 'Compliance policies', description: 'Configure regulatory and organizational controls.', priority: 'P1', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'Document intelligence', description: 'Extract and validate controlled documents.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Sanctions / restricted-party checks', description: 'Screen parties and flag potential compliance risks.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'CRITICAL' },
  ]},
  { name: 'Operations', description: 'Observability, releases, backups, migrations and resilience.', priority: 'P1', icon: Activity, capabilities: [
    { name: 'System health', description: 'Monitor services, dependencies and operating status.', priority: 'P1', defaultMode: 'AI AUTOPILOT', risk: 'HIGH' },
    { name: 'Release governance', description: 'Control releases, migrations and rollback policy.', priority: 'P1', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'Backup / recovery', description: 'Govern backup schedules and recovery readiness.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'CRITICAL' },
  ]},
  { name: 'AI / ML', description: 'Models, agents, confidence, tools and AI operating policies.', priority: 'P1', icon: Bot, capabilities: [
    { name: 'AI policies', description: 'Define where AI may recommend, approve or execute.', priority: 'P1', defaultMode: 'MANUAL', risk: 'CRITICAL' },
    { name: 'Model governance', description: 'Review models, confidence and evaluation status.', priority: 'P1', defaultMode: 'AI COPILOT', risk: 'HIGH' },
    { name: 'Agent permissions', description: 'Control tools, scopes and action authority for agents.', priority: 'P1', defaultMode: 'MANUAL', risk: 'CRITICAL' },
  ]},
  { name: 'Portals', description: 'Supplier, customer, carrier and distributor portal governance.', priority: 'P2', icon: Users, capabilities: [
    { name: 'Portal access', description: 'Manage external identities and permissions.', priority: 'P2', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'External workflows', description: 'Configure approvals, submissions and notifications.', priority: 'P2', defaultMode: 'AI COPILOT', risk: 'MEDIUM' },
    { name: 'Portal analytics', description: 'Monitor adoption, response and service levels.', priority: 'P2', defaultMode: 'AI AUTOPILOT', risk: 'LOW' },
  ]},
  { name: 'Mobile & Devices', description: 'Mobile workflows, offline operation, devices and notifications.', priority: 'P2', icon: Settings2, capabilities: [
    { name: 'Device policies', description: 'Govern registered devices and access requirements.', priority: 'P2', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Offline policies', description: 'Control offline data scope, retention and sync rules.', priority: 'P2', defaultMode: 'MANUAL', risk: 'HIGH' },
    { name: 'Push notifications', description: 'Configure operational notification policies.', priority: 'P2', defaultMode: 'AI COPILOT', risk: 'LOW' },
  ]},
];

const modeMeta: Record<Mode, { label: string; description: string; icon: React.ElementType }> = {
  MANUAL: { label: 'Manual', description: 'Administrator controls the change directly.', icon: SlidersHorizontal },
  'AI COPILOT': { label: 'AI Copilot', description: 'AI analyzes and proposes; an authorized person decides.', icon: Sparkles },
  'AI AUTOPILOT': { label: 'AI Autopilot', description: 'AI may execute automatically inside an approved policy boundary.', icon: Bot },
};

export const AdminControlCenter: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0].name);
  const [selectedCapability, setSelectedCapability] = useState(DOMAINS[0].capabilities[0].name);
  const [modeOverrides, setModeOverrides] = useState<Record<string, Mode>>({});
  const [approvalRequired, setApprovalRequired] = useState(true);

  const filteredDomains = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOMAINS;
    return DOMAINS.map(domain => ({
      ...domain,
      capabilities: domain.capabilities.filter(c => `${domain.name} ${domain.description} ${c.name} ${c.description}`.toLowerCase().includes(q)),
    })).filter(d => d.capabilities.length > 0 || d.name.toLowerCase().includes(q));
  }, [query]);

  const domain = DOMAINS.find(d => d.name === selectedDomain) ?? DOMAINS[0];
  const capability = domain.capabilities.find(c => c.name === selectedCapability) ?? domain.capabilities[0];
  const currentMode = modeOverrides[`${domain.name}:${capability.name}`] ?? capability.defaultMode;

  const selectCapability = (d: Domain, c: Capability) => {
    setSelectedDomain(d.name);
    setSelectedCapability(c.name);
  };

  const setMode = (mode: Mode) => {
    setModeOverrides(prev => ({ ...prev, [`${domain.name}:${capability.name}`]: mode }));
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-400">
            <CircleDot size={12} /> Platform Administration
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-os-text-primary">AI + Manual Control Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-os-text-muted">One governed control plane for every operational domain: capability, policy, operating mode, governance and audit.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
          <span className="text-emerald-300">AI GOVERNANCE ACTIVE</span>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted" size={16} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search domains, capabilities or policies..." className="w-full rounded-lg border border-os-border bg-os-surface/60 py-2.5 pl-10 pr-4 text-sm text-os-text-primary outline-none focus:border-cyan-500/50" />
      </div>

      <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-xl border border-os-border bg-[#080b0f] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-os-border bg-black/20 xl:border-b-0 xl:border-r">
          <div className="border-b border-os-border px-4 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-os-text-muted">Domains · {filteredDomains.length}</div>
          <div className="max-h-[620px] overflow-y-auto p-2">
            {filteredDomains.map(d => {
              const Icon = d.icon;
              const active = d.name === domain.name;
              return (
                <button key={d.name} type="button" onClick={() => { setSelectedDomain(d.name); setSelectedCapability(d.capabilities[0]?.name ?? ''); }} className={cn('mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition', active ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-transparent text-os-text-secondary hover:border-os-border hover:bg-white/[0.03]')}>
                  <Icon size={16} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{d.name}</span>
                    <span className="block text-[10px] text-os-text-muted">{d.capabilities.length} capabilities</span>
                  </span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-mono', d.priority === 'P0' ? 'bg-red-500/10 text-red-300' : d.priority === 'P1' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-500/10 text-slate-300')}>{d.priority}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-os-border px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-400">Domain <ChevronRight size={11} /> {domain.name}</div>
                <h2 className="mt-1 text-lg font-semibold text-os-text-primary">{domain.description}</h2>
              </div>
              <span className="rounded border border-os-border px-2 py-1 text-[10px] font-mono text-os-text-muted">POLICY SCOPE · ORGANIZATION</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            <div className="min-w-0 border-b border-os-border lg:border-b-0 lg:border-r">
              <div className="border-b border-os-border px-5 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-os-text-muted">Capabilities → Policy</div>
              <div className="p-4 space-y-2">
                {domain.capabilities.map(c => {
                  const active = c.name === capability.name;
                  return (
                    <button key={c.name} type="button" onClick={() => selectCapability(domain, c)} className={cn('w-full rounded-lg border p-3 text-left transition', active ? 'border-cyan-500/30 bg-cyan-500/[0.05]' : 'border-os-border bg-os-surface/20 hover:bg-white/[0.03]')}>
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 h-2 w-2 rounded-full', active ? 'bg-cyan-400' : 'bg-slate-600')} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-os-text-primary">{c.name}</span>
                            <span className="text-[9px] font-mono text-os-text-muted">{c.priority}</span>
                            <span className="text-[9px] font-mono text-os-text-muted">RISK · {c.risk}</span>
                          </div>
                          <p className="mt-1 text-xs text-os-text-muted">{c.description}</p>
                        </div>
                        <ChevronRight size={15} className="mt-1 shrink-0 text-os-text-muted" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 p-5 space-y-5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-os-text-muted">Selected capability</div>
                <h3 className="mt-1 text-base font-semibold text-os-text-primary">{capability.name}</h3>
                <p className="mt-1 text-xs leading-5 text-os-text-muted">{capability.description}</p>
              </div>

              <div>
                <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-os-text-muted">Operating mode</div>
                <div className="space-y-2">
                  {(Object.keys(modeMeta) as Mode[]).map(mode => {
                    const MetaIcon = modeMeta[mode].icon;
                    const active = currentMode === mode;
                    return <button key={mode} type="button" onClick={() => setMode(mode)} className={cn('flex w-full items-center gap-3 rounded-lg border p-3 text-left transition', active ? 'border-blue-500/40 bg-blue-500/10' : 'border-os-border hover:bg-white/[0.03]')}>
                      <MetaIcon size={16} className={active ? 'text-blue-300' : 'text-os-text-muted'} />
                      <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-os-text-primary">{modeMeta[mode].label}</span><span className="mt-0.5 block text-[10px] text-os-text-muted">{modeMeta[mode].description}</span></span>
                      {active && <CheckCircle2 size={15} className="text-blue-300" />}
                    </button>;
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-os-border bg-os-surface/20 p-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-os-text-muted"><ShieldCheck size={13} /> Governance</div>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-3"><span className="text-os-text-muted">Risk level</span><span className={cn('font-mono', capability.risk === 'CRITICAL' ? 'text-red-300' : capability.risk === 'HIGH' ? 'text-amber-300' : 'text-emerald-300')}>{capability.risk}</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-os-text-muted">Approval required</span><button type="button" onClick={() => setApprovalRequired(v => !v)} className={cn('rounded border px-2 py-1 font-mono text-[10px]', approvalRequired ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300')}>{approvalRequired ? 'YES' : 'NO'}</button></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-os-text-muted">Execution scope</span><span className="font-mono text-os-text-secondary">ORGANIZATION</span></div>
                  <div className="flex items-center justify-between gap-3"><span className="text-os-text-muted">High-impact actions</span><span className="font-mono text-amber-300">HUMAN GATE</span></div>
                </div>
              </div>

              <div className="rounded-lg border border-os-border bg-os-surface/20 p-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-os-text-muted"><Activity size={13} /> Audit</div>
                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="flex justify-between gap-3"><span className="text-os-text-muted">Last policy change</span><span className="text-os-text-secondary">System baseline</span></div>
                  <div className="flex justify-between gap-3"><span className="text-os-text-muted">Changed by</span><span className="text-os-text-secondary">Orion Administrator</span></div>
                  <div className="flex justify-between gap-3"><span className="text-os-text-muted">Current mode</span><span className="text-cyan-300">{currentMode}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-os-text-muted">Audit state</span><span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 size={12} /> Recorded</span></div>
                </div>
              </div>

              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-xs font-medium text-blue-300 hover:bg-blue-500/15">
                <Play size={14} /> Review policy configuration
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Domains', DOMAINS.length], ['Capabilities', DOMAINS.reduce((n, d) => n + d.capabilities.length, 0)], ['P0 Controls', DOMAINS.filter(d => d.priority === 'P0').length], ['Governed Modes', '3']].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-os-border bg-os-surface/20 p-3"><div className="text-[9px] font-mono uppercase tracking-[0.16em] text-os-text-muted">{label}</div><div className="mt-1 text-lg font-semibold text-os-text-primary">{value}</div></div>
        ))}
      </div>
    </div>
  );
};
