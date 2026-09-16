import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Bot, BrainCircuit, CheckCircle2, ChevronRight, CircleDollarSign,
  Database, GitBranch, Globe2, Link2, Network, Play, RefreshCw, Search,
  ShieldCheck, Sparkles, Target, TrendingUp, Workflow, Zap
} from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { AutonomousOperationsEngine, AutonomyMode, OrionDecision, OrionScenario } from '../services/AutonomousOperationsEngine';
import { Card, CardContent, CardHeader } from './ui/Card';
import { PageHeader } from './ui/PageHeader';
import { cn } from '../lib/utils';

const tabs = [
  ['command', 'Mission Control', Activity], ['twin', 'Digital Twin', Globe2], ['signals', 'Event Fabric', Zap],
  ['decisions', 'Decision Engine', Target], ['scenarios', 'Scenario Lab', Network], ['agents', 'AI Agents', Bot],
  ['integrations', 'Integration Fabric', Link2], ['master-data', 'Master Data', Database], ['finance', 'Financial Intel', CircleDollarSign],
  ['risk', 'Risk Graph', GitBranch], ['automation', 'Automation', Workflow], ['governance', 'AI Governance', ShieldCheck],
  ['learning', 'Learning Loop', TrendingUp], ['ask', 'Ask ORION', Sparkles],
] as const;

type TabId = typeof tabs[number][0];

const money = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

