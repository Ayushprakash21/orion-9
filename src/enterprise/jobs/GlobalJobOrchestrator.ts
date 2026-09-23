/**
 * ORION-9 WAVE 11: GLOBAL DISTRIBUTED JOB & WORKLOAD ORCHESTRATOR
 * Coordinates high-volume, cross-region batch processing workloads.
 * Features:
 * - Dynamic job chunking & partition assignment
 * - Worker lease management with heartbeat timeouts
 * - Automatic re-assignment of stalled/orphaned chunks
 * - Real-time progress and throughput telemetry
 */

export type JobStatus = 
  | 'SUBMITTED'
  | 'PLANNING'
  | 'DISPATCHED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_FAILED'
  | 'FAILED'
  | 'CANCELLED';

export interface WorkloadChunk {
  chunkId: string;
  jobId: string;
  chunkIndex: number;
  totalChunks: number;
  startRecordIndex: number;
  recordCount: number;
  assignedWorkerId?: string;
  leaseExpiresAt?: string;
  status: 'PENDING' | 'LEASED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  error?: string;
  processedRecords: number;
  durationMs?: number;
}

export interface DistributedJob {
  jobId: string;
  tenantId: string;
  jobType: 'ERP_LEDGER_SYNC' | 'GLOBAL_INVENTORY_REBALANCE' | 'EDI_CATALOG_EXPORT' | 'MASS_ASN_RECONCILIATION';
  targetRegionId: string;
  status: JobStatus;
  totalRecords: number;
  chunkSize: number;
  chunks: WorkloadChunk[];
  progressPercent: number;
  activeWorkersCount: number;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  submittedBy: string;
  metadata?: Record<string, any>;
}

export class GlobalJobOrchestrator {
  private static instance: GlobalJobOrchestrator;
  private jobs: Map<string, DistributedJob> = new Map(); // key: jobId

  private readonly LEASE_DURATION_MS = 30000; // 30s worker lease

  private constructor() {
    this.seedDefaultJobs();
  }

  public static getInstance(): GlobalJobOrchestrator {
    if (!GlobalJobOrchestrator.instance) {
      GlobalJobOrchestrator.instance = new GlobalJobOrchestrator();
    }
    return GlobalJobOrchestrator.instance;
  }

  private seedDefaultJobs(): void {
    const tenantId = 'demo-tenant';
    const now = new Date().toISOString();

    const sampleJob: DistributedJob = {
      jobId: 'job-ledger-sync-01',
      tenantId,
      jobType: 'ERP_LEDGER_SYNC',
      targetRegionId: 'reg-us-east',
      status: 'PROCESSING',
      totalRecords: 10000,
      chunkSize: 1000,
      chunks: Array.from({ length: 10 }).map((_, i) => ({
        chunkId: `chk-${i}`,
        jobId: 'job-ledger-sync-01',
        chunkIndex: i,
        totalChunks: 10,
        startRecordIndex: i * 1000,
        recordCount: 1000,
        assignedWorkerId: `worker-us-east-${(i % 4) + 1}`,
        leaseExpiresAt: new Date(Date.now() + 25000).toISOString(),
        status: i < 6 ? 'COMPLETED' : 'PROCESSING',
        retryCount: 0,
        processedRecords: i < 6 ? 1000 : 450,
        durationMs: i < 6 ? 1200 : undefined
      })),
      progressPercent: 64.5,
      activeWorkersCount: 4,
      submittedAt: new Date(Date.now() - 120000).toISOString(),
      startedAt: new Date(Date.now() - 110000).toISOString(),
      submittedBy: 'scheduler'
    };

    const seedTenants = ['demo-tenant', 'ORION_PLATFORM'];
    for (const t of seedTenants) {
      const id = t === 'demo-tenant' ? sampleJob.jobId : `${sampleJob.jobId}-${t}`;
      this.jobs.set(id, { ...sampleJob, jobId: id, tenantId: t });
    }
  }

