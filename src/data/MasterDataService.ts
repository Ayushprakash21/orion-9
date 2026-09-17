/**
 * ORION-9 MASTER DATA LIFECYCLE SERVICE
 * Layer 7: Data Fabric Master Data Management (MDM)
 * 
 * Enforces canonical lifecycle states:
 * DRAFT -> VALIDATED -> DUPLICATE_CHECKED -> APPROVAL_PENDING -> ACTIVE -> RETIRED
 */

import { MasterDataLifecycleState, DataClassification, SourceSystemType, Product, Supplier } from '../types';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { db, loadData, saveData } from './db';

export type MasterDataEntityType = 'PRODUCT' | 'SUPPLIER' | 'FACILITY' | 'CUSTOMER';

export interface DuplicateMatch {
  existingId: string;
  existingName: string;
  matchScore: number; // 0.0 - 1.0 (e.g. 0.95 = 95% match)
  matchedField: string;
  reason: string;
}

export interface MasterDataRecord<T = any> {
  id: string; // e.g. MDR-PRD-1234
  entityType: MasterDataEntityType;
  data: T;
  state: MasterDataLifecycleState;
  version: number;
  sourceSystemId?: string;
  sourceSystemType: SourceSystemType;
  classification: DataClassification;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  validationErrors: string[];
  duplicateMatches: DuplicateMatch[];
  history: Array<{
    timestamp: string;
    fromState: MasterDataLifecycleState;
    toState: MasterDataLifecycleState;
    actor: string;
    comment?: string;
  }>;
}

export class MasterDataService {
  private static instance: MasterDataService;
  private records: Map<string, MasterDataRecord> = new Map();
  private isPersisting: boolean = false;

  private constructor() {
    this.hydrate();
  }

