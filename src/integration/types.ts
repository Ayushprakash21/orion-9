/**
 * ORION-9 ENTERPRISE INTEGRATION FABRIC CONTRACTS & TYPES
 * Wave 3.1 Architecture: Integration Fabric Foundation
 */

import { DataClassification, SourceSystemType } from '../types';

export type ConnectorType = 'SAP' | 'ORACLE' | 'EDI' | 'REST' | 'FILE';

export type ConnectorEnvironment = 'SANDBOX' | 'LIVE';

export type ConnectorHealthStatus =
  | 'REGISTERED'
  | 'CONFIGURING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'MAINTENANCE'
  | 'DISABLED'
  | 'UNCONFIGURED'
  | 'AUTH_FAILED';

export interface ConnectorCapabilities {
  supportsInbound: boolean;
  supportsOutbound: boolean;
  supportsRealtime: boolean;
  supportsBatch: boolean;
  specificCapabilities?: string[];
}

export interface ConnectionHealthTelemetry {
  lastSuccessfulRequest?: string;
  lastFailure?: string;
  failureCount: number;
  latencyMs: number;
  recordsProcessed: number;
}

export interface ConnectorRecord {
  connectorId: string;
  tenantId: string;
  type: ConnectorType;
  name: string;
  version: string;
  status: ConnectorHealthStatus;
  environment: ConnectorEnvironment;
  configuration: Record<string, any>; // No plain-text credentials!
  capabilities: ConnectorCapabilities;
  health: ConnectionHealthTelemetry;
  endpointReference: string;
  credentialReference: string; // secret://tenant/<tenantId>/connector/<connectorId>
  lastHealthCheck?: string;
  lastSuccessfulSync?: string;
  lastFailure?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ERPEntitlement {
  id: string;
  customerName: string;
  erpSystem: string;
  erpVersion: string;
  licenseTier: string;
  licensedModules: string[];
  environment: string;
  connectorStatus: string;
  maxTransactionsPerDay: number;
  usedTransactionsToday: number;
  lastHandshake: string;
  expiresAt: string;
}

export type TransformationRuleType =
  | 'DIRECT'
  | 'TRIM'
  | 'UPPERCASE'
  | 'LOWERCASE'
  | 'NUMERIC_PARSE'
  | 'DATE_ISO'
  | 'CURRENCY_CONVERT'
  | 'LOOKUP_MAP'
  | 'CUSTOM_SCRIPT';

export interface FieldMappingContract {
  sourceField: string;
  orionField: string;
  rule: TransformationRuleType;
  required?: boolean;
  defaultValue?: any;
  lookupTable?: Record<string, string>;
  notes?: string;
}

export interface IntegrationContract {
  id: string;
  name: string;
  sourceSystem: SourceSystemType;
  sourceSystemVersion: string;
  entityType: 'Supplier' | 'Product' | 'Inventory' | 'PurchaseOrder' | 'Shipment' | 'ASN' | 'Invoice' | 'CustomerOrder';
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  classification: DataClassification;
  mappings: FieldMappingContract[];
  version: string;
  active: boolean;
  lastUpdated: string;
}

// ── CANONICAL ENTITY CONTRACTS ───────────────────────────────────────────────

export interface CanonicalSupplier {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  contactEmail?: string;
  currency: string;
  rating?: number;
  tenantId: string;
}

export interface CanonicalProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  unitCost: number;
  tenantId: string;
}

export interface CanonicalInventory {
  id: string;
  productId: string;
  warehouseId: string;
  onHand: number;
  allocated: number;
  available: number;
  inTransit: number;
  unitCost: number;
  tenantId: string;
}

export interface CanonicalPurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: string;
  expectedDelivery: string;
  totalValue: number;
  currency: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'In Transit' | 'Received' | 'Cancelled';
  lineItems: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  tenantId: string;
}

export interface CanonicalShipment {
  id: string;
  trackingNumber: string;
  poId?: string;
  carrier: string;
  origin: string;
  destination: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Delayed' | 'Exception';
  shipDate: string;
  expectedArrival: string;
  actualArrival?: string;
  delayDays: number;
  tenantId: string;
}

export interface CanonicalASN {
  id: string;
  asnNumber: string;
  shipmentId: string;
  poNumber: string;
  supplierId: string;
  shippedDate: string;
  expectedDeliveryDate: string;
  itemCount: number;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'RECEIVED' | 'REJECTED';
  tenantId: string;
}

export interface CanonicalInvoice {
  id: string;
  invoiceNumber: string;
  poNumber: string;
  supplierId: string;
  amount: number;
  currency: string;
  taxAmount: number;
  status: 'SUBMITTED' | 'MATCHED' | 'APPROVED' | 'DISPUTED' | 'PAID';
  dueDate: string;
  tenantId: string;
}

export interface CanonicalCustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  fulfillmentStatus: 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED';
  tenantId: string;
}