  /**
   * Submit and plan a large-scale distributed job
   */
  public submitJob(params: {
    tenantId: string;
    jobType: DistributedJob['jobType'];
    targetRegionId: string;
    totalRecords: number;
    chunkSize?: number;
    submittedBy?: string;
    metadata?: Record<string, any>;
  }): DistributedJob {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const chunkSize = params.chunkSize || 1000;
    const totalChunks = Math.ceil(params.totalRecords / chunkSize);
    const now = new Date().toISOString();

    const chunks: WorkloadChunk[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const startRecordIndex = i * chunkSize;
      const recordCount = Math.min(chunkSize, params.totalRecords - startRecordIndex);
      chunks.push({
        chunkId: `${jobId}-chk-${i}`,
        jobId,
        chunkIndex: i,
        totalChunks,
        startRecordIndex,
        recordCount,
        status: 'PENDING',
        retryCount: 0,
        processedRecords: 0
      });
    }

    const job: DistributedJob = {
      jobId,
      tenantId: params.tenantId,
      jobType: params.jobType,
      targetRegionId: params.targetRegionId,
      status: 'PLANNING',
      totalRecords: params.totalRecords,
      chunkSize,
      chunks,
      progressPercent: 0,
      activeWorkersCount: 0,
      submittedAt: now,
      submittedBy: params.submittedBy || 'admin',
      metadata: params.metadata
    };

    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Worker leases next available chunk
   */
  public leaseNextChunk(jobId: string, workerId: string): WorkloadChunk | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const now = Date.now();

    // Find pending chunk or expired lease
    const eligibleChunk = job.chunks.find(c => {
      if (c.status === 'PENDING') return true;
      if (c.status === 'LEASED' && c.leaseExpiresAt && new Date(c.leaseExpiresAt).getTime() < now) {
        return true; // Expired lease, take over
      }
      return false;
    });

    if (!eligibleChunk) return undefined;

    eligibleChunk.status = 'LEASED';
    eligibleChunk.assignedWorkerId = workerId;
    eligibleChunk.leaseExpiresAt = new Date(now + this.LEASE_DURATION_MS).toISOString();

    if (job.status === 'PLANNING' || job.status === 'SUBMITTED') {
      job.status = 'PROCESSING';
      job.startedAt = new Date().toISOString();
    }

    this.recalculateJobProgress(job);
    return eligibleChunk;
  }

  /**
   * Worker reports chunk completion
   */
  public completeChunk(jobId: string, chunkId: string, processedRecords: number, durationMs: number): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const chunk = job.chunks.find(c => c.chunkId === chunkId);
    if (!chunk) return false;

    chunk.status = 'COMPLETED';
    chunk.processedRecords = processedRecords;
    chunk.durationMs = durationMs;

    this.recalculateJobProgress(job);
    return true;
  }

  /**
   * Worker reports chunk failure
   */
  public failChunk(jobId: string, chunkId: string, error: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const chunk = job.chunks.find(c => c.chunkId === chunkId);
    if (!chunk) return false;

    chunk.retryCount += 1;
    chunk.error = error;

    if (chunk.retryCount >= 3) {
      chunk.status = 'FAILED';
    } else {
      chunk.status = 'PENDING'; // Return to queue for retry
      chunk.assignedWorkerId = undefined;
    }

    this.recalculateJobProgress(job);
    return true;
  }

  private recalculateJobProgress(job: DistributedJob): void {
    const total = job.chunks.length;
    if (total === 0) return;

    const completed = job.chunks.filter(c => c.status === 'COMPLETED').length;
    const failed = job.chunks.filter(c => c.status === 'FAILED').length;
    const leased = job.chunks.filter(c => c.status === 'LEASED' || c.status === 'PROCESSING').length;

    job.progressPercent = Math.round((completed / total) * 100);
    const activeWorkers = new Set(job.chunks.filter(c => c.assignedWorkerId).map(c => c.assignedWorkerId));
    job.activeWorkersCount = activeWorkers.size;

    if (completed === total) {
      job.status = 'COMPLETED';
      job.completedAt = new Date().toISOString();
      if (job.startedAt) {
        job.durationMs = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
      }
    } else if (failed > 0 && (completed + failed === total)) {
      job.status = 'PARTIALLY_FAILED';
      job.completedAt = new Date().toISOString();
    }
  }

  public getJob(jobId: string): DistributedJob | undefined {
    return this.jobs.get(jobId);
  }

  public listJobs(tenantId: string): DistributedJob[] {
    const results: DistributedJob[] = [];
    for (const j of this.jobs.values()) {
      if (j.tenantId === tenantId) {
        results.push({ ...j });
      }
    }
    return results.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public clear(): void {
    this.jobs.clear();
  }
}

export const globalJobOrchestrator = GlobalJobOrchestrator.getInstance();
