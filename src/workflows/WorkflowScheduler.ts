/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Scheduler
 * 
 * Durable scheduling engine for timed triggers, delayed retries, approval expiry checks,
 * and background SLA escalation.
 */

import { WorkflowSchedule } from './types';

export class WorkflowScheduler {
  private static instance: WorkflowScheduler;
  private schedules: Map<string, WorkflowSchedule> = new Map(); // key: `${tenantId}:${scheduleId}`

  private constructor() {}

  public static getInstance(): WorkflowScheduler {
    if (!WorkflowScheduler.instance) {
      WorkflowScheduler.instance = new WorkflowScheduler();
    }
    return WorkflowScheduler.instance;
  }

  public scheduleWorkflow(
    tenantId: string,
    workflowId: string,
    config: {
      cronExpression?: string;
      delayMs?: number;
      runAt?: string;
    }
  ): WorkflowSchedule {
    const scheduleId = `SCHED-${tenantId}-${workflowId}-${Date.now()}`;
    const runAt = config.runAt || (config.delayMs ? new Date(Date.now() + config.delayMs).toISOString() : new Date().toISOString());

    const schedule: WorkflowSchedule = {
      scheduleId,
      tenantId,
      workflowId,
      cronExpression: config.cronExpression,
      delayMs: config.delayMs,
      runAt,
      nextRunAt: runAt,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.schedules.set(`${tenantId}:${scheduleId}`, schedule);
    return JSON.parse(JSON.stringify(schedule));
  }

  public getDueSchedules(tenantId: string, now: number = Date.now()): WorkflowSchedule[] {
    const due: WorkflowSchedule[] = [];
    for (const [key, sched] of this.schedules.entries()) {
      if (key.startsWith(`${tenantId}:`) && sched.status === 'ACTIVE' && sched.nextRunAt) {
        if (new Date(sched.nextRunAt).getTime() <= now) {
          due.push(JSON.parse(JSON.stringify(sched)));
        }
      }
    }
    return due;
  }

  public markExecuted(tenantId: string, scheduleId: string, nextRunAt?: string): void {
    const key = `${tenantId}:${scheduleId}`;
    const sched = this.schedules.get(key);
    if (sched) {
      sched.lastRunAt = new Date().toISOString();
      sched.updatedAt = new Date().toISOString();
      if (nextRunAt) {
        sched.nextRunAt = nextRunAt;
      } else if (!sched.cronExpression) {
        sched.status = 'COMPLETED';
        sched.nextRunAt = undefined;
      }
    }
  }

  public pauseSchedule(tenantId: string, scheduleId: string): void {
    const key = `${tenantId}:${scheduleId}`;
    const sched = this.schedules.get(key);
    if (sched) {
      sched.status = 'PAUSED';
      sched.updatedAt = new Date().toISOString();
    }
  }

  public listSchedules(tenantId: string): WorkflowSchedule[] {
    const res: WorkflowSchedule[] = [];
    for (const [key, sched] of this.schedules.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        res.push(JSON.parse(JSON.stringify(sched)));
      }
    }
    return res;
  }

  public clear(): void {
    this.schedules.clear();
  }
}

export const workflowScheduler = WorkflowScheduler.getInstance();
