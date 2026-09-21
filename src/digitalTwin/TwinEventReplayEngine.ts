/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Twin Event Replay Engine
 * 
 * Reconstructs historical Digital Twin topologies by replaying events from the
 * Wave 6 Event Fabric and Decision Replay ledger.
 * Strictly guarantees ZERO side effects or mutations to current production state.
 */

import { TwinEntity, TwinSnapshot } from './types';
import { TwinGraphEngine } from './TwinGraphEngine';

export interface HistoricalEventRecord {
  eventId: string;
  tenantId?: string;
  entityId: string;
  eventType?: string;
  type?: string;
  payload: Record<string, any>;
  timestamp: string;
}

export class TwinEventReplayEngine {
  private static instance: TwinEventReplayEngine;

  private constructor() {}

  public static getInstance(): TwinEventReplayEngine {
    if (!TwinEventReplayEngine.instance) {
      TwinEventReplayEngine.instance = new TwinEventReplayEngine();
    }
    return TwinEventReplayEngine.instance;
  }

  /**
   * Reconstructs historical twin graph or entity list at a specific target timestamp
   * by replaying events on baseline snapshot or base entities.
   */
  public replayToTimestamp(
    arg1: string | TwinEntity[] | TwinSnapshot,
    arg2: TwinSnapshot | HistoricalEventRecord[] | any,
    arg3: HistoricalEventRecord[] | string | any,
    arg4?: string
  ): any {
    let tenantId = 'DEFAULT_TENANT';
    let baseEntities: TwinEntity[] = [];
    let events: HistoricalEventRecord[] = [];
    let targetTimestamp: string = '';
    let returnArray = false;

    if (typeof arg1 === 'string') {
      tenantId = arg1;
      const baselineSnapshot = arg2 as TwinSnapshot;
      events = arg3 as HistoricalEventRecord[];
      targetTimestamp = arg4 || '';
      if (Array.isArray(baselineSnapshot.entities)) {
        baseEntities = baselineSnapshot.entities;
      } else if (baselineSnapshot.entities) {
        baseEntities = Object.values(baselineSnapshot.entities);
      }
    } else if (Array.isArray(arg1)) {
      returnArray = true;
      baseEntities = arg1;
      events = arg2 as HistoricalEventRecord[];
      targetTimestamp = arg3 as string;
      tenantId = baseEntities[0]?.tenantId || 'DEFAULT_TENANT';
    } else {
      const baselineSnapshot = arg1 as TwinSnapshot;
      events = arg2 as HistoricalEventRecord[];
      targetTimestamp = arg3 as string;
      tenantId = baselineSnapshot.tenantId || 'DEFAULT_TENANT';
      if (Array.isArray(baselineSnapshot.entities)) {
        baseEntities = baselineSnapshot.entities;
      } else if (baselineSnapshot.entities) {
        baseEntities = Object.values(baselineSnapshot.entities);
      }
    }

    const replayGraph = new TwinGraphEngine(tenantId);
    for (const node of baseEntities) {
      replayGraph.addNode(JSON.parse(JSON.stringify(node)));
    }

    const targetTimeMs = new Date(targetTimestamp).getTime();

    const eligibleEvents = events
      .filter(e => (!e.tenantId || e.tenantId === tenantId) && new Date(e.timestamp).getTime() <= targetTimeMs)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const event of eligibleEvents) {
      const existingNode = replayGraph.getNode(tenantId, event.entityId);
      if (existingNode) {
        const payload = event.payload || {};
        const attrs = existingNode.attributes || existingNode.state || {};
        if (payload.delta !== undefined && typeof attrs.onHand === 'number') {
          attrs.onHand += payload.delta;
        }
        for (const [k, v] of Object.entries(payload)) {
          if (k !== 'delta') {
            attrs[k] = v;
          }
        }
        existingNode.attributes = attrs;
        existingNode.state = attrs;
        existingNode.properties = attrs;
        if (payload.status) existingNode.status = payload.status;
        if (payload.riskScore !== undefined) existingNode.riskScore = payload.riskScore;
        existingNode.updatedAt = event.timestamp;
        replayGraph.addNode(existingNode);
      }
    }

    if (returnArray) {
      return replayGraph.listNodes(tenantId);
    }
    return replayGraph;
  }
}

export const twinEventReplayEngine = TwinEventReplayEngine.getInstance();
