/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Twin Risk Propagation Engine
 * 
 * Extends Wave 6 SupplyChainRiskGraph to model multi-tier disruption contagion:
 * Supplier -> Purchase Order -> Shipment -> Warehouse -> Inventory -> Customer Order -> Service Level
 * 
 * Computes direct impact, indirect impact, infection propagation paths, and risk score deltas.
 */

import { TwinEntity, TwinRelationship } from './types';
import { TwinGraphEngine } from './TwinGraphEngine';

export interface RiskPropagationPath {
  sourceEntityId: string;
  sourceEntityType: string;
  targetEntityId: string;
  targetEntityType: string;
  path: string[];
  attenuatedRiskScore: number;
}

export interface RiskPropagationReport {
  tenantId: string;
  directAffectedEntityIds: string[];
  indirectAffectedEntityIds: string[];
  propagationPaths: RiskPropagationPath[];
  averageBaselineRisk: number;
  averageProjectedRisk: number;
  delta: number;
}

export class TwinRiskPropagationEngine {
  private static instance: TwinRiskPropagationEngine;

  public static getInstance(): TwinRiskPropagationEngine {
    if (!TwinRiskPropagationEngine.instance) {
      TwinRiskPropagationEngine.instance = new TwinRiskPropagationEngine();
    }
    return TwinRiskPropagationEngine.instance;
  }

  /**
   * Propagates risk from an origin node downstream through graph relationships
   */
  public propagateRisk(
    graph: TwinGraphEngine,
    startEntityId: string,
    baseRisk: number = 0.9,
    attenuation: number = 0.8
  ): {
    affectedEntities: string[];
    blastRadiusScore: number;
    entityRiskScores: Record<string, number>;
  } {
    const affectedEntities: string[] = [startEntityId];
    const entityRiskScores: Record<string, number> = {
      [startEntityId]: baseRisk
    };

    const queue: Array<{ id: string; risk: number }> = [{ id: startEntityId, risk: baseRisk }];
    const visited = new Set<string>([startEntityId]);

    while (queue.length > 0) {
      const { id, risk } = queue.shift()!;
      const outgoing = graph.getOutgoingEdges('', id);

      for (const edge of outgoing) {
        const targetId = edge.toId || (edge as any).targetId;
        if (!visited.has(targetId)) {
          visited.add(targetId);
          affectedEntities.push(targetId);
          const attenuated = Math.round(risk * attenuation * 100) / 100;
          entityRiskScores[targetId] = attenuated;
          queue.push({ id: targetId, risk: attenuated });
        }
      }
    }

    const blastRadiusScore = Math.round((affectedEntities.length / Math.max(1, graph.listNodes().length)) * 100);

    return {
      affectedEntities,
      blastRadiusScore: Math.max(15, blastRadiusScore),
      entityRiskScores
    };
  }

  /**
   * Propagates risk from initially disrupted entities through graph dependencies
   */
  public static propagateScenarioRisk(
    tenantId: string,
    initialDisruptedIds: string[],
    entities: Record<string, TwinEntity>,
    relationships: TwinRelationship[],
    baseShockScore: number = 85
  ): RiskPropagationReport {
    const directSet = new Set<string>(initialDisruptedIds);
    const indirectSet = new Set<string>();
    const propagationPaths: RiskPropagationPath[] = [];

    // Build forward adjacency map
    const forwardMap = new Map<string, Array<{ toId: string; type: string }>>();
    for (const rel of relationships) {
      if (rel.tenantId === tenantId) {
        const fromId = rel.fromId || (rel as any).sourceId;
        const toId = rel.toId || (rel as any).targetId;
        const list = forwardMap.get(fromId) || [];
        list.push({ toId, type: rel.type });
        forwardMap.set(fromId, list);
      }
    }

    // BFS Queue: [currentId, currentRisk, path]
    const queue: Array<{ id: string; risk: number; path: string[] }> = [];
    for (const initId of initialDisruptedIds) {
      queue.push({ id: initId, risk: baseShockScore, path: [initId] });
    }

    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id) && current.path.length > 1) continue;
      visited.add(current.id);

      const neighbors = forwardMap.get(current.id) || [];
      for (const neighbor of neighbors) {
        if (!current.path.includes(neighbor.toId)) {
          // Attenuate risk by 15% per tier jump
          const attenuated = Math.round(current.risk * 0.85);
          if (attenuated > 10) {
            indirectSet.add(neighbor.toId);
            const sourceEntity = entities[current.id];
            const targetEntity = entities[neighbor.toId];

            propagationPaths.push({
              sourceEntityId: current.id,
              sourceEntityType: sourceEntity?.entityType || 'UNKNOWN',
              targetEntityId: neighbor.toId,
              targetEntityType: targetEntity?.entityType || 'UNKNOWN',
              path: [...current.path, neighbor.toId],
              attenuatedRiskScore: attenuated,
            });

            queue.push({
              id: neighbor.toId,
              risk: attenuated,
              path: [...current.path, neighbor.toId],
            });
          }
        }
      }
    }

    let baseRiskSum = 0;
    let projRiskSum = 0;
    const entityList = Object.values(entities);
    for (const e of entityList) {
      const baseR = e.riskScore || 0;
      baseRiskSum += baseR;
      if (directSet.has(e.entityId)) {
        projRiskSum += Math.max(baseR, baseShockScore);
      } else if (indirectSet.has(e.entityId)) {
        projRiskSum += Math.max(baseR, Math.round(baseShockScore * 0.7));
      } else {
        projRiskSum += baseR;
      }
    }

    const count = entityList.length > 0 ? entityList.length : 1;
    const avgBase = Math.round(baseRiskSum / count);
    const avgProj = Math.round(projRiskSum / count);

    return {
      tenantId,
      directAffectedEntityIds: Array.from(directSet),
      indirectAffectedEntityIds: Array.from(indirectSet),
      propagationPaths,
      averageBaselineRisk: avgBase,
      averageProjectedRisk: avgProj,
      delta: avgProj - avgBase,
    };
  }
}

export const twinRiskPropagationEngine = TwinRiskPropagationEngine.getInstance();
