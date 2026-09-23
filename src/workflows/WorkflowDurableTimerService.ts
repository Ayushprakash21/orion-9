/**
 * ORION-9 PART 4 TRACK 6: ENTERPRISE WORKFLOW PLATFORM
 * Durable Timer & Schedule Service
 * 
 * Provides durable, Firestore-backed timer scheduling and automatic recovery
 * across runtime restarts, process crashes, and browser reloads.
 */

import { WorkflowSchedule } from './types';
import { db, saveData, loadData } from '../data/db';

export class WorkflowDurableTimerService {
  private static instance: WorkflowDurableTimerService;
  private timerMap: Map<string, WorkflowSchedule> = new Map();
  private timerCallbacks: Map<string, (schedule: WorkflowSchedule) => Promise<void>> = new Map();
  private pollIntervalId?: any;

  private constructor() {
    this.startBackgroundPoller();
  }

  public static getInstance(): WorkflowDurableTimerService {
    if (!WorkflowDurableTimerService.instance) {
      WorkflowDurableTimerService.instance = new WorkflowDurableTimerService();
    }
    return WorkflowDurableTimerService.instance;
  }

  /**
   * Registers a callback for handling matured timer executions
   */
  public registerHandler(
    scheduleType: string,
    handler: (schedule: WorkflowSchedule) => Promise<void>
  ): void {
    this.timerCallbacks.set(scheduleType, handler);
  }

  /**
   * Schedule a durable timer backed by Firestore
   */
  public async scheduleTimer(params: {
    tenantId: string;
    workflowId: string;
    instanceId?: string;
    stepId?: string;
    scheduleType: 'WAIT_FOR_TIMER' | 'STEP_TIMEOUT' | 'APPROVAL_TIMEOUT' | 'TASK_TIMEOUT' | 'SLA_DEADLINE' | 'RETRY_DELAY' | 'CRON';
    delayMs: number;
    correlationId?: string;
    cronExpression?: string;
  }): Promise<WorkflowSchedule> {
    const now = Date.now();
    const executeAt = new Date(now + params.delayMs).toISOString();
    const scheduleId = `SCH-${params.tenantId}-${params.workflowId}-${now}-${Math.floor(Math.random() * 10000)}`;

    const schedule: WorkflowSchedule = {
      scheduleId,
      tenantId: params.tenantId,
      workflowId: params.workflowId,
      instanceId: params.instanceId,
      stepId: params.stepId,
      scheduleType: params.scheduleType,
      cronExpression: params.cronExpression,
      delayMs: params.delayMs,
      executeAt,
      status: 'ACTIVE',
      attempt: 0,
      correlationId: params.correlationId || scheduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.timerMap.set(scheduleId, schedule);

    try {
      await saveData<WorkflowSchedule>((db as any).workflow_schedules, [schedule]);
    } catch (err) {
      console.warn(`[WorkflowDurableTimerService] Failed to persist timer to Firestore:`, err);
      // Fallback: timer remains in memory map
    }

    return schedule;
  }

  /**
   * Scans and recovers pending/matured durable timers on process startup or poll iteration
   */
  public async recoverTimers(tenantId?: string): Promise<WorkflowSchedule[]> {
    const recovered: WorkflowSchedule[] = [];
    const now = Date.now();

    try {
      const allSchedules = await loadData<WorkflowSchedule>((db as any).workflow_schedules);
      const candidates = (allSchedules && Array.isArray(allSchedules) && allSchedules.length > 0)
        ? allSchedules
        : Array.from(this.timerMap.values());

      for (const sched of candidates) {
        if (tenantId && sched.tenantId !== tenantId) continue;
        if (sched.status === 'ACTIVE') {
          this.timerMap.set(sched.scheduleId, sched);
          if (sched.executeAt && new Date(sched.executeAt).getTime() <= now) {
            recovered.push(sched);
            await this.executeTimer(sched);
          }
        }
      }
    } catch (err) {
      console.warn(`[WorkflowDurableTimerService] Timer recovery scan failed:`, err);
    }

    return recovered;
  }


  /**
   * Executes a matured timer idempotently
   */
  public async executeTimer(schedule: WorkflowSchedule): Promise<boolean> {
    if (schedule.status !== 'ACTIVE') return false;

    schedule.status = 'COMPLETED';
    schedule.lastRunAt = new Date().toISOString();
    schedule.updatedAt = new Date().toISOString();
    this.timerMap.set(schedule.scheduleId, schedule);

    try {
      await saveData<WorkflowSchedule>((db as any).workflow_schedules, [schedule]);
    } catch (err) {
      console.warn(`[WorkflowDurableTimerService] Failed to update completed timer state:`, err);
    }

    const handler = this.timerCallbacks.get(schedule.scheduleType || 'WAIT_FOR_TIMER');
    if (handler) {
      try {
        await handler(schedule);
      } catch (err) {
        console.error(`[WorkflowDurableTimerService] Error executing timer callback for ${schedule.scheduleId}:`, err);
      }
    }

    return true;
  }

  /**
   * Cancels a scheduled timer
   */
  public async cancelTimer(scheduleId: string): Promise<boolean> {
    const sched = this.timerMap.get(scheduleId);
    if (sched && sched.status === 'ACTIVE') {
      sched.status = 'DISABLED';
      sched.updatedAt = new Date().toISOString();
      try {
        await saveData<WorkflowSchedule>((db as any).workflow_schedules, [sched]);
      } catch (err) {
        console.warn(`[WorkflowDurableTimerService] Error persisting cancelled timer:`, err);
      }
      return true;
    }
    return false;
  }

  /**
   * Lists active timers for a tenant
   */
  public listActiveTimers(tenantId: string): WorkflowSchedule[] {
    return Array.from(this.timerMap.values()).filter(
      t => t.tenantId === tenantId && t.status === 'ACTIVE'
    );
  }

  private startBackgroundPoller(): void {
    if (typeof setInterval !== 'undefined') {
      this.pollIntervalId = setInterval(() => {
        this.recoverTimers().catch(err => {
          console.warn('[WorkflowDurableTimerService] Background poll error:', err);
        });
      }, 15000); // Poll every 15s
    }
  }

  public clear(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
    this.timerMap.clear();
    this.timerCallbacks.clear();
  }
}

export const workflowDurableTimerService = WorkflowDurableTimerService.getInstance();
