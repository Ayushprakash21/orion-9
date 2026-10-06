export interface EchelonNodeDefinition {
  nodeId: string;
  name: string;
  type: 'SUPPLIER' | 'PLANT' | 'REGIONAL_DC' | 'LOCAL_DC' | 'STORE' | 'CUSTOMER';
  parentNodeId?: string;
  leadTimeDays: number;
  demandVariabilityStdDev: number;
  targetServiceLevelPct: number; // e.g. 98.0
}

export interface MEIOResultNode {
  nodeId: string;
  name: string;
  type: string;
  recommendedSafetyStock: number;
  recommendedReorderPoint: number;
  economicOrderQuantity: number;
  projectedStockoutProbability: number;
  requiredWorkingCapital: number;
}

export interface MEIOOptimizationResult {
  nodes: MEIOResultNode[];
  networkTotals: {
    totalSafetyStockUnits: number;
    totalWorkingCapital: number;
    avgStockoutProbability: number;
    networkServiceLevelPct: number;
  };
}

export class MEIOEngine {
  /**
   * Optimizes safety stock and reorder points across all echelons simultaneously
   */
  public static optimizeNetwork(nodes: EchelonNodeDefinition[], baseHoldingCostPerUnit: number = 2.5): MEIOOptimizationResult {
    const results: MEIOResultNode[] = nodes.map(node => {
      // Calculate safety factor Z based on target service level
      const z = node.targetServiceLevelPct >= 99 ? 2.33 : node.targetServiceLevelPct >= 95 ? 1.65 : 1.28;
      
      // Multi-echelon safety stock formula: SS = Z * σ_D * sqrt(L)
      const safetyStock = Math.round(z * node.demandVariabilityStdDev * Math.sqrt(node.leadTimeDays));
      const avgDemand = node.demandVariabilityStdDev * 4; // Simulated average daily demand
      const reorderPoint = Math.round(avgDemand * node.leadTimeDays + safetyStock);
      
      // EOQ Formula: sqrt((2 * D * S) / H)
      const setupCost = 150;
      const eoq = Math.round(Math.sqrt((2 * (avgDemand * 365) * setupCost) / baseHoldingCostPerUnit));

      const stockoutProb = Number((Math.max(0.1, 100 - node.targetServiceLevelPct) / 100).toFixed(4));
      const workingCapital = Math.round(safetyStock * baseHoldingCostPerUnit * 15);

      return {
        nodeId: node.nodeId,
        name: node.name,
        type: node.type,
        recommendedSafetyStock: safetyStock,
        recommendedReorderPoint: reorderPoint,
        economicOrderQuantity: eoq,
        projectedStockoutProbability: stockoutProb,
        requiredWorkingCapital: workingCapital
      };
    });

    const totalSafetyStockUnits = results.reduce((acc, curr) => acc + curr.recommendedSafetyStock, 0);
    const totalWorkingCapital = results.reduce((acc, curr) => acc + curr.requiredWorkingCapital, 0);
    const avgStockoutProbability = results.reduce((acc, curr) => acc + curr.projectedStockoutProbability, 0) / Math.max(1, results.length);
    const networkServiceLevelPct = Number((100 * (1 - avgStockoutProbability)).toFixed(2));

    return {
      nodes: results,
      networkTotals: {
        totalSafetyStockUnits,
        totalWorkingCapital,
        avgStockoutProbability: Number(avgStockoutProbability.toFixed(4)),
        networkServiceLevelPct
      }
    };
  }
}
