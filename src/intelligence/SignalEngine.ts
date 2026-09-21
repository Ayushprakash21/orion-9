/**
 * ORION-9 WAVE 6 — SIGNAL ENGINE
 *
 * Deterministic detection engine for 13 canonical SCM signal types across inventory,
 * logistics, procurement, quality, demand, and suppliers.
 *
 * Enforces:
 * - Deterministic, explainable confidence metrics (0.0 - 1.0)
 * - Zero Math.random(), zero fabricated ML claims
 * - Strict tenant isolation
 * - Firestore persistence in 'signals' collection
 */

import { Signal, SignalType, SignalSeverity, SignalDetectionMethod } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export interface SignalScanInput {
  tenantId: string;
  inventory?: Array<{
    id: string;
    productId: string;
    onHand: number;
    safetyStock: number;
    reorderPoint: number;
    dailyDemand?: number;
    unitCost?: number;
  }>;
  purchaseOrders?: Array<{
    id: string;
    poNumber?: string;
    supplierId: string;
    status: string;
    expectedDelivery: string;
    actualDelivery?: string;
    confirmedAt?: string;
    createdAt?: string;
    lines: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }>;
  shipments?: Array<{
    id: string;
    trackingNumber?: string;
    poId?: string;
    status: string;
    delayDays: number;
    estimatedArrival: string;
    actualArrival?: string;
    origin?: string;
    destination?: string;
  }>;
  suppliers?: Array<{
    id: string;
    name: string;
    otif: number; // 0 - 100
    qualityRating?: number; // 0 - 100
    averageLeadTimeDays?: number;
    contractedLeadTimeDays?: number;
    status?: string;
  }>;
  qualityInspections?: Array<{
    id: string;
    poId: string;
    defectRatePercent: number; // e.g. 8.5
    status: string;
  }>;
  demandForecasts?: Array<{
    productId: string;
    historicalAverageDaily: number;
    forecastedDaily: number;
    trendPercentage: number;
  }>;
  costIndices?: Array<{
    productId: string;
    benchmarkCost: number;
    currentCost: number;
  }>;
}

export class SignalEngine {
  private static instance: SignalEngine;
  private signals: Map<string, Signal> = new Map();

  private constructor() {}

  public static getInstance(): SignalEngine {
    if (!SignalEngine.instance) {
      SignalEngine.instance = new SignalEngine();
    }
    return SignalEngine.instance;
  }

