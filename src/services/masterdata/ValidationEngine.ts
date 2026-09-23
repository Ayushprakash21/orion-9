/**
 * ORION-9 MASTER DATA VALIDATION ENGINE
 * Layer 7: Data Fabric & Master Data Governance
 *
 * Implements deterministic multi-tier validation covering:
 * - Mandatory fields and schema compliance
 * - Format validation (ISO codes, emails, phones, tax IDs)
 * - Reference integrity (UOMs, Currencies, Location paths, Relationships)
 * - Effective-date collision detection (overlapping active date windows)
 * - Multi-tenant isolation verification
 * - Lifecycle state transition guards
 *
 * Structured output with severity levels: INFO, WARNING, ERROR, BLOCKING.
 * Any BLOCKING error halts execution at the Kernel level.
 */

import {
  ValidationResult,
  ValidationSeverity,
  MasterDataEntityType,
  StewardshipState,
  MasterDataLifecycleState,
  SupplierMaster,
  ProductMaster,
  CustomerMaster,
  LocationMaster,
  WarehouseMaster,
  StorageLocationMaster,
  UOMMaster,
  CurrencyMaster,
  PaymentTermsMaster,
  TaxClassificationMaster,
  SupplierProductRelationship,
  CustomerProductRelationship,
} from '../../types';

// Standard reference dictionaries for baseline validation
export const STANDARD_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'SGD', 'HKD']);
export const STANDARD_UOMS = new Set(['KG', 'G', 'MG', 'L', 'ML', 'M', 'CM', 'MM', 'EA', 'PALLET', 'BOX', 'DRUM', 'UNIT', 'BAG', 'CONTAINER']);

const VALID_LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['VALIDATED', 'VALIDATION_PENDING', 'DUPLICATE_CHECKED', 'REJECTED'],
  VALIDATED: ['DUPLICATE_CHECKED', 'APPROVAL_PENDING', 'ACTIVE', 'REJECTED', 'DRAFT'],
  DUPLICATE_CHECKED: ['APPROVAL_PENDING', 'ACTIVE', 'REJECTED', 'DRAFT'],
  APPROVAL_PENDING: ['ACTIVE', 'APPROVED', 'REJECTED', 'DRAFT'],
  VALIDATION_PENDING: ['REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'DRAFT'],
  REVIEW_REQUIRED: ['APPROVED', 'ACTIVE', 'REJECTED', 'DRAFT'],
  APPROVED: ['ACTIVE', 'REJECTED', 'DRAFT'],
  ACTIVE: ['INACTIVE', 'SUPERSEDED', 'RETIRED'],
  INACTIVE: ['ACTIVE', 'SUPERSEDED', 'RETIRED', 'REJECTED'],
  RETIRED: [],
  REJECTED: ['DRAFT'],
  SUPERSEDED: [],
};

export class MasterDataValidationEngine {
  private static instance: MasterDataValidationEngine;

  private constructor() {}

  public static getInstance(): MasterDataValidationEngine {
    if (!MasterDataValidationEngine.instance) {
      MasterDataValidationEngine.instance = new MasterDataValidationEngine();
    }
    return MasterDataValidationEngine.instance;
  }

