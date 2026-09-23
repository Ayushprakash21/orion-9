/**
 * ORION-9 SCM CONTROL TOWER — TOPOLOGICAL RISK GRAPH INTEGRATOR
 * Integrates real master data and SCM network entities into SupplyChainRiskGraph
 * and evaluates systemic downstream risk propagation.
 */

import { supplyChainRiskGraph } from '../../intelligence/SupplyChainRiskGraph';
import { RiskNode, RiskEdge } from '../../intelligence/types';
import { ScmPersistenceService } from '../scm/ScmPersistenceService';

export class ControlTowerRiskIntegrator {
  private static instance: ControlTowerRiskIntegrator;
  private persistence: ScmPersistenceService;

  private constructor() {
    this.persistence = ScmPersistenceService.getInstance();
  }

  public static getInstance(): ControlTowerRiskIntegrator {
    if (!ControlTowerRiskIntegrator.instance) {
      ControlTowerRiskIntegrator.instance = new ControlTowerRiskIntegrator();
    }
    return ControlTowerRiskIntegrator.instance;
  }

  /**
   * Synchronize active SCM entities (Suppliers, Warehouses, Hubs) into the Risk Graph.
   */
  public async syncNetworkTopology(tenantId: string): Promise<{
    nodeCount: number;
    edgeCount: number;
  }> {
    const [suppliers, shipments, pos] = await Promise.all([
      this.persistence.listRecords<any>('suppliers', tenantId),
      this.persistence.listRecords<any>('shipments', tenantId),
      this.persistence.listRecords<any>('purchase_orders', tenantId),
    ]);

    let nodeCount = 0;
    let edgeCount = 0;

    // 1. Ingest Supplier Nodes
    for (const s of suppliers) {
      const isHighRisk = s.riskLevel === 'High' || (s.otif && s.otif < 80);
      const baseRiskScore = isHighRisk ? 75 : 20;

      await supplyChainRiskGraph.upsertNode({
        nodeId: `NODE-SUP-${s.id}`,
        tenantId,
        nodeType: 'SUPPLIER',
        name: s.name || `Supplier ${s.id}`,
        baseRiskScore,
        propagatedRiskScore: baseRiskScore,
        status: isHighRisk ? 'DISRUPTED' : 'OPERATIONAL',
        metadata: {
          supplierId: s.id,
          otif: s.otif || 95,
          tier: s.tier || 'TIER_1',
        },
      });
      nodeCount++;
    }

    // 2. Standard Central Hub Nodes
    const centralHubId = `NODE-HUB-${tenantId}`;
    await supplyChainRiskGraph.upsertNode({
      nodeId: centralHubId,
      tenantId,
      nodeType: 'WAREHOUSE',
      name: 'Primary Distribution Center',
      baseRiskScore: 15,
      propagatedRiskScore: 15,
      status: 'OPERATIONAL',
      metadata: {},
    });
    nodeCount++;

    const plantId = `NODE-PLANT-${tenantId}`;
    await supplyChainRiskGraph.upsertNode({
      nodeId: plantId,
      tenantId,
      nodeType: 'MANUFACTURING_PLANT',
      name: 'Central Assembly Plant',
      baseRiskScore: 10,
      propagatedRiskScore: 10,
      status: 'OPERATIONAL',
      metadata: {},
    });
    nodeCount++;

    // 3. Ingest Edges from POs and Shipments
    for (const po of pos) {
      if (po.supplierId) {
        await supplyChainRiskGraph.upsertEdge({
          edgeId: `EDGE-PO-${po.id}`,
          tenantId,
          fromNodeId: `NODE-SUP-${po.supplierId}`,
          toNodeId: centralHubId,
          relationshipType: 'SUPPLIES_TO',
          factor: 0.8,
          weight: 0.9,
        });
        edgeCount++;
      }
    }

    // Hub to Plant edge
    await supplyChainRiskGraph.upsertEdge({
      edgeId: `EDGE-HUB-PLANT-${tenantId}`,
      tenantId,
      fromNodeId: centralHubId,
      toNodeId: plantId,
      relationshipType: 'FEEDS',
      factor: 0.85,
      weight: 0.95,
    });
    edgeCount++;

    return { nodeCount, edgeCount };
  }

  /**
   * Propagate systemic risk across the network and report impacted nodes.
   */
  public async evaluateSystemicRisk(tenantId: string): Promise<{
    nodes: RiskNode[];
    edges: RiskEdge[];
    highRiskNodes: RiskNode[];
  }> {
    // Propagate risk through topological engine
    const { nodes, edges } = await supplyChainRiskGraph.propagateRisk(tenantId);
    const highRiskNodes = nodes.filter((n) => n.propagatedRiskScore >= 50);

    return {
      nodes,
      edges,
      highRiskNodes,
    };
  }

  public reset(): void {
    // Rely on supplyChainRiskGraph.reset()
  }
}

export const controlTowerRiskIntegrator = ControlTowerRiskIntegrator.getInstance();
