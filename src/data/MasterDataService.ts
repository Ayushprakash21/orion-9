/**
 * ORION-9 MASTER DATA & DATA QUALITY SERVICE
 * Layer 7: Data Fabric Master Data Management (MDM) & Golden Record Authority
 *
 * Authoritative persistence via Cloud Firestore with Dexie/IndexedDB offline read cache.
 * Governed execution via Kernel CommandBus, AuthorizationEngine, and KernelAuditEngine.
 * Enforces canonical lifecycle states:
 * DRAFT -> VALIDATED -> REVIEW_REQUIRED -> APPROVAL_PENDING -> APPROVED -> ACTIVE -> RETIRED / SUPERSEDED
 */

import {
  MasterDataEntityType,
  MasterDataLifecycleState,
  StewardshipState,
  DataClassification,
  SourceSystemType,
  ValidationResult,
  DataQualityScore,
  GoldenRecord,
} from '../types';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { KernelCommandBus } from '../kernel/CommandBus';
import { aiSecurityGuard } from '../ai/AISecurityGuard';
import { db, loadData, saveData } from './db';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { masterDataValidationEngine } from '../services/masterdata/ValidationEngine';
import { masterDataNormalizationEngine } from '../services/masterdata/NormalizationEngine';
import { masterDataDuplicateDetectionEngine, DuplicateCandidate } from '../services/masterdata/DuplicateDetectionEngine';
import { masterDataQualityScoringEngine } from '../services/masterdata/DataQualityScoringEngine';
import { masterDataIngestionPipeline, IngestionBatchReport } from '../services/masterdata/MasterDataIngestionPipeline';

export type { MasterDataEntityType };

export interface DuplicateMatch {
  existingId: string;
  existingName: string;
  matchScore: number; // 0.0 - 1.0
  matchedField: string;
  reason: string;
}

export interface MasterDataRecord<T = any> {
  id: string; // e.g. MDR-PRD-1234
  entityType: MasterDataEntityType;
  tenantId: string;
  data: T;
  state: MasterDataLifecycleState | StewardshipState;
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
  validationResults?: ValidationResult[];
  duplicateMatches: DuplicateMatch[];
  duplicateCandidates?: DuplicateCandidate[];
  qualityScore?: DataQualityScore;
  history: Array<{
    timestamp: string;
    fromState: MasterDataLifecycleState | StewardshipState;
    toState: MasterDataLifecycleState | StewardshipState;
    actor: string;
    comment?: string;
  }>;
}

export class MasterDataService {
  private static instance: MasterDataService;
  private records: Map<string, MasterDataRecord> = new Map();
  private goldenRecords: Map<string, GoldenRecord> = new Map();
  private isPersisting: boolean = false;
  private handlersRegistered: boolean = false;

  private constructor() {
    this.hydrate();
    this.registerKernelHandlers();
  }

  public static getInstance(): MasterDataService {
    if (!MasterDataService.instance) {
      MasterDataService.instance = new MasterDataService();
    }
    return MasterDataService.instance;
  }

