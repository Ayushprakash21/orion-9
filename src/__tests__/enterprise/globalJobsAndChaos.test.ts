import { describe, it, expect, beforeEach } from 'vitest';
import { globalJobOrchestrator } from '../../enterprise/jobs/GlobalJobOrchestrator';
import { scaleChaosHarness } from '../../enterprise/chaos/ScaleChaosHarness';

describe('Wave 11: Global Distributed Workloads & Scale / Chaos Harness', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    globalJobOrchestrator.clear();
    scaleChaosHarness.clear();
  });

  it('1. GlobalJobOrchestrator chunks large workloads and manages worker leases', () => {
    const job = globalJobOrchestrator.submitJob({
      tenantId,
      jobType: 'ERP_LEDGER_SYNC',
      targetRegionId: 'reg-us-east',
      totalRecords: 5000,
      chunkSize: 1000
    });

    expect(job.chunks.length).toBe(5);
    expect(job.status).toBe('PLANNING');
    expect(job.progressPercent).toBe(0);

    // Worker 1 leases chunk 0
    const chunk0 = globalJobOrchestrator.leaseNextChunk(job.jobId, 'worker-alpha');
    expect(chunk0).toBeDefined();
    expect(chunk0?.assignedWorkerId).toBe('worker-alpha');
    expect(chunk0?.status).toBe('LEASED');

    // Job transitions to PROCESSING
    const refreshed = globalJobOrchestrator.getJob(job.jobId);
    expect(refreshed?.status).toBe('PROCESSING');

    // Worker 1 completes chunk 0
    globalJobOrchestrator.completeChunk(job.jobId, chunk0!.chunkId, 1000, 450);
    const updated = globalJobOrchestrator.getJob(job.jobId);
    expect(updated?.progressPercent).toBe(20); // 1 of 5 completed
  });

  it('2. ScaleChaosHarness executes scale throughput simulation with telemetry', async () => {
    const simResult = await scaleChaosHarness.executeScaleSimulation({
      tenantId,
      totalEvents: 500,
      batchSize: 50
    });

    expect(simResult.totalEventsEmitted).toBe(500);
    expect(simResult.eventsPerSecond).toBeGreaterThan(0);
    expect(simResult.p99LatencyMs).toBeGreaterThanOrEqual(0);

    const history = scaleChaosHarness.getSimulationHistory();
    expect(history.length).toBe(1);
  });

  it('3. ScaleChaosHarness starts and stops chaos experiments cleanly', () => {
    const exp = scaleChaosHarness.startExperiment({
      tenantId,
      name: 'Simulated 500ms Edge Latency',
      faultType: 'INJECT_LATENCY',
      targetSubsystem: 'EVENT_BROKER',
      parameters: { latencyMs: 500 }
    });

    expect(exp.status).toBe('ACTIVE');
    const activeList = scaleChaosHarness.listExperiments(tenantId);
    expect(activeList.length).toBe(1);

    const stopped = scaleChaosHarness.stopExperiment(exp.experimentId);
    expect(stopped).toBe(true);

    const afterStop = scaleChaosHarness.listExperiments(tenantId);
    expect(afterStop[0].status).toBe('STOPPED');
  });
});