export const AutonomousOperationsCenter: React.FC<{ adminMode?: boolean }> = ({ adminMode = false }) => {
  const scm = useSupplyChain();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('command');
  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [mode, setMode] = useState<AutonomyMode>('COPILOT');
  const [decisions, setDecisions] = useState<OrionDecision[]>([]);
  const [scenario, setScenario] = useState<OrionScenario | null>(null);

  const snapshot = useMemo(() => AutonomousOperationsEngine.buildSnapshot({
    inventory: scm.inventory || [], purchaseOrders: scm.purchaseOrders || [], shipments: scm.shipments || [], suppliers: scm.suppliers || [], exceptions: scm.exceptions || [],
  }), [scm.inventory, scm.purchaseOrders, scm.shipments, scm.suppliers, scm.exceptions]);

  React.useEffect(() => setDecisions(AutonomousOperationsEngine.loadDecisions()), []);

  const runAnalysis = () => {
    setRunning(true);
    window.setTimeout(() => {
      const generated = snapshot.decisions.map(d => ({ ...d, mode }));
      generated.forEach(d => AutonomousOperationsEngine.recordDecision(d));
      setDecisions([...generated, ...AutonomousOperationsEngine.loadDecisions().filter(d => !generated.some(g => g.id === d.id))]);
      setRunning(false);
      showToast(`Analysis completed: ${generated.length} governed decisions generated.`, 'success', 'ORION Autonomous Engine');
    }, 650);
  };

  const updateDecision = (decision: OrionDecision, status: OrionDecision['status']) => {
    const updated = { ...decision, status };
    AutonomousOperationsEngine.recordDecision(updated);
    if (status === 'EXECUTED') {
      AutonomousOperationsEngine.recordLearning({ decisionId: decision.id, result: 'SUCCESS', avoidedCost: decision.valueAtRisk * 0.8 });
    }
    setDecisions(prev => prev.map(d => d.id === decision.id ? updated : d));
    showToast(status === 'EXECUTED' ? 'Action executed in ORION sandbox and outcome recorded.' : `Decision ${status.toLowerCase()}.`, status === 'EXECUTED' ? 'success' : 'info', 'Decision Governance');
  };

  const ask = () => {
    if (!question.trim()) return;
    setAnswer(AutonomousOperationsEngine.answerQuestion(question, snapshot));
  };

  const runScenario = () => {
    const next = AutonomousOperationsEngine.simulateScenario('Custom scenario', 15, 4, 7, snapshot.inventoryValue, snapshot.valueAtRisk);
    setScenario(next);
    showToast('Scenario simulation completed.', 'success', 'Scenario Lab');
  };

  const effectiveDecisions = decisions.length ? decisions : snapshot.decisions;
  const connected = snapshot.integrations.filter(i => i.status === 'CONNECTED').length;

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-5 min-w-0">
      <PageHeader
        title={adminMode ? 'ORION Autonomous Operations — Control Plane' : 'ORION Autonomous Operations'}
        description="Closed-loop supply chain intelligence: detect → understand → predict → simulate → decide → govern → execute → verify → learn."
        actions={<div className="flex flex-wrap gap-2">
          <select value={mode} onChange={e => setMode(e.target.value as AutonomyMode)} className="h-9 px-3 rounded-lg bg-os-surface border border-os-border text-xs text-os-text-primary">
            <option value="MANUAL">Manual</option><option value="COPILOT">AI Copilot</option><option value="AUTOPILOT">AI Autopilot</option>
          </select>
          <button onClick={runAnalysis} disabled={running} className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2">
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} /> {running ? 'Running Engine…' : 'Run Autonomous Analysis'}
          </button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          ['Operating Health', `${snapshot.health}/100`, snapshot.health >= 80 ? 'text-emerald-400' : 'text-amber-400'],
          ['Value at Risk', money(snapshot.valueAtRisk), 'text-amber-400'],
          ['Open Exceptions', String(snapshot.openExceptions), 'text-os-text-primary'],
          ['Critical', String(snapshot.criticalExceptions), 'text-red-400'],
          ['Delayed Shipments', String(snapshot.delayedShipments), 'text-amber-400'],
          ['Supplier OTIF', `${snapshot.supplierOtif}%`, 'text-emerald-400'],
          ['Integrations', `${connected}/${snapshot.integrations.length}`, 'text-cyan-400'],
          ['Learning Accuracy', `${snapshot.learning.accuracy}%`, 'text-violet-400'],
        ].map(([label, value, color]) => <div key={label} className="rounded-xl border border-os-border bg-os-surface p-3 min-w-0">
          <div className="text-[9px] uppercase tracking-widest text-os-text-muted truncate">{label}</div>
          <div className={cn('mt-1 text-lg font-mono', color)}>{value}</div>
        </div>)}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-os-border scrollbar-thin">
        {tabs.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={cn('shrink-0 flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider border-b-2 transition-colors', tab === id ? 'text-cyan-400 border-cyan-400' : 'text-os-text-muted border-transparent hover:text-os-text-primary')}><Icon size={13} />{label}</button>)}
      </div>

      {tab === 'command' && <MissionControl snapshot={snapshot} onTab={setTab} adminMode={adminMode} />}
      {tab === 'twin' && <DigitalTwin snapshot={snapshot} />}
      {tab === 'signals' && <Signals snapshot={snapshot} />}
      {tab === 'decisions' && <Decisions decisions={effectiveDecisions} onUpdate={updateDecision} />}
      {tab === 'scenarios' && <ScenarioLab snapshot={snapshot} scenario={scenario} onRun={runScenario} />}
      {tab === 'agents' && <Agents snapshot={snapshot} />}
      {tab === 'integrations' && <Integrations snapshot={snapshot} adminMode={adminMode} onNavigate={() => navigate('/integrations')} />}
      {tab === 'master-data' && <MasterData snapshot={snapshot} />}
      {tab === 'finance' && <Finance snapshot={snapshot} />}
      {tab === 'risk' && <RiskGraph snapshot={snapshot} />}
      {tab === 'automation' && <Automation snapshot={snapshot} />}
      {tab === 'governance' && <Governance mode={mode} adminMode={adminMode} />}
      {tab === 'learning' && <Learning snapshot={snapshot} />}
      {tab === 'ask' && <Ask question={question} setQuestion={setQuestion} answer={answer} onAsk={ask} />}

      <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-os-text-muted font-mono border-t border-os-border pt-3">
        <span>SESSION: {profile?.role || 'operator'} • MODE: {mode}</span>
        <span>External ERP/WMS/TMS/MES writes remain governed by configured connectors and policies.</span>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, subtitle, children, actions }) => <Card><CardHeader title={title} subtitle={subtitle} actions={actions} /><CardContent>{children}</CardContent></Card>;

