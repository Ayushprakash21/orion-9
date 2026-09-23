export type UserProfile = {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  role: string;
  avatarUrl?: string | null;
  phone?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationProfile = {
  id: string;
  name: string;
  logoUrl?: string | null;
  industry?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  units?: 'metric' | 'imperial';
  createdAt: string;
  updatedAt: string;
};

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type SourceSystemType =
  | 'SAP'
  | 'ORACLE'
  | 'NETSUITE'
  | 'SHOPIFY'
  | 'MANUAL'
  | 'ORION_INTERNAL'
  | 'EDI'
  | 'SFTP'
  | 'WMS'
  | 'TMS';

export type MasterDataLifecycleState =
  | 'DRAFT'
  | 'VALIDATED'
  | 'DUPLICATE_CHECKED'
  | 'APPROVAL_PENDING'
  | 'ACTIVE'
  | 'RETIRED';

export interface DataLineageRecord {
  entityId: string;
  entityType: string;
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  ingestionJobId?: string;
  transformedAt: string;
  actor: string;
  checksum?: string;
  classification: DataClassification;
}

export type Product = {
  id: string; // SKU
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  unit?: string;
  unitCost?: number;
  sellingPrice?: number;
  leadTime?: number;
  safetyStock?: number;
  reorderPoint?: number;
  minOrderQty?: number;
  supplierId?: string;
  warehouseId?: string;
  status?: string;
  brand?: string;
  countryOfOrigin?: string;
  weight?: number;
  volume?: number;
  abcClass?: string;
  criticality?: string;
  // Layer 7 Data Fabric extensions
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  classification?: DataClassification;
  lifecycleState?: MasterDataLifecycleState;
  lineage?: DataLineageRecord;
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  classification?: DataClassification;
};

export type Inventory = {
  id: string;
  productId: string; // mapped to SKU
  warehouseId: string;
  onHand: number; // current_stock
  reserved: number; // reserved_stock
  inTransit?: number;
  safetyStock: number;
  reorderPoint: number;
  dailyDemand?: number;
  averageDailyDemand: number;
  unitCost: number;
  leadTime: number; // in days
  lastUpdated?: string;
  // Layer 7 Data Fabric extensions
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  classification?: DataClassification;
  lineage?: DataLineageRecord;
};

export type Supplier = {
  id: string; // e.g. SUP-001
  name: string;
  category: string;
  region: string;
  country?: string;
  contact?: string;
  otif: number; // On-time in-full percentage 0-100
  qualityRate: number; // percentage 0-100
  leadTime: number;
  defectRate: number;
  spend: number;
  openPoValue?: number;
  score?: number;
  riskLevel?: string;
  status?: string;
  // Layer 7 Data Fabric extensions
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  classification?: DataClassification;
  lifecycleState?: MasterDataLifecycleState;
  taxId?: string;
  lineage?: DataLineageRecord;
};

export type PurchaseOrder = {
  id: string; // PO-2026-0001
  supplierId: string;
  orderDate: string; // ISO string
  expectedDelivery: string;
  actualDelivery?: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'In Transit' | 'Partially Received' | 'Received' | 'Delayed' | 'Cancelled' | 'Overdue';
  totalValue: number;
  currency?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    receivedQuantity: number;
    unitPrice: number;
  }>;
  buyer: string;
  // Layer 7 Data Fabric extensions
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  classification?: DataClassification;
  lineage?: DataLineageRecord;
};

export type Shipment = {
  id: string;
  poId: string;
  supplierId?: string;
  carrier: string;
  origin: string;
  destination: string; // Warehouse name or ID
  warehouseId?: string;
  shipDate: string;
  expectedArrival: string;
  actualArrival: string | null;
  status: 'Booked' | 'Planned' | 'Picked Up' | 'In Transit' | 'Delayed' | 'Delivered' | 'Exception' | 'Cancelled';
  delayDays: number;
  freightCost: number;
  trackingNumber?: string;
  // Layer 7 Data Fabric extensions
  sourceSystemId?: string;
  sourceSystemType?: SourceSystemType;
  classification?: DataClassification;
  lineage?: DataLineageRecord;
};

