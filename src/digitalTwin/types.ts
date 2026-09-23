/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Domain Types and Core Contracts
 * 
 * Defines Canonical Digital Twin Entities, Immutable Snapshots, Relationship Graph,
 * Deterministic Scenario Parameters, Multi-Vector Impact Metrics, and Temporal States.
 */

export type TwinStatus =
  | 'INITIALIZING'
  | 'SYNCING'
  | 'READY'
  | 'STALE'
  | 'DEGRADED'
  | 'ERROR';

export type TwinEntityType =
  | 'TENANT'
  | 'ORGANIZATION'
  | 'SUPPLIER'
  | 'SUPPLIER_SITE'
  | 'SUPPLIER_PRODUCT'
  | 'PRODUCT'
  | 'CUSTOMER'
  | 'CUSTOMER_SITE'
  | 'WAREHOUSE'
  | 'STORAGE_LOCATION'
  | 'INVENTORY'
  | 'PURCHASE_REQUISITION'
  | 'RFQ'
  | 'QUOTATION'
  | 'PURCHASE_ORDER'
  | 'ASN'
  | 'SHIPMENT'
  | 'CARRIER'
  | 'GATE_ENTRY'
  | 'RECEIVING'
  | 'RECEIPT'
  | 'GRN'
  | 'QUALITY_INSPECTION'
  | 'PUTAWAY'
  | 'CUSTOMER_ORDER'
  | 'SALES_ORDER'
  | 'INVOICE'
  | 'PAYMENT_HANDOFF'
  | 'DEMAND_PLAN'
  | 'SOP_SCENARIO'
  | 'TRANSPORTATION'
  | 'TRANSPORTATION_PLAN'
  | 'MANUFACTURING'
  | 'MANUFACTURING_SITE'
  | 'CONTRACT'
  | 'RISK'
  | 'EXCEPTION'
  | 'EVENT'
  | 'KPI'
  | 'DECISION'
  | 'WORKFLOW'
  | 'SCENARIO';

export type TwinRelationshipType =
  | 'parent'
  | 'child'
  | 'depends_on'
  | 'supplies'
  | 'ships'
  | 'stores'
  | 'consumes'
  | 'fulfills'
  | 'constrained_by'
  | 'affected_by'
  | 'SUPPLIES'
  | 'DEPENDS_ON'
  | 'SHIPS_TO'
  | 'STORED_AT'
  | 'PART_OF'
  | 'FULFILLS'
  | 'CONSUMES'
  | 'TRANSITS_THROUGH'
  | 'INVOICED_BY'
  | 'PAID_BY'
  | 'INSPECTED_BY'
  | 'ALLOCATED_TO'
  | 'REQUISITIONS'
  | 'AFFECTS';

export type TemporalStateMode =
  | 'CURRENT_STATE'
  | 'HISTORICAL_STATE'
  | 'PROJECTED_STATE'
  | 'SIMULATED_STATE';

