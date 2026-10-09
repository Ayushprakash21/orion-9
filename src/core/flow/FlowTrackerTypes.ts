/**
 * ORION-9 UNIFIED SUPPLY CHAIN FLOW TRACKER TYPES
 * Comprehensive types for Order-to-Cash (O2C) and Procure-to-Pay (P2P) pipelines,
 * milestone tracking, domain event integration, and operational exception management.
 */

export type FlowPipelineType = 'ORDER_TO_CASH' | 'PROCURE_TO_PAY';

export type FlowStatus = 'IN_PROGRESS' | 'COMPLETED' | 'HELD' | 'EXCEPTION' | 'CANCELLED';

export type FlowStageStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export type FlowExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FlowExceptionType =
  | 'SLA_BREACH'
  | 'DELIVERY_HOLD'
  | 'MATCHING_DISCREPANCY'
  | 'QUANTITY_VARIANCE'
  | 'PRICE_VARIANCE'
  | 'STUCK_MILESTONE';

export interface FlowStageVariance {
  amount?: number;
  quantity?: number;
  delayHours?: number;
  reason?: string;
}

export interface FlowStage {
  id: string;
  name: string;
  label: string;
  status: FlowStageStatus;
  startedAt?: string;
  completedAt?: string;
  actor?: string;
  documentId?: string;
  documentType?: string;
  notes?: string;
  variance?: FlowStageVariance;
}

export interface FlowException {
  id: string;
  stage: string;
  severity: FlowExceptionSeverity;
  type: FlowExceptionType;
  title: string;
  description: string;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface LinkedFlowDocument {
  documentType: string;
  documentId: string;
  reference: string;
  date: string;
  status?: string;
}

export interface FlowSlaTracking {
  targetCompletionDate: string;
  estimatedCompletionDate?: string;
  isBreached: boolean;
  totalDurationHours?: number;
}

export interface FlowTrackingRecord {
  id: string;
  flowId: string;
  tenantId: string;
  flowType: FlowPipelineType;
  entityId: string;
  referenceNumber: string;
  counterpartyName: string;
  currentStage: string;
  status: FlowStatus;
  stages: FlowStage[];
  exceptions: FlowException[];
  sla: FlowSlaTracking;
  linkedDocuments: LinkedFlowDocument[];
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlowFilterCriteria {
  searchTerm?: string;
  flowType?: FlowPipelineType | 'ALL';
  status?: FlowStatus | 'ALL';
  hasExceptions?: boolean;
}