// ── RETRY & DEAD LETTER QUEUE (DLQ) ──────────────────────────────────────────

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export interface DLQRecord {
  messageId: string;
  tenantId: string;
  connectorId: string;
  entityType: string;
  payloadReference: any;
  errorCode: string;
  errorMessage: string;
  attemptCount: number;
  firstFailedAt: string;
  lastFailedAt: string;
  status: 'UNRESOLVED' | 'RETRIED' | 'DISCARDED' | 'RESOLVED';
}

// ── RECONCILIATION TYPES ─────────────────────────────────────────────────────

export type DiscrepancyType =
  | 'MISSING_IN_ORION'
  | 'MISSING_IN_SOURCE'
  | 'QUANTITY_MISMATCH'
  | 'PRICE_DRIFT'
  | 'STATUS_OUT_OF_SYNC'
  | 'DELIVERY_DATE_DRIFT'
  | 'SCHEMA_DRIFT';

export type ReconciliationStatus =
  | 'MATCHED'
  | 'MISMATCH'
  | 'MISSING_IN_ORION'
  | 'MISSING_IN_SOURCE'
  | 'PENDING_REVIEW'
  | 'RESOLVED'
  | 'OPEN'
  | 'IGNORED';

export interface ReconciliationDiscrepancy {
  id: string;
  tenantId?: string;
  entityType: string;
  entityId: string;
  sourceSystem: SourceSystemType;
  type: DiscrepancyType;
  field?: string;
  orionValue?: any;
  externalValue?: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedResolution: string;
  status: ReconciliationStatus;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReconciliationReport {
  id: string;
  timestamp: string;
  tenantId?: string;
  sourceSystem: SourceSystemType;
  entityType: string;
  recordsChecked: number;
  matchedCount: number;
  discrepancyCount: number;
  discrepancies: ReconciliationDiscrepancy[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  reconciledBy: string;
}

// ── WAVE 3.2 ENTERPRISE CONNECTOR RUNTIME EXTENSIONS ────────────────────────

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerTelemetry {
  state: CircuitBreakerState;
  consecutiveFailures: number;
  lastStateChange: string;
  nextAttemptAllowedAt?: string;
}

export type SyncJobDirection = 'INGRESS' | 'EGRESS';
export type SyncJobMode = 'FULL' | 'INCREMENTAL' | 'EVENT_DRIVEN' | 'MANUAL';
export type SyncJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';

export interface WatermarkCursor {
  lastModifiedAt?: string;
  updatedSince?: string;
  externalSequence?: number;
  pageToken?: string;
  eventOffset?: number;
}

export interface PaginationState {
  pageNumber: number;
  cursor?: string;
  continuationToken?: string;
  offset?: number;
  limit?: number;
  recordsRead: number;
  recordsProcessed: number;
  hasMore: boolean;
}

export interface SyncJobRecord {
  syncJobId: string;
  tenantId: string;
  connectorId: string;
  entityType: string;
  direction: SyncJobDirection;
  mode: SyncJobMode;
  status: SyncJobStatus;
  startedAt: string;
  completedAt?: string;
  recordsRead: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  recordsSkipped: number;
  errorCount: number;
  correlationId: string;
  watermark?: WatermarkCursor;
  pagination?: PaginationState;
  errorMessage?: string;
}

export interface StructuredConnectorError {
  classification: 'RETRYABLE' | 'NON_RETRYABLE';
  code: string;
  message: string;
  httpStatus?: number;
  timestamp: string;
  correlationId: string;
  details?: Record<string, any>;
}

export type SAPCapability =
  | 'SAP_CAPABILITY_SUPPLIER'
  | 'SAP_CAPABILITY_MATERIAL'
  | 'SAP_CAPABILITY_INVENTORY'
  | 'SAP_CAPABILITY_PURCHASE_ORDER'
  | 'SAP_CAPABILITY_ASN'
  | 'SAP_CAPABILITY_GRN'
  | 'SAP_CAPABILITY_INVOICE';

export type OracleCapability =
  | 'ORACLE_CAPABILITY_SUPPLIER'
  | 'ORACLE_CAPABILITY_PRODUCT'
  | 'ORACLE_CAPABILITY_INVENTORY'
  | 'ORACLE_CAPABILITY_PURCHASE_ORDER'
  | 'ORACLE_CAPABILITY_SHIPMENT'
  | 'ORACLE_CAPABILITY_ASN'
  | 'ORACLE_CAPABILITY_RECEIVING'
  | 'ORACLE_CAPABILITY_INVOICE';

export type EDITransactionType = '850' | '855' | '856' | '810' | '820';
export type EDIFormat = 'X12' | 'EDIFACT';

export interface EDIMessageRecord {
  messageId: string;
  tenantId: string;
  format: EDIFormat;
  transactionType: EDITransactionType;
  controlNumber: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  rawPayload: string;
  correlationId: string;
  validationStatus: 'VALID' | 'FAILED_VALIDATION';
  validationErrors?: string[];
  mappingStatus?: 'MAPPED' | 'FAILED_MAPPING';
}