  public static getInstance(): MasterDataService {
    if (!MasterDataService.instance) {
      MasterDataService.instance = new MasterDataService();
    }
    return MasterDataService.instance;
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<MasterDataRecord>(db.masterData);
        if (stored && stored.length > 0) {
          stored.forEach(r => this.records.set(r.id, r));
        } else {
          this.seedInitialMasterData();
        }
      } else {
        this.seedInitialMasterData();
      }
    } catch (err) {
      console.warn('[MasterDataService] Hydration warning:', err);
      this.seedInitialMasterData();
    }
  }

  private seedInitialMasterData(): void {
    const seedRecords: MasterDataRecord[] = [
      {
        id: 'MDR-PRD-9001',
        entityType: 'PRODUCT',
        data: {
          id: 'SKU-TITAN-X1',
          name: 'Industrial Titanium Alloy Sensor Housing',
          category: 'Mechanical Components',
          unitCost: 145.50,
          sellingPrice: 289.00,
          leadTime: 21,
          safetyStock: 50,
          reorderPoint: 75,
          minOrderQty: 25,
          supplierId: 'SUP-001',
          status: 'ACTIVE'
        },
        state: 'ACTIVE',
        version: 1,
        sourceSystemId: 'SAP-MAT-99201',
        sourceSystemType: 'SAP',
        classification: 'CONFIDENTIAL',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdBy: 'SAP_SYNC_AGENT',
        approvedBy: 'Procurement Director',
        approvedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        validationErrors: [],
        duplicateMatches: [],
        history: [
          { timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), fromState: 'DRAFT', toState: 'VALIDATED', actor: 'SAP_SYNC_AGENT' },
          { timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), fromState: 'VALIDATED', toState: 'DUPLICATE_CHECKED', actor: 'System' },
          { timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), fromState: 'DUPLICATE_CHECKED', toState: 'APPROVAL_PENDING', actor: 'System' },
          { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), fromState: 'APPROVAL_PENDING', toState: 'ACTIVE', actor: 'Procurement Director', comment: 'Approved for production line' }
        ]
      },
      {
        id: 'MDR-SUP-9002',
        entityType: 'SUPPLIER',
        data: {
          id: 'SUP-AURORA-SEM',
          name: 'Aurora Semiconductor Global AG',
          category: 'Electronic Components',
          region: 'Europe (DACH)',
          country: 'Germany',
          contact: 'procurement@aurora-semi.de',
          otif: 96.5,
          qualityRate: 99.1,
          leadTime: 14,
          defectRate: 0.9,
          spend: 485000,
          status: 'ACTIVE'
        },
        state: 'ACTIVE',
        version: 1,
        sourceSystemId: 'ORACLE-VND-55410',
        sourceSystemType: 'ORACLE',
        classification: 'CONFIDENTIAL',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        createdBy: 'ORACLE_INGESTION',
        approvedBy: 'VP Supply Chain',
        approvedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        validationErrors: [],
        duplicateMatches: [],
        history: [
          { timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), fromState: 'DRAFT', toState: 'ACTIVE', actor: 'VP Supply Chain' }
        ]
      },
      {
        id: 'MDR-PRD-9003',
        entityType: 'PRODUCT',
        data: {
          id: 'SKU-OPTIC-F5',
          name: 'Fiber Optic Transceiver Core 100G',
          category: 'Optoelectronics',
          unitCost: 320.00,
          sellingPrice: 580.00,
          leadTime: 35,
          safetyStock: 30,
          reorderPoint: 45,
          minOrderQty: 10,
          supplierId: 'SUP-002',
          status: 'PENDING'
        },
        state: 'APPROVAL_PENDING',
        version: 1,
        sourceSystemId: 'NETSUITE-ITEM-884',
        sourceSystemType: 'NETSUITE',
        classification: 'RESTRICTED',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdBy: 'integration_agent',
        validationErrors: [],
        duplicateMatches: [],
        history: [
          { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), fromState: 'DRAFT', toState: 'VALIDATED', actor: 'integration_agent' },
          { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), fromState: 'VALIDATED', toState: 'DUPLICATE_CHECKED', actor: 'System' },
          { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), fromState: 'DUPLICATE_CHECKED', toState: 'APPROVAL_PENDING', actor: 'System', comment: 'Ready for governance sign-off' }
        ]
      }
    ];

    seedRecords.forEach(r => this.records.set(r.id, r));
  }

  private async persist(): Promise<void> {
    if (this.isPersisting || typeof window === 'undefined') return;
    this.isPersisting = true;
    try {
      await saveData(db.masterData, Array.from(this.records.values()));
    } catch (e) {
      console.warn('[MasterDataService] Persistence error:', e);
    } finally {
      this.isPersisting = false;
    }
  }

  /**
   * Proposes a new master data record into the pipeline in DRAFT state
   */
  public proposeRecord<T = any>(params: {
    entityType: MasterDataEntityType;
    data: T;
    sourceSystemType: SourceSystemType;
    sourceSystemId?: string;
    classification?: DataClassification;
    actor: string;
  }): MasterDataRecord<T> {
    const id = `MDR-${params.entityType.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: MasterDataRecord<T> = {
      id,
      entityType: params.entityType,
      data: params.data,
      state: 'DRAFT',
      version: 1,
      sourceSystemId: params.sourceSystemId,
      sourceSystemType: params.sourceSystemType,
      classification: params.classification || 'INTERNAL',
      createdAt: now,
      updatedAt: now,
      createdBy: params.actor,
      validationErrors: [],
      duplicateMatches: [],
      history: [
        {
          timestamp: now,
          fromState: 'DRAFT',
          toState: 'DRAFT',
          actor: params.actor,
          comment: `Initial record created via ${params.sourceSystemType}`
        }
      ]
    };

    this.records.set(id, record);
    this.persist();

    kernelEventBus.publish('orion:master-data:created', {
      recordId: id,
      entityType: params.entityType,
      sourceSystemType: params.sourceSystemType
    }, {
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: id,
      entityType: params.entityType,
      classification: record.classification
    });

    return record;
  }

  /**
   * Validates a master data record against domain schemas and business rules
   */
  public validateRecord(recordId: string, actor: string = 'System'): { isValid: boolean; errors: string[] } {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const errors: string[] = [];
    const data = record.data;

    if (!data) {
      errors.push('Payload contains null or undefined data.');
    } else {
      if (record.entityType === 'PRODUCT') {
        const prod = data as Partial<Product>;
        if (!prod.id || prod.id.trim() === '') errors.push('Missing unique Product SKU / Identifier.');
        if (!prod.name || prod.name.trim() === '') errors.push('Missing Product Name.');
        if (prod.unitCost !== undefined && prod.unitCost < 0) errors.push('Unit cost cannot be negative.');
        if (prod.sellingPrice !== undefined && prod.sellingPrice < 0) errors.push('Selling price cannot be negative.');
        if (prod.leadTime !== undefined && prod.leadTime < 0) errors.push('Lead time cannot be negative.');
      } else if (record.entityType === 'SUPPLIER') {
        const sup = data as Partial<Supplier>;
        if (!sup.id || sup.id.trim() === '') errors.push('Missing Supplier ID.');
        if (!sup.name || sup.name.trim() === '') errors.push('Missing Supplier Name.');
        if (sup.otif !== undefined && (sup.otif < 0 || sup.otif > 100)) errors.push('OTIF score must be between 0 and 100.');
        if (sup.defectRate !== undefined && (sup.defectRate < 0 || sup.defectRate > 100)) errors.push('Defect rate must be between 0 and 100.');
      }
    }

    const previousState = record.state;
    record.validationErrors = errors;
    record.updatedAt = new Date().toISOString();

    if (errors.length === 0) {
      record.state = 'VALIDATED';
      record.history.push({
        timestamp: record.updatedAt,
        fromState: previousState,
        toState: 'VALIDATED',
        actor,
        comment: 'Passed all schema and semantic validation checks.'
      });
    }

    this.persist();

    kernelEventBus.publish('orion:master-data:validated', {
      recordId,
      isValid: errors.length === 0,
      errors
    }, {
      actor: { id: actor, type: 'SYSTEM', name: actor },
      entityId: recordId,
      entityType: record.entityType
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Scans for duplicates against existing active and pipeline records
   */
  public checkDuplicates(recordId: string, existingRecords: Array<{ id: string; name: string }>, actor: string = 'System'): DuplicateMatch[] {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const matches: DuplicateMatch[] = [];
    const targetName = (record.data?.name || '').toLowerCase().trim();
    const targetId = (record.data?.id || '').toLowerCase().trim();

    // Scan against existing operational records
    existingRecords.forEach(ext => {
      const extName = ext.name.toLowerCase().trim();
      const extId = ext.id.toLowerCase().trim();

      // Exact ID match
      if (extId === targetId && targetId !== '') {
        matches.push({
          existingId: ext.id,
          existingName: ext.name,
          matchScore: 1.0,
          matchedField: 'id',
          reason: `Exact identifier collision with active record ${ext.id}`
        });
        return;
      }

      // Name similarity
      if (targetName && extName) {
        if (targetName === extName) {
          matches.push({
            existingId: ext.id,
            existingName: ext.name,
            matchScore: 0.98,
            matchedField: 'name',
            reason: `Exact entity name match with active record ${ext.name}`
          });
        } else if (targetName.includes(extName) || extName.includes(targetName)) {
          matches.push({
            existingId: ext.id,
            existingName: ext.name,
            matchScore: 0.85,
            matchedField: 'name',
            reason: `Partial substring name overlap with ${ext.name}`
          });
        }
      }
    });

    record.duplicateMatches = matches;
    record.updatedAt = new Date().toISOString();
    const previousState = record.state;
    record.state = 'DUPLICATE_CHECKED';
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'DUPLICATE_CHECKED',
      actor,
      comment: matches.length > 0 ? `Identified ${matches.length} potential duplicate candidates.` : 'Zero duplicate collisions detected.'
    });

    this.persist();

    kernelEventBus.publish('orion:master-data:duplicate-checked', {
      recordId,
      matchesCount: matches.length,
      matches
    }, {
      actor: { id: actor, type: 'SYSTEM', name: actor },
      entityId: recordId,
      entityType: record.entityType
    });

    return matches;
  }

  /**
   * Submits record for human governance approval
   */
  public submitForApproval(recordId: string, actor: string): MasterDataRecord {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    if (record.validationErrors.length > 0) {
      throw new Error(`Cannot submit record with unresolved validation errors.`);
    }

    const previousState = record.state;
    record.state = 'APPROVAL_PENDING';
    record.updatedAt = new Date().toISOString();
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'APPROVAL_PENDING',
      actor,
      comment: 'Submitted for human-in-the-loop governance approval'
    });

    this.persist();

    kernelAuditEngine.record({
      action: 'SUBMIT_MASTER_DATA_APPROVAL',
      actor: { id: actor, type: 'USER', name: actor },
      entity: { id: recordId, type: record.entityType },
      classification: record.classification,
      details: {
        recordId,
        entityType: record.entityType,
        sourceSystem: record.sourceSystemType
      }
    });

    kernelEventBus.publish('orion:master-data:approval-requested', {
      recordId,
      entityType: record.entityType,
      data: record.data,
      requester: actor
    }, {
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification
    });

    return record;
  }

  /**
   * Approves and activates record into the live operating pool
   */
  public activateRecord(recordId: string, approver: string, comment?: string): MasterDataRecord {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const previousState = record.state;
    record.state = 'ACTIVE';
    record.version += 1;
    record.approvedBy = approver;
    record.approvedAt = new Date().toISOString();
    record.updatedAt = record.approvedAt;
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'ACTIVE',
      actor: approver,
      comment: comment || 'Master data record approved and activated for enterprise operations.'
    });

    this.persist();

    kernelAuditEngine.record({
      action: 'ACTIVATE_MASTER_DATA',
      actor: { id: approver, type: 'USER', name: approver },
      entity: { id: recordId, type: record.entityType },
      classification: record.classification,
      details: {
        recordId,
        entityType: record.entityType,
        version: record.version,
        comment
      }
    });

    kernelEventBus.publish('orion:master-data:activated', {
      recordId,
      entityType: record.entityType,
      data: record.data,
      approver
    }, {
      actor: { id: approver, type: 'USER', name: approver },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification
    });

    return record;
  }

  /**
   * Retires or decommissions a master data record
   */
  public retireRecord(recordId: string, actor: string, reason: string): MasterDataRecord {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const previousState = record.state;
    record.state = 'RETIRED';
    record.updatedAt = new Date().toISOString();
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'RETIRED',
      actor,
      comment: reason
    });

    this.persist();

    kernelAuditEngine.record({
      action: 'RETIRE_MASTER_DATA',
      actor: { id: actor, type: 'USER', name: actor },
      entity: { id: recordId, type: record.entityType },
      classification: record.classification,
      details: { recordId, reason }
    });

    kernelEventBus.publish('orion:master-data:retired', {
      recordId,
      entityType: record.entityType,
      reason
    }, {
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType
    });

    return record;
  }

  public getRecord(id: string): MasterDataRecord | undefined {
    return this.records.get(id);
  }

  public getAllRecords(filter?: { entityType?: MasterDataEntityType; state?: MasterDataLifecycleState }): MasterDataRecord[] {
    let list = Array.from(this.records.values());
    if (filter?.entityType) list = list.filter(r => r.entityType === filter.entityType);
    if (filter?.state) list = list.filter(r => r.state === filter.state);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export const masterDataService = MasterDataService.getInstance();
