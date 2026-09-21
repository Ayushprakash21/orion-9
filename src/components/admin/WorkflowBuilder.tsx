/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Builder UI Component
 * 
 * Visual workflow manager allowing administrators to create, edit, version,
 * simulate (dry-run), and activate autonomous workflows.
 */

import React, { useState, useEffect } from 'react';
import {
  WorkflowDefinition,
  AutonomyLevel,
  WorkflowRiskClass,
  WorkflowStep
} from '../../workflows/types';
import {
  workflowVersionService,
  WorkflowSimulationEngine,
  WorkflowSimulationReport,
  getAllStandardWorkflowTemplates,
  workflowEngine
} from '../../workflows';
import {
  GitBranch,
  Play,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  Layers,
  FileCode2,
  RefreshCw,
  Plus
} from 'lucide-react';

interface WorkflowBuilderProps {
  tenantId?: string;
  userRole?: string;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  tenantId = 'TENANT_A',
  userRole = 'admin'
}) => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [simulationReport, setSimulationReport] = useState<WorkflowSimulationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'STEPS' | 'SIMULATION'>('DETAILS');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Seed standard templates if empty
    const templates = getAllStandardWorkflowTemplates(tenantId);
    templates.forEach(t => {
      if (!workflowVersionService.getDefinition(tenantId, t.workflowId)) {
        workflowVersionService.registerDefinition(t);
      }
    });

    const loaded = templates.map(t => workflowVersionService.getDefinition(tenantId, t.workflowId) || t);
    setWorkflows(loaded);
    if (loaded.length > 0 && !selectedWorkflow) {
      setSelectedWorkflow(loaded[0]);
    }
  }, [tenantId]);

  const handleActivate = (wf: WorkflowDefinition) => {
    // Only administrators or procurement directors can activate
    const privilegedRoles = ['admin', 'platform_admin', 'organization_admin', 'procurement_director'];
    if (!privilegedRoles.includes(userRole)) {
      setStatusMessage(`Unauthorized: User with role '${userRole}' cannot activate workflows.`);
      return;
    }

    const updated = { ...wf, status: 'ACTIVE' as const, updatedAt: new Date().toISOString() };
    workflowVersionService.registerDefinition(updated);
    setSelectedWorkflow(updated);
    setWorkflows(prev => prev.map(w => (w.workflowId === updated.workflowId ? updated : w)));
    setStatusMessage(`Workflow '${wf.name}' successfully activated.`);
  };

  const handlePublishVersion = (wf: WorkflowDefinition) => {
    try {
      const parts = wf.version.split('.');
      const nextPatch = parseInt(parts[parts.length - 1] || '0', 10) + 1;
      const nextVersion = `${parts[0]}.${parts[1] || '0'}.${nextPatch}`;

      const versioned = { ...wf, version: nextVersion, updatedAt: new Date().toISOString() };
      workflowVersionService.registerDefinition(versioned);
      workflowVersionService.publishVersion(tenantId, versioned.workflowId, userRole, `Published version ${nextVersion}`);

      setSelectedWorkflow(versioned);
      setWorkflows(prev => prev.map(w => (w.workflowId === versioned.workflowId ? versioned : w)));
      setStatusMessage(`Published new immutable version ${nextVersion}`);
    } catch (e: any) {
      setStatusMessage(`Publish failed: ${e.message}`);
    }
  };

  const handleRunSimulation = (wf: WorkflowDefinition) => {
    const report = WorkflowSimulationEngine.simulate(
      wf,
      {
        delayDays: 4,
        daysOfSupply: 3,
        stockoutProbability: 0.85,
        etaDelayHours: 36,
        riskScore: 85
      },
      { id: 'ADMIN_SIM', role: userRole, isAi: false }
    );
    setSimulationReport(report);
    setActiveTab('SIMULATION');
  };

  return (
    <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-6 text-white font-sans space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363D] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
              Autonomous Workflow Builder
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Wave 7
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Enterprise visual orchestration, version immutability, and dry-run simulation
            </p>
          </div>
        </div>

        {selectedWorkflow && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunSimulation(selectedWorkflow)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1F242C] hover:bg-[#282F3A] border border-[#30363D] rounded-lg transition"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              Simulate Dry-Run
            </button>
            <button
              onClick={() => handlePublishVersion(selectedWorkflow)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1F242C] hover:bg-[#282F3A] border border-[#30363D] rounded-lg transition"
            >
              <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
              Publish Version
            </button>
            <button
              onClick={() => handleActivate(selectedWorkflow)}
              disabled={selectedWorkflow.status === 'ACTIVE'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {selectedWorkflow.status === 'ACTIVE' ? 'Active' : 'Activate Workflow'}
            </button>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="text-xs p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar: Workflows list */}
        <div className="col-span-4 space-y-2 border-r border-[#30363D] pr-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Workflow Definitions ({workflows.length})
          </div>
          {workflows.map(wf => {
            const isSelected = selectedWorkflow?.workflowId === wf.workflowId;
            return (
              <div
                key={wf.workflowId}
                onClick={() => {
                  setSelectedWorkflow(wf);
                  setSimulationReport(null);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-[#161B22] border-[#30363D] text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-cyan-300 truncate">{wf.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-gray-700 text-gray-400">
                    v{wf.version}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-1">{wf.description}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px]">
                  <span className={`px-1.5 py-0.5 rounded ${wf.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {wf.status}
                  </span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-400">{wf.autonomyLevel}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content detail area */}
        <div className="col-span-8 space-y-4">
          {selectedWorkflow ? (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b border-[#30363D] text-xs">
                <button
                  onClick={() => setActiveTab('DETAILS')}
                  className={`pb-2 px-3 font-medium transition ${
                    activeTab === 'DETAILS' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Configuration
                </button>
                <button
                  onClick={() => setActiveTab('STEPS')}
                  className={`pb-2 px-3 font-medium transition ${
                    activeTab === 'STEPS' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Steps ({selectedWorkflow.steps.length})
                </button>
                <button
                  onClick={() => setActiveTab('SIMULATION')}
                  className={`pb-2 px-3 font-medium transition ${
                    activeTab === 'SIMULATION' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Simulation Dry-Run {simulationReport && '(Report Ready)'}
                </button>
              </div>

              {/* Tab: Details */}
              {activeTab === 'DETAILS' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg">
                      <span className="text-gray-400 text-[11px]">Workflow ID</span>
                      <p className="font-mono font-medium text-white mt-0.5">{selectedWorkflow.workflowId}</p>
                    </div>
                    <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg">
                      <span className="text-gray-400 text-[11px]">Autonomy Level</span>
                      <p className="font-semibold text-cyan-300 mt-0.5">{selectedWorkflow.autonomyLevel}</p>
                    </div>
                    <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg">
                      <span className="text-gray-400 text-[11px]">Trigger Event</span>
                      <p className="font-mono text-purple-300 mt-0.5">{selectedWorkflow.trigger.eventType}</p>
                    </div>
                    <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg">
                      <span className="text-gray-400 text-[11px]">Risk Classification</span>
                      <p className="font-semibold text-amber-300 mt-0.5">{selectedWorkflow.riskClass}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg">
                    <span className="text-gray-400 text-[11px]">Description</span>
                    <p className="text-gray-200 mt-1">{selectedWorkflow.description}</p>
                  </div>
                </div>
              )}

              {/* Tab: Steps */}
              {activeTab === 'STEPS' && (
                <div className="space-y-3">
                  {selectedWorkflow.steps.map((st, idx) => (
                    <div key={st.stepId} className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-white">{st.name}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">
                          {st.type}
                        </span>
                      </div>
                      {st.action && (
                        <div className="pl-7 text-gray-400 text-[11px]">
                          Action: <span className="text-cyan-300 font-mono">{st.action.type}</span>
                          {st.action.isMaterial && <span className="ml-2 text-amber-400 font-semibold">(Material Kernel Command)</span>}
                          {st.approval && (
                            <span className="ml-2 text-rose-400">
                              [Approval: {st.approval.requiredRole}]
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Simulation */}
              {activeTab === 'SIMULATION' && (
                <div className="space-y-4">
                  {simulationReport ? (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-emerald-400">Dry-Run Simulation Complete</div>
                          <p className="text-[11px] text-gray-300">{simulationReport.summary}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono px-2 py-1 bg-black/40 rounded border border-emerald-500/30 text-emerald-300">
                            Mutations: {simulationReport.mutationsPerformed}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-gray-400 font-semibold uppercase text-[10px]">Trace Steps:</span>
                        {simulationReport.evaluatedSteps.map((s, idx) => (
                          <div key={idx} className="p-2.5 bg-[#161B22] border border-[#30363D] rounded flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{s.stepName}</div>
                              <div className="text-[11px] text-gray-400">{s.details}</div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              s.simulatedStatus === 'EXECUTED_DRY_RUN' ? 'bg-emerald-500/20 text-emerald-300' :
                              s.simulatedStatus === 'AWAITING_APPROVAL_SIMULATED' ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-800 text-gray-400'
                            }`}>
                              {s.simulatedStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      Click "Simulate Dry-Run" above to evaluate this workflow without committing mutations.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs">Select a workflow to inspect configuration.</div>
          )}
        </div>
      </div>
    </div>
  );
};
