/**
 * ORION-9 SCM CANONICAL ENTITY REGISTRY & DATA CONTRACTS
 * Layer 7 / Wave 4-5 Authority Foundation
 *
 * Defines canonical entity contracts, deterministic keys, foreign-key referential dependencies,
 * lifecycle state machines, tenant/environment scoping rules, and immutable audit classifications
 * across all 31 core SCM entities.
 */

export type ScmDomainCategory =
  | 'IDENTITY_TENANCY'
  | 'MASTER_DATA'
  | 'PROCUREMENT'
  | 'SOURCING'
  | 'MANUFACTURING'
  | 'INVENTORY_WAREHOUSING'
  | 'LOGISTICS_TRANSPORT'
  | 'CUSTOMER_ORDERS_FULFILLMENT'
  | 'FINANCE_SETTLEMENT';

export type ScmLifecycleState =
  | 'Draft'
  | 'Pending Review'
  | 'Approved'
  | 'Active'
  | 'Inactive'
  | 'Archived'
  // Domain-specific state aliases for strict compatibility
  | 'SUBMITTED'
  | 'QUALIFICATION'
  | 'REJECTED'
  | 'RELEASED'
  | 'CONFIRMED'
  | 'RECEIVED'
  | 'POSTED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export interface CanonicalFieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  description: string;
  isForeignKey?: boolean;
  foreignEntity?: string;
  foreignField?: string;
}

export interface ScmCanonicalEntityDefinition {
  entityName: string;
  domain: ScmDomainCategory;
  collectionPath: string;
  primaryKey: string;
  tenantField: string;
  environmentScoped: boolean;
  isImmutable: boolean;
  description: string;
  lifecycleStates: ScmLifecycleState[];
  allowedTransitions: Record<string, string[]>;
  dependencies: Array<{
    entity: string;
    field: string;
    foreignField: string;
    required: boolean;
    activeOnly?: boolean;
  }>;
  fields: CanonicalFieldDefinition[];
}

