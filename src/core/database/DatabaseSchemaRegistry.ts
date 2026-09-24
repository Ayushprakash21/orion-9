/**
 * ORION-9 AUTHORITATIVE DATABASE SCHEMA REGISTRY
 * Complete enterprise specification across 18 business domains (A through R).
 * Standardizes entity models, primary keys, collection paths, tenant scoping,
 * security rule coverage, index requirements, and implementation status.
 */

export type EntityLifecycleStatus = 'IMPLEMENTED' | 'VERIFIED' | 'PLANNED';

export type DatabaseDomainCode =
  | 'A_IDENTITY'
  | 'B_MASTER_DATA'
  | 'C_PROCUREMENT'
  | 'D_INVENTORY'
  | 'E_WAREHOUSE'
  | 'F_DEMAND_PLANNING'
  | 'G_MANUFACTURING'
  | 'H_LOGISTICS'
  | 'I_CUSTOMER_ORDERS'
  | 'J_FINANCE'
  | 'K_CONTROL_TOWER'
  | 'L_DIGITAL_TWIN'
  | 'M_AI_WORKFORCE'
  | 'N_WORKFLOW'
  | 'O_INTEGRATION_FABRIC'
  | 'P_OBSERVABILITY'
  | 'Q_OUTCOME_LEARNING'
  | 'R_SYSTEM_GOVERNANCE';

export interface SchemaEntityDefinition {
  domain: DatabaseDomainCode;
  domainName: string;
  entityName: string;
  collectionPath: string;
  isAuthoritative: boolean;
  tenantScoped: boolean;
  tenantField: 'tenantId' | 'organizationId' | 'both' | 'none';
  primaryKey: string;
  immutable: boolean;
  status: EntityLifecycleStatus;
  readPath: string;
  writePath: string;
  ruleCoverage: string;
  requiredIndexes: string[];
  description: string;
}

