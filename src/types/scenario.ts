/**
 * ORION-9 SCENARIO LAB & DIGITAL TWIN STRESS TESTING ENGINE
 * Layer 7 Data Fabric & Layer 4 Kernel Canonical Types
 */

export type ScenarioShockType =
  | 'SUPPLIER_INSOLVENCY'
  | 'PORT_BLOCKADE'
  | 'GEOPOLITICAL_CANAL_CRISIS'
  | 'DEMAND_SURGE'
  | 'CYBER_OUTAGE'
  | 'CLIMATE_EXTREME'
  | 'CUSTOM';

export type ScenarioState =
  | 'DRAFT'
  | 'READY'
  | 'SIMULATING'
  | 'CONVERGED'
  | 'CONTINGENCY_DRAFTED'
  | 'ROUTED_TO_APPROVAL'
  | 'COMMITTED'
  | 'ARCHIVED';

export type DigitalTwinNodeType =
  | 'SUPPLIER'
  | 'PORT'
  | 'PLANT'
  | 'WAREHOUSE'
  | 'CUSTOMER_CLUSTER';

export type DigitalTwinNodeStatus =
  | 'HEALTHY'
  | 'STRESSED'
  | 'SEVERELY_DISRUPTED'
  | 'OFFLINE';

export interface DigitalTwinNode {
  id: string;
  name: string;
  type: DigitalTwinNodeType;
  region: string;
  country: string;
  coordinates: [number, number]; // [lat, lng]
  tier: 1 | 2 | 3 | 4 | 5;
  status: DigitalTwinNodeStatus;
  latencyImpactDays: number;
  capacityRemainingPercent: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  connectedNodeIds: string[];
}

export interface MonteCarloDailyPoint {
  day: number;
  p10StockoutProb: number;
  p50StockoutProb: number;
  p90StockoutProb: number;
  cumulativeRevenueAtRisk: number;
}

export interface MonteCarloProjection {
  simulationIterations: number;
  p10BestCaseDays: number;
  p50ExpectedDays: number;
  p90WorstCaseDays: number;
  stockoutConfidencePercent: number;
  revenueExposureMin: number;
  revenueExposureExpected: number;
  revenueExposureMax: number;
  timelineSeries: MonteCarloDailyPoint[];
}

export type ContingencyStrategyType =
  | 'DUAL_SOURCING_ALLOCATION'
  | 'EXPEDITE_AIR_FREIGHT'
  | 'BUFFER_STOCK_REROUTE'
  | 'DEMAND_SHAPING';

export type ContingencyPlanStatus =
  | 'PROPOSED'
  | 'SUBMITTED_TO_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'REJECTED';

export interface ContingencyPlaybook {
  id: string;
  scenarioId: string;
  title: string;
  strategy: ContingencyStrategyType;
  description: string;
  costToExecute: number;
  revenueProtected: number;
  riskMitigationPercent: number;
  timeToRecoverDays: number;
  requiresExecutiveApproval: boolean;
  steps: string[];
  status: ContingencyPlanStatus;
  sha256Seal?: string;
  dispatchedAt?: string;
  approvedBy?: string;
}

export interface SkuVulnerability {
  sku: string;
  name: string;
  currentOnHand: number;
  dailyBurnRate: number;
  daysOfSupplyRemaining: number;
  projectedStockoutDay: number;
  revenueImpact: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface EnterpriseScenario {
  id: string;
  name: string;
  shockType: ScenarioShockType;
  state: ScenarioState;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';
  description: string;
  targetEpicenter: string;
  epicenterNodeId?: string;
  durationDays: number;
  magnitudePercent: number; // e.g., +40% delay or +50% demand
  affectedNodeIds: string[];
  affectedPoIds: string[];
  affectedShipmentIds: string[];
  affectedSkus: SkuVulnerability[];
  
  // Results
  financialExposure: number;
  networkResilienceScore: number; // 0 - 100
  cascadingFailureNodesCount: number;
  monteCarlo?: MonteCarloProjection;
  playbooks: ContingencyPlaybook[];
  
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  createdBy: string;
  version: number;
}
