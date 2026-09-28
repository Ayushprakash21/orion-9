/**
 * ORION-9 ENTERPRISE GOVERNANCE POLICY REPOSITORY
 * 
 * Authoritative persistence plane for enterprise governance policies using Cloud Firestore
 * (`control_policies` collection), strictly eliminating in-process memory as a source of truth.
 * 
 * Governed Trust Flow:
 * Policy Definition -> Firestore control_policies -> Policy Loader -> Policy Validation -> Policy Engine -> Kernel -> Audit
 */

import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { dbManager } from '../database/DatabaseConnectionManager';
import { GovernancePolicyRecord } from '../../operations/types';
import { kernelAuditEngine } from '../../kernel/AuditEngine';
import { kernelEventBus } from '../../kernel/EventBus';
import { sanitizeFirestorePayload } from '../database/firestoreSanitizer';
import { GovernanceSubsystemStatus, GovernanceHealthStatus } from '../systemStatus/SystemStatusTypes';

export class GovernancePolicyRepository {
  private static instance: GovernancePolicyRepository;

  // STRICTLY NON-AUTHORITATIVE read-through cache (invalidation on mutation/environment change)
  private nonAuthoritativeCache: Map<string, { policy: GovernancePolicyRecord; cachedAt: number }> = new Map();
  private lastSuccessfulLoadAt: number | null = null;
  private lastPolicyUpdateAt: number | null = null;
  private lastError: string | null = null;
  private readonly CACHE_TTL_MS = 60_000; // 1 minute read-through TTL

  private constructor() {
    this.registerEventBusListeners();
  }

  public static getInstance(): GovernancePolicyRepository {
    if (!GovernancePolicyRepository.instance) {
      GovernancePolicyRepository.instance = new GovernancePolicyRepository();
    }
    return GovernancePolicyRepository.instance;
  }

  private registerEventBusListeners(): void {
    // Invalidate local non-authoritative cache on policy update events across instances
    kernelEventBus.subscribe('CONTROL_POLICY_UPDATED', (payload: any) => {
      if (payload?.tenantId) {
        this.invalidateCache(payload.tenantId);
      } else {
        this.invalidateCache();
      }
    });

    kernelEventBus.subscribe('GOVERNANCE_POLICY_UPDATED', (payload: any) => {
      if (payload?.tenantId) {
        this.invalidateCache(payload.tenantId);
      } else {
        this.invalidateCache();
      }
    });
  }

  /**
   * Deterministic document ID format for control_policies collection:
   * Format: `${tenantId}_${policyId}` (ensures strict tenant scoping in Firestore)
   */
  public getDocumentId(tenantId: string, policyId: string): string {
    if (policyId.startsWith(`${tenantId}_`)) {
      return policyId;
    }
    return `${tenantId}_${policyId}`;
  }

  /**
   * Clears the non-authoritative memory cache
   */
  public invalidateCache(tenantId?: string): void {
    if (!tenantId) {
      this.nonAuthoritativeCache.clear();
      return;
    }
    for (const [key, entry] of this.nonAuthoritativeCache.entries()) {
      if (entry.policy.tenantId === tenantId || key.startsWith(`${tenantId}_`)) {
        this.nonAuthoritativeCache.delete(key);
      }
    }
  }

  /**
   * Validates policy structure, required metadata, tenant scope, and versioning rules.
   * Throws Error if validation fails.
   */
  public validatePolicy(
    policy: GovernancePolicyRecord,
    targetTenantId?: string,
    actorRole?: string,
    actorId?: string
  ): void {
    if (!policy) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: Policy payload is required.');
    }

