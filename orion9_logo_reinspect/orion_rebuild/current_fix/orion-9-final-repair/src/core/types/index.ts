import { 
  Product as LegacyProduct, 
  Supplier as LegacySupplier, 
  Warehouse as LegacyWarehouse, 
  Inventory as LegacyInventory, 
  PurchaseOrder as LegacyPurchaseOrder, 
  Shipment as LegacyShipment, 
  Exception as LegacyException, 
  Event as LegacyEvent, 
  Decision as LegacyDecision 
} from '../../types';
import { UserProfile as LegacyUser, Organization as LegacyOrg } from '../../types/auth';

export type Product = LegacyProduct & { organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Supplier = LegacySupplier & { 
  organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; 
  performanceMetrics?: { onTimeDelivery: number; qualityScore: number; };
};
export type Customer = { id: string; name: string; organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Location = { id: string; name: string; address?: string; organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Warehouse = LegacyWarehouse & { organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Inventory = LegacyInventory & { organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type SalesOrder = { id: string; customerId: string; status?: string; totalAmount?: number; organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type PurchaseOrder = LegacyPurchaseOrder & { organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Shipment = LegacyShipment & { organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Transportation = { id: string; carrier: string; status?: string; organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Contract = { id: string; title: string; supplierId: string; status?: string; organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Document = { id: string; name: string; url: string; organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Exception = LegacyException & { title?: string; detectedAt?: string; source?: string; entityType?: string; impact?: string; organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Risk = { id: string; type: string; severity: string; score: number; entityId: string; entityType: string; organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type KPI = { id: string; name: string; value: number; unit: string; trend?: number; target?: number; organizationId?: string; timestamp?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Forecast = { id: string; entityId: string; entityType: string; period: string; predictedValue: number; confidence?: number; organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Scenario = { id: string; name: string; description?: string; parameters: Record<string, any>; results?: Record<string, any>; organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Decision = LegacyDecision & { organizationId?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type WorkflowStepType = 
  | 'EVALUATE_RISK'
  | 'EVALUATE_INVENTORY'
  | 'CREATE_EXCEPTION'
  | 'CREATE_ACTION'
  | 'REQUIRE_APPROVAL'
  | 'UPDATE_ENTITY'
  | 'CREATE_COMMUNICATION'
  | 'WAIT'
  | 'VERIFY_OUTCOME';

export type WorkflowStep = {
  step: number;
  id?: string;
  name: string;
  type: WorkflowStepType;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  config?: Record<string, any>;
  result?: any;
};

export type Workflow = { 
  id: string; 
  name?: string;
  description?: string;
  trigger: string; 
  conditions: any[]; 
  steps: WorkflowStep[]; 
  status: 'OPEN' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT'; 
  owner?: string; 
  organizationId?: string; 
  createdAt?: string; 
  updatedAt?: string; 
  metadata?: Record<string, any>; 
};
export type Event = LegacyEvent & { type?: string; severity?: string; organizationId?: string; entityType?: string; entityId?: string; payload?: any; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type User = LegacyUser & { organizationId?: string; status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };
export type Organization = LegacyOrg & { status?: string; createdAt?: string; updatedAt?: string; metadata?: Record<string, any>; };

export type Rule = {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  priority: number;
  conditions: any[];
  actions: any[];
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
};
