import React, { useState } from 'react';
import { 
  Gauge, Play, Cpu, Zap, Activity, AlertOctagon, 
  RefreshCw, CheckCircle2, ShieldAlert, Layers, BarChart2,
  Sliders, Bug
} from 'lucide-react';
import { 
  globalJobOrchestrator, 
  DistributedJob 
} from '../../enterprise/jobs/GlobalJobOrchestrator';
import { 
  scaleChaosHarness, 
  ScaleSimulationResult, 
  ActiveChaosExperiment 
} from '../../enterprise/chaos/ScaleChaosHarness';
import { useAuth } from '../../store/AuthContext';

export const ScalePerformanceCenter: React.FC = () => {
  const { profile } = useAuth();
  const tenantId = profile?.organizationId || 'demo-tenant';

  const [activeTab, setActiveTab] = useState<'JOBS' | 'SCALE_SIM' | 'CHAOS'>('JOBS');
  const [jobs, setJobs] = useState<DistributedJob[]>(() => globalJobOrchestrator.listJobs(tenantId));
  const [selectedJob, setSelectedJob] = useState<DistributedJob | null>(() => jobs[0] || null);

  // Scale Sim state
  const [eventCount, setEventCount] = useState(1000);
  const [batchSize, setBatchSize] = useState(100);
  const [isSimulating, setIsSimulating] = useState(false);
  const [latestSimResult, setLatestSimResult] = useState<ScaleSimulationResult | null>(null);

  // Chaos state
  const [experiments, setExperiments] = useState<ActiveChaosExperiment[]>(() => 
    scaleChaosHarness.listExperiments(tenantId)
  );

  const refreshAll = () => {
    setJobs(globalJobOrchestrator.listJobs(tenantId));
    setExperiments(scaleChaosHarness.listExperiments(tenantId));
    if (selectedJob) {
      const j = globalJobOrchestrator.getJob(selectedJob.jobId);
      if (j) setSelectedJob(j);
    }
  };

  const handleRunScaleSim = async () => {
    setIsSimulating(true);
    try {
      const res = await scaleChaosHarness.executeScaleSimulation({
        tenantId,
        totalEvents: eventCount,
        batchSize
      });
      setLatestSimResult(res);
    } catch (err) {
      console.error('Scale simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStartChaos = (type: any, name: string) => {
    scaleChaosHarness.startExperiment({
      tenantId,
      name,
      faultType: type,
      targetSubsystem: 'EVENT_BROKER',
      parameters: { latencyMs: 500, packetDropRate: 0.1 }
    });
    setExperiments(scaleChaosHarness.listExperiments(tenantId));
  };

  const handleStopChaos = (id: string) => {
    scaleChaosHarness.stopExperiment(id);
    setExperiments(scaleChaosHarness.listExperiments(tenantId));
  };

  return (
    <div className="space-y-6 pb-12" data-testid="scale-performance-center">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Gauge size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Scale & Performance Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              Distributed Batch Workload Orchestrator, Throughput Simulator & Chaos Injection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh All Metrics"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-os-border pb-2 text-xs font-mono">
        {[
          { id: 'JOBS', label: `Distributed Jobs (${jobs.length})` },
          { id: 'SCALE_SIM', label: 'High-Throughput Scale Simulator' },
          { id: 'CHAOS', label: `Chaos Fault Harness (${experiments.filter(e => e.status === 'ACTIVE').length} Active)` },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === t.id
                ? 'bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 font-bold'
                : 'text-os-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Distributed Jobs */}
      {activeTab === 'JOBS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <span className="text-sm font-bold text-white font-mono">Workload Queue</span>
              <span className="text-xs text-os-text-muted font-mono">Dynamic Chunking</span>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
              {jobs.map(j => (
                <div
                  key={j.jobId}
                  onClick={() => setSelectedJob(j)}
                  className={`p-3 bg-black/30 border rounded cursor-pointer transition-colors ${
                    selectedJob?.jobId === j.jobId
                      ? 'border-[#00F2FE] bg-[#00F2FE]/10'
                      : 'border-os-border hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs font-mono">{j.jobId}</span>
                    <span className="px-2 py-0.5 text-[9px] font-mono rounded border font-bold bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                      {j.status}
                    </span>
                  </div>

                  <div className="text-xs text-os-text-secondary mt-1">{j.jobType}</div>

                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-os-text-muted">
                      <span>Progress</span>
                      <span>{j.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#00F2FE] h-full" style={{ width: `${j.progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-os-text-muted mt-2 pt-2 border-t border-os-border/40">
                    <span>{j.chunks.length} Chunks ({j.chunkSize}/chk)</span>
                    <span>{j.activeWorkersCount} Workers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Job Inspector */}
          <div className="lg:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col h-[560px] overflow-y-auto space-y-4">
            {selectedJob ? (
              <>
                <div className="flex items-center justify-between border-b border-os-border pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{selectedJob.jobId}</h3>
                    <div className="text-xs font-mono text-os-text-muted">{selectedJob.jobType} | Region: {selectedJob.targetRegionId}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold text-[#00F2FE] bg-[#00F2FE]/10 border border-[#00F2FE]/30 rounded">
                      {selectedJob.status} ({selectedJob.progressPercent}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">Total Records</div>
                    <div className="text-white font-bold text-base mt-0.5">{selectedJob.totalRecords.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">Chunk Size</div>
                    <div className="text-white font-bold text-base mt-0.5">{selectedJob.chunkSize}</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">Total Chunks</div>
                    <div className="text-white font-bold text-base mt-0.5">{selectedJob.chunks.length}</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">Active Workers</div>
                    <div className="text-white font-bold text-base mt-0.5">{selectedJob.activeWorkersCount}</div>
                  </div>
                </div>

                {/* Chunks Matrix */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-white font-mono">Chunk Leases & Execution State</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedJob.chunks.map(chunk => (
                      <div key={chunk.chunkId} className="p-2.5 bg-black/30 border border-os-border rounded text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Chunk #{chunk.chunkIndex}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold ${
                            chunk.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-cyan-400 bg-cyan-500/10'
                          }`}>
                            {chunk.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-os-text-muted">
                          Worker: {chunk.assignedWorkerId || 'Unassigned'} | Records: {chunk.processedRecords}/{chunk.recordCount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-os-text-muted text-xs">
                Select a distributed job to inspect
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Scale Simulator */}
      {activeTab === 'SCALE_SIM' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0d1117] border border-os-border rounded p-4 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono">High-Throughput Load Parameters</h3>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-os-text-muted uppercase text-[10px] block mb-1">Total Synthetic Events</label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  step="100"
                  value={eventCount}
                  onChange={(e) => setEventCount(parseInt(e.target.value) || 1000)}
                  className="w-full bg-black/40 border border-os-border rounded p-2 text-white outline-none focus:border-[#00F2FE]"
                />
              </div>

              <div>
                <label className="text-os-text-muted uppercase text-[10px] block mb-1">Batch Concurrency Size</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  step="10"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                  className="w-full bg-black/40 border border-os-border rounded p-2 text-white outline-none focus:border-[#00F2FE]"
                />
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={handleRunScaleSim}
                className={`w-full py-2.5 font-mono text-xs font-bold rounded border transition-all flex items-center justify-center gap-2 ${
                  isSimulating
                    ? 'bg-white/10 text-os-text-muted border-os-border cursor-not-allowed'
                    : 'bg-[#00F2FE]/20 hover:bg-[#00F2FE]/30 text-[#00F2FE] border-[#00F2FE]/40 cursor-pointer'
                }`}
              >
                <Play size={14} /> {isSimulating ? 'Injecting High-Volume Stream...' : `Execute ${eventCount.toLocaleString()} Event Batch`}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 flex flex-col space-y-4">
            <h3 className="text-sm font-bold text-white font-mono">Simulation Telemetry & Elasticity Results</h3>

            {latestSimResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">Throughput Rate</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">
                      {latestSimResult.eventsPerSecond.toLocaleString()} evt/sec
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">P99 Batch Latency</div>
                    <div className="text-xl font-bold text-[#00F2FE] mt-1">{latestSimResult.p99LatencyMs}ms</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-os-border rounded">
                    <div className="text-[10px] text-os-text-muted uppercase">Total Ingested</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {latestSimResult.totalEventsEmitted.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/30 border border-os-border rounded text-xs font-mono space-y-1">
                  <div className="text-os-text-muted">Target Topic: <strong className="text-white">{latestSimResult.targetTopic}</strong></div>
                  <div className="text-os-text-muted">Batch Size: <strong className="text-white">{latestSimResult.batchSize}</strong> | Duration: <strong className="text-white">{latestSimResult.durationMs}ms</strong></div>
                  <div className="text-os-text-muted">Duplicates Suppressed: <strong className="text-purple-400">{latestSimResult.duplicatesHandled}</strong></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-os-text-muted text-xs">
                Launch a simulation to observe real-time broker ingestion throughput
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Chaos Engineering */}
      {activeTab === 'CHAOS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0d1117] border border-os-border rounded p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono">Inject Fault Archetypes</h3>
            <div className="space-y-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleStartChaos('INJECT_LATENCY', 'Synthetic P99 Latency Delay')}
                className="w-full p-2.5 bg-black/40 hover:bg-white/5 border border-os-border rounded text-left text-amber-300"
              >
                + Inject 500ms Synthetic Latency
              </button>
              <button
                type="button"
                onClick={() => handleStartChaos('INJECT_PACKET_DROP', 'Transient Packet Drop Probe')}
                className="w-full p-2.5 bg-black/40 hover:bg-white/5 border border-os-border rounded text-left text-orange-300"
              >
                + Inject 10% Packet Drop Rate
              </button>
              <button
                type="button"
                onClick={() => handleStartChaos('INJECT_POISON_PILL', 'Malformed EDI X12 Payload')}
                className="w-full p-2.5 bg-black/40 hover:bg-white/5 border border-os-border rounded text-left text-rose-300"
              >
                + Inject Malformed Poison Pill
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0d1117] border border-os-border rounded p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono">Active Chaos Experiments</h3>
            <div className="space-y-2">
              {experiments.map(exp => (
                <div key={exp.experimentId} className="p-3 bg-black/40 border border-os-border rounded flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{exp.name}</span>
                      <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold ${
                        exp.status === 'ACTIVE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-os-text-muted mt-1">
                      Fault: {exp.faultType} | Target: {exp.targetSubsystem}
                    </div>
                  </div>

                  {exp.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => handleStopChaos(exp.experimentId)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white border border-os-border rounded text-[10px]"
                    >
                      Halt Experiment
                    </button>
                  )}
                </div>
              ))}
              {experiments.length === 0 && (
                <div className="p-8 text-center text-os-text-muted text-xs italic">
                  No chaos experiments currently recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