export const ORION_DATABASE_SCHEMA_REGISTRY: SchemaEntityDefinition[] = [
  // =========================================================================
  // DOMAIN A: IDENTITY & ORGANIZATION
  // =========================================================================
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'User',
    collectionPath: 'users',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'UserService.getUserById / getDocs(users where tenantId)',
    writePath: 'UserService.saveUser / setDoc(users)',
    ruleCoverage: 'match /users/{id} -> isAuthenticated && isOrgMember',
    requiredIndexes: ['tenantId ASC, role ASC', 'tenantId ASC, email ASC'],
    description: 'Enterprise user identity and profile record bound to Firebase Auth UID.',
  },
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'UserProfile',
    collectionPath: 'user_profiles',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'organizationId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'FirebaseDbService.getUserProfile / getDoc(user_profiles)',
    writePath: 'FirebaseDbService.saveUserProfile / setDoc(user_profiles)',
    ruleCoverage: 'match /user_profiles/{id} -> isAuthenticated && isOrgMember',
    requiredIndexes: ['organizationId ASC, department ASC'],
    description: 'Extended personal preferences, phone, title, and regional display settings.',
  },
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'Organization',
    collectionPath: 'organizations',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'OrganizationService.getOrg / getDoc(organizations)',
    writePath: 'OrganizationService.saveOrg / setDoc(organizations)',
    ruleCoverage: 'match /organizations/{id} -> isAuthenticated && (isOrgMember || isAdmin)',
    requiredIndexes: ['tenantId ASC, name ASC'],
    description: 'Top-level enterprise tenant organization boundary and corporate hierarchy.',
  },
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'TenantMembership',
    collectionPath: 'tenant_memberships',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'UserService.getMemberships / getDocs(tenant_memberships)',
    writePath: 'UserService.assignMembership / setDoc(tenant_memberships)',
    ruleCoverage: 'match /tenant_memberships/{id} -> isAuthenticated && isOrgMember',
    requiredIndexes: ['tenantId ASC, userId ASC', 'userId ASC, role ASC'],
    description: 'Multi-tenant membership mapping user UIDs to explicit roles per tenant boundary.',
  },
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'RoleBinding',
    collectionPath: 'role_bindings',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'PermissionService.getBindings / getDocs(role_bindings)',
    writePath: 'PermissionService.saveBinding / setDoc(role_bindings)',
    ruleCoverage: 'match /role_bindings/{id} -> isAdmin',
    requiredIndexes: ['tenantId ASC, principalId ASC'],
    description: 'Granular RBAC/ABAC role bindings and domain permission overrides.',
  },
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'BrandingConfig',
    collectionPath: 'system_configs',
    isAuthoritative: true,
    tenantScoped: false,
    tenantField: 'none',
    primaryKey: 'applicationBranding',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'BrandingRepository.getBranding / API / Firestore',
    writePath: 'BrandingRepository.saveBranding / setDoc(system_configs)',
    ruleCoverage: 'match /system_configs/{id} -> read: isAuthenticated, write: isAdmin',
    requiredIndexes: [],
    description: 'Authoritative OS branding, logo assets, nomenclature, and colorway customization.',
  },
  {
    domain: 'A_IDENTITY',
    domainName: 'Identity & Organization',
    entityName: 'SecurityPolicy',
    collectionPath: 'security_policies',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ControlPolicyService.getPolicies / getDocs(security_policies)',
    writePath: 'ControlPolicyService.savePolicy / setDoc(security_policies)',
    ruleCoverage: 'match /security_policies/{id} -> isAdmin',
    requiredIndexes: ['tenantId ASC, policyType ASC'],
    description: 'Platform authentication constraints, session TTLs, and MFA enforcement policies.',
  },

  // =========================================================================
  // DOMAIN B: MASTER DATA
  // =========================================================================
  {
    domain: 'B_MASTER_DATA',
    domainName: 'Master Data',
    entityName: 'Supplier',
    collectionPath: 'suppliers',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("suppliers") / SupplyChainContext',
    writePath: 'ScmPersistenceService.saveRecord("suppliers") / MasterDataService',
    ruleCoverage: 'match /suppliers/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, rating DESC', 'tenantId ASC, category ASC'],
    description: 'Authoritative vendor master record with tiering, scorecards, and compliance status.',
  },
  {
    domain: 'B_MASTER_DATA',
    domainName: 'Master Data',
    entityName: 'Product',
    collectionPath: 'products',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("products") / SupplyChainContext',
    writePath: 'ScmPersistenceService.saveRecord("products") / MasterDataService',
    ruleCoverage: 'match /products/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, category ASC', 'tenantId ASC, abcClass ASC'],
    description: 'Item and SKU master repository with dimensions, safety stock levels, and BOM linkage.',
  },
  {
    domain: 'B_MASTER_DATA',
    domainName: 'Master Data',
    entityName: 'Warehouse',
    collectionPath: 'warehouses',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("warehouses")',
    writePath: 'ScmPersistenceService.saveRecord("warehouses")',
    ruleCoverage: 'match /warehouses/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, location ASC'],
    description: 'Distribution centers, fulfillment hubs, regional depots, and yard terminals.',
  },
  {
    domain: 'B_MASTER_DATA',
    domainName: 'Master Data',
    entityName: 'Customer',
    collectionPath: 'customers',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("customers")',
    writePath: 'ScmPersistenceService.saveRecord("customers")',
    ruleCoverage: 'match /customers/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, creditTier ASC'],
    description: 'Commercial client master record with shipping accounts and credit limits.',
  },
  {
    domain: 'B_MASTER_DATA',
    domainName: 'Master Data',
    entityName: 'TransportationLane',
    collectionPath: 'transportation_lanes',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'LogisticsService.getLanes / getDocs(transportation_lanes)',
    writePath: 'LogisticsService.saveLane / setDoc(transportation_lanes)',
    ruleCoverage: 'match /transportation_lanes/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, originId ASC, destinationId ASC'],
    description: 'Intermodal freight transit corridors, historical lead times, and carrier allocations.',
  },

  // =========================================================================
  // DOMAIN C: PROCUREMENT
  // =========================================================================
  {
    domain: 'C_PROCUREMENT',
    domainName: 'Procurement',
    entityName: 'PurchaseOrder',
    collectionPath: 'purchase_orders',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("purchase_orders")',
    writePath: 'ScmPersistenceService.saveRecord("purchase_orders")',
    ruleCoverage: 'match /purchase_orders/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, supplierId ASC', 'tenantId ASC, orderDate DESC'],
    description: 'Commercial procurement purchase order with line items, release cycles, and matching state.',
  },
  {
    domain: 'C_PROCUREMENT',
    domainName: 'Procurement',
    entityName: 'PurchaseRequisition',
    collectionPath: 'purchase_requisitions',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ProcurementEngine.getRequisitions / getDocs(purchase_requisitions)',
    writePath: 'ProcurementEngine.createRequisition / setDoc(purchase_requisitions)',
    ruleCoverage: 'match /purchase_requisitions/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, createdAt DESC'],
    description: 'Internal demand requisitions awaiting approval and conversion to purchase orders.',
  },
  {
    domain: 'C_PROCUREMENT',
    domainName: 'Procurement',
    entityName: 'Contract',
    collectionPath: 'contracts',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ContractService.getContracts / getDocs(contracts)',
    writePath: 'ContractService.saveContract / setDoc(contracts)',
    ruleCoverage: 'match /contracts/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'organizationId ASC, expiryDate ASC'],
    description: 'Governed supplier master service agreements, SLAs, discount matrices, and rate sheets.',
  },
  {
    domain: 'C_PROCUREMENT',
    domainName: 'Procurement',
    entityName: 'SupplierInvoice',
    collectionPath: 'supplier_invoices',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ProcurementEngine.getInvoices / getDocs(supplier_invoices)',
    writePath: 'ProcurementEngine.saveInvoice / setDoc(supplier_invoices)',
    ruleCoverage: 'match /supplier_invoices/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, poId ASC', 'tenantId ASC, matchStatus ASC'],
    description: 'Inbound vendor billing documents subjected to 2-way and 3-way matching rules.',
  },

  // =========================================================================
  // DOMAIN D: INVENTORY
  // =========================================================================
  {
    domain: 'D_INVENTORY',
    domainName: 'Inventory',
    entityName: 'InventoryBalance',
    collectionPath: 'inventory',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("inventory")',
    writePath: 'ScmPersistenceService.saveRecord("inventory")',
    ruleCoverage: 'match /inventory/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, productId ASC, warehouseId ASC', 'tenantId ASC, status ASC'],
    description: 'Real-time on-hand, reserved, in-transit, and available-to-promise inventory quantities.',
  },
  {
    domain: 'D_INVENTORY',
    domainName: 'Inventory',
    entityName: 'InventoryTransaction',
    collectionPath: 'inventory_transactions',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listTransactions / getDocs(inventory_transactions)',
    writePath: 'ScmPersistenceService.recordTransaction / setDoc(inventory_transactions)',
    ruleCoverage: 'match /inventory_transactions/{id} -> read: isOrgMember, write: isOrgMember, delete: false',
    requiredIndexes: ['tenantId ASC, productId ASC, timestamp DESC', 'tenantId ASC, transactionType ASC'],
    description: 'Immutable double-entry transaction ledger of all receipts, issues, adjustments, and moves.',
  },
  {
    domain: 'D_INVENTORY',
    domainName: 'Inventory',
    entityName: 'SkuBuffer',
    collectionPath: 'sku_buffers',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'InventoryOptimizationService.getBuffers / getDocs(sku_buffers)',
    writePath: 'InventoryOptimizationService.saveBuffer / setDoc(sku_buffers)',
    ruleCoverage: 'match /sku_buffers/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, skuId ASC, echelonId ASC'],
    description: 'Multi-echelon dynamic safety stock and buffer sizing calculations.',
  },
  {
    domain: 'D_INVENTORY',
    domainName: 'Inventory',
    entityName: 'ReplenishmentOrder',
    collectionPath: 'replenishment_orders',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'InventoryOptimizationService.getReplenishments / getDocs(replenishment_orders)',
    writePath: 'InventoryOptimizationService.createReplenishment / setDoc(replenishment_orders)',
    ruleCoverage: 'match /replenishment_orders/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, targetEchelonId ASC'],
    description: 'Automated inter-facility replenishment transfers triggered by buffer penetration.',
  },

  // =========================================================================
  // DOMAIN E: WAREHOUSE
  // =========================================================================
  {
    domain: 'E_WAREHOUSE',
    domainName: 'Warehouse',
    entityName: 'YardAppointment',
    collectionPath: 'yard_appointments',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'LogisticsService.getYardAppointments / getDocs(yard_appointments)',
    writePath: 'LogisticsService.saveYardAppointment / setDoc(yard_appointments)',
    ruleCoverage: 'match /yard_appointments/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, facilityId ASC, scheduledTime ASC'],
    description: 'Dock appointment scheduling, trailer spotting, gate logging, and turnaround metrics.',
  },
  {
    domain: 'E_WAREHOUSE',
    domainName: 'Warehouse',
    entityName: 'GoodsReceiptNote',
    collectionPath: 'goods_receipt_notes',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'WarehouseEngine.getGRNs / getDocs(goods_receipt_notes)',
    writePath: 'WarehouseEngine.createGRN / setDoc(goods_receipt_notes)',
    ruleCoverage: 'match /goods_receipt_notes/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, poId ASC, receivedDate DESC'],
    description: 'Authoritative physical receiving confirmation and quality inspection entry point.',
  },

  // =========================================================================
  // DOMAIN F: DEMAND / PLANNING / S&OP
  // =========================================================================
  {
    domain: 'F_DEMAND_PLANNING',
    domainName: 'Demand & S&OP Planning',
    entityName: 'DemandForecast',
    collectionPath: 'forecasts',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ForecastEngine.getForecasts / getDocs(forecasts)',
    writePath: 'ForecastEngine.saveForecast / setDoc(forecasts)',
    ruleCoverage: 'match /forecasts/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, productId ASC, horizonMonth ASC'],
    description: 'Statistical, ML-enhanced, and consensus demand projections across rolling planning horizons.',
  },
  {
    domain: 'F_DEMAND_PLANNING',
    domainName: 'Demand & S&OP Planning',
    entityName: 'BullwhipMetric',
    collectionPath: 'bullwhip_metrics',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'InventoryOptimizationService.getBullwhipMetrics / getDocs(bullwhip_metrics)',
    writePath: 'InventoryOptimizationService.recordBullwhip / setDoc(bullwhip_metrics)',
    ruleCoverage: 'match /bullwhip_metrics/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, echelonId ASC, measuredAt DESC'],
    description: 'Demand variance amplification ratios and order oscillation diagnostics across tiers.',
  },

  // =========================================================================
  // DOMAIN G: MANUFACTURING
  // =========================================================================
  {
    domain: 'G_MANUFACTURING',
    domainName: 'Manufacturing',
    entityName: 'BillOfMaterials',
    collectionPath: 'boms',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'MasterDataService.getBOMs / getDocs(boms)',
    writePath: 'MasterDataService.saveBOM / setDoc(boms)',
    ruleCoverage: 'match /boms/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, finishedGoodSku ASC'],
    description: 'Multi-level assembly structures, scrap allowances, and component consumption factors.',
  },
  {
    domain: 'G_MANUFACTURING',
    domainName: 'Manufacturing',
    entityName: 'ProductionOrder',
    collectionPath: 'production_orders',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'SupplyChainContext.productionOrders / getDocs(production_orders)',
    writePath: 'ScmPersistenceService.saveRecord("production_orders")',
    ruleCoverage: 'match /production_orders/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, plannedStartDate ASC'],
    description: 'Work orders, shop floor schedules, and component staging requirements.',
  },

  // =========================================================================
  // DOMAIN H: LOGISTICS
  // =========================================================================
  {
    domain: 'H_LOGISTICS',
    domainName: 'Logistics',
    entityName: 'Shipment',
    collectionPath: 'shipments',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("shipments")',
    writePath: 'ScmPersistenceService.saveRecord("shipments")',
    ruleCoverage: 'match /shipments/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, carrier ASC', 'tenantId ASC, eta ASC'],
    description: 'Inbound, outbound, and inter-facility freight shipments with GPS telematics and waypoint milestones.',
  },
  {
    domain: 'H_LOGISTICS',
    domainName: 'Logistics',
    entityName: 'FreightConsignment',
    collectionPath: 'freight_consignments',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'LogisticsService.getConsignments / getDocs(freight_consignments)',
    writePath: 'LogisticsService.saveConsignment / setDoc(freight_consignments)',
    ruleCoverage: 'match /freight_consignments/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, laneId ASC'],
    description: 'Containerized multimodal freight bookings, bills of lading, and carrier performance.',
  },
  {
    domain: 'H_LOGISTICS',
    domainName: 'Logistics',
    entityName: 'ConsolidationPlan',
    collectionPath: 'consolidation_plans',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'both',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'LogisticsService.getConsolidations / getDocs(consolidation_plans)',
    writePath: 'LogisticsService.saveConsolidation / setDoc(consolidation_plans)',
    ruleCoverage: 'match /consolidation_plans/{id} -> isOrgMember(organizationId) || isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC'],
    description: 'LTL-to-FTL route optimization plans and multi-stop delivery drop sequences.',
  },

  // =========================================================================
  // DOMAIN I: CUSTOMER ORDERS
  // =========================================================================
  {
    domain: 'I_CUSTOMER_ORDERS',
    domainName: 'Customer Orders',
    entityName: 'CustomerOrder',
    collectionPath: 'customer_orders',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'SupplyChainContext.customerOrders / getDocs(customer_orders)',
    writePath: 'ScmPersistenceService.saveRecord("customer_orders")',
    ruleCoverage: 'match /customer_orders/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, customerId ASC', 'tenantId ASC, status ASC', 'tenantId ASC, orderDate DESC'],
    description: 'Outbound sales demand, order lines, fulfillment priorities, and promised delivery dates.',
  },

  // =========================================================================
  // DOMAIN J: FINANCE / COMMERCIAL
  // =========================================================================
  {
    domain: 'J_FINANCE',
    domainName: 'Finance & Commercial Handoff',
    entityName: 'PaymentHandoff',
    collectionPath: 'payment_handoffs',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'ProcurementEngine.getPaymentHandoffs / getDocs(payment_handoffs)',
    writePath: 'ProcurementEngine.createPaymentHandoff / setDoc(payment_handoffs)',
    ruleCoverage: 'match /payment_handoffs/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, invoiceId ASC'],
    description: 'Governed payment status, 3-way match validation proof, and ERP AP journal handoff records.',
  },

  // =========================================================================
  // DOMAIN K: CONTROL TOWER
  // =========================================================================
  {
    domain: 'K_CONTROL_TOWER',
    domainName: 'Control Tower',
    entityName: 'ExceptionRecord',
    collectionPath: 'exceptions',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScmPersistenceService.listRecords("exceptions")',
    writePath: 'ScmPersistenceService.saveRecord("exceptions")',
    ruleCoverage: 'match /exceptions/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, severity ASC', 'tenantId ASC, status ASC', 'tenantId ASC, createdAt DESC'],
    description: 'Active supply chain disruptions, stockouts, transit delays, quality holds, and supplier breaches.',
  },
  {
    domain: 'K_CONTROL_TOWER',
    domainName: 'Control Tower',
    entityName: 'Signal',
    collectionPath: 'signals',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'Wave6ControlTowerService.getSignals / getDocs(signals)',
    writePath: 'Wave6ControlTowerService.emitSignal / setDoc(signals)',
    ruleCoverage: 'match /signals/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, signalType ASC, timestamp DESC'],
    description: 'Telemetry signals, weather anomalies, port congestions, and upstream supplier risk flags.',
  },
  {
    domain: 'K_CONTROL_TOWER',
    domainName: 'Control Tower',
    entityName: 'DecisionRecord',
    collectionPath: 'decisions',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'Wave6ControlTowerService.getDecisions / getDocs(decisions)',
    writePath: 'Wave6ControlTowerService.recordDecision / setDoc(decisions)',
    ruleCoverage: 'match /decisions/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, createdAt DESC'],
    description: 'Autonomous and human-in-the-loop decision events, evaluated trade-offs, and chosen options.',
  },

  // =========================================================================
  // DOMAIN L: DIGITAL TWIN / SCENARIO
  // =========================================================================
  {
    domain: 'L_DIGITAL_TWIN',
    domainName: 'Digital Twin & Simulation',
    entityName: 'DigitalTwinState',
    collectionPath: 'digital_twin_states',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'DigitalTwinService.getState / getDoc(digital_twin_states)',
    writePath: 'DigitalTwinService.saveState / setDoc(digital_twin_states)',
    ruleCoverage: 'match /digital_twin_states/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, snapshotVersion DESC'],
    description: 'Topology graph representation of nodes, lanes, throughputs, and real-time network flow state.',
  },
  {
    domain: 'L_DIGITAL_TWIN',
    domainName: 'Digital Twin & Simulation',
    entityName: 'Scenario',
    collectionPath: 'scenarios',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ScenarioService.getScenarios / getDocs(scenarios)',
    writePath: 'ScenarioService.saveScenario / setDoc(scenarios)',
    ruleCoverage: 'match /scenarios/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, scenarioType ASC', 'tenantId ASC, createdAt DESC'],
    description: 'What-if disruption simulations, port closures, tariff changes, and demand surge models.',
  },

  // =========================================================================
  // DOMAIN M: AI WORKFORCE
  // =========================================================================
  {
    domain: 'M_AI_WORKFORCE',
    domainName: 'AI Workforce',
    entityName: 'AIAgent',
    collectionPath: 'ai_agents',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'AgentRuntimeService.getAgents / getDocs(ai_agents)',
    writePath: 'AgentRuntimeService.registerAgent / setDoc(ai_agents)',
    ruleCoverage: 'match /ai_agents/{id} -> read: isOrgMember, write: isAdmin',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, role ASC'],
    description: 'Registered AI agent persona, capability bounds, autonomy boundaries, and policy bindings.',
  },
  {
    domain: 'M_AI_WORKFORCE',
    domainName: 'AI Workforce',
    entityName: 'AIProposal',
    collectionPath: 'ai_proposals',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'AgentRuntimeService.getProposals / getDocs(ai_proposals)',
    writePath: 'AgentRuntimeService.submitProposal / setDoc(ai_proposals)',
    ruleCoverage: 'match /ai_proposals/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, riskLevel ASC'],
    description: 'AI recommendation subjected to Kernel risk governance and human approval workflow.',
  },
  {
    domain: 'M_AI_WORKFORCE',
    domainName: 'AI Workforce',
    entityName: 'AgentMemory',
    collectionPath: 'agent_memory',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'AgentRuntimeService.getMemory / getDoc(agent_memory)',
    writePath: 'AgentRuntimeService.saveMemory / setDoc(agent_memory)',
    ruleCoverage: 'match /agent_memory/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, agentId ASC'],
    description: 'Tenant-isolated episodic and semantic working memory partitions for autonomous agents.',
  },

  // =========================================================================
  // DOMAIN N: WORKFLOW
  // =========================================================================
  {
    domain: 'N_WORKFLOW',
    domainName: 'Workflow Engine',
    entityName: 'WorkflowInstance',
    collectionPath: 'workflow_instances',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'WorkflowLifecycleService.getInstances / getDocs(workflow_instances)',
    writePath: 'WorkflowLifecycleService.saveInstance / setDoc(workflow_instances)',
    ruleCoverage: 'match /workflow_instances/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, workflowDefinitionId ASC'],
    description: 'Durable execution state, step history, pending approvals, and replay checkpoints.',
  },

  // =========================================================================
  // DOMAIN O: INTEGRATION FABRIC
  // =========================================================================
  {
    domain: 'O_INTEGRATION_FABRIC',
    domainName: 'Integration Fabric',
    entityName: 'ConnectorInstance',
    collectionPath: 'connectors',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'ConnectorRuntimeService.getConnectors / getDocs(connectors)',
    writePath: 'ConnectorRuntimeService.saveConnector / setDoc(connectors)',
    ruleCoverage: 'match /connectors/{id} -> read: isOrgMember, write: isAdmin',
    requiredIndexes: ['tenantId ASC, status ASC', 'tenantId ASC, connectorType ASC'],
    description: 'ERP/WMS/TMS adapters (SAP, Oracle, EDI, Webhook, SFTP) configuration and telemetry metadata.',
  },

  // =========================================================================
  // DOMAIN P: OBSERVABILITY
  // =========================================================================
  {
    domain: 'P_OBSERVABILITY',
    domainName: 'Observability & Audit',
    entityName: 'AuditLog',
    collectionPath: 'audit_logs',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'organizationId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'AuditService.getLogs / getDocs(audit_logs)',
    writePath: 'AuditService.log / setDoc(audit_logs)',
    ruleCoverage: 'match /audit_logs/{id} -> read: (isOrgMember || isAdmin), write: isAuthenticated, delete: false',
    requiredIndexes: ['organizationId ASC, timestamp DESC', 'organizationId ASC, action ASC'],
    description: 'Immutable compliance audit ledger capturing all auth, mutation, and policy decisions.',
  },
  {
    domain: 'P_OBSERVABILITY',
    domainName: 'Observability & Audit',
    entityName: 'Incident',
    collectionPath: 'incidents',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'OperationsCenterService.getIncidents / getDocs(incidents)',
    writePath: 'OperationsCenterService.recordIncident / setDoc(incidents)',
    ruleCoverage: 'match /incidents/{id} -> read: isOrgMember, write: isAdmin, delete: false',
    requiredIndexes: ['tenantId ASC, severity ASC, timestamp DESC'],
    description: 'System-level operational incidents, outage tracking, failover events, and MTTR records.',
  },

  // =========================================================================
  // DOMAIN Q: OUTCOME / LEARNING
  // =========================================================================
  {
    domain: 'Q_OUTCOME_LEARNING',
    domainName: 'Outcome Intelligence & Learning',
    entityName: 'DecisionOutcome',
    collectionPath: 'decision_outcomes',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: true,
    status: 'VERIFIED',
    readPath: 'OutcomeIntelligenceService.getOutcomes / getDocs(decision_outcomes)',
    writePath: 'OutcomeIntelligenceService.recordOutcome / setDoc(decision_outcomes)',
    ruleCoverage: 'match /decision_outcomes/{id} -> read: isOrgMember, write: isOrgMember, delete: false',
    requiredIndexes: ['tenantId ASC, evaluatedAt DESC'],
    description: 'Empirical measurement of decision results comparing predicted vs actual business impact.',
  },

  // =========================================================================
  // DOMAIN R: SYSTEM / GOVERNANCE
  // =========================================================================
  {
    domain: 'R_SYSTEM_GOVERNANCE',
    domainName: 'System & Platform Governance',
    entityName: 'SystemStatus',
    collectionPath: 'system_status',
    isAuthoritative: true,
    tenantScoped: false,
    tenantField: 'none',
    primaryKey: 'current',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'HealthAndObservabilityService.getStatus / getDoc(system_status)',
    writePath: 'HealthAndObservabilityService.updateStatus / setDoc(system_status)',
    ruleCoverage: 'match /system_status/{id} -> read: isAuthenticated, write: isAdmin',
    requiredIndexes: [],
    description: 'Real-time microservice heartbeat signals, database health, latency, and operational mode.',
  },
  {
    domain: 'R_SYSTEM_GOVERNANCE',
    domainName: 'System & Platform Governance',
    entityName: 'DataQualityMetric',
    collectionPath: 'data_quality_metrics',
    isAuthoritative: true,
    tenantScoped: true,
    tenantField: 'tenantId',
    primaryKey: 'id',
    immutable: false,
    status: 'VERIFIED',
    readPath: 'DataQualityService.getMetrics / getDocs(data_quality_metrics)',
    writePath: 'DataQualityService.recordMetrics / setDoc(data_quality_metrics)',
    ruleCoverage: 'match /data_quality_metrics/{id} -> isOrgMember(tenantId)',
    requiredIndexes: ['tenantId ASC, timestamp DESC'],
    description: 'Calculated completeness, schema validity, referential integrity, and timeliness scores.',
  }
];

