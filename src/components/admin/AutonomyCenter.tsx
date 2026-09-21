/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Autonomy Control Center UI Component
 * 
 * Central command dashboard displaying enterprise autonomy tiers, active workflows,
 * pending human approval gates, retry and compensation queues, and risk profiles.
 */

import React, { useState, useEffect } from 'react';
import {
  workflowEngine,
  workflowApprovalEngine,
  workflowObservability,
  workflowVersionService,
  getAllStandardWorkflowTemplates,
  WorkflowInstance,
  WorkflowApproval,
  WorkflowStepExecution
} from '../../workflows';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

interface AutonomyCenterProps {
  tenantId?: string;
  userRole?: string;
}

export const AutonomyCenter: React.FC<AutonomyCenterProps> = ({
  tenantId = 'TENANT_A',
  userRole = 'admin'
}) => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowApproval[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowStepExecution[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadState = () => {
    // Ensure templates are seeded
    getAllStandardWorkflowTemplates(tenantId).forEach(t => {
      if (!workflowVersionService.getDefinition(tenantId, t.workflowId)) {
        workflowVersionService.registerDefinition(t);
      }
    });

    const insts = workflowEngine.listInstances(tenantId);
    setInstances(insts);
    setPendingApprovals(workflowApprovalEngine.listPendingApprovals(tenantId));
    setRecentExecutions(workflowObservability.getAllExecutions(tenantId).slice(-10));
  };

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 2500);
    return () => clearInterval(interval);
  }, [tenantId]);

  const handleApprove = async (approval: WorkflowApproval) => {
    try {
      await workflowEngine.resumeAfterApproval(
        tenantId,
        approval.workflowInstanceId,
        approval.approvalId,
        { id: 'ADMIN_OPERATOR', role: userRole, name: 'Admin Operator', isAi: false }
      );
      setStatusMsg(`Approved action '${approval.actionId}' for instance '${approval.workflowInstanceId}'`);
      loadState();
    } catch (e: any) {
      setStatusMsg(`Approval failed: ${e.message}`);
    }
  };

  const handleReject = async (approval: WorkflowApproval) => {
    try {
      workflowApprovalEngine.reject(
        tenantId,
        approval.approvalId,
        { id: 'ADMIN_OPERATOR', role: userRole, name: 'Admin Operator', isAi: false },
        'Rejected by enterprise operator in Autonomy Center'
      );
      setStatusMsg(`Rejected action '${approval.actionId}'`);
      loadState();
    } catch (e: any) {
      setStatusMsg(`Rejection failed: ${e.message}`);
    }
  };

  const activeCount = instances.filter(i => i.status === 'RUNNING').length;
  const waitingApprovalCount = pendingApprovals.length;
  const failedCount = instances.filter(i => i.status === 'FAILED' || i.status === 'TIMED_OUT').length;
  const compensatedCount = instances.filter(i => i.status === 'COMPENSATED').length;

  return (
    <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-6 text-white font-sans space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363D] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
              Autonomy Control Center
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Governed Level 0–4
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Enterprise governance oversight, risk thresholds, and human-in-the-loop approval gates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5" /> Autopilot Safe
          </span>
        </div>
      </div>

      {statusMsg && (
        <div className="text-xs p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-[#161B22] border border-[#30363D] rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Active Workflows</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeCount}</div>
          <span className="text-[11px] text-cyan-400">Governed Execution</span>
        </div>

        <div className="p-4 bg-[#161B22] border border-[#30363D] rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{waitingApprovalCount}</div>
          <span className="text-[11px] text-amber-400/80">Awaiting Human Sign-off</span>
        </div>

        <div className="p-4 bg-[#161B22] border border-[#30363D] rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Failed / Timed Out</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{failedCount}</div>
          <span className="text-[11px] text-rose-400/80">Requires Escalation</span>
        </div>

        <div className="p-4 bg-[#161B22] border border-[#30363D] rounded-xl">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Compensated (Saga)</span>
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">{compensatedCount}</div>
          <span className="text-[11px] text-purple-400/80">Reversible Rollbacks</span>
        </div>
      </div>

      {/* Pending Approvals Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <span>Human Approval Gate Queue ({pendingApprovals.length})</span>
          <span className="text-[11px] text-gray-500 font-normal">Strict Separation of Duties Enforced</span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-6 bg-[#161B22] border border-[#30363D] rounded-xl text-center text-xs text-gray-400">
            No actions awaiting approval. All autonomous processes within tolerance thresholds.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.map(approval => (
              <div
                key={approval.approvalId}
                className="p-4 bg-[#161B22] border border-amber-500/30 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{approval.actionId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Role Required: {approval.requiredRole}
                    </span>
                    <span className="text-gray-400 text-[11px]">· Instance: {approval.workflowInstanceId}</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Requested by: <span className="text-cyan-300">{approval.requestedBy.name}</span> ({approval.requestedBy.type}) at {new Date(approval.requestedAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(approval)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg font-medium transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(approval)}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-medium transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Governed Executions Audit Feed */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Recent Governed Kernel Dispatches
        </div>
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl divide-y divide-[#30363D] text-xs">
          {recentExecutions.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No recent workflow executions recorded.</div>
          ) : (
            recentExecutions.map(exec => (
              <div key={exec.executionId} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${exec.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <div>
                    <span className="font-medium text-white">{exec.stepName}</span>
                    <span className="text-gray-400 text-[11px] ml-2">({exec.stepId})</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                  <span>Duration: {exec.durationMs || 0}ms</span>
                  <span className="font-mono text-[10px] text-cyan-400">{exec.commandEnvelopeId || 'Advisory'}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    exec.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {exec.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