  /**
   * Registers Kernel CommandBus handlers for authoritative master-data mutations
   */
  private registerKernelHandlers(): void {
    if (this.handlersRegistered) return;
    const bus = KernelCommandBus.getInstance();

    bus.registerHandler('CREATE_MASTER_RECORD', async (cmd) => {
      return this.proposeRecord({
        entityType: cmd.payload.entityType,
        tenantId: (cmd.tenant as any)?.organizationId || (cmd.tenant as any)?.id || cmd.payload.tenantId || 'DEFAULT_TENANT',
        data: cmd.payload.data,
        sourceSystemType: cmd.payload.sourceSystemType || 'ORION_INTERNAL',
        sourceSystemId: cmd.payload.sourceSystemId,
        classification: cmd.payload.classification,
        actor: cmd.actor?.name || cmd.actor?.id || 'Unknown',
      });
    });

    bus.registerHandler('UPDATE_MASTER_RECORD', async (cmd) => {
      return this.updateRecord(cmd.payload.recordId, cmd.payload.data, cmd.actor?.name || cmd.actor?.id || 'Unknown', cmd.payload.comment);
    });

    bus.registerHandler('APPROVE_MASTER_DATA_STEWARDSHIP', async (cmd) => {
      // AI Self-Approval Guard
      const approverActor: any = {
        id: cmd.actor?.id || 'unknown-approver',
        name: cmd.actor?.name || 'Unknown Approver',
        type: cmd.actor?.type === 'AI_AGENT' ? 'AI_AGENT' : 'HUMAN_USER',
        roles: cmd.actor?.role ? [cmd.actor.role] : ['platform_admin'],
        permissions: ['master_data:stewardship_approve'],
      };
      const requesterActor: any = {
        id: 'system-proposer',
        name: 'System Proposer',
        type: 'HUMAN_USER',
        roles: ['procurement_specialist'],
        permissions: ['master_data:create'],
      };
      aiSecurityGuard.assertCanApprove(approverActor, requesterActor, cmd.commandId);
      return this.activateRecord(cmd.payload.recordId, cmd.actor?.name || cmd.actor?.id || 'Steward', cmd.payload.comment);
    });

    bus.registerHandler('REJECT_MASTER_DATA_STEWARDSHIP', async (cmd) => {
      return this.rejectRecord(cmd.payload.recordId, cmd.actor?.name || cmd.actor?.id || 'Steward', cmd.payload.reason);
    });

    bus.registerHandler('RETIRE_MASTER_DATA', async (cmd) => {
      return this.retireRecord(cmd.payload.recordId, cmd.actor?.name || cmd.actor?.id || 'Unknown', cmd.payload.reason);
    });

    this.handlersRegistered = true;
  }

