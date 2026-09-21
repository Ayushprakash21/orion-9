/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Monitor UI Component
 * 
 * Live operational monitoring timeline for active, waiting, completed,
 * and compensated workflow instances across the tenant.
 */

import React, { useState, useEffect } from 'react';
import {
  workflowEngine,
  workflowObservability,
  workflowVersionService,
  WorkflowInstance,
  WorkflowStepExecution
} from '../../workflows';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Layers,
  ChevronRight,
  ShieldAlert,
  Search
} from 'lucide-react';

interface WorkflowMonitorProps {
  tenantId?: string;
}

export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  tenantId = 'TENANT_A'
}) => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [timeline, setTimeline] = useState<WorkflowStepExecution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    const list = workflowEngine.listInstances(tenantId);
    setInstances(list);
    if (!selectedInstance && list.length > 0) {
      setSelectedInstance(list[0]);
      setTimeline(workflowObservability.getExecutionsForInstance(tenantId, list[0].workflowInstanceId));
    } else if (selectedInstance) {
      const refreshed = list.find(i => i.workflowInstanceId === selectedInstance.workflowInstanceId);
      if (refreshed) {
        setSelectedInstance(refreshed);
        setTimeline(workflowObservability.getExecutionsForInstance(tenantId, refreshed.workflowInstanceId));
      }
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const filteredInstances = instances.filter(i =>
    i.workflowInstanceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.workflowId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-6 text-white font-sans space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363D] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-wide flex items-center gap-2">
              Workflow Live Monitor
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Observability
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Real-time trace spans, execution timelines, retry counters, and failure diagnosis
            </p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search instance ID or name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#161B22] border border-[#30363D] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Instances List */}
        <div className="col-span-5 space-y-2 border-r border-[#30363D] pr-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Instances ({filteredInstances.length})
          </div>

          {filteredInstances.length === 0 ? (
            <div className="p-6 bg-[#161B22] border border-[#30363D] rounded-lg text-center text-xs text-gray-400">
              No workflow instances recorded for this tenant yet.
            </div>
          ) : (
            filteredInstances.map(inst => {
              const isSelected = selectedInstance?.workflowInstanceId === inst.workflowInstanceId;
              return (
                <div
                  key={inst.workflowInstanceId}
                  onClick={() => {
                    setSelectedInstance(inst);
                    setTimeline(workflowObservability.getExecutionsForInstance(tenantId, inst.workflowInstanceId));
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                      : 'bg-[#161B22] border-[#30363D] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white font-mono">{inst.workflowId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      inst.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                      inst.status === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-300' :
                      inst.status === 'WAITING_APPROVAL' ? 'bg-amber-500/20 text-amber-300' :
                      inst.status === 'COMPENSATED' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {inst.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono truncate">{inst.workflowInstanceId}</div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                    <span>v{inst.workflowVersion}</span>
                    <span>·</span>
                    <span>Started: {new Date(inst.startedAt).toLocaleTimeString()}</span>
                    {inst.retryCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-400 font-semibold">Retries: {inst.retryCount}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail & Timeline Panel */}
        <div className="col-span-7 space-y-4">
          {selectedInstance ? (
            <>
              {/* Instance metadata overview */}
              <div className="p-4 bg-[#161B22] border border-[#30363D] rounded-xl text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#30363D] pb-2">
                  <span className="font-semibold text-white">Instance Details</span>
                  <span className="font-mono text-[11px] text-gray-400">Correlation: {selectedInstance.correlationId}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-gray-400">Current Step Index:</span>{' '}
                    <span className="text-white font-mono">{selectedInstance.currentStepIndex + 1}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>{' '}
                    <span className="font-semibold text-cyan-300">{selectedInstance.status}</span>
                  </div>
                  {selectedInstance.waitingReason && (
                    <div className="col-span-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-amber-300">
                      Waiting Reason: {selectedInstance.waitingReason}
                    </div>
                  )}
                  {selectedInstance.failureReason && (
                    <div className="col-span-2 p-2 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300">
                      Failure Reason: {selectedInstance.failureReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Step Execution Timeline ({timeline.length} spans)
                </div>

                {timeline.length === 0 ? (
                  <div className="p-6 bg-[#161B22] border border-[#30363D] rounded-xl text-center text-xs text-gray-400">
                    No executed step spans recorded for this instance.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeline.map((span, idx) => (
                      <div
                        key={span.executionId || idx}
                        className="p-3 bg-[#161B22] border border-[#30363D] rounded-lg text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{span.stepName}</span>
                            <span className="text-[10px] text-gray-400">({span.stepId})</span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Actor: <span className="text-cyan-300">{span.actorId}</span> ({span.actorType}) · Command: {span.commandEnvelopeId || 'Advisory'}
                          </div>
                        </div>

                        <div className="text-right text-[11px] text-gray-400">
                          <div>{span.durationMs || 0}ms</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            span.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {span.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 text-xs">
              Select an instance from the list to view its execution trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
