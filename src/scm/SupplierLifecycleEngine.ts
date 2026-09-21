/**
 * ORION-9 WAVE 4 — SUPPLIER ONBOARDING & QUALIFICATION ENGINE
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import {
  DimensionQualification,
  QualificationDecisionStatus,
  SupplierLifecycleStatus,
  SupplierRecord,
} from './types';

export class SupplierLifecycleEngine {
  private static instance: SupplierLifecycleEngine;
  private suppliers: Map<string, SupplierRecord> = new Map(); // key: `${tenantId}:${supplierId}`

  private constructor() {}

  public static getInstance(): SupplierLifecycleEngine {
    if (!SupplierLifecycleEngine.instance) {
      SupplierLifecycleEngine.instance = new SupplierLifecycleEngine();
    }
    return SupplierLifecycleEngine.instance;
  }

  public async registerSupplier(params: {
    tenantId: string;
    actor: AuthorizationActor;
    legalName: string;
    supplierCode: string;
    taxIdentifier: string;
    addresses?: SupplierRecord['addresses'];
    contacts?: SupplierRecord['contacts'];
    categories?: string[];
    capabilities?: string[];
    paymentTerms?: string;
    currency?: string;
    incoterms?: string;
    bankingReference?: string;
    certifications?: string[];
    riskClassification?: SupplierRecord['riskClassification'];
  }) {
    const supplierId = `SUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const initialRecord: SupplierRecord = {
      supplierId,
      tenantId: params.tenantId,
      legalName: params.legalName,
      supplierCode: params.supplierCode,
      taxIdentifier: params.taxIdentifier,
      addresses: params.addresses || [],
      contacts: params.contacts || [],
      categories: params.categories || ['GENERAL'],
      capabilities: params.capabilities || [],
      paymentTerms: params.paymentTerms || 'NET30',
      currency: params.currency || 'USD',
      incoterms: params.incoterms || 'FOB',
      bankingReference: params.bankingReference,
      certifications: params.certifications || [],
      riskClassification: params.riskClassification || 'MEDIUM',
      status: 'DRAFT',
      qualificationStatus: 'PENDING',
      dimensions: [],
      createdAt: now,
      updatedAt: now,
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Supplier:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'Supplier',
      entityId: supplierId,
      targetState: 'DRAFT',
      requiredPermission: 'supplier:create',
      payload: initialRecord,
    }, async (record) => {
      this.suppliers.set(`${params.tenantId}:${supplierId}`, record);
      return record;
    });
  }

  public async submitSupplier(tenantId: string, supplierId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${supplierId}`;
    const supplier = this.suppliers.get(key);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'Supplier:Submit',
      tenantId,
      actor,
      entityType: 'Supplier',
      entityId: supplierId,
      currentState: supplier.status,
      targetState: 'SUBMITTED',
      requiredPermission: 'supplier:create',
      payload: null,
    }, async () => {
      supplier.status = 'SUBMITTED';
      supplier.updatedAt = new Date().toISOString();
      this.suppliers.set(key, supplier);
      return supplier;
    });
  }

  public async reviewSupplier(tenantId: string, supplierId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${supplierId}`;
    const supplier = this.suppliers.get(key);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'Supplier:Review',
      tenantId,
      actor,
      entityType: 'Supplier',
      entityId: supplierId,
      currentState: supplier.status,
      targetState: 'UNDER_REVIEW',
      requiredPermission: 'supplier:qualify',
      payload: null,
    }, async () => {
      supplier.status = 'UNDER_REVIEW';
      supplier.updatedAt = new Date().toISOString();
      this.suppliers.set(key, supplier);
      return supplier;
    });
  }

  public async startQualification(tenantId: string, supplierId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${supplierId}`;
    const supplier = this.suppliers.get(key);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'Supplier:StartQualification',
      tenantId,
      actor,
      entityType: 'Supplier',
      entityId: supplierId,
      currentState: supplier.status,
      targetState: 'QUALIFICATION',
      requiredPermission: 'supplier:qualify',
      payload: null,
    }, async () => {
      supplier.status = 'QUALIFICATION';
      supplier.updatedAt = new Date().toISOString();
      this.suppliers.set(key, supplier);
      return supplier;
    });
  }

  public async evaluateQualification(params: {
    tenantId: string;
    supplierId: string;

    actor: AuthorizationActor;
    dimensionEvaluations: DimensionQualification[];
  }) {
    const key = `${params.tenantId}:${params.supplierId}`;
    const supplier = this.suppliers.get(key);
    if (!supplier) throw new Error(`Supplier ${params.supplierId} not found`);

    // Determine overall qualification status
    const hasFail = params.dimensionEvaluations.some((d) => d.status === 'FAIL');
    const hasConditional = params.dimensionEvaluations.some((d) => d.status === 'CONDITIONAL');

    const overallStatus: QualificationDecisionStatus = hasFail
      ? 'FAIL'
      : hasConditional
      ? 'CONDITIONAL'
      : 'PASS';

    const targetStatus: SupplierLifecycleStatus = overallStatus === 'FAIL' ? 'REJECTED' : 'APPROVED';

    return scmTransactionEngine.executeCommand({
      commandName: 'Supplier:Qualify',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'Supplier',
      entityId: params.supplierId,
      currentState: supplier.status,
      targetState: targetStatus,
      requiredPermission: 'supplier:qualify',
      payload: { overallStatus, dimensions: params.dimensionEvaluations },
    }, async () => {
      supplier.dimensions = params.dimensionEvaluations;
      supplier.qualificationStatus = overallStatus;
      supplier.status = targetStatus;
      supplier.updatedAt = new Date().toISOString();
      this.suppliers.set(key, supplier);
      return supplier;
    });
  }

  public async activateSupplier(tenantId: string, supplierId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${supplierId}`;
    const supplier = this.suppliers.get(key);
    if (!supplier) throw new Error(`Supplier ${supplierId} not found`);

    // Rule: Cannot activate an un-qualified supplier
    if (supplier.qualificationStatus !== 'PASS' && supplier.qualificationStatus !== 'CONDITIONAL') {
      return {
        success: false,
        status: 'DENIED_POLICY' as const,
        message: `Policy violation: Cannot activate supplier with qualification status '${supplier.qualificationStatus}'`,
        correlationId: `CORR-ACTIVATION-${Date.now()}`,
      };
    }

    return scmTransactionEngine.executeCommand({
      commandName: 'Supplier:Activate',
      tenantId,
      actor,
      entityType: 'Supplier',
      entityId: supplierId,
      currentState: supplier.status,
      targetState: 'ACTIVE',
      requiredPermission: 'supplier:approve',
      payload: null,
    }, async () => {
      supplier.status = 'ACTIVE';
      supplier.updatedAt = new Date().toISOString();
      this.suppliers.set(key, supplier);
      return supplier;
    });
  }

  public getSupplier(tenantId: string, supplierId: string): SupplierRecord | undefined {
    return this.suppliers.get(`${tenantId}:${supplierId}`);
  }

  public listSuppliers(tenantId: string): SupplierRecord[] {
    const result: SupplierRecord[] = [];
    for (const [key, sup] of this.suppliers.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...sup });
      }
    }
    return result;
  }

  public clear(): void {
    this.suppliers.clear();
  }
}

export const supplierLifecycleEngine = SupplierLifecycleEngine.getInstance();