export const SCM_CANONICAL_ENTITIES: Record<string, ScmCanonicalEntityDefinition> = {
  // 1. Tenant
  Tenant: {
    entityName: 'Tenant',
    domain: 'IDENTITY_TENANCY',
    collectionPath: 'organizations',
    primaryKey: 'id',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Top-level enterprise tenant boundary.',
    lifecycleStates: ['Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [],
    fields: [
      { name: 'id', type: 'string', required: true, description: 'Tenant unique identifier' },
      { name: 'name', type: 'string', required: true, description: 'Tenant corporate legal name' },
      { name: 'status', type: 'string', required: true, description: 'Tenant lifecycle status' },
    ],
  },

  // 2. Organization
  Organization: {
    entityName: 'Organization',
    domain: 'IDENTITY_TENANCY',
    collectionPath: 'organizations',
    primaryKey: 'id',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Operating corporate entity or legal division within tenant.',
    lifecycleStates: ['Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'id', type: 'string', required: true, description: 'Organization unique identifier' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Organization name' },
    ],
  },

  // 3. User
  User: {
    entityName: 'User',
    domain: 'IDENTITY_TENANCY',
    collectionPath: 'users',
    primaryKey: 'id',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Enterprise operator, manager, or system principal.',
    lifecycleStates: ['Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'id', type: 'string', required: true, description: 'Firebase Auth UID or principal ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant identifier', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'email', type: 'string', required: true, description: 'User work email' },
      { name: 'role', type: 'string', required: true, description: 'RBAC role' },
    ],
  },

  // 4. Supplier
  Supplier: {
    entityName: 'Supplier',
    domain: 'PROCUREMENT',
    collectionPath: 'suppliers',
    primaryKey: 'supplierId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Qualified vendor, manufacturer, or logistics supplier.',
    lifecycleStates: ['Draft', 'Pending Review', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Pending Review', 'Approved', 'Archived'],
      'Pending Review': ['Approved', 'Draft', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'supplierId', type: 'string', required: true, description: 'Deterministic Supplier ID (e.g. SUP-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'legalName', type: 'string', required: true, description: 'Supplier registered legal name' },
      { name: 'supplierCode', type: 'string', required: true, description: 'ERP supplier code' },
      { name: 'status', type: 'string', required: true, description: 'Lifecycle status' },
    ],
  },

  // 5. Customer
  Customer: {
    entityName: 'Customer',
    domain: 'CUSTOMER_ORDERS_FULFILLMENT',
    collectionPath: 'customers',
    primaryKey: 'customerId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Commercial client, buyer, or B2B distributor.',
    lifecycleStates: ['Draft', 'Pending Review', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Pending Review', 'Approved', 'Archived'],
      'Pending Review': ['Approved', 'Draft', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'customerId', type: 'string', required: true, description: 'Deterministic Customer ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'legalName', type: 'string', required: true, description: 'Customer legal name' },
      { name: 'status', type: 'string', required: true, description: 'Lifecycle status' },
    ],
  },

  // 6. Product
  Product: {
    entityName: 'Product',
    domain: 'MASTER_DATA',
    collectionPath: 'products',
    primaryKey: 'productId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Finished good, component, assembly, or SKU.',
    lifecycleStates: ['Draft', 'Pending Review', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Pending Review', 'Approved', 'Archived'],
      'Pending Review': ['Approved', 'Draft', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'productId', type: 'string', required: true, description: 'Deterministic Product SKU/ID (e.g. PRD-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Product name' },
      { name: 'category', type: 'string', required: true, description: 'Product family category' },
      { name: 'unitOfMeasure', type: 'string', required: true, description: 'Base UOM' },
    ],
  },

  // 7. Material
  Material: {
    entityName: 'Material',
    domain: 'MANUFACTURING',
    collectionPath: 'materials',
    primaryKey: 'materialId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Raw material, sub-assembly, or bulk commodity input.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'materialId', type: 'string', required: true, description: 'Deterministic Material ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Material name' },
    ],
  },

  // 8. Warehouse
  Warehouse: {
    entityName: 'Warehouse',
    domain: 'INVENTORY_WAREHOUSING',
    collectionPath: 'warehouses',
    primaryKey: 'warehouseId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Physical distribution center, storage facility, or hub.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'warehouseId', type: 'string', required: true, description: 'Deterministic Warehouse ID (e.g. WH-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Warehouse name' },
      { name: 'location', type: 'string', required: true, description: 'Geographic facility location' },
    ],
  },

  // 9. Plant
  Plant: {
    entityName: 'Plant',
    domain: 'MANUFACTURING',
    collectionPath: 'plants',
    primaryKey: 'plantId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Manufacturing factory or production plant facility.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'plantId', type: 'string', required: true, description: 'Deterministic Plant ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Plant name' },
    ],
  },

  // 10. Location
  Location: {
    entityName: 'Location',
    domain: 'MASTER_DATA',
    collectionPath: 'locations',
    primaryKey: 'locationId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Specific bin, aisle, rack, or logistics node.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'locationId', type: 'string', required: true, description: 'Deterministic Location ID (e.g. LOC-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Location code/name' },
    ],
  },

  // 11. Inventory
  Inventory: {
    entityName: 'Inventory',
    domain: 'INVENTORY_WAREHOUSING',
    collectionPath: 'inventory',
    primaryKey: 'id',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Current aggregate inventory balance at a warehouse/product grain.',
    lifecycleStates: ['Active', 'Inactive'],
    allowedTransitions: {
      Active: ['Inactive'],
      Inactive: ['Active'],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'id', type: 'string', required: true, description: 'Composite key e.g. INV-{warehouseId}-{productId}' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'productId', type: 'string', required: true, description: 'Product ID', isForeignKey: true, foreignEntity: 'Product' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Warehouse ID', isForeignKey: true, foreignEntity: 'Warehouse' },
      { name: 'onHand', type: 'number', required: true, description: 'Available stock on-hand' },
    ],
  },

  // 12. PurchaseRequisition
  PurchaseRequisition: {
    entityName: 'PurchaseRequisition',
    domain: 'PROCUREMENT',
    collectionPath: 'purchase_requisitions',
    primaryKey: 'prId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Internal demand request for procuring items or services.',
    lifecycleStates: ['Draft', 'Pending Review', 'Approved', 'SUBMITTED', 'REJECTED', 'CLOSED'],
    allowedTransitions: {
      Draft: ['Pending Review', 'SUBMITTED', 'REJECTED', 'CLOSED'],
      'Pending Review': ['Approved', 'REJECTED', 'Draft'],
      SUBMITTED: ['Approved', 'REJECTED', 'Draft'],
      Approved: ['CLOSED'],
      REJECTED: ['Draft'],
      CLOSED: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'prId', type: 'string', required: true, description: 'Purchase requisition ID (e.g. PR-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'requesterId', type: 'string', required: true, description: 'Requester user ID' },
      { name: 'status', type: 'string', required: true, description: 'PR status' },
    ],
  },

  // 13. RFQ
  RFQ: {
    entityName: 'RFQ',
    domain: 'SOURCING',
    collectionPath: 'rfqs',
    primaryKey: 'rfqId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Request for Quotation sent to suppliers.',
    lifecycleStates: ['Draft', 'Active', 'CLOSED', 'CANCELLED'],
    allowedTransitions: {
      Draft: ['Active', 'CANCELLED'],
      Active: ['CLOSED', 'CANCELLED'],
      CLOSED: [],
      CANCELLED: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'rfqId', type: 'string', required: true, description: 'RFQ ID (e.g. RFQ-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'title', type: 'string', required: true, description: 'RFQ title' },
    ],
  },

  // 14. SupplierQuote
  SupplierQuote: {
    entityName: 'SupplierQuote',
    domain: 'SOURCING',
    collectionPath: 'quotations',
    primaryKey: 'quotationId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Supplier commercial bid quotation in response to an RFQ.',
    lifecycleStates: ['Draft', 'SUBMITTED', 'Approved', 'REJECTED'],
    allowedTransitions: {
      Draft: ['SUBMITTED', 'REJECTED'],
      SUBMITTED: ['Approved', 'REJECTED'],
      Approved: [],
      REJECTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'RFQ', field: 'rfqId', foreignField: 'rfqId', required: true },
      { entity: 'Supplier', field: 'supplierId', foreignField: 'supplierId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'quotationId', type: 'string', required: true, description: 'Quote unique ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'rfqId', type: 'string', required: true, description: 'Associated RFQ', isForeignKey: true, foreignEntity: 'RFQ' },
      { name: 'supplierId', type: 'string', required: true, description: 'Bidding Supplier', isForeignKey: true, foreignEntity: 'Supplier' },
    ],
  },

  // 15. PurchaseOrder
  PurchaseOrder: {
    entityName: 'PurchaseOrder',
    domain: 'PROCUREMENT',
    collectionPath: 'purchase_orders',
    primaryKey: 'poId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Authoritative commercial procurement contract issued to a supplier.',
    lifecycleStates: ['Draft', 'Pending Review', 'Approved', 'RELEASED', 'CONFIRMED', 'RECEIVED', 'CLOSED', 'CANCELLED'],
    allowedTransitions: {
      Draft: ['Pending Review', 'Approved', 'CANCELLED'],
      'Pending Review': ['Approved', 'Draft', 'CANCELLED'],
      Approved: ['RELEASED', 'CANCELLED'],
      RELEASED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['RECEIVED', 'CANCELLED'],
      RECEIVED: ['CLOSED'],
      CLOSED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Supplier', field: 'supplierId', foreignField: 'supplierId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'poId', type: 'string', required: true, description: 'Purchase Order ID (e.g. PO-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'supplierId', type: 'string', required: true, description: 'Target supplier', isForeignKey: true, foreignEntity: 'Supplier' },
      { name: 'status', type: 'string', required: true, description: 'PO lifecycle status' },
      { name: 'totalAmount', type: 'number', required: true, description: 'Total purchase order monetary value' },
    ],
  },

  // 16. PurchaseOrderLine
  PurchaseOrderLine: {
    entityName: 'PurchaseOrderLine',
    domain: 'PROCUREMENT',
    collectionPath: 'po_lines',
    primaryKey: 'lineId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Line item on a purchase order specifying product, quantity, and unit price.',
    lifecycleStates: ['Active', 'CLOSED', 'CANCELLED'],
    allowedTransitions: {
      Active: ['CLOSED', 'CANCELLED'],
      CLOSED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'PurchaseOrder', field: 'poId', foreignField: 'poId', required: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'lineId', type: 'string', required: true, description: 'Line item unique ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'poId', type: 'string', required: true, description: 'Parent PO ID', isForeignKey: true, foreignEntity: 'PurchaseOrder' },
      { name: 'productId', type: 'string', required: true, description: 'Target Product', isForeignKey: true, foreignEntity: 'Product' },
      { name: 'quantity', type: 'number', required: true, description: 'Ordered quantity' },
      { name: 'unitPrice', type: 'number', required: true, description: 'Price per unit' },
    ],
  },

  // 17. SupplierConfirmation
  SupplierConfirmation: {
    entityName: 'SupplierConfirmation',
    domain: 'PROCUREMENT',
    collectionPath: 'supplier_confirmations',
    primaryKey: 'id',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: true,
    description: 'Supplier formal acknowledgement of a Purchase Order.',
    lifecycleStates: ['CONFIRMED', 'REJECTED'],
    allowedTransitions: {
      CONFIRMED: [],
      REJECTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'PurchaseOrder', field: 'poId', foreignField: 'poId', required: true },
    ],
    fields: [
      { name: 'id', type: 'string', required: true, description: 'Confirmation unique ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'poId', type: 'string', required: true, description: 'Confirmed PO', isForeignKey: true, foreignEntity: 'PurchaseOrder' },
    ],
  },

  // 18. BOM
  BOM: {
    entityName: 'BOM',
    domain: 'MANUFACTURING',
    collectionPath: 'boms',
    primaryKey: 'bomId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Bill of Materials defining component structure for finished products.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Product', field: 'finishedProductId', foreignField: 'productId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'bomId', type: 'string', required: true, description: 'BOM ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'finishedProductId', type: 'string', required: true, description: 'Finished Product', isForeignKey: true, foreignEntity: 'Product' },
    ],
  },

  // 19. Routing
  Routing: {
    entityName: 'Routing',
    domain: 'MANUFACTURING',
    collectionPath: 'routings',
    primaryKey: 'routingId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Sequence of operations and work centers required for manufacturing.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'routingId', type: 'string', required: true, description: 'Routing ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'productId', type: 'string', required: true, description: 'Product ID', isForeignKey: true, foreignEntity: 'Product' },
    ],
  },

  // 20. WorkCenter
  WorkCenter: {
    entityName: 'WorkCenter',
    domain: 'MANUFACTURING',
    collectionPath: 'work_centers',
    primaryKey: 'workCenterId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Production machine, station, or labor team executing routing operations.',
    lifecycleStates: ['Draft', 'Approved', 'Active', 'Inactive', 'Archived'],
    allowedTransitions: {
      Draft: ['Approved', 'Archived'],
      Approved: ['Active', 'Inactive', 'Archived'],
      Active: ['Inactive', 'Archived'],
      Inactive: ['Active', 'Archived'],
      Archived: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'workCenterId', type: 'string', required: true, description: 'Work center ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'name', type: 'string', required: true, description: 'Work center name' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Associated Warehouse/Plant', isForeignKey: true, foreignEntity: 'Warehouse' },
    ],
  },

  // 21. ProductionOrder
  ProductionOrder: {
    entityName: 'ProductionOrder',
    domain: 'MANUFACTURING',
    collectionPath: 'production_orders',
    primaryKey: 'productionOrderId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Shop floor manufacturing order for finished or semi-finished goods.',
    lifecycleStates: ['Draft', 'RELEASED', 'CONFIRMED', 'CLOSED', 'CANCELLED'],
    allowedTransitions: {
      Draft: ['RELEASED', 'CANCELLED'],
      RELEASED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CLOSED', 'CANCELLED'],
      CLOSED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'productionOrderId', type: 'string', required: true, description: 'Production Order ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'productId', type: 'string', required: true, description: 'Finished Product', isForeignKey: true, foreignEntity: 'Product' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Plant/Warehouse', isForeignKey: true, foreignEntity: 'Warehouse' },
    ],
  },

  // 22. ASN (Advance Shipping Notice)
  ASN: {
    entityName: 'ASN',
    domain: 'LOGISTICS_TRANSPORT',
    collectionPath: 'asns',
    primaryKey: 'asnId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Supplier advance shipment notice detailing shipped goods against a PO.',
    lifecycleStates: ['Draft', 'SUBMITTED', 'Approved', 'RECEIVED', 'REJECTED'],
    allowedTransitions: {
      Draft: ['SUBMITTED', 'REJECTED'],
      SUBMITTED: ['Approved', 'REJECTED'],
      Approved: ['RECEIVED', 'REJECTED'],
      RECEIVED: [],
      REJECTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'PurchaseOrder', field: 'poId', foreignField: 'poId', required: true },
      { entity: 'Supplier', field: 'supplierId', foreignField: 'supplierId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'asnId', type: 'string', required: true, description: 'ASN unique ID (e.g. ASN-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'poId', type: 'string', required: true, description: 'Referenced PO', isForeignKey: true, foreignEntity: 'PurchaseOrder' },
      { name: 'supplierId', type: 'string', required: true, description: 'Shipper Supplier', isForeignKey: true, foreignEntity: 'Supplier' },
      { name: 'trackingNumber', type: 'string', required: true, description: 'Carrier shipment tracking identifier' },
    ],
  },

  // 23. Shipment
  Shipment: {
    entityName: 'Shipment',
    domain: 'LOGISTICS_TRANSPORT',
    collectionPath: 'shipments',
    primaryKey: 'shipmentId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Freight cargo consignment in transit.',
    lifecycleStates: ['Draft', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    allowedTransitions: {
      Draft: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    },
    dependencies: [{ entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true }],
    fields: [
      { name: 'shipmentId', type: 'string', required: true, description: 'Shipment ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'trackingNumber', type: 'string', required: true, description: 'Tracking ID' },
    ],
  },

  // 24. ShipmentLine
  ShipmentLine: {
    entityName: 'ShipmentLine',
    domain: 'LOGISTICS_TRANSPORT',
    collectionPath: 'shipment_lines',
    primaryKey: 'lineId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Individual SKU line in a cargo shipment.',
    lifecycleStates: ['Active', 'DELIVERED', 'CANCELLED'],
    allowedTransitions: {
      Active: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Shipment', field: 'shipmentId', foreignField: 'shipmentId', required: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'lineId', type: 'string', required: true, description: 'Shipment line ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'shipmentId', type: 'string', required: true, description: 'Parent shipment ID', isForeignKey: true, foreignEntity: 'Shipment' },
      { name: 'productId', type: 'string', required: true, description: 'Product ID', isForeignKey: true, foreignEntity: 'Product' },
    ],
  },

  // 25. Receiving
  Receiving: {
    entityName: 'Receiving',
    domain: 'INVENTORY_WAREHOUSING',
    collectionPath: 'receipts',
    primaryKey: 'receivingId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Dock receiving verification record for inbound freight.',
    lifecycleStates: ['Draft', 'Approved', 'POSTED'],
    allowedTransitions: {
      Draft: ['Approved', 'POSTED'],
      Approved: ['POSTED'],
      POSTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'PurchaseOrder', field: 'poId', foreignField: 'poId', required: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'receivingId', type: 'string', required: true, description: 'Receiving ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'poId', type: 'string', required: true, description: 'Referenced PO', isForeignKey: true, foreignEntity: 'PurchaseOrder' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Receiving warehouse', isForeignKey: true, foreignEntity: 'Warehouse' },
    ],
  },

  // 26. GRN (Goods Receipt Note)
  GRN: {
    entityName: 'GRN',
    domain: 'INVENTORY_WAREHOUSING',
    collectionPath: 'grns',
    primaryKey: 'grnId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Authoritative Goods Receipt Note certifying physical custody acceptance.',
    lifecycleStates: ['Draft', 'POSTED'],
    allowedTransitions: {
      Draft: ['POSTED'],
      POSTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'PurchaseOrder', field: 'poId', foreignField: 'poId', required: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'grnId', type: 'string', required: true, description: 'GRN ID (e.g. GRN-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'poId', type: 'string', required: true, description: 'Referenced PO', isForeignKey: true, foreignEntity: 'PurchaseOrder' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Warehouse ID', isForeignKey: true, foreignEntity: 'Warehouse' },
      { name: 'status', type: 'string', required: true, description: 'GRN status' },
    ],
  },

  // 27. InventoryTransaction
  InventoryTransaction: {
    entityName: 'InventoryTransaction',
    domain: 'INVENTORY_WAREHOUSING',
    collectionPath: 'inventory_transactions',
    primaryKey: 'transactionId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: true,
    description: 'Append-only immutable stock adjustment ledger entry.',
    lifecycleStates: ['POSTED'],
    allowedTransitions: {
      POSTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'transactionId', type: 'string', required: true, description: 'Immutable transaction identifier' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'productId', type: 'string', required: true, description: 'Transacted Product', isForeignKey: true, foreignEntity: 'Product' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Transacted Warehouse', isForeignKey: true, foreignEntity: 'Warehouse' },
      { name: 'quantityDelta', type: 'number', required: true, description: 'Quantity change (+ for receipt, - for issue)' },
      { name: 'balanceBefore', type: 'number', required: true, description: 'Stock before transaction' },
      { name: 'balanceAfter', type: 'number', required: true, description: 'Stock after transaction' },
      { name: 'correlationId', type: 'string', required: true, description: 'Idempotency correlation ID' },
    ],
  },

  // 28. CustomerOrder
  CustomerOrder: {
    entityName: 'CustomerOrder',
    domain: 'CUSTOMER_ORDERS_FULFILLMENT',
    collectionPath: 'customer_orders',
    primaryKey: 'orderId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Sales order placed by a customer or B2B client.',
    lifecycleStates: ['Draft', 'CONFIRMED', 'RELEASED', 'CLOSED', 'CANCELLED'],
    allowedTransitions: {
      Draft: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['RELEASED', 'CANCELLED'],
      RELEASED: ['CLOSED', 'CANCELLED'],
      CLOSED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Customer', field: 'customerId', foreignField: 'customerId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'orderId', type: 'string', required: true, description: 'Customer Order ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'customerId', type: 'string', required: true, description: 'Ordering Customer', isForeignKey: true, foreignEntity: 'Customer' },
      { name: 'status', type: 'string', required: true, description: 'Order status' },
    ],
  },

  // 29. CustomerOrderLine
  CustomerOrderLine: {
    entityName: 'CustomerOrderLine',
    domain: 'CUSTOMER_ORDERS_FULFILLMENT',
    collectionPath: 'customer_order_lines',
    primaryKey: 'lineId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Individual line item on a customer sales order.',
    lifecycleStates: ['Active', 'CLOSED', 'CANCELLED'],
    allowedTransitions: {
      Active: ['CLOSED', 'CANCELLED'],
      CLOSED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'CustomerOrder', field: 'orderId', foreignField: 'orderId', required: true },
      { entity: 'Product', field: 'productId', foreignField: 'productId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'lineId', type: 'string', required: true, description: 'Customer order line ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'orderId', type: 'string', required: true, description: 'Parent sales order', isForeignKey: true, foreignEntity: 'CustomerOrder' },
      { name: 'productId', type: 'string', required: true, description: 'Ordered Product', isForeignKey: true, foreignEntity: 'Product' },
      { name: 'quantityOrdered', type: 'number', required: true, description: 'Quantity requested' },
    ],
  },

  // 30. Fulfillment
  Fulfillment: {
    entityName: 'Fulfillment',
    domain: 'CUSTOMER_ORDERS_FULFILLMENT',
    collectionPath: 'fulfillments',
    primaryKey: 'fulfillmentId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Warehouse pick, pack, and release dispatch for a customer order.',
    lifecycleStates: ['Draft', 'RELEASED', 'DELIVERED', 'CANCELLED'],
    allowedTransitions: {
      Draft: ['RELEASED', 'CANCELLED'],
      RELEASED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'CustomerOrder', field: 'orderId', foreignField: 'orderId', required: true },
      { entity: 'Warehouse', field: 'warehouseId', foreignField: 'warehouseId', required: true, activeOnly: true },
    ],
    fields: [
      { name: 'fulfillmentId', type: 'string', required: true, description: 'Fulfillment ID' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'orderId', type: 'string', required: true, description: 'Customer Order ID', isForeignKey: true, foreignEntity: 'CustomerOrder' },
      { name: 'warehouseId', type: 'string', required: true, description: 'Fulfilling Warehouse', isForeignKey: true, foreignEntity: 'Warehouse' },
    ],
  },

  // 31. Invoice
  Invoice: {
    entityName: 'Invoice',
    domain: 'FINANCE_SETTLEMENT',
    collectionPath: 'invoices',
    primaryKey: 'invoiceId',
    tenantField: 'tenantId',
    environmentScoped: true,
    isImmutable: false,
    description: 'Commercial invoice submitted for 3-way matching and accounts payable handoff.',
    lifecycleStates: ['Draft', 'Pending Review', 'Approved', 'POSTED', 'REJECTED'],
    allowedTransitions: {
      Draft: ['Pending Review', 'Approved', 'REJECTED'],
      'Pending Review': ['Approved', 'REJECTED', 'Draft'],
      Approved: ['POSTED', 'REJECTED'],
      POSTED: [],
      REJECTED: [],
    },
    dependencies: [
      { entity: 'Tenant', field: 'tenantId', foreignField: 'id', required: true },
      { entity: 'Supplier', field: 'supplierId', foreignField: 'supplierId', required: true, activeOnly: true },
      { entity: 'PurchaseOrder', field: 'poId', foreignField: 'poId', required: true },
    ],
    fields: [
      { name: 'invoiceId', type: 'string', required: true, description: 'Invoice ID (e.g. INV-001)' },
      { name: 'tenantId', type: 'string', required: true, description: 'Tenant scoping key', isForeignKey: true, foreignEntity: 'Tenant' },
      { name: 'supplierId', type: 'string', required: true, description: 'Invoicing Supplier', isForeignKey: true, foreignEntity: 'Supplier' },
      { name: 'poId', type: 'string', required: true, description: 'Associated PO', isForeignKey: true, foreignEntity: 'PurchaseOrder' },
      { name: 'amount', type: 'number', required: true, description: 'Invoice total payable amount' },
    ],
  },
};

export class ScmCanonicalRegistry {
  private static instance: ScmCanonicalRegistry;

  public static getInstance(): ScmCanonicalRegistry {
    if (!ScmCanonicalRegistry.instance) {
      ScmCanonicalRegistry.instance = new ScmCanonicalRegistry();
    }
    return ScmCanonicalRegistry.instance;
  }

  public getEntity(name: string): ScmCanonicalEntityDefinition | undefined {
    return SCM_CANONICAL_ENTITIES[name];
  }

  public listEntities(): ScmCanonicalEntityDefinition[] {
    return Object.values(SCM_CANONICAL_ENTITIES);
  }

  public getEntitiesByDomain(domain: ScmDomainCategory): ScmCanonicalEntityDefinition[] {
    return this.listEntities().filter((e) => e.domain === domain);
  }

  public isValidLifecycleTransition(entityName: string, fromState: string, toState: string): boolean {
    const entity = this.getEntity(entityName);
    if (!entity) return false;
    if (fromState === toState) return true;
    const allowed = entity.allowedTransitions[fromState];
    return Array.isArray(allowed) && allowed.includes(toState);
  }
}

export const scmCanonicalRegistry = ScmCanonicalRegistry.getInstance();