  private async hydrate(): Promise<void> {
    try {
      // 1. Try authoritative Cloud Firestore first if available
      const firestore = getFirebaseFirestore();
      if (firestore) {
        try {
          const colRef = collection(firestore, 'master_data');
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            snap.forEach((d) => {
              const r = d.data() as MasterDataRecord;
              this.records.set(r.id, r);
            });
            return;
          }
        } catch (fsErr) {
          console.warn('[MasterDataService] Firestore hydration fallback to cache:', fsErr);
        }
      }

      // 2. Read through local Dexie cache
      if (typeof window !== 'undefined') {
        const stored = await loadData<MasterDataRecord>(db.masterData);
        if (stored && stored.length > 0) {
          stored.forEach((r) => this.records.set(r.id, r));
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
        tenantId: 'ORG-DEFAULT',
        data: {
          productId: 'SKU-TITAN-X1',
          productCode: 'SKU-TITAN-X1',
          id: 'SKU-TITAN-X1',
          name: 'Industrial Titanium Alloy Sensor Housing',
          description: 'High-precision titanium housing for hostile industrial environments.',
          category: 'Mechanical Components',
          productGroup: 'Sensors',
          productType: 'FINISHED_GOODS',
          baseUom: 'EA',
          unitCost: 145.50,
          sellingPrice: 289.00,
          leadTime: 21,
          safetyStock: 50,
          reorderPoint: 75,
          minOrderQty: 25,
          supplierId: 'SUP-001',
          status: 'ACTIVE',
          procurementAttributes: {
            standardCost: 145.50,
            currency: 'USD',
            purchasingLeadTimeDays: 21,
            minOrderQty: 25,
          },
          inventoryAttributes: {
            trackingMethod: 'SERIAL',
            safetyStock: 50,
            reorderPoint: 75,
            abcClassification: 'A',
          },
          planningAttributes: {
            mrpEnabled: true,
            forecastRelevant: true,
            planningHorizonDays: 90,
          },
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
          { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), fromState: 'APPROVAL_PENDING', toState: 'ACTIVE', actor: 'Procurement Director', comment: 'Approved for production line' },
        ],
      },
      {
        id: 'MDR-SUP-9002',
        entityType: 'SUPPLIER',
        tenantId: 'ORG-DEFAULT',
        data: {
          id: 'SUP-AURORA-SEM',
          supplierCode: 'SUP-AURORA-SEM',
          legalName: 'Aurora Semiconductor Global AG',
          displayName: 'Aurora Semi',
          name: 'Aurora Semiconductor Global AG',
          category: 'Electronic Components',
          supplierType: 'DIRECT_MATERIAL',
          region: 'Europe (DACH)',
          country: 'DE',
          paymentTerms: 'NET30',
          currency: 'EUR',
          qualificationStatus: 'QUALIFIED',
          riskStatus: 'LOW',
          otif: 96.5,
          qualityRate: 99.1,
          leadTime: 14,
          defectRate: 0.9,
          spend: 485000,
          status: 'ACTIVE',
          addresses: [
            {
              addressId: 'ADDR-01',
              type: 'HEADQUARTERS',
              line1: 'Industriestrasse 42',
              city: 'Munich',
              postalCode: '80331',
              country: 'DE',
              isPrimary: true,
            },
          ],
          contacts: [
            {
              contactId: 'CONT-01',
              firstName: 'Hermann',
              lastName: 'Weber',
              email: 'procurement@aurora-semi.de',
              phone: '+4989123456',
              isPrimary: true,
            },
          ],
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
          { timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), fromState: 'DRAFT', toState: 'ACTIVE', actor: 'VP Supply Chain' },
        ],
      },
    ];

    seedRecords.forEach((r) => this.records.set(r.id, r));
  }

  private async persist(record?: MasterDataRecord): Promise<void> {
    if (this.isPersisting) return;
    this.isPersisting = true;

    try {
      // 1. Authoritative Firestore Persistence
      const firestore = getFirebaseFirestore();
      if (firestore && record) {
        try {
          const docRef = doc(firestore, 'master_data', record.id);
          await setDoc(docRef, record, { merge: true });
        } catch (fsErr) {
          console.warn('[MasterDataService] Firestore persist error:', fsErr);
        }
      }

      // 2. Local Dexie/IndexedDB offline read-through cache
      if (typeof window !== 'undefined') {
        await saveData(db.masterData, Array.from(this.records.values()));
      }
    } catch (e) {
      console.warn('[MasterDataService] Persistence warning:', e);
    } finally {
      this.isPersisting = false;
    }
  }

  /**
   * Proposes a new master data record into the pipeline in DRAFT state
   */
  public proposeRecord<T = any>(params: {
    entityType: MasterDataEntityType;
    tenantId?: string;
    data: T;
    sourceSystemType: SourceSystemType;
    sourceSystemId?: string;
    classification?: DataClassification;
    actor: string;
  }): MasterDataRecord<T> {
    const tenantId = params.tenantId || (params.data as any)?.tenantId || 'ORG-DEFAULT';
    const id = `MDR-${params.entityType.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    // Deterministic Normalization
    const norm = masterDataNormalizationEngine.normalizeRecord(params.data as any, params.entityType);
    const normalizedData = norm.normalized;
    normalizedData.tenantId = tenantId;

    const record: MasterDataRecord<T> = {
      id,
      entityType: params.entityType,
      tenantId,
      data: normalizedData,
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
          comment: `Initial master record created via ${params.sourceSystemType}`,
        },
      ],
    };

    // Auto-validate and score
    const valResults = masterDataValidationEngine.validate(params.entityType, normalizedData, { targetTenantId: tenantId });
    record.validationResults = valResults;
    record.validationErrors = valResults.filter(v => v.severity === 'BLOCKING' || v.severity === 'ERROR').map(v => v.message);

    const dupCandidates = masterDataDuplicateDetectionEngine.findDuplicates(
      params.entityType,
      normalizedData,
      Array.from(this.records.values()).map(r => r.data)
    );
    record.duplicateCandidates = dupCandidates;
    record.duplicateMatches = dupCandidates.map(d => ({
      existingId: d.targetRecordId,
      existingName: d.matchedField,
      matchScore: d.similarityScore,
      matchedField: d.matchedField,
      reason: d.reason,
    }));

    record.qualityScore = masterDataQualityScoringEngine.computeScore({
      entityType: params.entityType,
      entity: normalizedData,
      validationResults: valResults,
      duplicates: dupCandidates,
    });

    this.records.set(id, record);
    this.persist(record);

    kernelEventBus.publish('orion:master-data:created', {
      recordId: id,
      entityType: params.entityType,
      tenantId,
      sourceSystemType: params.sourceSystemType,
    }, {
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: id,
      entityType: params.entityType,
      classification: record.classification,
    });

    return record;
  }

  /**
   * Updates an existing master data record with version increment N -> N+1
   */
  public updateRecord<T = any>(recordId: string, updatedData: Partial<T>, actor: string, reason?: string): MasterDataRecord<T> {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const now = new Date().toISOString();
    const previousState = record.state;
    const oldVersion = record.version;

    // Normalization
    const merged = { ...record.data, ...updatedData };
    const norm = masterDataNormalizationEngine.normalizeRecord(merged, record.entityType);
    record.data = norm.normalized;

    record.version = oldVersion + 1;
    record.state = 'DRAFT';
    record.updatedAt = now;
    record.history.push({
      timestamp: now,
      fromState: previousState,
      toState: 'DRAFT',
      actor,
      comment: reason || `Updated fields (Version ${oldVersion} -> ${record.version})`,
    });

    // Re-validate and re-score
    const valResults = masterDataValidationEngine.validate(record.entityType, record.data, { targetTenantId: record.tenantId });
    record.validationResults = valResults;
    record.validationErrors = valResults.filter(v => v.severity === 'BLOCKING' || v.severity === 'ERROR').map(v => v.message);

    record.qualityScore = masterDataQualityScoringEngine.computeScore({
      entityType: record.entityType,
      entity: record.data,
      validationResults: valResults,
      duplicates: record.duplicateCandidates || [],
    });

    this.records.set(recordId, record);
    this.persist(record);

    kernelAuditEngine.record({
      action: 'UPDATE_MASTER_DATA',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
      details: {
        recordId,
        version: record.version,
        reason,
      },
    });

    return record;
  }

  /**
   * Validates a master data record against domain schemas and business rules
   */
  public validateRecord(recordId: string, actor: string = 'System'): { isValid: boolean; errors: string[] } {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const results = masterDataValidationEngine.validate(record.entityType, record.data, { targetTenantId: record.tenantId });
    const errors = results.filter(v => v.severity === 'BLOCKING' || v.severity === 'ERROR').map(v => v.message);

    const previousState = record.state;
    record.validationResults = results;
    record.validationErrors = errors;
    record.updatedAt = new Date().toISOString();

    if (errors.length === 0 && record.state === 'DRAFT') {
      record.state = 'VALIDATED';
      record.history.push({
        timestamp: record.updatedAt,
        fromState: previousState,
        toState: 'VALIDATED',
        actor,
        comment: 'Passed all schema and semantic validation checks.',
      });
    }

    record.qualityScore = masterDataQualityScoringEngine.computeScore({
      entityType: record.entityType,
      entity: record.data,
      validationResults: results,
      duplicates: record.duplicateCandidates || [],
    });

    this.persist(record);

    kernelEventBus.publish('orion:master-data:validated', {
      recordId,
      isValid: errors.length === 0,
      errors,
    }, {
      actor: { id: actor, type: 'SYSTEM', name: actor },
      entityId: recordId,
      entityType: record.entityType,
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Scans for duplicates against existing active and pipeline records
   */
  public checkDuplicates(recordId: string, existingRecords: Array<{ id: string; name: string }>, actor: string = 'System'): DuplicateMatch[] {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const corpus = Array.from(this.records.values()).map(r => r.data);
    const candidates = masterDataDuplicateDetectionEngine.findDuplicates(record.entityType, record.data, corpus);

    record.duplicateCandidates = candidates;
    record.duplicateMatches = candidates.map(d => ({
      existingId: d.targetRecordId,
      existingName: d.matchedField,
      matchScore: d.similarityScore,
      matchedField: d.matchedField,
      reason: d.reason,
    }));

    record.updatedAt = new Date().toISOString();
    const previousState = record.state;
    record.state = 'DUPLICATE_CHECKED';
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'DUPLICATE_CHECKED',
      actor,
      comment: candidates.length > 0 ? `Identified ${candidates.length} potential duplicate candidates.` : 'Zero duplicate collisions detected.',
    });

    record.qualityScore = masterDataQualityScoringEngine.computeScore({
      entityType: record.entityType,
      entity: record.data,
      validationResults: record.validationResults || [],
      duplicates: candidates,
    });

    this.persist(record);

    kernelEventBus.publish('orion:master-data:duplicate-checked', {
      recordId,
      matchesCount: candidates.length,
      matches: record.duplicateMatches,
    }, {
      actor: { id: actor, type: 'SYSTEM', name: actor },
      entityId: recordId,
      entityType: record.entityType,
    });

    return record.duplicateMatches;
  }

  /**
   * Submits record for human governance approval
   */
  public submitForApproval(recordId: string, actor: string): MasterDataRecord {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    if (record.validationErrors.length > 0) {
      throw new Error(`Cannot submit record with unresolved blocking or error validation issues.`);
    }

    const previousState = record.state;
    record.state = 'APPROVAL_PENDING';
    record.updatedAt = new Date().toISOString();
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'APPROVAL_PENDING',
      actor,
      comment: 'Submitted for human-in-the-loop governance approval',
    });

    this.persist(record);

    kernelAuditEngine.record({
      action: 'SUBMIT_MASTER_DATA_APPROVAL',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
      details: {
        recordId,
        entityType: record.entityType,
        sourceSystem: record.sourceSystemType,
      },
    });

    kernelEventBus.publish('orion:master-data:approval-requested', {
      recordId,
      entityType: record.entityType,
      data: record.data,
      requester: actor,
    }, {
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
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
    record.approvedBy = approver;
    record.approvedAt = new Date().toISOString();
    record.updatedAt = record.approvedAt;
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'ACTIVE',
      actor: approver,
      comment: comment || 'Master data record approved and activated for enterprise operations.',
    });

    this.consolidateGoldenRecord(record);
    this.persist(record);

    kernelAuditEngine.record({
      action: 'ACTIVATE_MASTER_DATA',
      actor: { id: approver, type: 'USER', name: approver },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
      details: {
        recordId,
        entityType: record.entityType,
        version: record.version,
        comment,
      },
    });

    kernelEventBus.publish('orion:master-data:activated', {
      recordId,
      entityType: record.entityType,
      data: record.data,
      approver,
    }, {
      actor: { id: approver, type: 'USER', name: approver },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
    });

    return record;
  }

  /**
   * Rejects a pending record
   */
  public rejectRecord(recordId: string, actor: string, reason: string): MasterDataRecord {
    const record = this.records.get(recordId);
    if (!record) throw new Error(`Record ${recordId} not found.`);

    const previousState = record.state;
    record.state = 'REJECTED';
    record.updatedAt = new Date().toISOString();
    record.history.push({
      timestamp: record.updatedAt,
      fromState: previousState,
      toState: 'REJECTED',
      actor,
      comment: reason,
    });

    this.persist(record);

    kernelAuditEngine.record({
      action: 'REJECT_MASTER_DATA',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
      details: { recordId, reason },
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
      comment: reason,
    });

    this.persist(record);

    kernelAuditEngine.record({
      action: 'RETIRE_MASTER_DATA',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
      classification: record.classification,
      details: { recordId, reason },
    });

    kernelEventBus.publish('orion:master-data:retired', {
      recordId,
      entityType: record.entityType,
      reason,
    }, {
      actor: { id: actor, type: 'USER', name: actor },
      entityId: recordId,
      entityType: record.entityType,
    });

    return record;
  }

  /**
   * Consolidates an approved master record into a Golden Record
   */
  public consolidateGoldenRecord(record: MasterDataRecord): GoldenRecord {
    const goldenId = record.id;
    const now = new Date().toISOString();

    const golden: GoldenRecord = {
      id: goldenId,
      entityType: record.entityType,
      canonicalId: record.data.id || record.id,
      tenantId: record.tenantId,
      canonicalData: record.data,
      payload: record.data,
      sourceRecords: [
        {
          sourceSystem: record.sourceSystemType,
          sourceRecordId: record.sourceSystemId || record.id,
          extractedAt: record.createdAt,
          data: record.data,
          confidence: 0.95,
        },
      ],
      provenanceMap: {},
      normalizationStatus: 'COMPLETED',
      validationStatus: record.validationErrors.length === 0 ? 'VALID' : 'WARNINGS',
      duplicateStatus: (record.duplicateMatches?.length || 0) === 0 ? 'UNIQUE' : 'POTENTIAL_DUPLICATES_DETECTED',
      qualityScore: record.qualityScore?.overallScore || 90,
      confidenceScore: 0.95,
      stewardshipStatus: 'ACTIVE',
      version: record.version,
      validFrom: now,
      validTo: '2099-12-31T23:59:59Z',
      lineage: {
        entityId: record.id,
        entityType: record.entityType,
        sourceSystemId: record.sourceSystemId,
        sourceSystemType: record.sourceSystemType,
        transformedAt: now,
        actor: record.approvedBy || 'System',
        classification: record.classification,
      },
      createdAt: now,
      updatedAt: now,
      lastReconciledAt: now,
    };

    this.goldenRecords.set(goldenId, golden);

    // Persist golden record
    const firestore = getFirebaseFirestore();
    if (firestore) {
      try {
        const docRef = doc(firestore, 'golden_records', goldenId);
        setDoc(docRef, golden, { merge: true });
      } catch (e) {
        console.warn('[MasterDataService] Golden record persist warning:', e);
      }
    }

    return golden;
  }

  public getGoldenRecord(arg1: string, arg2?: string): GoldenRecord | undefined {
    const id = arg2 || arg1;
    const direct = this.goldenRecords.get(id);
    if (direct) return direct;
    return Array.from(this.goldenRecords.values()).find(
      g => g.id === id || g.canonicalId === id || g.canonicalData?.id === id || g.sourceRecords.some(s => s.sourceRecordId === id)
    );
  }

  public getAllGoldenRecords(tenantId?: string): GoldenRecord[] {
    let list = Array.from(this.goldenRecords.values());
    if (tenantId) list = list.filter(g => g.tenantId === tenantId);
    return list;
  }

  public getRecord(id: string): MasterDataRecord | undefined {
    return this.records.get(id);
  }

  public getAllRecords(filter?: { entityType?: MasterDataEntityType; state?: MasterDataLifecycleState | StewardshipState; tenantId?: string }): MasterDataRecord[] {
    let list = Array.from(this.records.values());
    if (filter?.entityType) list = list.filter(r => r.entityType === filter.entityType);
    if (filter?.state) list = list.filter(r => r.state === filter.state);
    if (filter?.tenantId) list = list.filter(r => r.tenantId === filter.tenantId);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Executes batch ingestion through MasterDataIngestionPipeline
   */
  public async ingestBatch(params: {
    tenantId: string;
    entityType: MasterDataEntityType;
    records: Array<{ rawId?: string; sourceSystemType: SourceSystemType; sourceRecordId?: string; payload: Record<string, any> }>;
    actor: string;
    autoApproveClean?: boolean;
  }): Promise<IngestionBatchReport> {
    const existingCorpus = Array.from(this.records.values()).map(r => r.data);
    const report = await masterDataIngestionPipeline.executePipeline({
      ...params,
      existingCorpus,
    });

    // Populate pipeline records into master store
    for (const res of report.recordResults) {
      if (res.status === 'SUCCEEDED' || res.status === 'NEEDS_REVIEW') {
        const id = `MDR-${params.entityType.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}-${res.rowNumber}`;
        const record: MasterDataRecord = {
          id,
          entityType: params.entityType,
          tenantId: params.tenantId,
          data: res.normalizedData,
          state: res.lifecycleState,
          version: 1,
          sourceSystemId: res.sourceRecordId,
          sourceSystemType: (res.normalizedData.sourceSystem as SourceSystemType) || 'ORION_INTERNAL',
          classification: 'INTERNAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: params.actor,
          validationErrors: res.errors,
          validationResults: res.validationResults,
          duplicateMatches: res.duplicateCandidates.map(d => ({
            existingId: d.targetRecordId,
            existingName: d.matchedField,
            matchScore: d.similarityScore,
            matchedField: d.matchedField,
            reason: d.reason,
          })),
          duplicateCandidates: res.duplicateCandidates,
          qualityScore: res.qualityScore,
          history: [
            {
              timestamp: new Date().toISOString(),
              fromState: 'DRAFT',
              toState: res.lifecycleState,
              actor: params.actor,
              comment: `Batch ingested via Job ${report.jobId}`,
            },
          ],
        };

        this.records.set(id, record);
        this.persist(record);
      }
    }

    return report;
  }
}

export const masterDataService = MasterDataService.getInstance();