export interface DigitalTwin {
  twinId: string;
  tenantId: string;
  name: string;
  version: string;
  stateVersion: number;
  status: TwinStatus;
  lastReconciledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwinEntity {
  entityId?: string;
  id?: string;
  tenantId: string;
  entityType?: TwinEntityType;
  type?: TwinEntityType;
  name: string;
  canonicalName?: string;
  sourceSystem?: string;
  sourceEntityId?: string;
  version?: number | string;
  state?: Record<string, any>;
  properties?: Record<string, any>;
  attributes?: Record<string, any>;
  metrics?: Record<string, any>;
  tags?: string[];
  riskScore?: number;
  healthScore?: number;
  status: string;
  statePlane?: 'CURRENT' | 'HISTORICAL' | 'PROJECTED' | 'SIMULATED' | 'CURRENT_STATE' | 'HISTORICAL_STATE' | 'PROJECTED_STATE' | 'SIMULATED_STATE';
  validFrom?: string;
  validTo?: string;
  lineage?: string[] | { createdAt: string; lastSyncedAt: string; derivationMethod: string } | any;
  relationships?: string[];
  metadata?: Record<string, any>;
  lastUpdated?: string;
  updatedAt?: string;
}

export interface TwinRelationship {
  relationshipId?: string;
  id?: string;
  tenantId: string;
  fromId?: string;
  sourceId?: string;
  fromType?: TwinEntityType;
  toId?: string;
  targetId?: string;
  toType?: TwinEntityType;
  type: TwinRelationshipType;
  weight?: number;
  active?: boolean;
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
  establishedAt?: string;
}

export interface TwinSnapshot {
  snapshotId: string;
  id?: string;
  tenantId: string;
  twinId: string;
  stateVersion: number;
  statePlane?: 'CURRENT' | 'HISTORICAL' | 'PROJECTED' | 'SIMULATED' | 'CURRENT_STATE' | 'HISTORICAL_STATE' | 'PROJECTED_STATE' | 'SIMULATED_STATE';
  createdAt: string;
  createdBy?: string;
  sourceEventIds: string[];
  entityCount: number;
  relationshipCount: number;
  checksum: string;
  status: 'VALID' | 'CORRUPTED';
  entities: Record<string, TwinEntity>;
  relationships: TwinRelationship[];
}

export const ScenarioType = {
  DEMAND_INCREASE: 'DEMAND_INCREASE',
  DEMAND_DECREASE: 'DEMAND_DECREASE',
  SUPPLIER_DELAY: 'SUPPLIER_DELAY',
  SUPPLIER_FAILURE: 'SUPPLIER_FAILURE',
  SHIPMENT_DELAY: 'SHIPMENT_DELAY',
  CAPACITY_REDUCTION: 'CAPACITY_REDUCTION',
  INVENTORY_SHORTAGE: 'INVENTORY_SHORTAGE',
  INVENTORY_STOCKOUT: 'INVENTORY_SHORTAGE',
  LEAD_TIME_CHANGE: 'LEAD_TIME_CHANGE',
  FREIGHT_COST_CHANGE: 'FREIGHT_COST_CHANGE',
  FREIGHT_SURCHARGE: 'FREIGHT_SURCHARGE',
  WAREHOUSE_CAPACITY_CHANGE: 'WAREHOUSE_CAPACITY_CHANGE',
  SUPPLY_DISRUPTION: 'SUPPLY_DISRUPTION',
  CUSTOMER_DEMAND_SHIFT: 'CUSTOMER_DEMAND_SHIFT',
  SUPPLIER_OUTAGE: 'SUPPLIER_OUTAGE',
  SUPPLIER_DISRUPTION: 'SUPPLIER_OUTAGE',
  LOGISTICS_BOTTLENECK: 'PORT_CONGESTION',
  DEMAND_SURGE: 'DEMAND_SURGE',
  PORT_CONGESTION: 'PORT_CONGESTION',
  CARRIER_BANKRUPTCY: 'CARRIER_BANKRUPTCY',
  FACTORY_SHUTDOWN: 'FACTORY_SHUTDOWN',
  INVENTORY_SPOILAGE: 'INVENTORY_SPOILAGE',
  COST_SHOCK: 'COST_SHOCK',
  LEAD_TIME_EXPANSION: 'LEAD_TIME_EXPANSION',
  BORDER_CLOSURE: 'BORDER_CLOSURE',
  CURRENCY_VOLATILITY: 'CURRENCY_VOLATILITY',
  CYBER_INCIDENT: 'CYBER_INCIDENT',
  CUSTOM: 'CUSTOM'
} as const;

export type ScenarioType =
  | 'DEMAND_INCREASE'
  | 'DEMAND_DECREASE'
  | 'SUPPLIER_DELAY'
  | 'SUPPLIER_FAILURE'
  | 'SHIPMENT_DELAY'
  | 'CAPACITY_REDUCTION'
  | 'INVENTORY_SHORTAGE'
  | 'LEAD_TIME_CHANGE'
  | 'FREIGHT_COST_CHANGE'
  | 'FREIGHT_SURCHARGE'
  | 'WAREHOUSE_CAPACITY_CHANGE'
  | 'SUPPLY_DISRUPTION'
  | 'CUSTOMER_DEMAND_SHIFT'
  | 'SUPPLIER_OUTAGE'
  | 'DEMAND_SURGE'
  | 'PORT_CONGESTION'
  | 'CARRIER_BANKRUPTCY'
  | 'FACTORY_SHUTDOWN'
  | 'INVENTORY_SPOILAGE'
  | 'COST_SHOCK'
  | 'LEAD_TIME_EXPANSION'
  | 'BORDER_CLOSURE'
  | 'CURRENCY_VOLATILITY'
  | 'CYBER_INCIDENT'
  | 'CUSTOM'
  | string;

export type ScenarioStatus =
  | 'DRAFT'
  | 'READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type AssumptionSource =
  | 'USER_DEFINED'
  | 'HISTORICAL'
  | 'SYSTEM'
  | 'AI_RECOMMENDED'
  | 'WHAT_IF_PLANNER';

export interface ScenarioAssumption {
  assumptionId?: string;
  id?: string;
  entityId?: string;
  name?: string;
  description?: string;
  parameter?: string;
  parameterName?: string;
  baselineValue?: any;
  assumedValue?: any;
  scenarioValue?: any;
  value?: number | string | boolean;
  unit?: string;
  source: AssumptionSource;
  confidence: number;
  createdAt?: string;
}

export interface ScenarioParameters {
  scenarioType?: ScenarioType;
  severity?: number;
  durationDays?: number;
  affectedEntityIds?: string[];
  demandSurgePercent?: number;
  targetEntityId?: string;
  targetEntityType?: TwinEntityType;
  multiplier?: number;
  deltaDays?: number;
  deltaPercent?: number;
  deltaCost?: number;
  affectedRegions?: string[];
  affectedCategories?: string[];
  customParameters?: Record<string, any>;
  [key: string]: any;
}

export interface ScenarioImpactVector {
  vector:
    | 'INVENTORY'
    | 'SERVICE'
    | 'SUPPLIER'
    | 'TRANSPORTATION'
    | 'WAREHOUSE'
    | 'WORKING_CAPITAL'
    | 'FINANCIAL_EXPOSURE'
    | 'FINANCIAL_EXP'
    | 'CUSTOMER'
    | 'RISK';
  metric: string;
  baseline: number;
  projected: number;
  delta: number;
  unit: string;
  calculationSource: 'RULE_BASED' | 'HISTORICAL_MODEL';
  confidence: number;
}

export interface ScenarioDecisionOption {
  optionId?: string;
  id?: string;
  title: string;
  description?: string;
  recommendedActionType?: string;
  type?: string;
  commandType?: string;
  payload?: Record<string, any>;
  actionPayload?: Record<string, any>;
  costImpact?: number;
  estimatedCost?: number;
  serviceImpact?: number;
  estimatedOTIFGain?: number;
  implementationDays?: number;
  riskReduction?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresGovernanceApproval?: boolean;
  targetAutonomyLevel?: string;
}

export interface SimulationResult {
  scenarioId: string;
  tenantId: string;
  baselineSnapshotId: string;
  simulatedSnapshotId: string;
  assumptions: ScenarioAssumption[];
  affectedEntities: string[];
  affectedRelationships: string[];
  kpiDelta: Record<string, { baseline: number; projected: number; delta: number; unit: string }>;
  riskDelta: { baselineAverage: number; projectedAverage: number; delta: number };
  exceptionDelta: { newExceptionsCount: number; criticalCount: number };
  financialDelta: { estimatedCostDelta: number; revenueAtRisk: number; currency: string };
  serviceDelta: { otifDeltaPercent: number; fillRateDeltaPercent: number };
  operationalDelta: { delayedShipmentsCount: number; stockoutPartsCount: number };
  impactVectors: ScenarioImpactVector[];
  decisionOptions: ScenarioDecisionOption[];
  isDryRun: true;
  mutationsPerformed: 0;
  simulationTimeMs: number;
  timestamp: string;
  simulationMode?: boolean;
}

export interface Scenario {
  scenarioId: string;
  id?: string;
  tenantId: string;
  name: string;
  description: string;
  scenarioType: ScenarioType;
  type?: ScenarioType;
  baseSnapshotId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: ScenarioStatus;
  assumptions: ScenarioAssumption[];
  parameters: ScenarioParameters;
  results?: SimulationResult;
  correlationId: string;
}

export type DiscrepancyType =
  | 'MISSING'
  | 'STALE'
  | 'CONFLICT'
  | 'DUPLICATE'
  | 'ORPHAN'
  | 'VALID';

export interface ReconciliationDiscrepancy {
  discrepancyId: string;
  tenantId: string;
  entityType: TwinEntityType;
  entityId: string;
  type: DiscrepancyType;
  details: string;
  detectedAt: string;
  field?: string;
  twinValue?: any;
  sourceValue?: any;
}

export interface TwinHealth {
  tenantId?: string;
  freshnessMs?: number;
  entityCompleteness?: number; // 0 to 1
  relationshipCompleteness?: number; // 0 to 1
  reconciliationErrors?: number;
  staleRecords?: number;
  orphanRecords?: number;
  conflicts?: number;
  activeAnomaliesCount?: number;
  status: 'HEALTHY' | 'DEGRADED' | 'STALE' | 'ERROR';
  lastCheckedAt?: string;
  lastEvaluatedAt?: string;
  freshnessScore?: number;
  discrepancyRate?: number;
}

export interface ScenarioOutcomeRecord {
  outcomeId: string;
  tenantId: string;
  scenarioId: string;
  workflowReference?: string;
  metric: string;
  projectedValue: number;
  actualValue: number;
  variance: number;
  variancePercent: number;
  evaluatedAt: string;
}