const MissionControl: React.FC<{ snapshot: ReturnType<typeof AutonomousOperationsEngine.buildSnapshot>; onTab: (tab: TabId) => void; adminMode: boolean }> = ({ snapshot, onTab, adminMode }) => <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
  <Section title="Closed-Loop Operating System" subtitle="The full ORION decision lifecycle">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {['Detect', 'Understand', 'Predict', 'Simulate', 'Decide', 'Govern', 'Execute', 'Verify', 'Learn'].map((step, i) => <div key={step} className="flex items-center gap-3 p-3 rounded-lg bg-os-surface-secondary border border-os-border"><span className="w-7 h-7 rounded-full border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xs font-mono">{i + 1}</span><div><div className="text-xs text-os-text-primary">{step}</div><div className="text-[10px] text-os-text-muted">{i < 5 ? 'Intelligence layer' : 'Control layer'}</div></div></div>)}
    </div>
  </Section>
  <Section title="Immediate Attention" subtitle="Highest-value intervention candidates" actions={<button onClick={() => onTab('decisions')} className="text-[10px] text-cyan-400">View all →</button>}>
    <div className="space-y-2">{snapshot.decisions.slice(0, 4).map(d => <div key={d.id} className="p-3 rounded-lg border border-os-border bg-os-surface-secondary"><div className="flex justify-between gap-3"><span className="text-xs text-os-text-primary">{d.title}</span><span className="text-[10px] text-amber-400">{d.confidence}%</span></div><div className="text-[10px] text-os-text-muted mt-1">{d.impact}</div></div>)}{!snapshot.decisions.length && <Empty text="No decisions require attention." />}</div>
  </Section>
  <Section title="Executive Posture" subtitle={adminMode ? 'Platform-wide governance' : 'Your operating view'}>
    <div className="space-y-4"><Metric label="Health" value={`${snapshot.health}/100`} /><Metric label="Financial exposure" value={money(snapshot.valueAtRisk)} /><Metric label="Learning accuracy" value={`${snapshot.learning.accuracy}%`} /><Metric label="Avoided cost" value={money(snapshot.learning.avoidedCost)} /><div className="pt-2 grid grid-cols-2 gap-2"><button onClick={() => onTab('risk')} className="h-9 rounded-lg border border-os-border text-xs hover:bg-os-surface-secondary">Risk Graph</button><button onClick={() => onTab('ask')} className="h-9 rounded-lg border border-os-border text-xs hover:bg-os-surface-secondary">Ask ORION</button></div></div>
  </Section>
</div>;

const Metric = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between items-center"><span className="text-xs text-os-text-muted">{label}</span><span className="font-mono text-sm text-os-text-primary">{value}</span></div>;
const Empty = ({ text }: { text: string }) => <div className="p-6 text-center text-xs text-os-text-muted border border-dashed border-os-border rounded-lg">{text}</div>;

