/**
 * ORION-9 INTEGRATION FABRIC CONTRACTS & RECONCILIATION TYPES
 * Layer 8: Enterprise Integration Contracts, Canonical Mapping, ERP Entitlements,
 * and Bidirectional State Reconciliation.
 */

import { DataClassification, SourceSystemType } from '../types';

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
  id: string; // e.g. CONTRACT-SAP-PO
  name: string;
  sourceSystem: SourceSystemType;
  sourceSystemVersion: string;
  entityType: 'Product' | 'Inventory' | 'Supplier' | 'PurchaseOrder' | 'Shipment';
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  classification: DataClassification;
  mappings: FieldMappingContract[];
  version: string;
  active: boolean;
  lastUpdated: string;
}

export interface ERPEntitlement {
  id: string;
  customerName: string;
  erpSystem: 'SAP S/4HANA' | 'Oracle Fusion SCM' | 'Microsoft Dynamics 365' | 'NetSuite ERP';
  erpVersion: string;
  licenseTier: 'ENTERPRISE' | 'PROFESSIONAL' | 'DEVELOPER';
  licensedModules: string[];
  environment: 'SANDBOX' | 'STAGING' | 'PRODUCTION';
  connectorStatus: 'ACTIVE' | 'WARNING' | 'EXPIRED' | 'PENDING_PROVISIONING';
  maxTransactionsPerDay: number;
  usedTransactionsToday: number;
  lastHandshake: string;
  expiresAt: string;
}

export type DiscrepancyType =
  | 'MISSING_IN_ORION'
  | 'MISSING_IN_ERP'
  | 'QUANTITY_MISMATCH'
  | 'PRICE_DRIFT'
  | 'STATUS_OUT_OF_SYNC'
  | 'DELIVERY_DATE_DRIFT'
  | 'SCHEMA_DRIFT';

export interface ReconciliationDiscrepancy {
  id: string;
  entityType: 'PURCHASE_ORDER' | 'INVENTORY' | 'SHIPMENT' | 'SUPPLIER';
  entityId: string;
  sourceSystem: SourceSystemType;
  type: DiscrepancyType;
  field?: string;
  orionValue?: any;
  externalValue?: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedResolution: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReconciliationReport {
  id: string;
  timestamp: string;
  sourceSystem: SourceSystemType;
  entityType: string;
  recordsChecked: number;
  matchedCount: number;
  discrepancyCount: number;
  discrepancies: ReconciliationDiscrepancy[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  reconciledBy: string;
}
