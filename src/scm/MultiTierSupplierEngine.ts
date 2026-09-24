/**
 * ORION-9 MULTI-TIER SUPPLIER NETWORK ENGINE
 *
 * Models and analyzes Tier 1, Tier 2, and Tier 3 supplier dependency graphs,
 * single-source bottlenecks, critical raw materials, and disruption propagation.
 */

import { MultiTierSupplierNetworkRecord, MultiTierNode } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class MultiTierSupplierEngine {
  private static instance: MultiTierSupplierEngine;
  private networks: Map<string, MultiTierSupplierNetworkRecord[]> = new Map();

  public static getInstance(): MultiTierSupplierEngine {
    if (!MultiTierSupplierEngine.instance) {
      MultiTierSupplierEngine.instance = new MultiTierSupplierEngine();
    }
    return MultiTierSupplierEngine.instance;
  }

  public registerNetwork(network: Omit<MultiTierSupplierNetworkRecord, 'networkId' | 'overallResilienceScore' | 'concentrationRisk' | 'analyzedAt'>): MultiTierSupplierNetworkRecord {
    // Compute resilience & concentration risk based on nodes
    const singleSources = network.nodes.filter(n => n.singleSource).length;
    const avgRisk = network.nodes.reduce((acc, n) => acc + n.disruptionRiskScore, 0) / Math.max(1, network.nodes.length);
    const overallResilienceScore = Math.max(10, Math.round(100 - (avgRisk * 0.6 + singleSources * 10)));
    
    let concentrationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (singleSources >= 3 || overallResilienceScore < 40) concentrationRisk = 'CRITICAL';
    else if (singleSources >= 1 || overallResilienceScore < 65) concentrationRisk = 'HIGH';
    else if (overallResilienceScore < 80) concentrationRisk = 'MEDIUM';

    const record: MultiTierSupplierNetworkRecord = {
      ...network,
      networkId: `MTIER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      overallResilienceScore,
      concentrationRisk,
      analyzedAt: new Date().toISOString()
    };

    const list = this.networks.get(record.tenantId) || [];
    list.push(record);
    this.networks.set(record.tenantId, list);

    eventBus.emit({
      eventId: `EVT-MTIER-${Date.now()}`,
      eventType: 'MULTI_TIER_NETWORK_ANALYZED',
      tenantId: record.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'SYSTEM', role: 'admin' }
    });

    return record;
  }

  public getNetworks(tenantId: string): MultiTierSupplierNetworkRecord[] {
    return this.networks.get(tenantId) || [];
  }
}

export const multiTierSupplierEngine = MultiTierSupplierEngine.getInstance();
