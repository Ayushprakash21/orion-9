import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  History, 
  AlertTriangle,
  Clock,
  Compass,
  Play
} from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';

interface AIDecisionCenterViewProps {
  onAskCopilot: (query: string) => void;
  currency: string;
}

export const AIDecisionCenterView: React.FC<AIDecisionCenterViewProps> = ({
  onAskCopilot,
  currency,
}) => {
  const [selectedDomainQuery, setSelectedDomainQuery] = useState<string>('all');

  const suggestedQueries = [
    { label: 'Priorities', query: 'What should I focus on today across supply chain risks and delayed shipments?' },
    { label: 'Inventory Capital', query: 'Which actions can save working capital without reducing customer service levels?' },
    { label: 'Supplier Exposure', query: 'Which suppliers are creating the most delivery and quality risk this quarter?' },
    { label: 'Order Impacts', query: 'Which high-value customer orders are currently at risk from upstream delays?' },
    { label: 'PO Deferral Impact', query: 'What happens to cash flow and warehouse capacity if we defer 23 open purchase orders?' },
    { label: 'Pending Governance', query: 'What autonomous recommendations are currently waiting for human approval?' },
  ];

  const decisionTraces = [
    {
      id: 'trace-4401',
      title: 'Automated Stock Transfer from Singapore Hub to São Paulo Plant',
      riskTier: 'LOW',
      governanceStatus: 'APPROVED_BY_POLICY',
      expectedSavings: 42000,
      timestamp: '14 mins ago',
      agent: 'Agent-InventoryOptimizer-09',
    },
    {
      id: 'trace-4402',
      title: 'Ocean Carrier Rebooking via Rotterdam Transshipment Bypass',
      riskTier: 'MATERIAL',
      governanceStatus: 'APPROVAL_REQUIRED',
      expectedSavings: 115000,
      timestamp: '32 mins ago',
      agent: 'Agent-LogisticsNavigator-03',
    },
    {
      id: 'trace-4403',
      title: 'Dynamic Safety Stock Adjustment across 14 Regional Nodes',
      riskTier: 'LOW',
      governanceStatus: 'EXECUTED_BY_KERNEL',
      expectedSavings: 280000,
      timestamp: '1 hour ago',
      agent: 'Agent-AutonomousPolicy-01',
    },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* HEADER BANNER */}
      <div className="p-4 sm:p-5 rounded-xl border border-os-border bg-gradient-to-r from-os-surface-elevated/90 to-os-surface/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-os-text-primary">
              AI Decision Center &bull; Governed Autonomous Core
            </h2>
          </div>
          <p className="text-xs text-os-text-secondary font-mono mt-1">
            Real-time synthesis of multi-agent recommendations, policy gating, decision traces, and outcome verification.
          </p>
        </div>

        <button
          onClick={() => onAskCopilot("Synthesize current supply chain posture, top 3 risks, and optimal decisions.")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Sparkles size={14} />
          <span>Launch Executive Synthesis</span>
        </button>
      </div>

      {/* NATURAL LANGUAGE QUERY PROMPT TILES */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
        <span className="text-[10px] font-mono uppercase font-bold text-os-text-muted block">
          Strategic Decision Prompts
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {suggestedQueries.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onAskCopilot(item.query)}
              className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/40 hover:border-cyan-500/50 hover:bg-cyan-500/5 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1">
                {item.label}
              </div>
              <p className="text-xs text-os-text-primary leading-snug">
                "{item.query}"
              </p>
              <div className="mt-2 text-[10px] text-cyan-400/80 flex items-center gap-1 font-mono">
                <span>Evaluate</span>
                <ArrowRight size={10} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AUDITABLE DECISION TRACES */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={14} className="text-os-text-muted" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-os-text-primary font-mono">
              Governed Decision Traces & Policy Verifications
            </h3>
          </div>
          <span className="text-[10px] font-mono text-os-text-muted">
            Kernel CommandBus Logged
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {decisionTraces.map((trace) => (
            <div
              key={trace.id}
              className="p-3 rounded-lg border border-os-border bg-os-surface-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-os-text-primary">{trace.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border ${
                    trace.governanceStatus === 'EXECUTED_BY_KERNEL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    trace.governanceStatus === 'APPROVAL_REQUIRED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {trace.governanceStatus}
                  </span>
                </div>
                <div className="text-[10px] text-os-text-muted mt-1 flex items-center gap-3">
                  <span>ID: {trace.id}</span>
                  <span>Agent: {trace.agent}</span>
                  <span>{trace.timestamp}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-emerald-400">
                  +{formatCurrency(trace.expectedSavings, currency)}
                </div>
                <div className="text-[9px] text-os-text-muted">Benefit Yield</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
