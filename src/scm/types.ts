/**
 * ORION-9 WAVE 4 — ENTERPRISE SCM TRANSACTION LIFECYCLE TYPES & CONTRACTS
 */

export type SupplierLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUALIFICATION'
  | 'APPROVED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'INACTIVE';

export type QualificationDimension =
  | 'financial'
  | 'quality'
  | 'delivery'
  | 'capacity'
  | 'compliance'
  | 'certification'
  | 'risk'
  | 'geographic'
  | 'operational';

export type QualificationDecisionStatus = 'PASS' | 'FAIL' | 'CONDITIONAL' | 'PENDING';

export interface DimensionQualification {
  dimension: QualificationDimension;
  status: QualificationDecisionStatus;
  score: number; // 0 - 100
  notes?: string;
  evaluatedAt: string;
  evaluatedBy: string;
}

export interface SupplierRecord {
  supplierId: string;
  tenantId: string;
  legalName: string;
  supplierCode: string;
  taxIdentifier: string;
  addresses: Array<{
    type: 'BILLING' | 'SHIPPING' | 'HQ';
    street: string;
    city: string;
    country: string;
    postalCode: string;
  }>;
  contacts: Array<{
    name: string;
    email: string;
    phone?: string;
    role: string;
  }>;
  categories: string[];
  capabilities: string[];
  paymentTerms: string;
  currency: string;
  incoterms: string;
  bankingReference?: string; // secret://... reference ONLY, no raw bank numbers in client!
  certifications: string[];
  riskClassification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: SupplierLifecycleStatus;
  qualificationStatus: QualificationDecisionStatus;
  dimensions?: DimensionQualification[];
  createdAt: string;
  updatedAt: string;
}

// ── PURCHASE REQUISITION (PR) ────────────────────────────────────────────────

export type PRStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface PRLineItem {
  lineId: string;
  productId: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedUnitCost: number;
  requiredDate: string;
  deliveryLocation: string;
}

