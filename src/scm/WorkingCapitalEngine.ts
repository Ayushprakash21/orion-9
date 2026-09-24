/**
 * ORION-9 WORKING CAPITAL INTELLIGENCE ENGINE
 *
 * Computes:
 * 1. Days Sales Outstanding (DSO) = (Accounts Receivable / Total Revenue) * 365
 * 2. Days Inventory Outstanding (DIO) = (Inventory Value / Cost of Goods Sold) * 365
 * 3. Days Payable Outstanding (DPO) = (Accounts Payable / Cost of Goods Sold) * 365
 * 4. Cash Conversion Cycle (CCC) = DIO + DSO - DPO
 * 5. Net Working Capital Exposure = Inventory + AR - AP
 */

import { WorkingCapitalRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class WorkingCapitalEngine {
  private static instance: WorkingCapitalEngine;
  private records: Map<string, WorkingCapitalRecord[]> = new Map();

  public static getInstance(): WorkingCapitalEngine {
    if (!WorkingCapitalEngine.instance) {
      WorkingCapitalEngine.instance = new WorkingCapitalEngine();
    }
    return WorkingCapitalEngine.instance;
  }

  public computeWorkingCapital(params: {
    tenantId: string;
    period: string;
    inventoryValue: number;
    accountsReceivable: number;
    accountsPayable: number;
    annualRevenue: number;
    annualCogs: number;
  }): WorkingCapitalRecord {
    const rev = Math.max(1, params.annualRevenue);
    const cogs = Math.max(1, params.annualCogs);

    const daysSalesOutstanding = Number(((params.accountsReceivable / rev) * 365).toFixed(1));
    const daysInventoryOutstanding = Number(((params.inventoryValue / cogs) * 365).toFixed(1));
    const daysPayableOutstanding = Number(((params.accountsPayable / cogs) * 365).toFixed(1));
    const cashConversionCycleDays = Number((daysInventoryOutstanding + daysSalesOutstanding - daysPayableOutstanding).toFixed(1));
    const netWorkingCapital = params.inventoryValue + params.accountsReceivable - params.accountsPayable;

    const record: WorkingCapitalRecord = {
      metricId: `WC-${Date.now()}`,
      tenantId: params.tenantId,
      period: params.period,
      daysSalesOutstanding,
      daysInventoryOutstanding,
      daysPayableOutstanding,
      cashConversionCycleDays,
      totalInventoryValue: params.inventoryValue,
      totalArExposure: params.accountsReceivable,
      totalApLiability: params.accountsPayable,
      netWorkingCapital,
      calculatedAt: new Date().toISOString()
    };

    const list = this.records.get(params.tenantId) || [];
    list.unshift(record);
    this.records.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-WC-${Date.now()}`,
      eventType: 'WORKING_CAPITAL_CALCULATED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'WORKING_CAPITAL_ENGINE', role: 'system' }
    });

    return record;
  }

  public getWorkingCapitalHistory(tenantId: string): WorkingCapitalRecord[] {
    return this.records.get(tenantId) || [];
  }
}

export const workingCapitalEngine = WorkingCapitalEngine.getInstance();
