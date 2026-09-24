/**
 * ORION-9 SUPPLY CHAIN SUSTAINABILITY & ESG ENGINE
 *
 * Implements:
 * 1. Scope 1 (direct operations), Scope 2 (facility power), Scope 3 (freight/logistics) carbon accounting.
 * 2. Transport CO2 computation with configurable emission factors.
 * 3. Packaging circularity and supplier ESG ratings.
 */

import { SustainabilityMetricsRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class SustainabilityEngine {
  private static instance: SustainabilityEngine;
  private metrics: Map<string, SustainabilityMetricsRecord[]> = new Map();

  public static getInstance(): SustainabilityEngine {
    if (!SustainabilityEngine.instance) {
      SustainabilityEngine.instance = new SustainabilityEngine();
    }
    return SustainabilityEngine.instance;
  }

  public calculateMetrics(params: {
    tenantId: string;
    period: string;
    freightTkm: number; // Ton-kilometers
    warehouseKwh: number;
    totalUnitsShipped: number;
    packagingRecycledPct: number;
    supplierEsggAvg: number;
    offsetPurchasedKg?: number;
  }): SustainabilityMetricsRecord {
    // Configurable emission factors:
    // Freight: ~0.082 kg CO2 / ton-km (hybrid road/rail mix)
    // Electricity: ~0.385 kg CO2 / kWh
    const totalTransportCo2Kg = Math.round(params.freightTkm * 0.082);
    const scope2IndirectCo2Kg = Math.round(params.warehouseKwh * 0.385);
    const scope1DirectCo2Kg = Math.round(totalTransportCo2Kg * 0.25);
    const scope3ValueChainCo2Kg = Math.round(totalTransportCo2Kg * 0.75 + params.totalUnitsShipped * 1.2);
    const offsetPurchasedKg = params.offsetPurchasedKg || 0;

    const netCarbonIntensityKgPerUnit = Number(
      ((scope1DirectCo2Kg + scope2IndirectCo2Kg + scope3ValueChainCo2Kg - offsetPurchasedKg) / Math.max(1, params.totalUnitsShipped)).toFixed(2)
    );

    const record: SustainabilityMetricsRecord = {
      sustainabilityId: `SUST-${Date.now()}`,
      tenantId: params.tenantId,
      period: params.period,
      totalTransportCo2Kg,
      totalWarehouseEnergyKwh: params.warehouseKwh,
      packagingRecycledContentPct: params.packagingRecycledPct,
      supplierEsggAvgScore: params.supplierEsggAvg,
      scope1DirectCo2Kg,
      scope2IndirectCo2Kg,
      scope3ValueChainCo2Kg,
      offsetPurchasedKg,
      netCarbonIntensityKgPerUnit,
      calculatedAt: new Date().toISOString()
    };

    const list = this.metrics.get(params.tenantId) || [];
    list.unshift(record);
    this.metrics.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-SUST-${Date.now()}`,
      eventType: 'SUSTAINABILITY_CALCULATED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'SUSTAINABILITY_AUDITOR', role: 'system' }
    });

    return record;
  }

  public getMetricsHistory(tenantId: string): SustainabilityMetricsRecord[] {
    return this.metrics.get(tenantId) || [];
  }
}

export const sustainabilityEngine = SustainabilityEngine.getInstance();