    if (!policy.policyId || !policy.policyId.trim()) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: Missing policyId.');
    }

    if (!policy.tenantId || policy.tenantId === 'UNRESOLVED' || !policy.tenantId.trim()) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: Valid tenantId is required.');
    }

    if (targetTenantId && policy.tenantId !== targetTenantId) {
      throw new Error(
        `TENANT_ACCESS_DENIED: Policy tenant '${policy.tenantId}' does not match target tenant '${targetTenantId}'.`
      );
    }

    if (!policy.name || !policy.name.trim()) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: Policy name is required.');
    }

    if (!policy.domain) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: Policy domain is required.');
    }

    if (typeof policy.version !== 'number' || policy.version < 1) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: Policy version must be an integer >= 1.');
    }

    const allowedExecutionScopes = ['CAPABILITY', 'DOMAIN', 'ENTERPRISE'];
    if (!allowedExecutionScopes.includes(policy.executionScope)) {
      throw new Error(`GOVERNANCE_VALIDATION_ERROR: Invalid executionScope '${policy.executionScope}'.`);
    }

    const allowedRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!allowedRiskLevels.includes(policy.riskLevel)) {
      throw new Error(`GOVERNANCE_VALIDATION_ERROR: Invalid riskLevel '${policy.riskLevel}'.`);
    }

    const allowedAiModes = ['MANUAL', 'AI_COPILOT', 'AI_AUTOPILOT'];
    if (!allowedAiModes.includes(policy.aiOperatingMode)) {
      throw new Error(`GOVERNANCE_VALIDATION_ERROR: Invalid aiOperatingMode '${policy.aiOperatingMode}'.`);
    }

    if (!Array.isArray(policy.allowedRoles) || policy.allowedRoles.length === 0) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: allowedRoles must be a non-empty array of roles.');
    }

    if (policy.effectiveUntil && policy.effectiveFrom) {
      const fromTime = new Date(policy.effectiveFrom).getTime();
      const untilTime = new Date(policy.effectiveUntil).getTime();
      if (isNaN(fromTime) || isNaN(untilTime) || untilTime <= fromTime) {
        throw new Error('GOVERNANCE_VALIDATION_ERROR: effectiveUntil must be chronologically after effectiveFrom.');
      }
    }

    // Role-based administrative verification
    if (actorRole) {
      const validAdminRoles = ['platform_admin', 'organization_admin', 'admin'];
      if (!validAdminRoles.includes(actorRole)) {
        throw new Error(
          `GOVERNANCE_DENIED: Actor '${actorId || 'unknown'}' with role '${actorRole}' lacks required administrative authority.`
        );
      }
    }
  }

  /**
   * Retrieves authoritative policy from Cloud Firestore with non-authoritative read-through cache.
   * In LIVE mode: Fails closed if Firestore is unavailable.
   */
  public async getPolicy(tenantId: string, policyId: string): Promise<GovernancePolicyRecord | null> {
    if (!tenantId || tenantId === 'UNRESOLVED') {
      throw new Error('GOVERNANCE_DENIED: Unresolved tenant.');
    }
    if (!policyId) return null;

    // Check if policyId contains a foreign tenant prefix
    if (policyId.includes('_')) {
      const prefix = policyId.split('_')[0];
      if (prefix.startsWith('tenant-') && prefix !== tenantId) {
        throw new Error(`TENANT_ACCESS_DENIED: Policy prefix '${prefix}' does not match requester tenant '${tenantId}'.`);
      }
    }

    const cacheKey = `${tenantId}_${policyId}`;
    const cached = this.nonAuthoritativeCache.get(cacheKey);
    const now = Date.now();

    const activeEnv = dbManager.getEnvironment();

    // Check non-authoritative cache freshness
    if (cached && (now - cached.cachedAt < this.CACHE_TTL_MS)) {
      // Assert tenant boundary on cached object
      if (cached.policy.tenantId !== tenantId) {
        this.nonAuthoritativeCache.delete(cacheKey);
        throw new Error('TENANT_ACCESS_DENIED: Cached policy tenant mismatch.');
      }
      return this.checkExpiration(cached.policy);
    }

    // Check if policy belongs to another tenant in cache
    for (const entry of this.nonAuthoritativeCache.values()) {
      if (entry.policy.policyId === policyId && entry.policy.tenantId !== tenantId) {
        throw new Error(`TENANT_ACCESS_DENIED: Policy '${policyId}' belongs to tenant '${entry.policy.tenantId}'.`);
      }
    }

    const firestore = dbManager.getFirestore();

    // FAIL-CLOSED invariant for LIVE environment:
    if (activeEnv === 'LIVE' && !firestore) {
      this.lastError = 'Authoritative Firestore connection unavailable in LIVE mode.';
      throw new Error('GOVERNANCE_UNAVAILABLE: Authoritative Firestore connection unavailable in LIVE mode.');
    }

    if (firestore) {
      try {
        const docId = this.getDocumentId(tenantId, policyId);
        const ref = doc(firestore, 'control_policies', docId);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          const raw = snapshot.data() as GovernancePolicyRecord;
          // Verify tenant ownership
          if (raw.tenantId !== tenantId) {
            throw new Error('TENANT_ACCESS_DENIED: Policy belongs to another tenant.');
          }

          const policyRecord = { ...raw, id: docId };
          this.nonAuthoritativeCache.set(cacheKey, { policy: policyRecord, cachedAt: now });
          this.lastSuccessfulLoadAt = now;
          this.lastError = null;
          return this.checkExpiration(policyRecord);
        } else {
          // If not found for current tenant, verify if this policyId exists for another tenant
          const crossCheckQuery = query(
            collection(firestore, 'control_policies'),
            where('policyId', '==', policyId)
          );
          const crossSnap = await getDocs(crossCheckQuery);
          if (!crossSnap.empty) {
            const otherPolicy = crossSnap.docs[0].data() as GovernancePolicyRecord;
            if (otherPolicy.tenantId !== tenantId) {
              throw new Error(`TENANT_ACCESS_DENIED: Policy '${policyId}' belongs to tenant '${otherPolicy.tenantId}'.`);
            }
          }
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('TENANT_ACCESS_DENIED') || err.message.includes('GOVERNANCE_DENIED'))) {
          throw err;
        }
        if (activeEnv === 'LIVE') {
          this.lastError = err?.message || 'Firestore getDoc failed';
          throw new Error(`GOVERNANCE_UNAVAILABLE: Failed to read authoritative policy from Firestore: ${err?.message || err}`);
        }
      }
    }

    // In DEMO environment: Check if seeded in memory or cached
    if (activeEnv === 'DEMO') {
      if (cached) return this.checkExpiration(cached.policy);
    }

    return null;
  }

  /**
   * Lists all authoritative policies for the authorized tenant scope.
   */
  public async listPolicies(tenantId: string): Promise<GovernancePolicyRecord[]> {
    if (!tenantId || tenantId === 'UNRESOLVED') {
      throw new Error('GOVERNANCE_DENIED: Unresolved tenant.');
    }

    const activeEnv = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      this.lastError = 'Authoritative Firestore unavailable in LIVE mode.';
      throw new Error('GOVERNANCE_UNAVAILABLE: Authoritative Firestore unavailable in LIVE mode.');
    }

    const results: GovernancePolicyRecord[] = [];
    const now = Date.now();

    if (firestore) {
      try {
        const q = query(
          collection(firestore, 'control_policies'),
          where('tenantId', '==', tenantId)
        );
        const snapshot = await getDocs(q);

        snapshot.forEach((d) => {
          const item = d.data() as GovernancePolicyRecord;
          if (item.tenantId === tenantId) {
            const policyWithDocId = { ...item, id: d.id };
            results.push(this.checkExpiration(policyWithDocId));
            this.nonAuthoritativeCache.set(`${tenantId}_${item.policyId}`, {
              policy: policyWithDocId,
              cachedAt: now,
            });
          }
        });

        this.lastSuccessfulLoadAt = now;
        this.lastError = null;
        return results;
      } catch (err: any) {
        if (activeEnv === 'LIVE') {
          this.lastError = err?.message || 'Firestore query failed';
          throw new Error(`GOVERNANCE_UNAVAILABLE: Failed to query authoritative policies: ${err?.message || err}`);
        }
      }
    }

    // DEMO fallback: Return cached policies matching tenantId
    if (activeEnv === 'DEMO') {
      for (const entry of this.nonAuthoritativeCache.values()) {
        if (entry.policy.tenantId === tenantId) {
          results.push(this.checkExpiration(entry.policy));
        }
      }
    }

    return results;
  }

  /**
   * Persists a newly created policy to Firestore `control_policies`.
   * Enforces version 1, validation, and audit recording.
   */
  public async createPolicy(
    policy: GovernancePolicyRecord,
    actorRole?: string,
    actorId?: string
  ): Promise<GovernancePolicyRecord> {
    this.validatePolicy(policy, policy.tenantId, actorRole, actorId);

    if (policy.version !== 1) {
      throw new Error('GOVERNANCE_VALIDATION_ERROR: New policy draft must start at version 1.');
    }

    const activeEnv = dbManager.getEnvironment();
    policy.environment = activeEnv;
    policy.createdAt = policy.createdAt || new Date().toISOString();
    policy.updatedAt = new Date().toISOString();
    policy.enabled = policy.status === 'ACTIVE';

    const docId = this.getDocumentId(policy.tenantId, policy.policyId);
    policy.id = docId;

    const firestore = dbManager.getFirestore();
    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('GOVERNANCE_UNAVAILABLE: Cannot persist policy. Firestore is unavailable in LIVE mode.');
    }

    const sanitized = sanitizeFirestorePayload(policy, `control_policies/${docId}`);

    if (firestore) {
      const ref = doc(firestore, 'control_policies', docId);
      await setDoc(ref, sanitized);
    }

    // Update non-authoritative cache
    const now = Date.now();
    this.nonAuthoritativeCache.set(`${policy.tenantId}_${policy.policyId}`, { policy, cachedAt: now });
    this.lastPolicyUpdateAt = now;

    // Publish event
    kernelEventBus.publish('GOVERNANCE_POLICY_CREATED', policy, {
      actor: { id: actorId || policy.createdBy, type: 'USER' },
      tenant: { tenantId: policy.tenantId, organizationId: policy.organizationId },
      entityId: policy.policyId,
      entityType: 'governance_policy',
    });

    // Record immutable audit ledger event
    await kernelAuditEngine.record({
      action: 'CREATE_GOVERNANCE_POLICY',
      actor: { id: actorId || policy.createdBy, type: 'USER', name: actorId || policy.createdBy },
      entityId: policy.policyId,
      entityType: 'GOVERNANCE_POLICY',
      classification: 'CONFIDENTIAL',
      details: {
        policyId: policy.policyId,
        tenantId: policy.tenantId,
        version: policy.version,
        domain: policy.domain,
        name: policy.name,
        status: policy.status,
      },
    });

    return policy;
  }

  /**
   * Updates an existing policy authoritatively.
   * Strictly enforces version sequential increment (stale version rejection).
   */
  public async updatePolicy(
    policy: GovernancePolicyRecord,
    actorRole?: string,
    actorId?: string
  ): Promise<GovernancePolicyRecord> {
    this.validatePolicy(policy, policy.tenantId, actorRole, actorId);

    const existing = await this.getPolicy(policy.tenantId, policy.policyId);
    if (!existing) {
      throw new Error(`GOVERNANCE_NOT_FOUND: Policy '${policy.policyId}' not found for tenant '${policy.tenantId}'.`);
    }

    // Tenant isolation verification
    if (existing.tenantId !== policy.tenantId) {
      throw new Error('TENANT_ACCESS_DENIED: Cannot modify a policy belonging to another tenant.');
    }

    // Strict version increment check: stale version cannot overwrite newer policy
    if (policy.version !== existing.version + 1) {
      throw new Error(
        `GOVERNANCE_VERSION_CONFLICT: Stale policy version. Existing version is ${existing.version}, update must be ${existing.version + 1} (received ${policy.version}).`
      );
    }

    const activeEnv = dbManager.getEnvironment();
    policy.environment = activeEnv;
    policy.updatedAt = new Date().toISOString();
    policy.updatedBy = actorId || policy.updatedBy || 'admin';
    policy.enabled = policy.status === 'ACTIVE';

    const docId = this.getDocumentId(policy.tenantId, policy.policyId);
    policy.id = docId;

    const firestore = dbManager.getFirestore();
    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('GOVERNANCE_UNAVAILABLE: Cannot persist policy update. Firestore is unavailable in LIVE mode.');
    }

    const sanitized = sanitizeFirestorePayload(policy, `control_policies/${docId}`);

    if (firestore) {
      const ref = doc(firestore, 'control_policies', docId);
      await setDoc(ref, sanitized, { merge: true });
    }

    // Update non-authoritative cache
    const now = Date.now();
    this.nonAuthoritativeCache.set(`${policy.tenantId}_${policy.policyId}`, { policy, cachedAt: now });
    this.lastPolicyUpdateAt = now;

    // Publish event
    kernelEventBus.publish('GOVERNANCE_POLICY_UPDATED', policy, {
      actor: { id: actorId || policy.updatedBy || 'admin', type: 'USER' },
      tenant: { tenantId: policy.tenantId, organizationId: policy.organizationId },
      entityId: policy.policyId,
      entityType: 'governance_policy',
    });

    // Audit log
    await kernelAuditEngine.record({
      action: 'UPDATE_GOVERNANCE_POLICY',
      actor: { id: actorId || 'admin', type: 'USER', name: actorId || 'admin' },
      entityId: policy.policyId,
      entityType: 'GOVERNANCE_POLICY',
      classification: 'CONFIDENTIAL',
      details: {
        policyId: policy.policyId,
        tenantId: policy.tenantId,
        version: policy.version,
        previousVersion: existing.version,
        name: policy.name,
        status: policy.status,
      },
    });

    return policy;
  }

  /**
   * Disables a policy authoritatively, advancing version and updating status to SUSPENDED.
   */
  public async disablePolicy(
    tenantId: string,
    policyId: string,
    actorId: string,
    actorRole: string
  ): Promise<GovernancePolicyRecord> {
    const existing = await this.getPolicy(tenantId, policyId);
    if (!existing) {
      throw new Error(`GOVERNANCE_NOT_FOUND: Policy '${policyId}' not found.`);
    }

    const updated: GovernancePolicyRecord = {
      ...existing,
      status: 'SUSPENDED',
      enabled: false,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    };

    return this.updatePolicy(updated, actorRole, actorId);
  }

  /**
   * Authoritative version check
   */
  public async getPolicyVersion(tenantId: string, policyId: string): Promise<number | null> {
    const policy = await this.getPolicy(tenantId, policyId);
    return policy ? policy.version : null;
  }

  /**
   * Verifies policy expiration against effectiveUntil timestamp.
   */
  private checkExpiration(policy: GovernancePolicyRecord): GovernancePolicyRecord {
    if (policy.effectiveUntil) {
      const expiry = new Date(policy.effectiveUntil).getTime();
      if (Date.now() >= expiry) {
        return {
          ...policy,
          status: 'SUSPENDED',
          enabled: false,
        };
      }
    }
    return policy;
  }

  /**
   * Health and telemetry probe for System Status fabric.
   */
  public getGovernanceTelemetry(): GovernanceSubsystemStatus {
    const activeEnv = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();
    const isStoreAvailable = firestore !== null;

    let status: GovernanceHealthStatus = 'GOVERNANCE_HEALTHY';
    let message = 'Governance policy store operational.';

    if (activeEnv === 'LIVE' && !isStoreAvailable) {
      status = 'GOVERNANCE_UNAVAILABLE';
      message = 'Authoritative Firestore control_policies connection unavailable in LIVE mode.';
    } else if (this.lastError) {
      status = 'GOVERNANCE_DEGRADED';
      message = `Governance degradation notice: ${this.lastError}`;
    }

    const cacheCount = this.nonAuthoritativeCache.size;
    const cacheState: 'EMPTY' | 'WARM' | 'STALE' | 'BYPASSED' = 
      cacheCount === 0 ? 'EMPTY' : 'WARM';

    return {
      status,
      message,
      environment: activeEnv,
      source: 'GovernancePolicyRepository',
      lastCheckedAt: Date.now(),
      lastHealthyAt: isStoreAvailable ? Date.now() : this.lastSuccessfulLoadAt,
      authoritativeStoreAvailable: isStoreAvailable,
      lastSuccessfulLoadAt: this.lastSuccessfulLoadAt,
      lastPolicyUpdateAt: this.lastPolicyUpdateAt,
      cacheState,
      activePoliciesCount: cacheCount,
    };
  }
}

export const governancePolicyRepository = GovernancePolicyRepository.getInstance();