  /**
   * Deterministically scans tenant data to detect active signals across the 13 canonical types
   */
  public async scan(input: SignalScanInput): Promise<Signal[]> {
    const { tenantId } = input;
    const detected: Signal[] = [];
    const now = new Date();
    const nowIso = now.toISOString();

    // Helper to generate deterministic ID
    const makeId = (type: SignalType, entityId: string) =>
      `sig-${tenantId}-${type.toLowerCase()}-${entityId}`;

    // 1. LOW_INVENTORY & 2. STOCKOUT_RISK
    if (input.inventory) {
      for (const inv of input.inventory) {
        if (inv.onHand <= 0) {
          detected.push({
            signalId: makeId('STOCKOUT_RISK', inv.productId),
            tenantId,
            signalType: 'STOCKOUT_RISK',
            entityType: 'INVENTORY',
            entityId: inv.productId,
            detectedAt: nowIso,
            severity: 'CRITICAL',
            confidence: 1.0,
            confidenceBasis: 'DETERMINISTIC',
            threshold: 1,
            actualValue: inv.onHand,
            expectedValue: inv.safetyStock,
            evidence: [
              `On-hand inventory is ${inv.onHand} units.`,
              `Safety stock requirement is ${inv.safetyStock} units.`,
              `Zero available inventory causes immediate fulfillment halt.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'THRESHOLD',
          });
        } else if (inv.onHand <= inv.safetyStock) {
          detected.push({
            signalId: makeId('LOW_INVENTORY', inv.productId),
            tenantId,
            signalType: 'LOW_INVENTORY',
            entityType: 'INVENTORY',
            entityId: inv.productId,
            detectedAt: nowIso,
            severity: inv.onHand < inv.safetyStock * 0.5 ? 'HIGH' : 'MEDIUM',
            confidence: 0.95,
            confidenceBasis: 'DETERMINISTIC',
            threshold: inv.safetyStock,
            actualValue: inv.onHand,
            expectedValue: inv.safetyStock,
            evidence: [
              `On-hand inventory (${inv.onHand}) breached safety stock threshold (${inv.safetyStock}).`,
              `Buffer stock depleted; reorder trigger active.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'THRESHOLD',
          });
        }

        // SERVICE_RISK: Days of supply below 7 days
        if (inv.dailyDemand && inv.dailyDemand > 0) {
          const daysOfSupply = inv.onHand / inv.dailyDemand;
          if (daysOfSupply < 7 && inv.onHand > 0) {
            detected.push({
              signalId: makeId('SERVICE_RISK', inv.productId),
              tenantId,
              signalType: 'SERVICE_RISK',
              entityType: 'INVENTORY',
              entityId: inv.productId,
              detectedAt: nowIso,
              severity: daysOfSupply < 3 ? 'CRITICAL' : 'HIGH',
              confidence: 0.90,
              confidenceBasis: 'CALCULATED',
              threshold: 7,
              actualValue: Number(daysOfSupply.toFixed(1)),
              expectedValue: 14,
              evidence: [
                `Days of supply calculated at ${daysOfSupply.toFixed(1)} days based on daily demand of ${inv.dailyDemand}.`,
                `Customer service level breach projected if replenishment does not arrive within ${Math.ceil(daysOfSupply)} days.`,
              ],
              status: 'ACTIVE',
              detectionMethod: 'DEVIATION',
            });
          }
        }
      }
    }

    // 3. SUPPLIER_DELAY & 6. PO_CONFIRMATION_DELAY
    if (input.purchaseOrders) {
      for (const po of input.purchaseOrders) {
        // PO Confirmation delay (unconfirmed > 48h from creation)
        if (!po.confirmedAt && po.createdAt && ['Draft', 'Submitted', 'Pending Approval'].includes(po.status)) {
          const hoursSinceCreated = (now.getTime() - new Date(po.createdAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceCreated > 48) {
            detected.push({
              signalId: makeId('PO_CONFIRMATION_DELAY', po.id),
              tenantId,
              signalType: 'PO_CONFIRMATION_DELAY',
              entityType: 'PURCHASE_ORDER',
              entityId: po.id,
              detectedAt: nowIso,
              severity: hoursSinceCreated > 96 ? 'HIGH' : 'MEDIUM',
              confidence: 0.95,
              confidenceBasis: 'DETERMINISTIC',
              threshold: 48,
              actualValue: Math.round(hoursSinceCreated),
              expectedValue: 48,
              evidence: [
                `PO ${po.id} has been pending confirmation for ${Math.round(hoursSinceCreated)} hours (SLA: 48h).`,
                `Supplier confirmation is overdue.`,
              ],
              status: 'ACTIVE',
              detectionMethod: 'DEADLINE_BREACH',
            });
          }
        }

        // Supplier Delivery delay on PO
        if (po.expectedDelivery && !['Received', 'Cancelled'].includes(po.status)) {
          const expectedMs = new Date(po.expectedDelivery).getTime();
          if (now.getTime() > expectedMs) {
            const delayDays = Math.ceil((now.getTime() - expectedMs) / (1000 * 60 * 60 * 24));
            detected.push({
              signalId: makeId('SUPPLIER_DELAY', po.id),
              tenantId,
              signalType: 'SUPPLIER_DELAY',
              entityType: 'PURCHASE_ORDER',
              entityId: po.id,
              detectedAt: nowIso,
              severity: delayDays > 5 ? 'CRITICAL' : 'HIGH',
              confidence: 1.0,
              confidenceBasis: 'DETERMINISTIC',
              threshold: 0,
              actualValue: delayDays,
              expectedValue: 0,
              evidence: [
                `PO ${po.id} promised delivery date was ${po.expectedDelivery}.`,
                `Order is overdue by ${delayDays} calendar days.`,
              ],
              status: 'ACTIVE',
              detectionMethod: 'DEADLINE_BREACH',
            });
          }
        }
      }
    }

    // 4. SHIPMENT_DELAY & 5. ETA_DEVIATION
    if (input.shipments) {
      for (const shp of input.shipments) {
        if (shp.delayDays > 0) {
          detected.push({
            signalId: makeId('SHIPMENT_DELAY', shp.id),
            tenantId,
            signalType: 'SHIPMENT_DELAY',
            entityType: 'SHIPMENT',
            entityId: shp.id,
            detectedAt: nowIso,
            severity: shp.delayDays >= 4 ? 'HIGH' : 'MEDIUM',
            confidence: 0.95,
            confidenceBasis: 'DETERMINISTIC',
            threshold: 0,
            actualValue: shp.delayDays,
            expectedValue: 0,
            evidence: [
              `Shipment ${shp.id} is actively delayed by ${shp.delayDays} days.`,
              `Estimated arrival pushed to ${shp.estimatedArrival}.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'DEVIATION',
          });
        }

        // ETA Deviation
        if (shp.estimatedArrival && shp.status !== 'Delivered') {
          const etaMs = new Date(shp.estimatedArrival).getTime();
          if (now.getTime() > etaMs) {
            const deviationHours = Math.round((now.getTime() - etaMs) / (1000 * 60 * 60));
            detected.push({
              signalId: makeId('ETA_DEVIATION', shp.id),
              tenantId,
              signalType: 'ETA_DEVIATION',
              entityType: 'SHIPMENT',
              entityId: shp.id,
              detectedAt: nowIso,
              severity: deviationHours > 72 ? 'HIGH' : 'MEDIUM',
              confidence: 0.92,
              confidenceBasis: 'CALCULATED',
              threshold: 0,
              actualValue: deviationHours,
              expectedValue: 0,
              evidence: [
                `Carrier transit passed estimated ETA (${shp.estimatedArrival}) by ${deviationHours} hours.`,
              ],
              status: 'ACTIVE',
              detectionMethod: 'DEADLINE_BREACH',
            });
          }
        }
      }
    }

    // 7. QUALITY_DETERIORATION
    if (input.qualityInspections) {
      for (const qi of input.qualityInspections) {
        if (qi.defectRatePercent > 5.0) {
          detected.push({
            signalId: makeId('QUALITY_DETERIORATION', qi.id),
            tenantId,
            signalType: 'QUALITY_DETERIORATION',
            entityType: 'QUALITY_INSPECTION',
            entityId: qi.id,
            detectedAt: nowIso,
            severity: qi.defectRatePercent > 10.0 ? 'CRITICAL' : 'HIGH',
            confidence: 0.98,
            confidenceBasis: 'DETERMINISTIC',
            threshold: 5.0,
            actualValue: qi.defectRatePercent,
            expectedValue: 2.0,
            evidence: [
              `Inspection ${qi.id} recorded defect rate of ${qi.defectRatePercent}% (AQL threshold: 5.0%).`,
              `Batch rejected or quarantined pending MRB review.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'THRESHOLD',
          });
        }
      }
    }

    // 8. DEMAND_SPIKE & 9. DEMAND_DROP
    if (input.demandForecasts) {
      for (const df of input.demandForecasts) {
        if (df.trendPercentage > 20.0) {
          detected.push({
            signalId: makeId('DEMAND_SPIKE', df.productId),
            tenantId,
            signalType: 'DEMAND_SPIKE',
            entityType: 'PRODUCT',
            entityId: df.productId,
            detectedAt: nowIso,
            severity: df.trendPercentage > 40.0 ? 'CRITICAL' : 'HIGH',
            confidence: 0.90,
            confidenceBasis: 'CALCULATED',
            threshold: 20.0,
            actualValue: df.trendPercentage,
            expectedValue: 0,
            evidence: [
              `Demand trend increased by ${df.trendPercentage}% over historical baseline.`,
              `Daily consumption elevated from ${df.historicalAverageDaily} to ${df.forecastedDaily} units.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'TREND',
          });
        } else if (df.trendPercentage < -25.0) {
          detected.push({
            signalId: makeId('DEMAND_DROP', df.productId),
            tenantId,
            signalType: 'DEMAND_DROP',
            entityType: 'PRODUCT',
            entityId: df.productId,
            detectedAt: nowIso,
            severity: 'MEDIUM',
            confidence: 0.88,
            confidenceBasis: 'CALCULATED',
            threshold: -25.0,
            actualValue: df.trendPercentage,
            expectedValue: 0,
            evidence: [
              `Demand contracted by ${Math.abs(df.trendPercentage)}% below baseline.`,
              `Potential excess inventory / holding cost accumulation risk.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'TREND',
          });
        }
      }
    }

    // 10. CAPACITY_SHORTAGE & 13. LEAD_TIME_INCREASE
    if (input.suppliers) {
      for (const sup of input.suppliers) {
        if (sup.averageLeadTimeDays && sup.contractedLeadTimeDays) {
          const leadTimeDelta = sup.averageLeadTimeDays - sup.contractedLeadTimeDays;
          if (leadTimeDelta > 5) {
            detected.push({
              signalId: makeId('LEAD_TIME_INCREASE', sup.id),
              tenantId,
              signalType: 'LEAD_TIME_INCREASE',
              entityType: 'SUPPLIER',
              entityId: sup.id,
              detectedAt: nowIso,
              severity: leadTimeDelta > 14 ? 'HIGH' : 'MEDIUM',
              confidence: 0.92,
              confidenceBasis: 'DETERMINISTIC',
              threshold: sup.contractedLeadTimeDays,
              actualValue: sup.averageLeadTimeDays,
              expectedValue: sup.contractedLeadTimeDays,
              evidence: [
                `Supplier ${sup.name} average lead time expanded to ${sup.averageLeadTimeDays} days (+${leadTimeDelta} days vs contract).`,
              ],
              status: 'ACTIVE',
              detectionMethod: 'DEVIATION',
            });
          }
        }

        // Capacity shortage indicated by collapsed OTIF (< 75%)
        if (sup.otif < 75) {
          detected.push({
            signalId: makeId('CAPACITY_SHORTAGE', sup.id),
            tenantId,
            signalType: 'CAPACITY_SHORTAGE',
            entityType: 'SUPPLIER',
            entityId: sup.id,
            detectedAt: nowIso,
            severity: sup.otif < 60 ? 'CRITICAL' : 'HIGH',
            confidence: 0.89,
            confidenceBasis: 'INFERRED',
            threshold: 75,
            actualValue: sup.otif,
            expectedValue: 95,
            evidence: [
              `Supplier OTIF dropped to ${sup.otif}%, indicating production capacity constraints or labor bottlenecks.`,
            ],
            status: 'ACTIVE',
            detectionMethod: 'PATTERN',
          });
        }
      }
    }

    // 12. COST_SPIKE
    if (input.costIndices) {
      for (const cost of input.costIndices) {
        if (cost.benchmarkCost > 0) {
          const costVariancePct = ((cost.currentCost - cost.benchmarkCost) / cost.benchmarkCost) * 100;
          if (costVariancePct > 15.0) {
            detected.push({
              signalId: makeId('COST_SPIKE', cost.productId),
              tenantId,
              signalType: 'COST_SPIKE',
              entityType: 'PRODUCT',
              entityId: cost.productId,
              detectedAt: nowIso,
              severity: costVariancePct > 30.0 ? 'CRITICAL' : 'HIGH',
              confidence: 0.95,
              confidenceBasis: 'DETERMINISTIC',
              threshold: 15.0,
              actualValue: Number(costVariancePct.toFixed(1)),
              expectedValue: 0,
              evidence: [
                `Purchase unit cost rose to ₹${cost.currentCost} vs benchmark ₹${cost.benchmarkCost} (+${costVariancePct.toFixed(1)}%).`,
                `Margin erosion risk detected.`,
              ],
              status: 'ACTIVE',
              detectionMethod: 'DEVIATION',
            });
          }
        }
      }
    }

    // Cache and persist signals
    for (const sig of detected) {
      this.signals.set(`${sig.tenantId}:${sig.signalId}`, sig);
      try {
        const db = getFirebaseFirestore();
        if (db) {
          await setDoc(doc(db, 'signals', `${sig.tenantId}_${sig.signalId}`), sig);
        }
      } catch (err) {
        // Non-fatal if offline
      }
    }

    return detected;
  }

  public getSignals(tenantId: string): Signal[] {
    const results: Signal[] = [];
    for (const [key, sig] of this.signals.entries()) {
      if (sig.tenantId === tenantId) {
        results.push(sig);
      }
    }
    return results;
  }

  public reset(): void {
    this.signals.clear();
  }
}

export const signalEngine = SignalEngine.getInstance();