export type ExceptionType = 'Stock-Out Risk' | 'Low Stock' | 'Excess Inventory' | 'Supplier Delay' | 'Quality Issue' | 'Supplier Quality' | 'Shipment Delay' | 'Forecast Variance' | 'Demand Spike' | 'Purchase Order Delay' | 'PO Overdue' | 'Lead Time Risk' | 'Data Quality' | 'Cost Variance';
export type ExceptionSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type Exception = {
  id: string;
  date: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  entityId: string; // SKU, PO, or SUP id
  description: string;
  estimatedImpact: number; // in currency value
  status: 'Open' | 'Investigating' | 'Action Required' | 'Resolved' | 'Dismissed';
  owner: string;
  recommendedAction: string;
};

export type ImportHistory = {
  id: string;
  filename: string;
  entityType: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  warnings?: number;
  importedAt: string;
  status: 'Success' | 'Success with warnings' | 'Failed';
};


export type ASN = {
  id: string;
  poId: string;
  supplierId: string;
  shipmentId?: string;
  warehouseId: string;
  expectedArrival: string;
  cartons: number;
  units: number;
  carrier?: string;
  dock?: string;
  status: 'CREATED' | 'CONFIRMED' | 'IN_TRANSIT' | 'ARRIVED' | 'DOCKED' | 'UNLOADING' | 'QC' | 'RECEIVED' | 'PUTAWAY' | 'CANCELLED';
  createdAt: string;
};

export type Event = {
  id: string;
  companyId: string;
  source: string;
  entityType: string;
  entityId: string;
  eventType: string;
  timestamp: string;
  payload: any;
  processed: boolean;
  processingStatus: string;
};

export type DecisionStatus = 'DETECTED' | 'ANALYZING' | 'READY_FOR_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTION_PENDING' | 'EXECUTED' | 'VERIFIED' | 'CLOSED' | 'FAILED';

export type DecisionEvidence = {
  id: string;
  sourceType: string;
  sourceId: string;
  field: string;
  value: any;
  expectedValue?: any;
  unit?: string;
  timestamp: string;
  description: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type DecisionRootCause = {
  primaryCause: string;
  contributingFactors: string[];
  evidence: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
};

export type DecisionImpact = {
  quantityAtRisk?: number;
  projectedStockoutDate?: string;
  daysOfSupply?: number;
  demandExposure?: number;
  inventoryExposure?: number;
  estimatedRevenueExposure?: number;
  estimatedExpediteCost?: number;
  serviceLevelImpact?: string;
  supplierRisk?: string;
  logisticsRisk?: string;
};

export type DecisionSimulation = {
  before: any;
  after: any;
  delta: any;
};

export type DecisionOption = {
  id: string;
  name: string;
  description: string;
  cost: number;
  benefit: string;
  risk: string;
  executionTime: string;
  affectedEntities: string[];
  assumptions: string[];
  simulationResult: DecisionSimulation;
  score: number;
};

export type DecisionRecommendation = {
  recommendedOptionId: string;
  reason: string;
  evidence: string[];
  impact: string;
  alternatives: string[];
  tradeoffs: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  assumptions: string[];
};

export type DecisionApproval = {
  approvedBy: string;
  approvedAt: string;
  decisionId: string;
  selectedOptionId: string;
  comment?: string;
};

export type DecisionAuditEvent = {
  id: string;
  decisionId: string;
  eventType: 'DECISION_CREATED' | 'EVIDENCE_COLLECTED' | 'ROOT_CAUSE_IDENTIFIED' | 'IMPACT_CALCULATED' | 'SIMULATION_RUN' | 'RECOMMENDATION_CREATED' | 'APPROVAL_REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXECUTION_REQUESTED' | 'VERIFIED' | 'CLOSED' | 'FAILED' | 'ACTION_APPROVED' | 'ACTION_EXECUTED' | 'ACTION_CANCELLED' | 'DATA_QUALITY_REPAIR';
  timestamp: string;
  actor: string;
  details: any;
};

export type Decision = {
  id: string;
  createdAt: string;
  updatedAt: string;
  sourceModule: string;
  entityType: string;
  entityId: string;
  title: string;
  issue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: DecisionStatus;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: DecisionEvidence[];
  rootCause: DecisionRootCause;
  impact: DecisionImpact;
  options: DecisionOption[];
  recommendedOptionId: string | null;
  recommendation: DecisionRecommendation | null;
  approval: DecisionApproval | null;
  auditTrail: string[];
};

export type Action = {
  id: string;
  entity: string;
  issue: string; // WHAT
  reason?: string; // WHY
  evidence?: string; // EVIDENCE
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string; // RECOMMENDED ACTION
  impact: string; // IMPACT (formatted currency or description)
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PROPOSED' | 'AWAITING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  approvalRequired: boolean;
  createdAt: string;
};

export type ConnectorStatus = 'NOT CONFIGURED' | 'AVAILABLE' | 'CONNECTED' | 'SYNCING' | 'ERROR';

export type Connector = {
  id: string;
  name: string;
  type: string; // ERP, WMS, TMS, CRM, DB, API, SFTP, EDI
  category: string;
  status: ConnectorStatus;
  lastSync?: string;
  recordsProcessed?: number;
  errorCount?: number;
};

export type SyncJob = {
  id: string;
  source: string;
  connectorId: string;
  startedAt: string;
  finishedAt?: string;
  duration?: string;
  records: number;
  status: 'SUCCESS' | 'RUNNING' | 'WARNING' | 'FAILED';
  errors?: string[];
};

export type OutboundOrder = {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: 'CREATED' | 'ALLOCATED' | 'PICKED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';
  promisedDate: string;
  shipmentId?: string;
  risk: string;
};

// ==========================================
// ORION-9 - OPERATIONAL MODEL EXTENSIONS
// ==========================================

export type Customer = {
  id: string;
  name: string;
  tier: 'Enterprise' | 'Strategic' | 'Standard';
  region: string;
  contactEmail: string;
  slaTargetDays: number;
  historicalFulfillmentRate: number;
  totalOrdersValue: number;
};

export type OrderLine = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  allocatedWarehouseId?: string;
  status: 'Allocated' | 'Unallocated' | 'In Transit' | 'Fulfilled' | 'Backordered';
};

