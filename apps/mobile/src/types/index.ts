/**
 * ORION-9 SCM & MOBILE DATA TYPES
 * Typed contracts for cross-platform enterprise supply chain operations.
 */

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ExceptionRecord {
  id: string;
  date: string;
  type: string;
  severity: SeverityLevel;
  entityId: string;
  description: string;
  estimatedImpact: number;
  status: 'Open' | 'Investigating' | 'Action Required' | 'Resolved' | 'Dismissed';
  owner?: string;
  recommendedAction: string;
}

export type ShipmentStatus =
  | 'Pending'
  | 'Dispatched'
  | 'In Transit'
  | 'Customs Hold'
  | 'Delayed'
  | 'Delivered'
  | 'Exception';

export interface ShipmentRecord {
  id: string;
  poId: string;
  supplierId: string;
  carrier: string;
  origin: string;
  destination: string;
  shipDate: string;
  expectedArrival: string;
  actualArrival: string | null;
  status: ShipmentStatus;
  delayDays: number;
  freightCost: number;
  trackingNumber: string;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  inTransit: number;
  safetyStock: number;
  reorderPoint: number;
  dailyDemand: number;
  averageDailyDemand?: number;
  unitCost: number;
  leadTime: number;
  lastUpdated?: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  category: string;
  region: string;
  country?: string;
  contact?: string;
  otif: number;
  qualityRate: number;
  leadTime: number;
  defectRate: number;
  spend: number;
  openPoValue?: number;
  score?: number;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: string;
}

export type POStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'In Transit'
  | 'Partially Received'
  | 'Received'
  | 'Delayed'
  | 'Cancelled'
  | 'Overdue';

export interface POLineItem {
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
}

export interface PurchaseOrderRecord {
  id: string;
  supplierId: string;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  status: POStatus;
  totalValue: number;
  currency?: string;
  lines: POLineItem[];
  buyer: string;
}

export interface OperationalEvent {
  id: string;
  source: string;
  entityType: string;
  entityId: string;
  eventType: string;
  timestamp: string;
  description: string;
  badgeColor?: string;
}

export interface DashboardMetrics {
  networkHealthIndex: number;
  criticalExceptionsCount: number;
  delayedShipmentsCount: number;
  delayedShipmentsValue: number;
  inventoryRiskCount: number;
  totalInventoryUnits: number;
  totalInventoryValue: number;
  openPOCount: number;
  overduePOCount: number;
  totalSpendCommitment: number;
  averageSupplierOtif: number;
  lastRefreshedAt: string;
  environment: 'DEMO' | 'LIVE';
}

// ---------------------------------------------------------------------------
// AUTHENTICATION TYPES
// ---------------------------------------------------------------------------
export type RoleCode =
  | 'platform_admin'
  | 'organization_admin'
  | 'supply_chain_director'
  | 'inventory_manager'
  | 'procurement_manager'
  | 'logistics_coordinator'
  | 'planner'
  | 'buyer'
  | 'operator'
  | 'viewer'
  | 'user'
  | 'admin';

export interface MobileUserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: RoleCode;
  organizationId: string;
  organizationName?: string;
  tenantId?: string;
  jobTitle?: string;
  department?: string;
  status: 'active' | 'suspended' | 'inactive';
}

export interface MobileAuthSession {
  token: string;
  user: MobileUserProfile;
  environment: 'DEMO' | 'LIVE';
  expiresAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: MobileAuthSession | null;
  error: string | null;
  biometricsEnabled: boolean;
  environment: 'DEMO' | 'LIVE';
}

// ---------------------------------------------------------------------------
// COGNITIVE AI TYPES
// ---------------------------------------------------------------------------
export type GroundingEvidenceTag = 'KNOWN' | 'CALCULATED' | 'INFERRED';

export interface GroundedEvidenceItem {
  tag?: GroundingEvidenceTag;
  citation?: string;
  metric?: string | number;
  source?: string;
  value?: string;
  groundingType?: GroundingEvidenceTag;
}

export interface RecommendedAction {
  id?: string;
  label: string;
  actionType: string;
  targetEntityId?: string;
  entityId?: string;
  entityType?: 'Shipment' | 'Inventory' | 'PurchaseOrder' | 'Supplier' | string;
  estimatedBenefit?: string;
  payload?: Record<string, any>;
}

export interface AIMessage {
  id: string;
  role?: 'user' | 'assistant';
  sender?: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'deterministic';
  status?: 'Connecting...' | 'Querying SCM telemetry...' | 'Evaluating constraints...' | 'Completed' | 'Error';
  error?: string;
  kpis?: Array<{ label: string; value: string | number; change?: string }>;
  evidence?: GroundedEvidenceItem[];
  actions?: RecommendedAction[];
  recommendedAction?: RecommendedAction;
}

export interface CopilotPromptPreset {
  id: string;
  category?: 'Control Tower' | 'Inventory' | 'Logistics' | 'Procurement' | 'Executive' | string;
  prompt: string;
  title?: string;
  icon?: string;
}

// ---------------------------------------------------------------------------
// ALERTS & NOTIFICATIONS
// ---------------------------------------------------------------------------
export interface MobileAlertItem {
  id: string;
  title: string;
  message: string;
  severity: SeverityLevel;
  timestamp: string;
  read: boolean;
  entityType?: string;
  entityId?: string;
  actionRequired?: boolean;
}

export interface UserNotificationPreferences {
  pushEnabled: boolean;
  criticalAlertsOnly: boolean;
  soundEnabled: boolean;
  shipmentDelayAlerts: boolean;
  inventoryStockoutAlerts: boolean;
  overduePoAlerts: boolean;
}
