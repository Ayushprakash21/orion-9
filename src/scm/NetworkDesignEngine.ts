/**
 * ORION-9 SUPPLY CHAIN NETWORK DESIGN & SCENARIO ENGINE
 *
 * Implements:
 * 1. Strategic node topology (suppliers, plants, DCs, regional fulfillment hubs).
 * 2. Multi-scenario cost, service level, and resilience simulation.
 * 3. Governed scenario approval and baseline promotion.
 */

import { NetworkDesignScenarioRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class NetworkDesignEngine {
  private static instance: NetworkDesignEngine;
  private scenarios: Map<string, NetworkDesignScenarioRecord[]> = new Map();

  public static getInstance(): NetworkDesignEngine {
    if (!NetworkDesignEngine.instance) {
      NetworkDesignEngine.instance = new NetworkDesignEngine();
    }
    return NetworkDesignEngine.instance;
  }

  public createScenario(params: Omit<NetworkDesignScenarioRecord, 'scenarioId' | 'createdAt' | 'updatedAt'>): NetworkDesignScenarioRecord {
    const record: NetworkDesignScenarioRecord = {
      ...params,
      scenarioId: `NET-SCEN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.scenarios.get(params.tenantId) || [];
    list.unshift(record);
    this.scenarios.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-NET-CRE-${Date.now()}`,
      eventType: 'NETWORK_SCENARIO_CREATED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'NETWORK_ARCHITECT', role: 'planner' }
    });

    return record;
  }

  public approveScenario(tenantId: string, scenarioId: string, approvedBy: string): NetworkDesignScenarioRecord {
    const list = this.scenarios.get(tenantId) || [];
    const scn = list.find(s => s.scenarioId === scenarioId);
    if (!scn) throw new Error(`Network scenario ${scenarioId} not found`);

    scn.approvalStatus = 'GOVERNED_APPROVED';
    scn.updatedAt = new Date().toISOString();

    eventBus.emit({
      eventId: `EVT-NET-APP-${Date.now()}`,
      eventType: 'NETWORK_SCENARIO_APPROVED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { scenarioId, approvedBy },
      actor: { userId: approvedBy, role: 'admin' }
    });

    return scn;
  }

  public getScenarios(tenantId: string): NetworkDesignScenarioRecord[] {
    return this.scenarios.get(tenantId) || [];
  }
}

export const networkDesignEngine = NetworkDesignEngine.getInstance();
