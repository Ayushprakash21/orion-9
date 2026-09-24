/**
 * ORION-9 DEMAND SENSING ENGINE
 *
 * Ingests high-frequency real-time signals (POS, eCommerce, weather, promotions)
 * and calculates short-term forecast adjustments with confidence scoring.
 */

import { DemandSensingSignalRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class DemandSensingEngine {
  private static instance: DemandSensingEngine;
  private signals: Map<string, DemandSensingSignalRecord[]> = new Map();

  public static getInstance(): DemandSensingEngine {
    if (!DemandSensingEngine.instance) {
      DemandSensingEngine.instance = new DemandSensingEngine();
    }
    return DemandSensingEngine.instance;
  }

  public detectSignal(params: Omit<DemandSensingSignalRecord, 'signalId' | 'detectedAt' | 'liftPct' | 'recommendedAdjustmentUnits' | 'governanceState'>): DemandSensingSignalRecord {
    const liftPct = ((params.observedDemandUnits - params.baselineForecastUnits) / Math.max(1, params.baselineForecastUnits)) * 100;
    const recommendedAdjustmentUnits = Math.round((params.observedDemandUnits - params.baselineForecastUnits) * params.confidenceScore);

    const record: DemandSensingSignalRecord = {
      ...params,
      signalId: `SENSE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      liftPct,
      recommendedAdjustmentUnits,
      governanceState: 'PROPOSED',
      detectedAt: new Date().toISOString()
    };

    const list = this.signals.get(record.tenantId) || [];
    list.unshift(record);
    this.signals.set(record.tenantId, list);

    eventBus.emit({
      eventId: `EVT-SENSE-${Date.now()}`,
      eventType: 'DEMAND_SIGNAL_SENSED',
      tenantId: record.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'AI_SENSING_AGENT', role: 'system' }
    });

    return record;
  }

  public applyAdjustment(tenantId: string, signalId: string, approvedBy: string): DemandSensingSignalRecord {
    const list = this.signals.get(tenantId) || [];
    const signal = list.find(s => s.signalId === signalId);
    if (!signal) throw new Error(`Signal ${signalId} not found`);

    signal.governanceState = 'APPLIED';

    eventBus.emit({
      eventId: `EVT-SENSE-APPLIED-${Date.now()}`,
      eventType: 'DEMAND_ADJUSTMENT_APPLIED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { signalId, approvedBy, adjustedUnits: signal.recommendedAdjustmentUnits },
      actor: { userId: approvedBy, role: 'planner' }
    });

    return signal;
  }

  public getSignals(tenantId: string): DemandSensingSignalRecord[] {
    return this.signals.get(tenantId) || [];
  }
}

export const demandSensingEngine = DemandSensingEngine.getInstance();