export type CustomerOrder = {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  promisedDate: string;
  status: 'Open' | 'Allocated' | 'In Assembly' | 'Shipped' | 'Delivered' | 'At Risk' | 'Delayed';
  totalValue: number;
  priority: 'Critical' | 'High' | 'Normal';
  lines: OrderLine[];
  linkedShipmentId?: string;
};

export type InventoryLot = {
  id: string;
  productId: string;
  warehouseId: string;
  lotNumber: string;
  quantity: number;
  expirationDate?: string;
  receivedDate: string;
  status: 'Available' | 'Quarantine' | 'Reserved' | 'Expired';
  unitCost: number;
};

export type Carrier = {
  id: string;
  name: string;
  modes: Array<'Ocean' | 'Air' | 'Road' | 'Rail'>;
  onTimeReliability: number; // 0 - 100%
  averageDelayDays: number;
  costPerTonKm: number;
  activeShipmentsCount: number;
  rating: number; // 1-5
  status: 'Active' | 'Restricted' | 'Preferred';
};

export type Route = {
  id: string;
  origin: string;
  destination: string;
  primaryCarrierId: string;
  mode: 'Ocean' | 'Air' | 'Road' | 'Rail';
  standardLeadTimeDays: number;
  currentCongestionLevel: 'Low' | 'Moderate' | 'Severe';
  typicalDelayRisk: number; // percentage
  freightIndexPerTeu: number;
};

export type TransportationPlan = {
  id: string;
  shipmentId: string;
  routeId: string;
  carrierId: string;
  mode: 'Ocean' | 'Air' | 'Road' | 'Rail';
  plannedDeparture: string;
  plannedArrival: string;
  estimatedCost: number;
  consolidationEligible: boolean;
  priorityScore: number;
  status: 'Planned' | 'Dispatched' | 'In Transit' | 'Completed' | 'Delayed';
};

export type WarehouseDetail = {
  id: string;
  name: string;
  location: string;
  totalCapacityPallets: number;
  usedCapacityPallets: number;
  utilizationRate: number; // percentage
  inboundCongestionScore: number; // 0 - 100
  outboundCongestionScore: number; // 0 - 100
  activeDockDoors: number;
  totalDockDoors: number;
  pickingEfficiencyScore: number; // percentage
  laborCapacityPercent: number;
  bottleneckSummary?: string;
};

