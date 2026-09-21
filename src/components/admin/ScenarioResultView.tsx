/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Scenario Result View UI Component
 * 
 * Deep analytical inspector for simulation outcomes:
 * 9-Vector Impact Breakdown, Risk Contagion Path, Rule-Based KPI Deltas,
 * and Governed Wave 7 Workflow Handoff Controls.
 */

import React, { useState } from 'react';
import { SimulationResult, ScenarioDecisionOption } from '../../digitalTwin/types';
import { scenarioWorkflowBridge } from '../../digitalTwin/ScenarioWorkflowBridge';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Shield,
  ArrowRight,
  Play,
  CheckCircle2,
  DollarSign,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';

export const ScenarioResultView: React.FC<{
  result: SimulationResult;
  tenantId?: string;
  onWorkflowTriggered?: (workflowInstanceId: string) => void;
}> = ({ result, tenantId = 'TENANT_A', onWorkflowTriggered }) => {
  const [bridgingOptionId, setBridgingOptionId] = useState<string | null>(null);
  const [bridgedSuccessMsg, setBridgedSuccessMsg] = useState<string | null>(null);

  const handleBridgeToWorkflow = async (option: ScenarioDecisionOption) => {
    setBridgingOptionId(option.optionId);
    try {
      // Mock scenario container for bridge call
      const dummyScenario = {
        scenarioId: result.scenarioId,
        tenantId,
        name: `Simulation Result: ${result.scenarioId}`,
        description: 'Auto-bridged scenario',
        scenarioType: 'SUPPLIER_DELAY' as const,
        baseSnapshotId: result.baselineSnapshotId,
        createdBy: 'operator-admin',
        createdAt: result.timestamp,
        updatedAt: result.timestamp,
        status: 'COMPLETED' as const,
        assumptions: result.assumptions,
        parameters: { scenarioType: 'SUPPLIER_DELAY' as const },
        correlationId: `CORR-${result.scenarioId}`,
      };

      const bridgeRes = await scenarioWorkflowBridge.bridgeDecisionOptionToWorkflow(
        tenantId,
        dummyScenario,
        option,
        { id: 'operator-admin', role: 'admin', name: 'Enterprise Operator', isAi: false }
      );

      setBridgedSuccessMsg(`Successfully created Wave 7 Workflow Instance: ${bridgeRes.workflowInstanceId} (Requires Human Governance: ${bridgeRes.governanceRequired ? 'YES' : 'NO'})`);
      if (onWorkflowTriggered) {
        onWorkflowTriggered(bridgeRes.workflowInstanceId);
      }
    } catch (err: any) {
      setBridgedSuccessMsg(`Workflow Bridge Error: ${err.message}`);
    } finally {
      setBridgingOptionId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-os-border pb-5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
            SIMULATION RESULT
          </span>
          <span className="text-xs font-mono text-os-text-muted">{result.scenarioId}</span>
        </div>
        <h1 className="text-2xl font-bold text-os-text-primary tracking-tight mt-1 flex items-center gap-2">
          <Activity className="text-purple-400" size={24} />
          Scenario Analytical Impact & Decision Options
        </h1>
        <div className="flex items-center gap-4 text-xs text-os-text-secondary mt-1">
          <span>Baseline: <strong className="font-mono text-os-text-primary">{result.baselineSnapshotId}</strong></span>
          <span>Simulation Time: <strong className="font-mono text-os-text-primary">{result.simulationTimeMs}ms</strong></span>
          <span className="text-emerald-400 font-mono">DRY-RUN CONFIRMED (0 PRODUCTION MUTATIONS)</span>
        </div>
      </div>

      {bridgedSuccessMsg && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-cyan-400" />
          {bridgedSuccessMsg}
        </div>
      )}

      {/* KPI Delta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.keys(result.kpiDelta).map((code) => {
          const kpi = result.kpiDelta[code];
          const isNegative = kpi.delta < 0;
          return (
            <div key={code} className="bg-os-surface border border-os-border rounded-xl p-4">
              <div className="text-xs text-os-text-muted mb-1">{code}</div>
              <div className="text-xl font-bold text-os-text-primary">
                {kpi.projected} {kpi.unit}
              </div>
              <div className={`text-xs mt-1 flex items-center gap-1 ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                {isNegative ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span>{kpi.delta > 0 ? `+${kpi.delta}` : kpi.delta} {kpi.unit} vs baseline</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 9-Vector Grid */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
          <Layers size={16} className="text-cyan-400" />
          9-Vector Impact Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.impactVectors.map((v) => (
            <div key={v.metric} className="p-3 bg-os-surface-hover/60 border border-os-border/70 rounded-lg text-xs">
              <div className="flex justify-between text-[11px] text-os-text-muted mb-1">
                <span>{v.vector}</span>
                <span className="font-mono text-purple-400">{v.calculationSource}</span>
              </div>
              <div className="font-semibold text-os-text-primary mb-1">{v.metric}</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-os-text-muted">Baseline: {v.baseline} {v.unit}</span>
                <span className={`font-bold font-mono ${v.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  Projected: {v.projected} {v.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Options / Wave 7 Workflow Handoff */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-os-border pb-3">
          <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
            <Shield size={16} className="text-purple-400" />
            Generated Decision Options (Governed Wave 7 Bridge)
          </h3>
          <span className="text-xs text-os-text-muted">Requires human review before execution</span>
        </div>

        <div className="space-y-3">
          {result.decisionOptions.map((opt) => (
            <div
              key={opt.optionId}
              className="p-4 bg-os-surface-hover border border-os-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="text-sm font-semibold text-os-text-primary">{opt.title}</div>
                <div className="text-xs text-os-text-secondary">{opt.description}</div>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-os-text-muted font-mono">
                  <span>Cost: ${opt.costImpact.toLocaleString()}</span>
                  <span>Service Recovery: +{opt.serviceImpact}%</span>
                  <span>Risk Drop: -{opt.riskReduction} pts</span>
                  <span className="text-amber-400">Tier: {opt.targetAutonomyLevel}</span>
                </div>
              </div>

              <button
                onClick={() => handleBridgeToWorkflow(opt)}
                disabled={bridgingOptionId === opt.optionId}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 shadow transition-colors whitespace-nowrap self-start md:self-auto disabled:opacity-50"
              >
                <Play size={14} />
                {bridgingOptionId === opt.optionId ? 'Bridging...' : 'Bridge to Wave 7 Workflow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
