/**
 * ORION-9 MULTI-ECHELON INVENTORY OPTIMIZATION (MEIO) & AUTONOMOUS REPLENISHMENT
 * Canonical types and interfaces for enterprise inventory intelligence.
 */

export type EchelonTier = 
  | 'TIER_1_CENTRAL_PLANT' 
  | 'TIER_2_REGIONAL_DC' 
  | 'TIER_3_LOCAL_SPOKE' 
  | 'TIER_4_FORWARD_BUFFER';

export interface EchelonNode {
  id: string;
  name: string;
  code: string;
  tier: EchelonTier;
  location: string;
  country: string;
  capacityUnits: number;
  currentUtilizationPct: number;
  leadTimeDaysToNextEchelon: number;
  parentEchelonId?: string;
  childEchelonIds: string[];
  isDecouplingPoint: boolean;
}

export type BufferStatus = 
  | 'HEALTHY_GREEN' 
  | 'WARNING_YELLOW' 
  | 'CRITICAL_RED' 
  | 'STOCKOUT_BLACK' 
  | 'OVERSTOCK_BLUE';

export interface SKUBuffer {
  id: string;
  sku: string;
  skuName: string;
  category: string;
  echelonNodeId: string;
  echelonNodeName: string;
  unitCost: number;
  onHandUnits: number;
  committedUnits: number;
  inTransitUnits: number;
  effectiveStock: number; // onHand + inTransit - committed
  targetSlaPct: number;   // e.g. 98.5
  zScore: number;         // e.g. 2.17 for 98.5%
  avgDailyDemand: number; // D
  demandStdDev: number;   // sigma_D
  replenishmentLeadTimeDays: number; // L
  leadTimeStdDevDays: number;        // sigma_LT
  calculatedSafetyStock: number;     // SS = Z * sqrt(L * sigma_D^2 + D^2 * sigma_LT^2)
  reorderPoint: number;              // ROP = (D * L) + SS
  orderUpToLevel: number;            // Max recommended inventory
  bufferStatus: BufferStatus;
  stockoutRiskPct: number;
  holdingCostAnnual: number;
  lastRebalancedAt: string;
  decouplingPoint: boolean;
}

export type ReplenishmentOrderType = 
  | 'PURCHASE_REQUISITION' 
  | 'STOCK_TRANSFER_ORDER' 
  | 'EXPEDITE_ORDER';

export type ReplenishmentOrderStatus = 
  | 'DRAFT_PROPOSED' 
  | 'POLICY_EVALUATED' 
  | 'PENDING_APPROVAL' 
  | 'AUTO_APPROVED' 
  | 'TRANSMITTED_TO_ERP' 
  | 'IN_TRANSIT' 
  | 'FULFILLED' 
  | 'REJECTED';

export interface ReplenishmentOrder {
  id: string;
  orderNumber: string;
  orderType: ReplenishmentOrderType;
  sku: string;
  skuName: string;
  sourceNodeId?: string;
  sourceNodeName?: string;
  destinationNodeId: string;
  destinationNodeName: string;
  requestedUnits: number;
  unitCost: number;
  totalValue: number;
  urgency: 'ROUTINE' | 'ELEVATED' | 'EXPEDITE_CRITICAL';
  status: ReplenishmentOrderStatus;
  suggestedBy: 'AI_AUTOPILOT' | 'MEIO_ENGINE' | 'PLANNER_MANUAL';
  confidencePct: number;
  projectedStockoutDate: string;
  policyClearance: {
    cleared: boolean;
    ruleId?: string;
    requiresApproval: boolean;
    approvalRole?: string;
    reason: string;
  };
  cryptographicSeal: string;
  createdAt: string;
  updatedAt: string;
}

export interface BullwhipMetric {
  nodeId: string;
  nodeName: string;
  demandVariance: number;
  orderVariance: number;
  bullwhipRatio: number; // orderVariance / demandVariance
  dampeningFactor: number;
  evaluationPeriod: string;
  status: 'STABILIZED' | 'DAMPENING' | 'AMPLIFIED';
}