export class DatabaseSchemaRegistryService {
  private static instance: DatabaseSchemaRegistryService;

  public static getInstance(): DatabaseSchemaRegistryService {
    if (!DatabaseSchemaRegistryService.instance) {
      DatabaseSchemaRegistryService.instance = new DatabaseSchemaRegistryService();
    }
    return DatabaseSchemaRegistryService.instance;
  }

  public getAllEntities(): SchemaEntityDefinition[] {
    return [...ORION_DATABASE_SCHEMA_REGISTRY];
  }

  public getEntitiesByDomain(domain: DatabaseDomainCode): SchemaEntityDefinition[] {
    return ORION_DATABASE_SCHEMA_REGISTRY.filter(e => e.domain === domain);
  }

  public getEntityByCollection(collectionPath: string): SchemaEntityDefinition | undefined {
    return ORION_DATABASE_SCHEMA_REGISTRY.find(e => e.collectionPath === collectionPath);
  }

  public getImplementedCollections(): string[] {
    return ORION_DATABASE_SCHEMA_REGISTRY
      .filter(e => e.status === 'IMPLEMENTED' || e.status === 'VERIFIED')
      .map(e => e.collectionPath);
  }

  public getTenantScopedCollections(): string[] {
    return ORION_DATABASE_SCHEMA_REGISTRY
      .filter(e => e.tenantScoped)
      .map(e => e.collectionPath);
  }

