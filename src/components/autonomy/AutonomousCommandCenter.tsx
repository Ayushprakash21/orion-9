import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, Zap, AlertTriangle, Layers, TrendingUp, 
  BrainCircuit, Users, RefreshCw, CheckCircle2, Clock, Play, Pause, 
  ArrowUpRight, Eye, Check, X, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { AutonomousMissionEngine } from '../../autonomy/AutonomousMissionEngine';
import { AutonomyApprovalRouter } from '../../autonomy/AutonomyApprovalRouter';
import { AutonomousMission, ApprovalRequest } from '../../autonomy/types';
import { ZeroFrictionApprovalModal } from './ZeroFrictionApprovalModal';
import { ForecastIntelligenceEngine } from '../../intelligence/ForecastIntelligenceEngine';
import { MEIOEngine } from '../../intelligence/MEIOEngine';
import { ExecutiveStrategyAgent } from '../../intelligence/ExecutiveStrategyAgent';
import { useToast } from '../../store/ToastContext';

export const AutonomousCommandCenter: React.FC<{ tenantId?: string }> = ({ tenantId = 'ORION_PLATFORM' }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'MISSIONS' | 'APPROVALS' | 'RISKS' | 'FORECAST' | 'STRATEGY'>('MISSIONS');
  const [missions, setMissions] = useState<AutonomousMission[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [automationRate, setAutomationRate] = useState<number>(96.4);

  // Initialize Sample Missions and Approvals if empty
  useEffect(() => {
    let existingMissions = AutonomousMissionEngine.getAllMissions(tenantId);
    if (existingMissions.length === 0) {
      const m1 = AutonomousMissionEngine.createMission(
        tenantId,
        'Prevent SKU-4902 Buffer Stockout',
        'Automatically reorder and shift sourcing allocation to prevent 14-day stockout at Regional DC Singapore.',
        'INVENTORY',
        'Service Level',
        99.5,
        96.2,
        'agent-inventory'
      );
      const m2 = AutonomousMissionEngine.createMission(
        tenantId,
        'Reroute Delayed Ocean Vessel V-8812',
        'Bypass port congestion by expediting feeder transit to West Coast hub.',
        'LOGISTICS',
        'On-Time Delivery',
        98.0,
        92.1,
        'agent-transportation'
      );
      setMissions([m1, m2]);
    } else {
      setMissions(existingMissions);
    }

    const pending = AutonomyApprovalRouter.getPendingApprovals(tenantId);
    if (pending.length === 0) {
      // Create sample approval request for demo
      const sampleDecision: any = {
        decisionId: 'dec-sample-01',
        tenantId,
        actionType: 'PAYMENT_SETTLEMENT_OVER_THRESHOLD',
        scoreCard: { riskScore: 65, financialExposure: 125000, reversibility: false, confidence: 0.94 }
      };
      const req = AutonomyApprovalRouter.createApprovalRequest(sampleDecision, {
        why: 'Contractual payment milestone for 45,000 units raw silicon wafer batch release.',
        impactSummary: 'Secures Q4 manufacturing line capacity and locks volume discount.',
        currentState: { poStatus: 'RECEIVED', invoiceMatched: true },
        proposedState: { paymentStatus: 'SCHEDULED', discountCaptured: '$18,500' },
        alternatives: [{ option: 'Hold Payment 14 Days', cost: 18500, risk: 'HIGH' }],
        expectedBenefit: 'Captures $18,500 early settlement discount with zero production line delay.',
        aiReasoningSummary: 'Verified matching GRN-9921 against SAP invoice #INV-4901. All quality certificates passed.'
      });
      setApprovals([req]);
    } else {
      setApprovals(pending);
    }
  }, [tenantId]);

  const handleRespondToApproval = (approvalId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_ALTERNATIVE' | 'DELEGATE') => {
    AutonomyApprovalRouter.respondToApproval(approvalId, action, { id: 'admin_user', role: 'platform_admin' });
    setApprovals(AutonomyApprovalRouter.getPendingApprovals(tenantId));
    showToast(`Approval request ${action.toLowerCase()}ed successfully`, 'success');
  };

  const execReport = ExecutiveStrategyAgent.generateExecutiveReport(tenantId);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Banner & Autonomous OS Status */}
      <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[var(--orion-text)] tracking-tight flex items-center gap-2.5">
              <BrainCircuit className="w-7 h-7 text-[var(--orion-accent)]" />
              Autonomous Enterprise OS Command Center
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LEVEL 4 GOVERNED AUTONOMY ACTIVE
            </span>
          </div>
          <p className="text-sm text-[var(--orion-text-secondary)]">
            Continuous self-optimizing supply chain execution engine. Routine operations execute autonomously through governed Kernel CommandBus.
          </p>
        </div>

        {/* Real-time Autonomy KPIs */}
        <div className="grid grid-cols-3 gap-4 border-l border-[var(--orion-border)] pl-6">
          <div>
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              Autonomous Execution Rate
            </span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {automationRate}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              Pending Approvals
            </span>
            <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
              {approvals.length}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[var(--orion-text-muted)] uppercase tracking-wider block">
              Active Missions
            </span>
            <span className="text-2xl font-black font-mono text-[var(--orion-accent)] mt-1 block">
              {missions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--orion-border)] pb-2 overflow-x-auto">
        {[
          { key: 'MISSIONS', label: 'Active Autonomous Missions', count: missions.length },
          { key: 'APPROVALS', label: 'Human Approval Matrix', count: approvals.length },
          { key: 'RISK', label: 'External Signals & Risk Graph', count: 4 },
          { key: 'FORECAST', label: 'Probabilistic Demand Forecast', count: 0 },
          { key: 'STRATEGY', label: 'Executive Horizon Intelligence', count: 0 }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[var(--orion-accent)] text-[var(--orion-on-accent)] shadow-sm'
                : 'text-[var(--orion-text-secondary)] hover:bg-[var(--orion-surface-hover)] hover:text-[var(--orion-text)]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === tab.key ? 'bg-black/20 text-white' : 'bg-[var(--orion-surface-secondary)] text-[var(--orion-text-secondary)]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. MISSIONS VIEW */}
      {activeTab === 'MISSIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--orion-text)] uppercase tracking-wider">
              Autonomous Business Missions
            </h3>
            <span className="text-xs text-[var(--orion-text-muted)] font-mono">
              Closed-Loop Execution Status: ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map(mission => (
              <div 
                key={mission.missionId}
                className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 space-y-4 hover:border-[var(--orion-accent)]/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--orion-accent-subtle)] text-[var(--orion-accent)]">
                      {mission.category} MISSION
                    </span>
                    <h4 className="text-base font-bold text-[var(--orion-text)] mt-1">{mission.title}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {mission.status}
                  </span>
                </div>

                <p className="text-xs text-[var(--orion-text-secondary)] leading-relaxed">
                  {mission.objective}
                </p>

                <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[var(--orion-text-muted)] block">Target Metric: {mission.targetKpi}</span>
                    <span className="font-mono font-bold text-[var(--orion-text)]">Current: {mission.currentValue}% → Target: {mission.targetValue}%</span>
                  </div>
                  <div className="w-24 h-2 rounded-full overflow-hidden bg-[var(--orion-surface)]">
                    <div className="h-full bg-[var(--orion-accent)]" style={{ width: `${(mission.currentValue / mission.targetValue) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. APPROVALS VIEW */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--orion-text)] uppercase tracking-wider">
              Material & High Risk Approval Queue
            </h3>
            <span className="text-xs text-[var(--orion-text-muted)]">
              Escalation Timer: 15 mins
            </span>
          </div>

          {approvals.length === 0 ? (
            <div className="p-8 text-center bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl text-xs text-[var(--orion-text-muted)]">
              Zero pending human approvals. 100% of routine actions are executing autonomously.
            </div>
          ) : (
            <div className="space-y-3">
              {approvals.map(req => (
                <div 
                  key={req.approvalId}
                  className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--orion-accent)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        {req.actionType}
                      </span>
                      <span className="text-xs font-mono text-[var(--orion-text-muted)]">
                        REQ: {req.approvalId}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--orion-text)]">{req.why}</h4>
                    <p className="text-xs text-[var(--orion-text-secondary)]">{req.impactSummary}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono text-xs">
                      <span className="text-[var(--orion-text-muted)] block text-[10px] uppercase">Exposure</span>
                      <span className="font-bold text-emerald-400">${req.financialCost.toLocaleString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedApproval(req)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--orion-accent)] text-[var(--orion-on-accent)] hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. EXECUTIVE HORIZON INTELLIGENCE */}
      {activeTab === 'STRATEGY' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--orion-text)] uppercase tracking-wider">
            Executive Horizon Risk Intelligence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.values(execReport.horizons).map(h => (
              <div key={h.timeframe} className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 space-y-3">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono bg-[var(--orion-accent-subtle)] text-[var(--orion-accent)] uppercase">
                  {h.timeframe.replace(/_/g, ' ')}
                </span>
                <div className="space-y-1">
                  <span className="text-xs text-[var(--orion-text-muted)] block">Revenue Risk</span>
                  <span className="text-lg font-bold font-mono text-rose-400">${h.revenueRiskAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-[var(--orion-text-secondary)] border-t border-[var(--orion-border)] pt-2">
                  <b>Threat:</b> {h.topStrategicThreat}
                </div>
                <div className="text-[11px] text-[var(--orion-accent)] bg-[var(--orion-surface-secondary)] p-2 rounded">
                  <b>Strategy:</b> {h.recommendedStrategicScenario}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Render */}
      {selectedApproval && (
        <ZeroFrictionApprovalModal
          request={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onRespond={handleRespondToApproval}
        />
      )}
    </div>
  );
};
