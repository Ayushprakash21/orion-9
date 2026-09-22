/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * JobManager: Durable Background Job State Machine, Distributed Leases & DLQ
 */

import { RuntimeJob, JobState } from './types';
import { observabilityService } from './ObservabilityService';

export class JobManager {
  private static instance: JobManager;
  private jobs: Map<string, RuntimeJob> = new Map();
  private idempotencyIndex: Map<string, string> = new Map(); // idempotencyKey -> jobId
  private defaultMaxRetries: number = 3;
  private defaultLeaseDurationMs: number = 30000; // 30s lease

  private constructor() {
    this.seedDefaultJobs();
  }

  public static getInstance(): JobManager {
    if (!JobManager.instance) {
      JobManager.instance = new JobManager();
    }
    return JobManager.instance;
  }

  private seedDefaultJobs(): void {
    const job1: RuntimeJob = {
      id: 'job-seed-01',
      jobType: 'TWIN_RECONCILIATION_SYNC',
      idempotencyKey: 'idemp-twin-sync-seed-01',
      tenantId: 'TENANT_A',
      state: 'SUCCEEDED',
      payload: { mode: 'INCREMENTAL', batchSize: 50 },
      retryCount: 0,
      maxRetries: 3,
      backoffDelayMs: 1000,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      startedAt: new Date(Date.now() - 29 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 29 * 60 * 1000 + 1200).toISOString(),
      result: { reconciledCount: 42, discrepanciesDetected: 0 },
    };

    this.jobs.set(job1.id, job1);
    this.idempotencyIndex.set(job1.idempotencyKey, job1.id);
  }

  /**
   * Submits a job with mandatory idempotency key.
   * If a job with the idempotency key already exists, returns the existing job.
   */
  public submitJob<T = any>(params: {
    jobType: string;
    idempotencyKey: string;
    tenantId: string;
    payload: T;
    maxRetries?: number;
  }): { job: RuntimeJob<T>; isDuplicate: boolean } {
    const existingJobId = this.idempotencyIndex.get(params.idempotencyKey);
    if (existingJobId) {
      const existing = this.jobs.get(existingJobId);
      if (existing) {
        return { job: existing as RuntimeJob<T>, isDuplicate: true };
      }
    }

    const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const job: RuntimeJob<T> = {
      id,
      jobType: params.jobType,
      idempotencyKey: params.idempotencyKey,
      tenantId: params.tenantId,
      state: 'CREATED',
      payload: params.payload,
      retryCount: 0,
      maxRetries: params.maxRetries || this.defaultMaxRetries,
      backoffDelayMs: 1000,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    this.idempotencyIndex.set(params.idempotencyKey, id);

    observabilityService.info(`[JOB_SUBMITTED] ${job.jobType} (${id}) for ${job.tenantId}`, {
      tenantId: job.tenantId,
      context: { jobId: id, idempotencyKey: params.idempotencyKey },
    });

    return { job, isDuplicate: false };
  }

  /**
   * Acquires a lease on a job for processing.
   * Prevents split-brain duplicate worker execution.
   */
  public acquireLease(jobId: string, workerId: string): { acquired: boolean; leaseToken?: string } {
    const job = this.jobs.get(jobId);
    if (!job) return { acquired: false };

    const now = Date.now();
    const isLeaseActive = job.leaseExpiresAt && new Date(job.leaseExpiresAt).getTime() > now;

    if (isLeaseActive && job.state === 'RUNNING') {
      return { acquired: false }; // Still held by another worker
    }

    const leaseToken = `lease-${workerId}-${now}`;
    job.leaseToken = leaseToken;
    job.leaseExpiresAt = new Date(now + this.defaultLeaseDurationMs).toISOString();
    job.state = 'RUNNING';
    job.startedAt = new Date().toISOString();

    this.jobs.set(jobId, job);
    return { acquired: true, leaseToken };
  }

  /**
   * Renews heartbeat for long-running jobs.
   */
  public renewHeartbeat(jobId: string, leaseToken: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.leaseToken !== leaseToken) return false;

    job.leaseExpiresAt = new Date(Date.now() + this.defaultLeaseDurationMs).toISOString();
    this.jobs.set(jobId, job);
    return true;
  }

  /**
   * Marks a job as SUCCEEDED with its result payload.
   */
  public completeJob(jobId: string, leaseToken: string, result: any): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.leaseToken !== leaseToken) return false;

    job.state = 'SUCCEEDED';
    job.completedAt = new Date().toISOString();
    job.result = result;
    job.leaseToken = undefined;
    job.leaseExpiresAt = undefined;

    this.jobs.set(jobId, job);
    return true;
  }

  /**
   * Handles job failure, enters exponential backoff or transitions to DEAD_LETTERED.
   */
  public failJob(jobId: string, leaseToken: string, error: string): RuntimeJob {
    const job = this.jobs.get(jobId)!;
    job.retryCount += 1;
    job.error = error;

    if (job.retryCount >= job.maxRetries) {
      job.state = 'DEAD_LETTERED';
      job.completedAt = new Date().toISOString();
      observabilityService.error(`[JOB_DEAD_LETTERED] Job ${jobId} exceeded max retries: ${error}`, {
        tenantId: job.tenantId,
        context: { jobId, retries: job.retryCount },
      });
    } else {
      job.state = 'RETRYING';
      job.backoffDelayMs = Math.min(job.backoffDelayMs * 2, 30000);
      observabilityService.warn(`[JOB_RETRY] Job ${jobId} retry #${job.retryCount} scheduled after ${job.backoffDelayMs}ms`, {
        tenantId: job.tenantId,
      });
    }

    job.leaseToken = undefined;
    job.leaseExpiresAt = undefined;
    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Replays a dead-lettered job from the Dead Letter Queue.
   */
  public replayDeadLetterJob(jobId: string, replayedBy: string): { replayed: boolean; newJob?: RuntimeJob } {
    const job = this.jobs.get(jobId);
    if (!job || job.state !== 'DEAD_LETTERED') {
      return { replayed: false };
    }

    const newIdempKey = `${job.idempotencyKey}:replay-${Date.now()}`;
    const result = this.submitJob({
      jobType: job.jobType,
      idempotencyKey: newIdempKey,
      tenantId: job.tenantId,
      payload: job.payload,
      maxRetries: job.maxRetries,
    });

    observabilityService.info(`[JOB_DLQ_REPLAY] Dead lettered job ${jobId} replayed by ${replayedBy}`, {
      tenantId: job.tenantId,
      context: { originalJobId: jobId, newJobId: result.job.id },
    });

    return { replayed: true, newJob: result.job };
  }

  public getJob(jobId: string): RuntimeJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllJobs(tenantId?: string): RuntimeJob[] {
    const list = Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (tenantId && tenantId !== 'GLOBAL') {
      return list.filter(j => j.tenantId === tenantId);
    }
    return list;
  }
}

export const jobManager = JobManager.getInstance();