  public getImmutableCollections(): string[] {
    return ORION_DATABASE_SCHEMA_REGISTRY
      .filter(e => e.immutable)
      .map(e => e.collectionPath);
  }
}

export const schemaRegistry = DatabaseSchemaRegistryService.getInstance();

export const getAllCollections = (): SchemaEntityDefinition[] => {
  return schemaRegistry.getAllEntities();
};

export const getCollectionsForDomain = (domain: string): SchemaEntityDefinition[] => {
  return schemaRegistry.getAllEntities().filter(e => e.domain.startsWith(domain));
};

export interface DomainSchemaGroup {
  domain: DatabaseDomainCode;
  name: string;
  collections: SchemaEntityDefinition[];
}

export const getAllDomainSchemas = (): DomainSchemaGroup[] => {
  const domains: DatabaseDomainCode[] = [
    'A_IDENTITY', 'B_MASTER_DATA', 'C_PROCUREMENT', 'D_INVENTORY', 'E_WAREHOUSE',
    'F_DEMAND_PLANNING', 'G_MANUFACTURING', 'H_LOGISTICS', 'I_CUSTOMER_ORDERS',
    'J_FINANCE', 'K_CONTROL_TOWER', 'L_DIGITAL_TWIN', 'M_AI_WORKFORCE',
    'N_WORKFLOW', 'O_INTEGRATION_FABRIC', 'P_OBSERVABILITY', 'Q_OUTCOME_LEARNING',
    'R_SYSTEM_GOVERNANCE'
  ];

  return domains.map(d => {
    const list = schemaRegistry.getEntitiesByDomain(d);
    return {
      domain: d,
      name: list[0]?.domainName || d,
      collections: list,
    };
  });
};

export const SCHEMA_REGISTRY = getAllDomainSchemas().reduce((acc, curr) => {
  const prefix = curr.domain.split('_')[0];
  acc[prefix] = curr;
  return acc;
}, {} as Record<string, DomainSchemaGroup>);