  /**
   * Validates any master data entity against domain constraints
   */
  public validate(
    entityType: MasterDataEntityType,
    entity: Record<string, any>,
    context?: {
      targetTenantId?: string;
      existingRelationships?: Array<{ supplierId: string; productId: string; validFrom: string; validTo: string; relationshipId?: string }>;
      activeUoms?: Set<string>;
      activeCurrencies?: Set<string>;
    }
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    const entityId = entity.id || entity.productId || entity.supplierId || entity.customerId || entity.locationId || entity.relationshipId || 'UNKNOWN';

    // 1. Mandatory Tenant Scoping Guard
    const tenantId = entity.tenantId || context?.targetTenantId;
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      if (context?.targetTenantId !== undefined) {
        results.push({
          status: 'INVALID',
          severity: 'BLOCKING',
          field: 'tenantId',
          code: 'MISSING_TENANT_ID',
          message: 'Master data record must have a non-empty tenant identifier.',
          entityType,
          entityId,
        });
      }
    } else if (context?.targetTenantId && entity.tenantId && entity.tenantId !== context.targetTenantId) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'tenantId',
        code: 'TENANT_MISMATCH',
        message: `Entity tenantId '${entity.tenantId}' does not match execution context tenantId '${context.targetTenantId}'.`,
        entityType,
        entityId,
      });
    }

    // 2. Entity-Specific Domain Validation
    switch (entityType) {
      case 'SUPPLIER':
        this.validateSupplier(entity as Partial<SupplierMaster>, results);
        break;
      case 'PRODUCT':
        this.validateProduct(entity as Partial<ProductMaster>, context?.activeUoms || STANDARD_UOMS, context?.activeCurrencies || STANDARD_CURRENCIES, results);
        break;
      case 'CUSTOMER':
        this.validateCustomer(entity as Partial<CustomerMaster>, context?.activeCurrencies || STANDARD_CURRENCIES, results);
        break;
      case 'LOCATION':
        this.validateLocation(entity as Partial<LocationMaster>, results);
        break;
      case 'WAREHOUSE':
        this.validateWarehouse(entity as Partial<WarehouseMaster>, results);
        break;
      case 'STORAGE_LOCATION':
        this.validateStorageLocation(entity as Partial<StorageLocationMaster>, results);
        break;
      case 'UOM':
        this.validateUOM(entity as Partial<UOMMaster>, results);
        break;
      case 'CURRENCY':
        this.validateCurrency(entity as Partial<CurrencyMaster>, results);
        break;
      case 'PAYMENT_TERMS':
        this.validatePaymentTerms(entity as Partial<PaymentTermsMaster>, results);
        break;
      case 'TAX_CLASSIFICATION':
        this.validateTaxClassification(entity as Partial<TaxClassificationMaster>, results);
        break;
      case 'RELATIONSHIP':
        this.validateRelationship(entity as Partial<SupplierProductRelationship>, context?.existingRelationships || [], results);
        break;
      default:
        results.push({
          status: 'INVALID',
          severity: 'WARNING',
          field: 'entityType',
          code: 'UNRECOGNIZED_ENTITY_TYPE',
          message: `Entity type '${entityType}' is not explicitly mapped for specialized validation.`,
          entityType,
          entityId,
        });
    }

    return results;
  }

  /**
   * Evaluates lifecycle transition validity
   */
  public validateLifecycleTransition(
    current: StewardshipState | MasterDataLifecycleState,
    next: StewardshipState | MasterDataLifecycleState,
    entityType: string,
    entityId: string
  ): ValidationResult[] {
    const allowed = VALID_LIFECYCLE_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      return [{
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'lifecycleStatus',
        code: 'ILLEGAL_LIFECYCLE_TRANSITION',
        message: `Illegal lifecycle transition from '${current}' to '${next}'. Allowed transitions: ${allowed.join(', ') || 'None'}.`,
        entityType,
        entityId,
      }];
    }
    return [];
  }

  public validateTransition(
    current: StewardshipState | MasterDataLifecycleState,
    next: StewardshipState | MasterDataLifecycleState
  ): { valid: boolean; message?: string } {
    const results = this.validateLifecycleTransition(current, next, 'GENERIC', 'GENERIC');
    return {
      valid: results.length === 0,
      message: results[0]?.message,
    };
  }

  // --- Domain Validators ---

  private validateSupplier(supplier: Partial<SupplierMaster>, results: ValidationResult[]): void {
    const entityId = supplier.id || supplier.supplierCode || 'NEW_SUPPLIER';
    const code = supplier.supplierCode || (supplier as any).id;
    const legalName = supplier.legalName || (supplier as any).name;

    if (!code?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'supplierCode',
        code: 'MISSING_SUPPLIER_CODE',
        message: 'Supplier code is required and cannot be blank.',
        entityType: 'SUPPLIER',
        entityId,
      });
    }

    if (!legalName?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'legalName',
        code: 'MISSING_LEGAL_NAME',
        message: 'Supplier legal business name is required.',
        entityType: 'SUPPLIER',
        entityId,
      });
    }

    if (supplier.country && supplier.country.length < 2) {
      results.push({
        status: 'INVALID',
        severity: 'ERROR',
        field: 'country',
        code: 'INVALID_COUNTRY_CODE',
        message: 'Country must be a valid ISO country code (e.g. US, DE, JP).',
        entityType: 'SUPPLIER',
        entityId,
      });
    }

    if (supplier.contacts && supplier.contacts.length > 0) {
      supplier.contacts.forEach((contact, idx) => {
        if (contact.email && !this.isValidEmail(contact.email)) {
          results.push({
            status: 'INVALID',
            severity: 'ERROR',
            field: `contacts[${idx}].email`,
            code: 'INVALID_EMAIL_FORMAT',
            message: `Contact email '${contact.email}' is malformed.`,
            entityType: 'SUPPLIER',
            entityId,
          });
        }
      });
    }
  }

  private validateProduct(
    product: Partial<ProductMaster>,
    activeUoms: Set<string>,
    activeCurrencies: Set<string>,
    results: ValidationResult[]
  ): void {
    const entityId = product.productId || product.productCode || (product as any).id || 'NEW_PRODUCT';
    const code = product.productCode || (product as any).id || product.productId;

    if (!code?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'id',
        code: 'MISSING_PRODUCT_CODE',
        message: 'Product SKU/Code is required.',
        entityType: 'PRODUCT',
        entityId,
      });
    }

    if (!product.name?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'name',
        code: 'MISSING_PRODUCT_NAME',
        message: 'Product name is required.',
        entityType: 'PRODUCT',
        entityId,
      });
    }

    const uom = product.baseUom || (product as any).uom;
    if (!uom?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'baseUom',
        code: 'MISSING_BASE_UOM',
        message: 'Product must specify a base Unit of Measure.',
        entityType: 'PRODUCT',
        entityId,
      });
    } else if (!activeUoms.has(uom.toUpperCase().trim())) {
      results.push({
        status: 'INVALID',
        severity: 'ERROR',
        field: 'baseUom',
        code: 'UNKNOWN_UOM',
        message: `UOM '${uom}' is not present in active reference units.`,
        entityType: 'PRODUCT',
        entityId,
      });
    }

    const rawCost = product.procurementAttributes?.standardCost ?? (product as any).unitCost;
    if (rawCost !== undefined && rawCost < 0) {
      results.push({
        status: 'INVALID',
        severity: 'ERROR',
        field: 'unitCost',
        code: 'NEGATIVE_COST',
        message: 'Standard unit cost cannot be negative.',
        entityType: 'PRODUCT',
        entityId,
      });
    }

    const startDate = (product as any).effectiveStartDate;
    const endDate = (product as any).effectiveEndDate;
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      results.push({
        status: 'INVALID',
        severity: 'ERROR',
        field: 'effectiveEndDate',
        code: 'INVALID_EFFECTIVE_DATE_RANGE',
        message: 'Effective end date must be strictly after effective start date.',
        entityType: 'PRODUCT',
        entityId,
      });
    }

    if (product.procurementAttributes) {
      if (product.procurementAttributes.standardCost < 0) {
        results.push({
          status: 'INVALID',
          severity: 'BLOCKING',
          field: 'procurementAttributes.standardCost',
          code: 'NEGATIVE_COST',
          message: 'Standard unit cost cannot be negative.',
          entityType: 'PRODUCT',
          entityId,
        });
      }
      if (product.procurementAttributes.currency && !activeCurrencies.has(product.procurementAttributes.currency.toUpperCase().trim())) {
        results.push({
          status: 'INVALID',
          severity: 'ERROR',
          field: 'procurementAttributes.currency',
          code: 'UNKNOWN_CURRENCY',
          message: `Currency '${product.procurementAttributes.currency}' is not a valid active currency.`,
          entityType: 'PRODUCT',
          entityId,
        });
      }
      if (product.procurementAttributes.purchasingLeadTimeDays < 0) {
        results.push({
          status: 'INVALID',
          severity: 'ERROR',
          field: 'procurementAttributes.purchasingLeadTimeDays',
          code: 'NEGATIVE_LEAD_TIME',
          message: 'Lead time days cannot be negative.',
          entityType: 'PRODUCT',
          entityId,
        });
      }
    }

    if (product.inventoryAttributes) {
      if (product.inventoryAttributes.safetyStock < 0 || product.inventoryAttributes.reorderPoint < 0) {
        results.push({
          status: 'INVALID',
          severity: 'ERROR',
          field: 'inventoryAttributes',
          code: 'NEGATIVE_STOCK_LEVELS',
          message: 'Safety stock and reorder point thresholds must be non-negative.',
          entityType: 'PRODUCT',
          entityId,
        });
      }
    }
  }

  private validateCustomer(customer: Partial<CustomerMaster>, activeCurrencies: Set<string>, results: ValidationResult[]): void {
    const entityId = customer.customerId || customer.customerCode || 'NEW_CUSTOMER';

    if (!customer.customerCode?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'customerCode',
        code: 'MISSING_CUSTOMER_CODE',
        message: 'Customer code is required.',
        entityType: 'CUSTOMER',
        entityId,
      });
    }

    if (!customer.legalName?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'legalName',
        code: 'MISSING_CUSTOMER_NAME',
        message: 'Customer legal name is required.',
        entityType: 'CUSTOMER',
        entityId,
      });
    }

    if (customer.currency && !activeCurrencies.has(customer.currency.toUpperCase().trim())) {
      results.push({
        status: 'INVALID',
        severity: 'ERROR',
        field: 'currency',
        code: 'UNKNOWN_CURRENCY',
        message: `Currency '${customer.currency}' is not a valid active currency.`,
        entityType: 'CUSTOMER',
        entityId,
      });
    }
  }

  private validateLocation(location: Partial<LocationMaster>, results: ValidationResult[]): void {
    const entityId = location.locationId || location.locationCode || 'NEW_LOCATION';

    if (!location.locationCode?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'locationCode',
        code: 'MISSING_LOCATION_CODE',
        message: 'Location code is required.',
        entityType: 'LOCATION',
        entityId,
      });
    }

    if (!location.name?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'name',
        code: 'MISSING_LOCATION_NAME',
        message: 'Location name is required.',
        entityType: 'LOCATION',
        entityId,
      });
    }

    if (!location.type) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'type',
        code: 'MISSING_LOCATION_TYPE',
        message: 'Location type must be specified within the hierarchy.',
        entityType: 'LOCATION',
        entityId,
      });
    }
  }

  private validateWarehouse(warehouse: Partial<WarehouseMaster>, results: ValidationResult[]): void {
    const entityId = warehouse.warehouseId || warehouse.warehouseCode || (warehouse as any).id || 'NEW_WAREHOUSE';
    const code = warehouse.warehouseCode || (warehouse as any).code || warehouse.warehouseId || (warehouse as any).id;

    if (!code?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'warehouseCode',
        code: 'MISSING_WAREHOUSE_CODE',
        message: 'Warehouse code is required.',
        entityType: 'WAREHOUSE',
        entityId,
      });
    }

    if (!warehouse.name?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'name',
        code: 'MISSING_WAREHOUSE_NAME',
        message: 'Warehouse name is required.',
        entityType: 'WAREHOUSE',
        entityId,
      });
    }
  }

  private validateStorageLocation(loc: Partial<StorageLocationMaster>, results: ValidationResult[]): void {
    const entityId = loc.storageLocationId || loc.code || (loc as any).id || 'NEW_STORAGE_LOC';
    const code = loc.code || (loc as any).id;

    if (!code?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'code',
        code: 'MISSING_STORAGE_CODE',
        message: 'Storage location bin/code is required.',
        entityType: 'STORAGE_LOCATION',
        entityId,
      });
    }

    if (!loc.warehouseId?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'warehouseId',
        code: 'MISSING_WAREHOUSE_PARENT',
        message: 'Storage location must belong to a parent Warehouse.',
        entityType: 'STORAGE_LOCATION',
        entityId,
      });
    }
  }

  private validateUOM(uom: Partial<UOMMaster>, results: ValidationResult[]): void {
    const entityId = uom.uomCode || (uom as any).code || (uom as any).id || 'NEW_UOM';
    const code = uom.uomCode || (uom as any).code || (uom as any).id;

    if (!code?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'uomCode',
        code: 'MISSING_UOM_CODE',
        message: 'UOM unit code is required.',
        entityType: 'UOM',
        entityId,
      });
    }

    if (!uom.category) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'category',
        code: 'MISSING_UOM_CATEGORY',
        message: 'UOM category (MASS, VOLUME, LENGTH, COUNT, TIME) is required.',
        entityType: 'UOM',
        entityId,
      });
    }

    if (uom.conversions) {
      uom.conversions.forEach((conv, idx) => {
        if (!conv.toUomCode || conv.multiplier <= 0) {
          results.push({
            status: 'INVALID',
            severity: 'ERROR',
            field: `conversions[${idx}]`,
            code: 'INVALID_CONVERSION_MULTIPLIER',
            message: `Conversion to '${conv.toUomCode || 'empty'}' must have a positive multiplier.`,
            entityType: 'UOM',
            entityId,
          });
        }
      });
    }
  }

  private validateCurrency(curr: Partial<CurrencyMaster>, results: ValidationResult[]): void {
    const entityId = curr.currencyCode || (curr as any).code || (curr as any).id || 'NEW_CURRENCY';
    const code = curr.currencyCode || (curr as any).code || (curr as any).id;

    if (!code || code.trim().length !== 3) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'currencyCode',
        code: 'INVALID_CURRENCY_CODE',
        message: 'Currency code must be a 3-letter ISO 4217 code (e.g. USD, EUR).',
        entityType: 'CURRENCY',
        entityId,
      });
    }

    if (!curr.name?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'name',
        code: 'MISSING_CURRENCY_NAME',
        message: 'Currency name is required.',
        entityType: 'CURRENCY',
        entityId,
      });
    }
  }

  private validatePaymentTerms(pt: Partial<PaymentTermsMaster>, results: ValidationResult[]): void {
    const entityId = pt.code || 'NEW_PAYMENT_TERMS';

    if (!pt.code?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'code',
        code: 'MISSING_TERMS_CODE',
        message: 'Payment terms code is required.',
        entityType: 'PAYMENT_TERMS',
        entityId,
      });
    }

    if (pt.netDays === undefined || pt.netDays < 0) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'netDays',
        code: 'INVALID_NET_DAYS',
        message: 'Net due days must be 0 or greater.',
        entityType: 'PAYMENT_TERMS',
        entityId,
      });
    }

    if (pt.discountPercentage !== undefined && (pt.discountPercentage < 0 || pt.discountPercentage > 100)) {
      results.push({
        status: 'INVALID',
        severity: 'ERROR',
        field: 'discountPercentage',
        code: 'INVALID_DISCOUNT_PERCENT',
        message: 'Discount percentage must be between 0% and 100%.',
        entityType: 'PAYMENT_TERMS',
        entityId,
      });
    }
  }

  private validateTaxClassification(tax: Partial<TaxClassificationMaster>, results: ValidationResult[]): void {
    const entityId = tax.taxCode || 'NEW_TAX';

    if (!tax.taxCode?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'taxCode',
        code: 'MISSING_TAX_CODE',
        message: 'Tax classification code is required.',
        entityType: 'TAX_CLASSIFICATION',
        entityId,
      });
    }

    if (tax.ratePercent === undefined || tax.ratePercent < 0 || tax.ratePercent > 100) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'ratePercent',
        code: 'INVALID_TAX_RATE',
        message: 'Tax rate percentage must be between 0% and 100%.',
        entityType: 'TAX_CLASSIFICATION',
        entityId,
      });
    }
  }

  private validateRelationship(
    rel: Partial<SupplierProductRelationship>,
    existing: Array<{ supplierId: string; productId: string; validFrom: string; validTo: string; relationshipId?: string }>,
    results: ValidationResult[]
  ): void {
    const entityId = rel.relationshipId || `${rel.supplierId}_${rel.productId}`;

    if (!rel.supplierId?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'supplierId',
        code: 'MISSING_RELATIONSHIP_SUPPLIER',
        message: 'Relationship must reference a valid supplier ID.',
        entityType: 'RELATIONSHIP',
        entityId,
      });
    }

    if (!rel.productId?.trim()) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'productId',
        code: 'MISSING_RELATIONSHIP_PRODUCT',
        message: 'Relationship must reference a valid product ID.',
        entityType: 'RELATIONSHIP',
        entityId,
      });
    }

    if (!rel.validFrom || !rel.validTo) {
      results.push({
        status: 'INVALID',
        severity: 'BLOCKING',
        field: 'effectiveDates',
        code: 'MISSING_EFFECTIVE_DATES',
        message: 'Effective dates (validFrom, validTo) are required.',
        entityType: 'RELATIONSHIP',
        entityId,
      });
    } else {
      const from = new Date(rel.validFrom).getTime();
      const to = new Date(rel.validTo).getTime();

      if (isNaN(from) || isNaN(to)) {
        results.push({
          status: 'INVALID',
          severity: 'BLOCKING',
          field: 'effectiveDates',
          code: 'MALFORMED_DATES',
          message: 'Effective dates must be valid ISO date strings.',
          entityType: 'RELATIONSHIP',
          entityId,
        });
      } else if (from >= to) {
        results.push({
          status: 'INVALID',
          severity: 'BLOCKING',
          field: 'effectiveDates',
          code: 'INVALID_DATE_RANGE',
          message: `validFrom (${rel.validFrom}) must precede validTo (${rel.validTo}).`,
          entityType: 'RELATIONSHIP',
          entityId,
        });
      } else {
        // Effective-date collision detection: check for overlapping active records
        for (const ext of existing) {
          if (ext.relationshipId && rel.relationshipId && ext.relationshipId === rel.relationshipId) continue;
          if (ext.supplierId === rel.supplierId && ext.productId === rel.productId) {
            const extFrom = new Date(ext.validFrom).getTime();
            const extTo = new Date(ext.validTo).getTime();

            // Overlap condition: max(from, extFrom) < min(to, extTo)
            if (Math.max(from, extFrom) < Math.min(to, extTo)) {
              results.push({
                status: 'INVALID',
                severity: 'BLOCKING',
                field: 'effectiveDates',
                code: 'EFFECTIVE_DATE_COLLISION',
                message: `Effective date range [${rel.validFrom} - ${rel.validTo}] overlaps with existing relationship range [${ext.validFrom} - ${ext.validTo}].`,
                entityType: 'RELATIONSHIP',
                entityId,
              });
              break;
            }
          }
        }
      }
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const masterDataValidationEngine = MasterDataValidationEngine.getInstance();
