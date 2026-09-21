/**
 * ORION-9 WAVE 3.3 — INTEGRATION SCHEDULER
 */

import { ScheduleRecord, ScheduleType } from '../types';

export class IntegrationScheduler {
  private static instance: IntegrationScheduler;
  private schedules: Map<string, ScheduleRecord> = new Map(); // key: `${tenantId}:${scheduleId}`

  private constructor() {}

  public static getInstance(): IntegrationScheduler {
    if (!IntegrationScheduler.instance) {
      IntegrationScheduler.instance = new IntegrationScheduler();
    }
    return IntegrationScheduler.instance;
  }

  public createSchedule(params: {
    tenantId: string;
    name: string;
    connectorId: string;
    transportId?: string;
    type: ScheduleType;
    cronExpression?: string;
    intervalMinutes?: number;
    active?: boolean;
  }): ScheduleRecord {
    const scheduleId = `SCHED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: ScheduleRecord = {
      scheduleId,
      tenantId: params.tenantId,
      name: params.name,
      connectorId: params.connectorId,
      transportId: params.transportId,
      type: params.type,
      cronExpression: params.cronExpression,
      intervalMinutes: params.intervalMinutes,
      active: params.active !== undefined ? params.active : true,
      createdAt: now,
      updatedAt: now,
    };

    this.schedules.set(`${params.tenantId}:${scheduleId}`, record);
    return record;
  }

  public getSchedule(tenantId: string, scheduleId: string): ScheduleRecord | undefined {
    return this.schedules.get(`${tenantId}:${scheduleId}`);
  }

  public listSchedules(tenantId: string): ScheduleRecord[] {
    const result: ScheduleRecord[] = [];
    for (const [key, sched] of this.schedules.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...sched });
      }
    }
    return result;
  }

  public triggerSchedule(tenantId: string, scheduleId: string): { success: boolean; triggeredAt: string } {
    const sched = this.getSchedule(tenantId, scheduleId);
    if (!sched || !sched.active) {
      return { success: false, triggeredAt: new Date().toISOString() };
    }

    const now = new Date().toISOString();
    sched.lastRunAt = now;
    sched.lastRunStatus = 'SUCCESS';
    sched.updatedAt = now;

    this.schedules.set(`${tenantId}:${scheduleId}`, sched);
    return { success: true, triggeredAt: now };
  }

  public setScheduleActive(tenantId: string, scheduleId: string, active: boolean): boolean {
    const sched = this.getSchedule(tenantId, scheduleId);
    if (!sched) return false;

    sched.active = active;
    sched.updatedAt = new Date().toISOString();
    this.schedules.set(`${tenantId}:${scheduleId}`, sched);
    return true;
  }

  public clear(): void {
    this.schedules.clear();
  }
}

export const integrationScheduler = IntegrationScheduler.getInstance();