export type Contract = {
  id: string;
  contractNumber: string;
  title: string;
  supplierId: string;
  supplierName: string;
  startDate: string;
  endDate: string;
  renewalNoticeDays: number;
  annualValue: number;
  status: 'Active' | 'Under Review' | 'Expiring Soon' | 'Expired' | 'Terminated';
  agreedOtifTarget: number;
  maxDefectRateAllowed: number;
  penaltyClauseSummary: string;
  pricingTerms: string;
  riskRating: 'Low' | 'Moderate' | 'High';
  keyObligations: string[];
};

export type DocumentRecord = {
  id: string;
  title: string;
  fileName: string;
  fileType: 'PDF' | 'Excel' | 'CSV' | 'Text';
  fileSizeKb: number;
  category: 'Contract' | 'Purchase Order' | 'Bill of Lading' | 'Quality Certificate' | 'Invoice';
  linkedEntityType: 'Supplier' | 'PurchaseOrder' | 'Shipment' | 'Product' | 'Contract';
  linkedEntityId: string;
  uploadedAt: string;
  uploadedBy: string;
  extractedFields: Record<string, any>;
  summary: string;
  anomalyDetected?: string;
};

export type SupplierCommunication = {
  id: string;
  supplierId: string;
  supplierName: string;
  contactEmail: string;
  subject: string;
  body: string;
  type: 'PO_STATUS' | 'DELAY_NOTICE' | 'QUALITY_ISSUE' | 'EXPEDITE_REQUEST' | 'CONTRACT_RENEWAL' | 'GENERAL';
  status: 'DRAFT' | 'APPROVED' | 'DISPATCHED' | 'ACKNOWLEDGED';
  sentAt?: string;
  sentBy?: string;
  requiresAuthorization: boolean;
  linkedPoId?: string;
};

export type KpiRecord = {
  id: string;
  domain: 'Service' | 'Inventory' | 'Supplier' | 'Procurement' | 'Logistics' | 'Warehouse' | 'Finance';
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  variancePercent: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  driver: string;
  recommendedAction: string;
  historicalValues: { date: string; value: number }[];
};

export type CausalityLevel = 'KNOWN' | 'CALCULATED' | 'INFERRED' | 'UNKNOWN';

export type RootCauseNode = {
  id: string;
  entityType: 'Demand' | 'Inventory' | 'Supplier' | 'PurchaseOrder' | 'Shipment' | 'Warehouse' | 'Transportation' | 'CustomerOrder';
  entityId: string;
  label: string;
  status: 'Normal' | 'Warning' | 'Critical' | 'Unknown';
  causalityLevel: CausalityLevel;
  evidence: string;
  description: string;
  timestamp?: string;
};

export type RootCauseGraph = {
  exceptionId: string;
  primaryCauseNodeId: string;
  nodes: RootCauseNode[];
  edges: { from: string; to: string; relation: string }[];
  summary: string;
  confidenceScore: number; // 0 - 100
};

export type SystemHealthRecord = {
  serviceName: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
  lastChecked: string;
  details: string;
};

// ==========================================
// ORION-9 - PART 4 / TRACK 1: MASTER DATA & DATA QUALITY
// ==========================================

export type MasterDataEntityType =
  | 'SUPPLIER'
  | 'PRODUCT'
  | 'CUSTOMER'
  | 'LOCATION'
  | 'WAREHOUSE'
  | 'STORAGE_LOCATION'
  | 'UOM'
  | 'CURRENCY'
  | 'PAYMENT_TERMS'
  | 'TAX_CLASSIFICATION'
  | 'RELATIONSHIP'
  | 'FACILITY';

export type StewardshipState =
  | 'DRAFT'
  | 'VALIDATION_PENDING'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUPERSEDED'
  | 'RETIRED';

export type ValidationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'BLOCKING';

export interface ValidationResult {
  status: 'VALID' | 'INVALID';
  severity: ValidationSeverity;
  field: string;
  code: string;
  message: string;
  entityType: string;
  entityId: string;
}