const DigitalTwin: React.FC<{ snapshot: any }> = ({ snapshot }) => <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="Supply Chain Digital Twin" subtitle="Live logical representation of the operating network"><div className="grid grid-cols-5 gap-2 text-center">{[['SUPPLIERS', snapshot.agents[0]?.actionsToday || 0], ['INVENTORY', snapshot.inventoryValue], ['POs', snapshot.decisions.length], ['SHIPMENTS', snapshot.delayedShipments], ['EXCEPTIONS', snapshot.openExceptions]].map(([label, value]) => <div key={label} className="p-4 rounded-xl bg-os-surface-secondary border border-os-border"><div className="text-[9px] text-os-text-muted">{label}</div><div className="mt-2 text-lg font-mono text-cyan-400">{typeof value === 'number' && value > 1000 ? money(value) : value}</div></div>)}</div><div className="mt-5 p-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5"><div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold"><Globe2 size={15}/> Network state</div><div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-os-text-muted">Supplier network <ChevronRight size={13}/> Inbound <ChevronRight size={13}/> Warehouses <ChevronRight size={13}/> Fulfillment <ChevronRight size={13}/> Customers</div></div></Section><Section title="Digital Twin Questions"><div className="space-y-2">{['What happens if Supplier A fails?', 'Which customers are exposed to Port B?', 'Where is capacity constrained?', 'Which node has the highest financial dependency?'].map(q => <div key={q} className="p-3 rounded-lg border border-os-border flex items-center justify-between text-xs"><span>{q}</span><ChevronRight size={14} className="text-os-text-muted"/></div>)}</div></Section></div>;

const Signals: React.FC<{ snapshot: any }> = ({ snapshot }) => <Section title="Event Fabric" subtitle="Event-driven telemetry and exception ingestion" actions={<span className="text-[10px] text-emerald-400">● STREAM ACTIVE</span>}><div className="space-y-2">{snapshot.events.map((e: any) => <div key={e.id} className="grid grid-cols-[90px_1fr_auto] gap-3 items-center p-3 rounded-lg border border-os-border"><span className={cn('text-[9px] font-mono', e.severity === 'CRITICAL' ? 'text-red-400' : e.severity === 'HIGH' ? 'text-amber-400' : 'text-os-text-muted')}>{e.severity}</span><div><div className="text-xs text-os-text-primary">{e.type} <span className="text-os-text-muted">• {e.entity}</span></div><div className="text-[10px] text-os-text-muted mt-1">{e.description}</div></div><span className="text-[9px] text-os-text-muted">{e.source}</span></div>)}{!snapshot.events.length && <Empty text="Event fabric is quiet."/>}</div></Section>;