export interface PurchaseRequisitionRecord {
  prId: string;
  tenantId: string;
  requesterId: string;
  department: string;
  costCenter: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  items: PRLineItem[];
  totalEstimatedValue: number;
  justification: string;
  budgetReference?: string;
  status: PRStatus;
  approvalId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── SOURCING: RFQ / RFP / QUOTATION / COMPARISON / AWARD ────────────────────

export type SourcingType = 'RFQ' | 'RFP';
export type RFQStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SUPPLIER_INVITED'
  | 'RESPONSES_OPEN'
  | 'RESPONSES_RECEIVED'
  | 'CLOSED'
  | 'EVALUATION'
  | 'AWARDED'
  | 'CANCELLED';

export interface RFQRecord {
  rfqId: string;
  tenantId: string;
  title: string;
  type: SourcingType;
  prId?: string;
  invitedSupplierIds: string[];
  items: PRLineItem[];
  submissionDeadline: string;
  evaluationCriteria: Record<string, number>; // weight breakdown (e.g. price: 0.4, quality: 0.3)
  status: RFQStatus;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface SupplierQuotationRecord {
  quotationId: string;
  tenantId: string;
  rfqId: string;
  supplierId: string;
  items: Array<{
    productId: string;
    unitPrice: number;
    moq: number;
    leadTimeDays: number;
  }>;
  currency: string;
  validUntil: string;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  paymentTerms: string;
  incoterms: string;
  status: QuotationStatus;
  submittedAt: string;
}

export interface BidComparisonRecord {
  comparisonId: string;
  tenantId: string;
  rfqId: string;
  evaluations: Array<{
    supplierId: string;
    quotationId: string;
    totalLandedCost: number;
    leadTimeDays: number;
    qualityScore: number;
    overallScore: number;
    rank: number;
  }>;
  recommendedSupplierId: string;
  recommendedQuotationId: string;
  justification: string;
  evaluatedAt: string;
  evaluatedBy: string;
}

export interface NegotiationRecord {
  negotiationId: string;
  tenantId: string;
  rfqId: string;
  supplierId: string;
  roundNumber: number;
  offerType: 'INITIAL_OFFER' | 'COUNTER_OFFER' | 'FINAL_OFFER';
  offeredUnitPrice: number;
  offeredTerms: string;
  notes: string;
  conductedBy: string;
  timestamp: string;
}

export type AwardStatus = 'PROPOSED' | 'UNDER_APPROVAL' | 'APPROVED' | 'AWARDED' | 'REJECTED';

export interface SupplierAwardRecord {
  awardId: string;
  tenantId: string;
  rfqId: string;
  supplierId: string;
  quotationId: string;
  awardedAmount: number;
  status: AwardStatus;
  approvalId?: string;
  awardedBy: string;
  awardedAt: string;
}

// ── PURCHASE ORDER LIFECYCLE ─────────────────────────────────────────────────

export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'RELEASED'
  | 'ACKNOWLEDGED'
  | 'PARTIALLY_CONFIRMED'
  | 'CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'BLOCKED';

export interface POLineItem {
  lineId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitOfMeasure: string;
  expectedDeliveryDate: string;
}

export interface PurchaseOrderRecord {
  poId: string;
  tenantId: string;
  poNumber: string;
  supplierId: string;
  prId?: string;
  rfqId?: string;
  quotationId?: string;
  items: POLineItem[];
  subtotal: number;
  taxAmount: number;
  freightAmount: number;
  totalAmount: number;
  currency: string;
  paymentTerms: string;
  incoterms: string;
  deliveryLocation: string;
  status: POStatus;
  approvalId?: string;
  releasedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── INBOUND LOGISTICS: ASN, SHIPMENT, GATE ENTRY ─────────────────────────────

export type ASNStatus = 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'ACCEPTED' | 'REJECTED' | 'RECEIVED';

export interface ASNItem {
  productId: string;
  shippedQuantity: number;
  lotNumber?: string;
  serialNumber?: string;
}

export interface ASNRecord {
  asnId: string;
  tenantId: string;
  asnNumber: string;
  poId: string;
  supplierId: string;
  shipmentId?: string;
  shippedDate: string;
  expectedArrivalDate: string;
  carrier: string;
  trackingNumber: string;
  items: ASNItem[];
  status: ASNStatus;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentLifecycleStatus =
  | 'PLANNED'
  | 'BOOKED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'AT_DESTINATION'
  | 'DELIVERED'
  | 'DELAYED'
  | 'CANCELLED'
  | 'LOST'
  | 'DAMAGED';

export interface ShipmentRecord {
  shipmentId: string;
  tenantId: string;
  trackingNumber: string;
  carrier: string;
  origin: string;
  destination: string;
  poId?: string;
  asnId?: string;
  status: ShipmentLifecycleStatus;
  expectedArrival: string;
  actualArrival?: string;
  delayDays: number;
  items: Array<{ productId: string; quantity: number }>;
  createdAt: string;
  updatedAt: string;
}

export type GateEntryStatus = 'EXPECTED' | 'ARRIVED' | 'CHECKED_IN' | 'DOCK_ASSIGNED' | 'RELEASED' | 'REJECTED';

export interface GateEntryRecord {
  gateEntryId: string;
  tenantId: string;
  vehicleNumber: string;
  carrier: string;
  driverName: string;
  shipmentId?: string;
  warehouseId: string;
  dockNumber?: string;
  securityStatus: 'PASSED' | 'FAILED' | 'PENDING';
  status: GateEntryStatus;
  arrivalTime: string;
  releasedTime?: string;
}

// ── RECEIVING, GRN, QUALITY INSPECTION, PUTAWAY ──────────────────────────────

export interface ReceivingRecord {
  receivingId: string;
  tenantId: string;
  poId: string;
  asnId?: string;
  shipmentId?: string;
  warehouseId: string;
  receivedItems: Array<{
    productId: string;
    receivedQuantity: number;
    damagedQuantity: number;
    shortQuantity: number;
  }>;
  receivedBy: string;
  timestamp: string;
}

export type GRNStatus = 'DRAFT' | 'POSTED' | 'REVERSED';

export interface GRNRecord {
  grnId: string;
  tenantId: string;
  grnNumber: string;
  poId: string;
  receivingId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    acceptedQuantity: number;
    unitCost: number;
  }>;
  status: GRNStatus;
  postedAt?: string;
  postedBy?: string;
  createdAt: string;
}

export type QualityStatus = 'PENDING' | 'INSPECTING' | 'PASSED' | 'FAILED' | 'PARTIAL' | 'QUARANTINED' | 'RELEASED';

export interface QualityInspectionRecord {
  inspectionId: string;
  tenantId: string;
  inspectionLot: string;
  grnId: string;
  productId: string;
  quantityInspected: number;
  quantityPassed: number;
  quantityFailed: number;
  decision: QualityStatus;
  inspectorId: string;
  notes?: string;
  inspectedAt: string;
}

export type PutawayStatus = 'PENDING' | 'ALLOCATED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface PutawayRecord {
  putawayId: string;
  tenantId: string;
  grnId: string;
  productId: string;
  quantity: number;
  sourceLocation: string;
  destinationLocation: string;
  status: PutawayStatus;
  operatorId?: string;
  completedAt?: string;
}

// ── INVOICING, MATCHING, PAYMENT HANDOFF ──────────────────────────────────────

export type InvoiceStatus =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'MATCHING'
  | 'APPROVED'
  | 'PAYMENT_HANDOFF'
  | 'REJECTED'
  | 'BLOCKED'
  | 'DISPUTED';

export interface InvoiceLineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceRecord {
  invoiceId: string;
  tenantId: string;
  invoiceNumber: string;
  supplierId: string;
  poId: string;
  grnId?: string;
  amount: number;
  taxAmount: number;
  freightAmount: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
}

export type MatchStatus = 'MATCHED' | 'PARTIAL_MATCH' | 'MISMATCH' | 'BLOCKED' | 'MANUAL_REVIEW';
export type MatchMode = 'TWO_WAY' | 'THREE_WAY';

export interface InvoiceMatchRecord {
  matchId: string;
  tenantId: string;
  invoiceId: string;
  poId: string;
  grnId?: string;
  matchMode: MatchMode;
  status: MatchStatus;
  priceVariance: number;
  quantityVariance: number;
  discrepancies: string[];
  matchedAt: string;
}

export type PaymentHandoffStatus = 'READY_FOR_HANDOFF' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED';

export interface PaymentHandoffRecord {
  handoffId: string;
  tenantId: string;
  invoiceId: string;
  supplierId: string;
  approvedAmount: number;
  currency: string;
  paymentTerms: string;
  dueDate: string;
  matchingId: string;
  status: PaymentHandoffStatus;
  sentAt?: string;
  createdAt: string;
}

// ── SUPPLIER PERFORMANCE ─────────────────────────────────────────────────────

export interface SupplierPerformanceMetrics {
  tenantId: string;
  supplierId: string;
  onTimeDeliveryRate: number; // OTD %
  onTimeInFullRate: number; // OTIF %
  qualityPassRate: number; // Quality %
  fillRate: number; // Fill %
  leadTimeAdherenceDays: number;
  defectRatePPM: number;
  totalOrdersProcessed: number;
  lastCalculatedAt: string;
}

// ── DEMAND PLANNING & S&OP ───────────────────────────────────────────────────

export type DemandPlanStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface DemandPlanItem {
  productId: string;
  forecastPeriod: string; // e.g. "2026-Q4" or "2026-11"
  statisticalForecast: number;
  salesAdjustment: number;
  marketingAdjustment: number;
  consensusDemand: number;
  unitOfMeasure: string;
  confidenceInterval: { lower: number; upper: number };
}

export interface DemandPlanRecord {
  planId: string;
  tenantId: string;
  title: string;
  horizonStart: string;
  horizonEnd: string;
  items: DemandPlanItem[];
  status: DemandPlanStatus;
  approvalId?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type SopScenarioStatus = 'DRAFT' | 'EVALUATING' | 'CONSENSUS_REACHED' | 'COMMITTED';

export interface SopScenarioRecord {
  scenarioId: string;
  tenantId: string;
  name: string;
  type: 'BASELINE' | 'UPSIDE' | 'DOWNSIDE' | 'SUPPLY_CONSTRAINED';
  planId: string;
  demandTotal: number;
  supplyCapacity: number;
  projectedRevenue: number;
  projectedCost: number;
  serviceLevelTarget: number;
  status: SopScenarioStatus;
  assumptions: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── CUSTOMER ORDER & FULFILLMENT ─────────────────────────────────────────────

export type CustomerOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'ALLOCATED'
  | 'PICKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CustomerOrderLineItem {
  lineId: string;
  productId: string;
  quantityOrdered: number;
  quantityAllocated: number;
  quantityFulfilled: number;
  unitPrice: number;
  totalPrice: number;
  warehouseId: string;
}

export interface CustomerOrderRecord {
  orderId: string;
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  items: CustomerOrderLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: string;
  deliveryDateRequested: string;
  status: CustomerOrderStatus;
  allocationDate?: string;
  fulfilledDate?: string;
  shippedDate?: string;
  trackingNumber?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── INVENTORY TRANSACTIONS (IMMUTABLE AUDIT) ──────────────────────────────────

export type InventoryTransactionType =
  | 'GRN_RECEIPT'
  | 'PUTAWAY_TRANSFER'
  | 'ORDER_ALLOCATION'
  | 'ORDER_FULFILLMENT'
  | 'CYCLE_COUNT_ADJUSTMENT'
  | 'RETURN_RESTOCK'
  | 'PRODUCTION_ISSUE'
  | 'PRODUCTION_RECEIPT'
  | 'BIN_TRANSFER'
  | 'SCRAP_WRITEOFF';

export interface InventoryTransactionRecord {
  transactionId: string;
  tenantId: string;
  transactionType: InventoryTransactionType;
  productId: string;
  warehouseId: string;
  quantityDelta: number; // positive for receipt, negative for deduction
  balanceBefore: number;
  balanceAfter: number;
  referenceEntityType: 'GRN' | 'PUTAWAY' | 'CUSTOMER_ORDER' | 'CYCLE_COUNT' | 'TRANSFER' | 'PRODUCTION_ORDER' | 'RMA';
  referenceEntityId: string;
  lotNumber?: string;
  batchNumber?: string;
  actor: string;
  correlationId: string;
  timestamp: string;
}

// ── 9-STATE INVENTORY LEDGER ──────────────────────────────────────────────────

export type InventoryState =
  | 'ON_HAND'
  | 'RESERVED'
  | 'ALLOCATED'
  | 'AVAILABLE'
  | 'BLOCKED'
  | 'QUALITY'
  | 'QUARANTINED'
  | 'IN_TRANSIT'
  | 'PROJECTED';

export interface InventoryBalanceRecord {
  balanceId: string;
  tenantId: string;
  productId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  allocated: number;
  available: number;
  blocked: number;
  quality: number;
  quarantined: number;
  inTransit: number;
  projected: number;
  reorderPoint: number;
  safetyStock: number;
  maxStock: number;
  unitOfMeasure: string;
  lastUpdatedAt: string;
}

// ── MANUFACTURING / MRP / BOM / ROUTING / WORK CENTER ─────────────────────────

export interface BOMComponent {
  componentProductId: string;
  componentName: string;
  quantityPerUnit: number;
  unitOfMeasure: string;
  scrapFactorPercent: number; // e.g. 2% scrap
  isCritical: boolean;
  leadTimeDays: number;
}

export interface BOMRecord {
  bomId: string;
  tenantId: string;
  bomNumber: string;
  finishedProductId: string;
  finishedProductName: string;
  version: number;
  isActive: boolean;
  baseQuantity: number;
  components: BOMComponent[];
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkCenterRecord {
  workCenterId: string;
  tenantId: string;
  code: string;
  name: string;
  warehouseId: string;
  capacityHoursPerDay: number;
  efficiencyPercent: number;
  hourlyLaborRate: number;
  hourlyMachineRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingOperation {
  operationNumber: number; // 10, 20, 30...
  description: string;
  workCenterId: string;
  setupTimeHours: number;
  runTimeHoursPerUnit: number;
  inspectionRequired: boolean;
}

export interface RoutingRecord {
  routingId: string;
  tenantId: string;
  productId: string;
  routingNumber: string;
  version: number;
  operations: RoutingOperation[];
  createdAt: string;
  updatedAt: string;
}

export type ProductionOrderStatus =
  | 'PLANNED'
  | 'RELEASED'
  | 'IN_PROGRESS'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED';

export interface ProductionOrderRecord {
  productionOrderId: string;
  tenantId: string;
  orderNumber: string;
  productId: string;
  bomId: string;
  routingId: string;
  warehouseId: string;
  plannedQuantity: number;
  completedQuantity: number;
  scrappedQuantity: number;
  startDate: string;
  dueDate: string;
  actualStartDate?: string;
  actualCompletedDate?: string;
  status: ProductionOrderStatus;
  assignedWorkCenterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialIssueRecord {
  issueId: string;
  tenantId: string;
  productionOrderId: string;
  componentProductId: string;
  quantityIssued: number;
  warehouseId: string;
  lotNumber?: string;
  issuedBy: string;
  issuedAt: string;
}

export interface OperationConfirmationRecord {
  confirmationId: string;
  tenantId: string;
  productionOrderId: string;
  operationNumber: number;
  workCenterId: string;
  yieldQuantity: number;
  scrapQuantity: number;
  reworkQuantity: number;
  actualLaborHours: number;
  actualMachineHours: number;
  operatorId: string;
  confirmedAt: string;
}

// ── SUPPLY PLANNING & MRP ────────────────────────────────────────────────────

export type PlannedOrderStatus = 'DRAFT' | 'FIRM' | 'CONVERTED' | 'CANCELLED';

export interface PlannedOrderRecord {
  plannedOrderId: string;
  tenantId: string;
  type: 'PLANNED_PO' | 'PLANNED_PRODUCTION';
  productId: string;
  warehouseId: string;
  quantity: number;
  requiredDate: string;
  orderReleaseDate: string;
  status: PlannedOrderStatus;
  sourceDemandReference?: string;
  convertedEntityId?: string; // poId or productionOrderId
  createdAt: string;
}

export interface GrossToNetItem {
  productId: string;
  period: string;
  grossDemand: number;
  onHandStock: number;
  scheduledReceipts: number; // Open POs and Prod Orders
  safetyStock: number;
  netRequirements: number;
  plannedOrderReceipts: number;
  projectedEndingStock: number;
}

export interface SupplyPlanRecord {
  supplyPlanId: string;
  tenantId: string;
  planName: string;
  horizonStart: string;
  horizonEnd: string;
  items: GrossToNetItem[];
  plannedOrders: PlannedOrderRecord[];
  isPublished: boolean;
  publishedAt?: string;
  createdBy: string;
  createdAt: string;
}

// ── RETURNS & REVERSE LOGISTICS ──────────────────────────────────────────────

export type RMAStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'DISPOSITIONED'
  | 'REFUNDED'
  | 'REJECTED'
  | 'CLOSED';

export type ReturnDispositionType =
  | 'RESTOCK'
  | 'REPAIR'
  | 'REFURBISH'
  | 'SCRAP'
  | 'QUARANTINE'
  | 'RETURN_TO_SUPPLIER';

export interface RMARecord {
  rmaId: string;
  tenantId: string;
  rmaNumber: string;
  customerOrderId: string;
  customerId: string;
  productId: string;
  quantityReturned: number;
  returnReason: 'DAMAGED' | 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CANCEL' | 'OTHER';
  notes?: string;
  status: RMAStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ReturnReceiptRecord {
  receiptId: string;
  tenantId: string;
  rmaId: string;
  warehouseId: string;
  quantityReceived: number;
  trackingNumber?: string;
  receivedBy: string;
  receivedAt: string;
}

export interface ReturnInspectionRecord {
  inspectionId: string;
  tenantId: string;
  rmaId: string;
  productId: string;
  inspectedQuantity: number;
  condition: 'MINT' | 'OPEN_BOX' | 'DAMAGED' | 'UNUSABLE';
  inspectorNotes?: string;
  inspectedBy: string;
  inspectedAt: string;
}

export interface ReturnDispositionRecord {
  dispositionId: string;
  tenantId: string;
  rmaId: string;
  disposition: ReturnDispositionType;
  quantity: number;
  destinationWarehouseId?: string;
  supplierId?: string; // For RETURN_TO_SUPPLIER
  actionTaken: string;
  dispositionedBy: string;
  dispositionedAt: string;
}

export interface CustomerCreditRecord {
  creditId: string;
  tenantId: string;
  rmaId: string;
  customerId: string;
  creditAmount: number;
  currency: string;
  status: 'PENDING' | 'ISSUED' | 'APPLIED';
  issuedAt: string;
}

// ── ENTERPRISE CONTRACT LIFECYCLE ────────────────────────────────────────────

export type ContractLifecycleStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'RENEWED'
  | 'TERMINATED';

export interface ContractPricingTier {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  rebatePercent?: number;
}

export interface ContractSLARule {
  metric: 'ON_TIME_DELIVERY' | 'DEFECT_RATE' | 'FILL_RATE';
  targetPercent: number;
  penaltyPerBreachPercent: number;
}

export interface EnterpriseContractRecord {
  contractId: string;
  tenantId: string;
  contractNumber: string;
  title: string;
  supplierId: string;
  supplierName: string;
  effectiveDate: string;
  expirationDate: string;
  renewalTerms?: string;
  totalCommittedValue: number;
  actualSpentValue: number;
  currency: string;
  paymentTerms: string;
  incoterms: string;
  status: ContractLifecycleStatus;
  pricingTiers: Record<string, ContractPricingTier[]>; // productId -> tiers
  slaRules: ContractSLARule[];
  version: number;
  approvalId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── LANDED COST & PPV ────────────────────────────────────────────────────────

export interface LandedCostComponent {
  type: 'PURCHASE' | 'FREIGHT' | 'CUSTOMS_DUTY' | 'INSURANCE' | 'HANDLING' | 'STORAGE' | 'QUALITY';
  amount: number;
  currency: string;
  isEstimated: boolean;
}

export interface LandedCostBreakdownRecord {
  landedCostId: string;
  tenantId: string;
  poId: string;
  productId: string;
  quantity: number;
  components: LandedCostComponent[];
  totalLandedCost: number;
  unitLandedCost: number;
  calculatedAt: string;
}

export interface PPVRecord {
  ppvId: string;
  tenantId: string;
  poId: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  standardUnitCost: number;
  actualUnitCost: number;
  variancePerUnit: number; // actual - standard
  totalPurchasePriceVariance: number;
  currency: string;
  evaluatedAt: string;
}