export interface DataQualityDimensionScore {
  score: number; // 0 - 100
  weight: number;
  details: string;
  metrics: Record<string, number | string | boolean>;
}

export interface DataQualityScore {
  id: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  overallScore: number; // 0 - 100
  dimensions: {
    completeness: DataQualityDimensionScore;
    validity: DataQualityDimensionScore;
    consistency: DataQualityDimensionScore;
    uniqueness: DataQualityDimensionScore;
    referentialIntegrity: DataQualityDimensionScore;
    freshness: DataQualityDimensionScore;
    provenance: DataQualityDimensionScore;
  };
  calculatedAt: string;
  version: number;
}

export interface SupplierAddress {
  addressId: string;
  type: 'BILLING' | 'SHIPPING' | 'REMITTANCE' | 'HEADQUARTERS' | 'PLANT';
  line1: string;
  line2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

export interface SupplierContact {
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

export interface SupplierMaster {
  id: string;
  tenantId: string;
  supplierCode: string;
  legalName: string;
  displayName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING';
  supplierType: 'DIRECT_MATERIAL' | 'INDIRECT_MATERIAL' | 'LOGISTICS_SERVICE' | 'OEM' | 'DISTRIBUTOR';
  taxIdentifiers: {
    vatNumber?: string;
    ein?: string;
    taxRegNo?: string;
    jurisdiction: string;
  }[];
  country: string;
  addresses: SupplierAddress[];
  contacts: SupplierContact[];
  paymentTerms: string;
  currency: string;
  qualificationStatus: 'QUALIFIED' | 'CONDITIONAL' | 'DISQUALIFIED' | 'PENDING_EVALUATION';
  riskStatus: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lifecycleStatus: StewardshipState;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  sourceSystem: SourceSystemType;
  sourceRecordId?: string;
  lineage?: DataLineageRecord;
}

export interface SupplierSiteMaster {
  supplierSiteId: string;
  supplierId: string;
  tenantId: string;
  siteCode: string;
  siteName: string;
  address: SupplierAddress;
  contact?: SupplierContact;
  operatingStatus: 'OPERATIONAL' | 'STANDBY' | 'DECOMMISSIONED';
  sourceSystem: SourceSystemType;
  sourceRecordId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMaster {
  productId: string;
  tenantId: string;
  productCode: string;
  name: string;
  description: string;
  category: string;
  productGroup: string;
  productType: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOODS' | 'PACKAGING' | 'CONSUMABLE' | 'SERVICE';
  lifecycleStatus: StewardshipState;
  baseUom: string;
  inventoryAttributes: {
    trackingMethod: 'LOT' | 'SERIAL' | 'BATCH' | 'NONE';
    shelfLifeDays?: number;
    safetyStock: number;
    reorderPoint: number;
    abcClassification: 'A' | 'B' | 'C';
  };
  procurementAttributes: {
    standardCost: number;
    currency: string;
    defaultSupplierId?: string;
    minOrderQty: number;
    purchasingLeadTimeDays: number;
  };
  planningAttributes: {
    mrpEnabled: boolean;
    forecastRelevant: boolean;
    planningHorizonDays: number;
  };
  manufacturingAttributes?: {
    bomId?: string;
    routingId?: string;
    standardLaborHours?: number;
  };
  taxClassification?: {
    hsnSacCode?: string;
    taxCategory: string;
    exempt: boolean;
  };
  sourceSystem: SourceSystemType;
  sourceRecordId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  lineage?: DataLineageRecord;
}

export interface CustomerContact {
  contactId: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  isPrimary: boolean;
}

export interface CustomerMaster {
  customerId: string;
  tenantId: string;
  customerCode: string;
  legalName: string;
  displayName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CREDIT_HOLD' | 'PROSPECT';
  customerType: 'ENTERPRISE' | 'STRATEGIC' | 'WHOLESALE' | 'RETAIL' | 'OEM';
  addresses: SupplierAddress[];
  contacts: CustomerContact[];
  paymentTerms: string;
  currency: string;
  lifecycleStatus: StewardshipState;
  sourceSystem: SourceSystemType;
  sourceRecordId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  lineage?: DataLineageRecord;
}

export interface CustomerSiteMaster {
  customerSiteId: string;
  customerId: string;
  tenantId: string;
  siteCode: string;
  address: SupplierAddress;
  contact?: CustomerContact;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface LocationMaster {
  locationId: string;
  tenantId: string;
  locationCode: string;
  name: string;
  type: 'ENTERPRISE' | 'REGION' | 'COUNTRY' | 'STATE' | 'CITY' | 'SITE' | 'WAREHOUSE' | 'STORAGE_LOCATION';
  parentId?: string;
  hierarchyPath: string;
  address?: SupplierAddress;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseMaster {
  warehouseId: string;
  tenantId: string;
  warehouseCode: string;
  name: string;
  locationId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  warehouseType: 'DISTRIBUTION_CENTER' | 'MANUFACTURING_HUB' | 'CROSS_DOCK' | 'BONDED' | 'COLD_STORAGE';
  operatingCalendar?: {
    workingDays: string[];
    shiftsPerDay: number;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocationMaster {
  storageLocationId: string;
  warehouseId: string;
  tenantId: string;
  code: string;
  name: string;
  type: 'RACK' | 'BULK' | 'PICK_FACE' | 'QUARANTINE' | 'STAGING';
  status: 'AVAILABLE' | 'FULL' | 'LOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface UOMConversion {
  toUomCode: string;
  multiplier: number;
}

export interface UOMMaster {
  uomCode: string;
  tenantId: string;
  description: string;
  category: 'MASS' | 'VOLUME' | 'LENGTH' | 'COUNT' | 'TIME' | 'CUSTOM';
  isBaseUnit: boolean;
  conversions: UOMConversion[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyMaster {
  currencyCode: string;
  tenantId: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTermsMaster {
  code: string;
  tenantId: string;
  description: string;
  netDays: number;
  discountDays?: number;
  discountPercentage?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxClassificationMaster {
  taxCode: string;
  tenantId: string;
  jurisdiction: string;
  description: string;
  ratePercent: number;
  taxType: 'VAT' | 'GST' | 'SALES_TAX' | 'EXCISE' | 'EXEMPT';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProductRelationship {
  relationshipId: string;
  tenantId: string;
  supplierId: string;
  productId: string;
  supplierProductCode: string;
  leadTimeDays: number;
  minOrderQty: number;
  pricingReference: number;
  currency: string;
  uom: string;
  qualificationStatus: 'QUALIFIED' | 'PREFERRED' | 'BACKUP' | 'PROBATION';
  validFrom: string;
  validTo: string;
  active: boolean;
  sourceMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProductRelationship {
  relationshipId: string;
  tenantId: string;
  customerId: string;
  productId: string;
  customerProductCode: string;
  contractPrice?: number;
  currency: string;
  uom: string;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SourceRecordReference {
  sourceSystem: SourceSystemType;
  sourceRecordId: string;
  extractedAt: string;
  data: Record<string, any>;
  confidence: number;
}

export interface FieldProvenance {
  field: string;
  chosenSource: SourceSystemType;
  chosenValue: any;
  confidence: number;
  reconciliationRule: 'MOST_RECENT' | 'PRIMARY_SYSTEM' | 'HIGHEST_QUALITY' | 'MANUAL_OVERRIDE';
  conflictingValues?: Array<{ source: SourceSystemType; value: any }>;
}

export interface GoldenRecord<T = any> {
  id: string;
  entityType: MasterDataEntityType;
  canonicalId: string;
  tenantId: string;
  canonicalData: T;
  payload?: T;
  sourceRecords: SourceRecordReference[];
  provenanceMap: Record<string, FieldProvenance>;
  normalizationStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  validationStatus: 'VALID' | 'INVALID' | 'WARNINGS';
  duplicateStatus: 'UNIQUE' | 'POTENTIAL_DUPLICATES_DETECTED' | 'RESOLVED';
  qualityScore: number;
  confidenceScore: number;
  stewardshipStatus: StewardshipState;
  version: number;
  validFrom: string;
  validTo: string;
  lineage: DataLineageRecord;
  createdAt: string;
  updatedAt: string;
  lastReconciledAt: string;
}

export * from './types/settings';