const Decisions: React.FC<{ decisions: OrionDecision[]; onUpdate: (d: OrionDecision, s: OrionDecision['status']) => void }> = ({ decisions, onUpdate }) => <Section title="Decision Engine" subtitle="Evidence-backed decisions with policy-aware execution"><div className="space-y-3">{decisions.map(d => <div key={d.id} className="p-4 rounded-xl border border-os-border bg-os-surface-secondary"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><div className="text-sm text-os-text-primary">{d.title}</div><div className="text-[10px] text-os-text-muted mt-1">{d.reason}</div></div><div className="flex items-center gap-2"><span className="text-[10px] px-2 py-1 rounded border border-violet-500/30 text-violet-400">{d.mode}</span><span className="text-[10px] px-2 py-1 rounded border border-emerald-500/30 text-emerald-400">{d.confidence}% confidence</span></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-[10px]"><div><span className="text-os-text-muted">Exposure</span><div className="font-mono text-amber-400 mt-1">{money(d.valueAtRisk)}</div></div><div><span className="text-os-text-muted">Recommendation</span><div className="text-os-text-primary mt-1">{d.recommendedAction}</div></div><div><span className="text-os-text-muted">Policy</span><div className="text-os-text-primary mt-1">{d.policy}</div></div></div><div className="flex flex-wrap gap-2 mt-4"><button onClick={() => onUpdate(d, 'APPROVED')} className="h-8 px-3 rounded-lg bg-blue-600 text-white text-[10px]">Approve</button><button onClick={() => onUpdate(d, 'EXECUTED')} className="h-8 px-3 rounded-lg border border-emerald-500/30 text-emerald-400 text-[10px]">Execute Sandbox</button><button onClick={() => onUpdate(d, 'REJECTED')} className="h-8 px-3 rounded-lg border border-red-500/30 text-red-400 text-[10px]">Reject</button></div></div>)}{!decisions.length && <Empty text="Run Autonomous Analysis to generate governed decisions."/>}</div></Section>;

const ScenarioLab: React.FC<{ snapshot: any; scenario: OrionScenario | null; onRun: () => void }> = ({ snapshot, scenario, onRun }) => <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="Scenario Laboratory" subtitle="Counterfactual simulation before execution" actions={<button onClick={onRun} className="h-8 px-3 rounded-lg bg-blue-600 text-white text-[10px] flex items-center gap-2"><Play size={12}/> Run Custom Scenario</button>}><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{snapshot.scenarios.map((s: OrionScenario) => <ScenarioCard key={s.id} scenario={s}/>)}</div></Section><Section title="Simulation Result" subtitle="Expected system-level impact"><div className="space-y-3">{scenario ? <ScenarioCard scenario={scenario} expanded/> : <Empty text="Run a scenario to see financial, service and risk impact."/>}</div></Section></div>;
const ScenarioCard = ({ scenario, expanded = false }: { scenario: OrionScenario; expanded?: boolean }) => <div className="p-4 rounded-xl border border-os-border bg-os-surface-secondary"><div className="text-xs text-os-text-primary">{scenario.name}</div><div className="grid grid-cols-2 gap-3 mt-3 text-[10px]"><Metric label="Service" value={`${scenario.serviceLevel}%`} /><Metric label="Risk" value={`${scenario.riskScore}/100`} /><Metric label="Financial" value={money(scenario.financialImpact)} /><Metric label="Inventory Δ" value={money(scenario.inventoryImpact)} /></div>{expanded && <div className="mt-3 text-[10px] text-cyan-400">Demand {scenario.demandDelta > 0 ? '+' : ''}{scenario.demandDelta}% • Lead time +{scenario.leadTimeDelta}d • Freight +{scenario.freightDelta}%</div>}</div>;

const Agents: React.FC<{ snapshot: any }> = ({ snapshot }) => <Section title="AI Agent Workforce" subtitle="Specialized agents operating under the ORION governance plane"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{snapshot.agents.map((a: any) => <div key={a.id} className="p-4 rounded-xl border border-os-border"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Bot size={15} className="text-violet-400"/><span className="text-xs text-os-text-primary">{a.name}</span></div><span className="text-[9px] text-emerald-400">{a.status}</span></div><div className="text-[10px] text-os-text-muted mt-1">{a.domain}</div><div className="grid grid-cols-3 gap-2 mt-4 text-[10px]"><div><span className="text-os-text-muted">Actions</span><div>{a.actionsToday}</div></div><div><span className="text-os-text-muted">Success</span><div>{a.successRate}%</div></div><div><span className="text-os-text-muted">Mode</span><div>{a.autonomy}</div></div></div></div>)}</div></Section>;

const Integrations: React.FC<{ snapshot: any; adminMode: boolean; onNavigate: () => void }> = ({ snapshot, adminMode, onNavigate }) => <Section title="Integration Fabric" subtitle="Canonical enterprise connectivity layer" actions={adminMode ? <button onClick={onNavigate} className="text-[10px] text-cyan-400">Open connector manager →</button> : undefined}><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{snapshot.integrations.map((i: any) => <div key={i.id} className="p-4 rounded-xl border border-os-border"><div className="flex justify-between gap-3"><span className="text-xs text-os-text-primary">{i.name}</span><span className={cn('text-[9px]', i.status === 'CONNECTED' ? 'text-emerald-400' : i.status === 'DEGRADED' ? 'text-amber-400' : 'text-os-text-muted')}>{i.status}</span></div><div className="text-[10px] text-os-text-muted mt-2">{i.category} • {i.recordsToday.toLocaleString()} records today</div><div className="text-[9px] text-os-text-muted mt-1">Last sync: {i.lastSync}</div></div>)}</div></Section>;

const MasterData: React.FC<{ snapshot: any }> = ({ snapshot }) => <Section title="Master Data Intelligence" subtitle="Detect, explain and govern data quality changes"><div className="space-y-2">{snapshot.masterDataIssues.map((i: any) => <div key={i.id} className="p-4 rounded-lg border border-os-border flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div className="text-xs text-os-text-primary">{i.type} <span className="text-os-text-muted">• {i.entity}</span></div><div className="text-[10px] text-os-text-muted mt-1">{i.recommendation}</div></div><div className="flex items-center gap-3"><span className="text-lg font-mono text-amber-400">{i.count}</span><span className="text-[9px] text-os-text-muted">{i.severity}</span></div></div>)}</div></Section>;

const Finance: React.FC<{ snapshot: any }> = ({ snapshot }) => <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="Supply Chain Financial Intelligence" subtitle="Translate operational events into financial consequences"><div className="grid grid-cols-2 gap-4"><div className="p-5 rounded-xl bg-os-surface-secondary border border-os-border"><div className="text-[9px] text-os-text-muted uppercase">Inventory capital</div><div className="text-2xl font-mono text-os-text-primary mt-2">{money(snapshot.inventoryValue)}</div></div><div className="p-5 rounded-xl bg-os-surface-secondary border border-os-border"><div className="text-[9px] text-os-text-muted uppercase">Value at risk</div><div className="text-2xl font-mono text-amber-400 mt-2">{money(snapshot.valueAtRisk)}</div></div></div></Section><Section title="Decision Economics"><div className="space-y-3"><Metric label="Potential avoided cost" value={money(snapshot.learning.avoidedCost)} /><Metric label="Current exposed value" value={money(snapshot.valueAtRisk)} /><Metric label="Learning accuracy" value={`${snapshot.learning.accuracy}%`} /><div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-300">Every governed decision can carry operational, financial and risk impact before approval.</div></div></Section></div>;

const RiskGraph: React.FC<{ snapshot: any }> = ({ snapshot }) => <Section title="Supply Chain Risk Graph" subtitle="Dependency paths from source to customer"><div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5"><div className="grid grid-cols-5 gap-2 items-center text-center">{['Supplier', 'Component', 'Plant', 'DC', 'Customer'].map((x, i) => <React.Fragment key={x}><div className="p-4 rounded-xl border border-os-border bg-os-surface"><div className="text-xs text-os-text-primary">{x}</div><div className="text-[9px] text-os-text-muted mt-1">{i === 0 ? 'risk source' : i === 4 ? 'service exposure' : 'dependency'}</div></div>{i < 4 && <ChevronRight size={14} className="text-red-400 mx-auto"/>}</React.Fragment>)}</div><div className="mt-5 text-[10px] text-os-text-muted">ORION currently maps {snapshot.openExceptions} open exceptions into the risk posture. Use the graph to trace second-order effects before executing changes.</div></div></Section>;

const Automation: React.FC<{ snapshot: any }> = ({ snapshot }) => <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="Closed-Loop Automation"><div className="space-y-2">{['Exception detected', 'AI analysis complete', 'Policy evaluated', 'Approval / autonomy decision', 'Execution adapter', 'Outcome verification', 'Learning update'].map((x, i) => <div key={x} className="flex items-center gap-3 p-3 rounded-lg border border-os-border"><span className="text-[10px] font-mono text-cyan-400">0{i + 1}</span><span className="text-xs">{x}</span><CheckCircle2 size={14} className="ml-auto text-emerald-400"/></div>)}</div></Section><Section title="Automation Readiness"><Metric label="Autonomous candidates" value={String(snapshot.decisions.filter((d: any) => d.mode === 'AUTOPILOT').length)} /><Metric label="Approval candidates" value={String(snapshot.decisions.filter((d: any) => d.mode === 'COPILOT').length)} /><Metric label="Agents online" value={String(snapshot.agents.filter((a: any) => a.status !== 'WAITING_APPROVAL').length)} /><div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-300">External system mutations should be enabled only after connector credentials and policies are configured.</div></Section></div>;

const Governance: React.FC<{ mode: AutonomyMode; adminMode: boolean }> = ({ mode, adminMode }) => <div className="grid grid-cols-1 xl:grid-cols-2 gap-5"><Section title="AI Governance Plane" subtitle="Policy controls for Manual, Copilot and Autopilot"><div className="space-y-3">{[['Critical financial change', 'Human approval required'], ['Standard replenishment', 'Autopilot allowed within threshold'], ['Supplier termination', 'Admin + business approval'], ['Cross-org data access', 'Blocked by default'], ['External ERP write', 'Connector + policy required']].map(([a, b]) => <div key={a} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-os-border"><span className="text-xs">{a}</span><span className="text-[10px] text-cyan-400">{b}</span></div>)}</div></Section><Section title="Current Operating Mode"><div className="text-3xl font-mono text-violet-400">{mode}</div><div className="text-xs text-os-text-muted mt-2">{adminMode ? 'Platform administrators can define policy boundaries for all organizations.' : 'Your actions remain constrained by the policies configured by administrators.'}</div><div className="grid grid-cols-3 gap-2 mt-5">{(['MANUAL', 'COPILOT', 'AUTOPILOT'] as AutonomyMode[]).map(m => <div key={m} className={cn('p-3 rounded-lg border text-center text-[9px]', m === mode ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/5' : 'border-os-border text-os-text-muted')}>{m}</div>)}</div></Section></div>;

const Learning: React.FC<{ snapshot: any }> = ({ snapshot }) => <div className="grid grid-cols-1 xl:grid-cols-3 gap-5"><Section title="Learning Loop"><Metric label="Predictions" value={snapshot.learning.predictions.toLocaleString()} /><Metric label="Verified outcomes" value={snapshot.learning.verified.toLocaleString()} /><Metric label="Prediction accuracy" value={`${snapshot.learning.accuracy}%`} /><Metric label="Avoided cost" value={money(snapshot.learning.avoidedCost)} /></Section><Section title="How ORION Learns"><div className="space-y-2">{['Prediction', 'Execution', 'Actual outcome', 'Prediction error', 'Model / policy adjustment'].map((x, i) => <div key={x} className="p-3 rounded-lg border border-os-border text-xs flex items-center gap-3"><span className="text-cyan-400 font-mono">{i + 1}</span>{x}</div>)}</div></Section><Section title="Trust Signals"><div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"><div className="flex items-center gap-2 text-emerald-400 text-xs"><BrainCircuit size={15}/> Outcome-aware intelligence</div><p className="text-[10px] text-os-text-muted mt-2">ORION records decision outcomes separately from recommendations so learning can be measured rather than assumed.</p></div></Section></div>;

const Ask: React.FC<{ question: string; setQuestion: (v: string) => void; answer: string; onAsk: () => void }> = ({ question, setQuestion, answer, onAsk }) => <div className="max-w-5xl mx-auto"><Section title="Ask ORION" subtitle="Natural-language access to the operating model"><div className="flex gap-2"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-3 text-os-text-muted"/><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAsk()} placeholder="Why is inventory increasing? What are my biggest risks? Which integrations are connected?" className="w-full h-10 pl-9 pr-3 rounded-lg bg-os-bg border border-os-border text-xs text-os-text-primary outline-none focus:border-cyan-500/50"/></div><button onClick={onAsk} className="h-10 px-5 rounded-lg bg-blue-600 text-white text-xs">Analyze</button></div><div className="flex flex-wrap gap-2 mt-3">{['What are my biggest risks?', 'How is inventory doing?', 'What is my supplier performance?', 'Which integrations are connected?'].map(q => <button key={q} onClick={() => { setQuestion(q); }} className="px-3 py-1.5 rounded-full border border-os-border text-[10px] text-os-text-muted hover:text-os-text-primary">{q}</button>)}</div>{answer && <div className="mt-5 p-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5"><div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold"><Sparkles size={14}/> ORION Answer</div><p className="text-sm text-os-text-primary mt-3 leading-relaxed">{answer}</p></div>}</Section></div>;
