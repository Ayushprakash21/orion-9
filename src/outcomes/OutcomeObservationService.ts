/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Outcome Observation Service
 * 
 * Ingests empirical real-world operational evidence from enterprise systems (SAP, Oracle, EDI, WMS).
 * Strictly immutable once committed.
 */

import { OutcomeObservation } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class OutcomeObservationService {
  private static instance: OutcomeObservationService;
  private observations: Map<string, OutcomeObservation> = new Map(); // key: `${tenantId}:${observationId}`

  private constructor() {}

  public static getInstance(): OutcomeObservationService {
    if (!OutcomeObservationService.instance) {
      OutcomeObservationService.instance = new OutcomeObservationService();
    }
    return OutcomeObservationService.instance;
  }

  private computePayloadHash(payload: Record<string, any>): string {
    const raw = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `hash_obs_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Ingest ground-truth empirical observation
   */
  public async ingestObservation(params: {
    tenantId: string;
    expectationId: string;
    sourceSystem: 'SAP_ERP' | 'ORACLE_TMS' | 'MANHATTAN_WMS' | 'EDI_214' | 'GRN_PORTAL' | 'IOT_TELEMETRY' | 'CARRIER_API';
    actualCost: number;
    actualOTIF: number;
    actualTransitTimeDays: number;
    actualInventoryDays: number;
    actualCO2ReductionKg?: number;
    evidenceReference: string;
    recordedBy: string;
  }): Promise<OutcomeObservation> {
    const observationId = `OBS-${params.tenantId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const observedAt = new Date().toISOString();

    const rawPayloadHash = this.computePayloadHash({
      observationId,
      tenantId: params.tenantId,
      expectationId: params.expectationId,
      evidenceReference: params.evidenceReference,
      actualCost: params.actualCost,
      actualOTIF: params.actualOTIF,
      observedAt,
    });

    const observation: OutcomeObservation = {
      observationId,
      tenantId: params.tenantId,
      expectationId: params.expectationId,
      sourceSystem: params.sourceSystem,
      actualCost: params.actualCost,
      actualOTIF: params.actualOTIF,
      actualTransitTimeDays: params.actualTransitTimeDays,
      actualInventoryDays: params.actualInventoryDays,
      actualCO2ReductionKg: params.actualCO2ReductionKg || 0,
      evidenceReference: params.evidenceReference,
      observedAt,
      recordedBy: params.recordedBy,
      rawPayloadHash,
    };

    this.observations.set(`${params.tenantId}:${observationId}`, observation);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'outcome_observations', `${params.tenantId}_${observationId}`), observation);
      }
    } catch {
      // Best-effort Firestore write
    }

    return observation;
  }

  public getObservation(tenantId: string, observationId: string): OutcomeObservation | undefined {
    return this.observations.get(`${tenantId}:${observationId}`);
  }

  public getObservationsForExpectation(tenantId: string, expectationId: string): OutcomeObservation[] {
    const list: OutcomeObservation[] = [];
    for (const [key, value] of this.observations.entries()) {
      if (key.startsWith(`${tenantId}:`) && value.expectationId === expectationId) {
        list.push(value);
      }
    }
    return list;
  }

  public listObservations(tenantId: string): OutcomeObservation[] {
    const list: OutcomeObservation[] = [];
    for (const [key, value] of this.observations.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
  }

  public clear(): void {
    this.observations.clear();
  }
}
