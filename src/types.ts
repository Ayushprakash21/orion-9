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
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
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

export type Action = {
  id: string;
  entity: string;
  issue: string;
  priority: string;
  recommendation: string;
  impact: string;
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
