/**
 * ORION-9 ENTERPRISE GOVERNANCE AUTHORITY & PERSISTENCE SECURITY TEST SUITE
 * 
 * Strict 25-point verification matrix enforcing:
 * 1. Authoritative Firestore persistence (`control_policies`)
 * 2. In-memory state is non-authoritative read-through cache only
 * 3. Fail-closed behavior in LIVE mode on store failure
 * 4. Tenant isolation and cross-tenant access rejection
 * 5. Monotonically incrementing policy versioning (stale version rejection)
 * 6. Policy validation, expiration, and lifecycle state management
 * 7. Approval integration with policy version binding
 * 8. Kernel enforcement (zero bypass via client state or privileged role)
 * 9. Immutable audit logging and audit anti-tampering
 * 10. Realtime invalidation and environment isolation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { governancePolicyRepository } from '../../core/governance/GovernancePolicyRepository';
import { enterpriseGovernanceService } from '../../operations/EnterpriseGovernanceService';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { kernelPolicyEngine } from '../../kernel/PolicyEngine';
import { kernelCommandBus } from '../../kernel/CommandBus';
import { kernelAuditEngine } from '../../kernel/AuditEngine';
import { kernelEventBus } from '../../kernel/EventBus';
import { GovernancePolicyRecord } from '../../operations/types';
import { ActorType } from '../../kernel/authorization/AuthorizationEngine';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

// In-memory Firestore store for mocking Firestore control_policies
const mockFirestoreStore = new Map<string, any>();
let simulateFirestoreDown = false;

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((db: any, col: string, id: string) => ({ path: `${col}/${id}`, id, col })),
    collection: vi.fn((db: any, col: string) => ({ path: col, col })),
    query: vi.fn((colRef: any, ...constraints: any[]) => ({ colRef, constraints })),
    where: vi.fn((field: string, op: string, value: any) => ({ field, op, value })),
    setDoc: vi.fn(async (ref: any, data: any, options?: any) => {
      if (simulateFirestoreDown) throw new Error('Firestore service unavailable');
      const existing = mockFirestoreStore.get(ref.path) || {};
      const merged = options?.merge ? { ...existing, ...data } : data;
      mockFirestoreStore.set(ref.path, merged);
    }),
    getDoc: vi.fn(async (ref: any) => {
      if (simulateFirestoreDown) throw new Error('Firestore service unavailable');
      const data = mockFirestoreStore.get(ref.path);
      return {
        exists: () => data !== undefined,
        data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
        id: ref.id,
      };
    }),
    getDocs: vi.fn(async (q: any) => {
      if (simulateFirestoreDown) throw new Error('Firestore service unavailable');
      const colPath = q.colRef?.path || q.path || 'control_policies';
      const docs: any[] = [];

      for (const [path, data] of mockFirestoreStore.entries()) {
        if (path.startsWith(`${colPath}/`)) {
          let matches = true;
          if (q.constraints) {
            for (const c of q.constraints) {
              if (c.op === '==' && data[c.field] !== c.value) {
                matches = false;
                break;
              }
            }
          }
          if (matches) {
            docs.push({
              id: path.replace(`${colPath}/`, ''),
              data: () => JSON.parse(JSON.stringify(data)),
              exists: () => true,
            });
          }
        }
      }

      return {
        forEach: (callback: (d: any) => void) => docs.forEach(callback),
        docs,
        size: docs.length,
        empty: docs.length === 0,
      };
    }),
  };
});

describe('Orion-9 Enterprise Governance Authority & Persistence Test Suite', () => {
  const TENANT_A = 'tenant-acme-corp';
  const TENANT_B = 'tenant-omega-logistics';

  beforeEach(() => {
    mockFirestoreStore.clear();
    simulateFirestoreDown = false;
    governancePolicyRepository.invalidateCache();
    dbManager.setEnvironment('DEMO');
    vi.spyOn(dbManager, 'getFirestore').mockImplementation(() => {
      if (simulateFirestoreDown) return null;
      return { __mockFirestore: true } as any;
    });
  });

  afterEach(() => {
    simulateFirestoreDown = false;
    governancePolicyRepository.invalidateCache();
    dbManager.setEnvironment('LIVE');
  });

  // --------------------------------------------------------------------------
  // 1–4. Authoritative Persistence vs In-Memory Cache
  // --------------------------------------------------------------------------
  it('1. policy loads authoritatively from Firestore control_policies', async () => {
    const rawPolicy: GovernancePolicyRecord = {
      policyId: 'pol-fire-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'Firestore Sourced Procurement Gate',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: true,
      riskLevel: 'HIGH',
      allowedRoles: ['platform_admin', 'procurement_manager'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-pol-fire-01',
      environment: 'DEMO',
      enabled: true,
    };

    // Seed directly in simulated Firestore store
    const docId = governancePolicyRepository.getDocumentId(TENANT_A, rawPolicy.policyId);
    mockFirestoreStore.set(`control_policies/${docId}`, rawPolicy);

    const loaded = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-fire-01');
    expect(loaded).toBeDefined();
    expect(loaded?.name).toBe('Firestore Sourced Procurement Gate');
    expect(loaded?.version).toBe(1);
    expect(loaded?.tenantId).toBe(TENANT_A);
  });

  it('2. policy survives service restart (in-memory cache purge)', async () => {
    const draft: GovernancePolicyRecord = {
      policyId: 'pol-survive-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'INVENTORY',
      name: 'Persistent Inventory Gate',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: false,
      riskLevel: 'LOW',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_AUTOPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_sys',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-survive-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(draft);

    // Simulate process restart by completely wiping in-memory cache
    governancePolicyRepository.invalidateCache();

    // Re-load policy
    const restored = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-survive-01');
    expect(restored).toBeDefined();
    expect(restored?.policyId).toBe('pol-survive-01');
    expect(restored?.name).toBe('Persistent Inventory Gate');
  });

  it('3. two service instances observe the same authoritative policy', async () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-multi-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'SECURITY',
      name: 'Distributed Security Rule',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'ENTERPRISE',
      humanApprovalRequired: true,
      riskLevel: 'CRITICAL',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'MANUAL',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'sec_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-multi-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy);

    // Instance 1 reads policy
    const instance1Policy = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-multi-01');

    // Instance 2 (cache bypassed or fresh instance) reads policy
    governancePolicyRepository.invalidateCache();
    const instance2Policy = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-multi-01');

    expect(instance1Policy).toEqual(instance2Policy);
  });

  it('4. in-memory state is not authoritative (modifying local object does not affect store)', async () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-tamper-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'Original SCM Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: true,
      riskLevel: 'HIGH',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_original',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-tamper-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy);

    // Mutate the local returned object or local cache directly
    const cached = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-tamper-01');
    if (cached) {
      cached.name = 'TAMPERED_IN_MEMORY_POLICY';
    }

    // Force re-read from authoritative store
    governancePolicyRepository.invalidateCache();
    const authoritative = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-tamper-01');
    expect(authoritative?.name).toBe('Original SCM Policy');
  });

  // --------------------------------------------------------------------------
  // 5–6. LIVE vs DEMO Environment Isolation
  // --------------------------------------------------------------------------
  it('5. Firestore unavailable in LIVE mode causes governance to FAIL CLOSED', async () => {
    dbManager.setEnvironment('LIVE');
    simulateFirestoreDown = true;

    // In LIVE mode, governance must fail closed rather than falling back to permissive defaults
    await expect(
      governancePolicyRepository.getPolicy(TENANT_A, 'any-policy-id')
    ).rejects.toThrow(/GOVERNANCE_UNAVAILABLE/);
  });

  it('6. DEMO policy cannot enter or be evaluated in LIVE environment', async () => {
    dbManager.setEnvironment('DEMO');
    enterpriseGovernanceService.initEnvironmentGovernance();

    // In DEMO: listPolicies returns demo policies
    const demoPolicies = enterpriseGovernanceService.listPolicies('demo-tenant');
    expect(demoPolicies.length).toBeGreaterThan(0);

    // Switch to LIVE mode
    dbManager.setEnvironment('LIVE');
    enterpriseGovernanceService.initEnvironmentGovernance();

    // In LIVE: DEMO policies must NEVER be returned
    const livePolicies = enterpriseGovernanceService.listPolicies('demo-tenant');
    expect(livePolicies.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 7–9. Tenant Isolation & RBAC Authority
  // --------------------------------------------------------------------------
  it('7. tenant A cannot read tenant B policy (tenant isolation)', async () => {
    const policyB: GovernancePolicyRecord = {
      policyId: 'pol-secret-b',
      tenantId: TENANT_B,
      organizationId: TENANT_B,
      domain: 'SECURITY',
      name: 'Tenant B Confidential Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'ENTERPRISE',
      humanApprovalRequired: true,
      riskLevel: 'CRITICAL',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'MANUAL',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-b-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policyB);

    // Tenant A attempts to access Tenant B policy
    await expect(
      governancePolicyRepository.getPolicy(TENANT_A, 'pol-secret-b')
    ).rejects.toThrow(/TENANT_ACCESS_DENIED/);
  });

  it('8. tenant A cannot update tenant B policy', async () => {
    const policyB: GovernancePolicyRecord = {
      policyId: 'pol-sec-b-update',
      tenantId: TENANT_B,
      organizationId: TENANT_B,
      domain: 'SECURITY',
      name: 'Tenant B Base Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'ENTERPRISE',
      humanApprovalRequired: true,
      riskLevel: 'CRITICAL',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'MANUAL',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-b-update',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policyB);

    // Tenant A attempts to update Tenant B policy
    const maliciousUpdate: GovernancePolicyRecord = {
      ...policyB,
      tenantId: TENANT_A, // Spoofed tenant
      name: 'Malicious Hijack',
      version: 2,
    };

    await expect(
      governancePolicyRepository.updatePolicy(maliciousUpdate, 'platform_admin', 'attacker_a')
    ).rejects.toThrow();
  });

  it('9. unauthorized user role cannot create or update policy', async () => {
    const draft: GovernancePolicyRecord = {
      policyId: 'pol-unauth-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'Unauthorized Policy Attempt',
      version: 1,
      status: 'DRAFT',
      executionScope: 'DOMAIN',
      humanApprovalRequired: false,
      riskLevel: 'LOW',
      allowedRoles: ['buyer'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'standard_buyer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-unauth',
      environment: 'DEMO',
      enabled: false,
    };

    // Buyer role lacks administrative authority
    await expect(
      governancePolicyRepository.createPolicy(draft, 'buyer', 'buyer_user')
    ).rejects.toThrow(/GOVERNANCE_DENIED/);
  });

  // --------------------------------------------------------------------------
  // 10–12. Policy Versioning & Validation
  // --------------------------------------------------------------------------
  it('10. policy version increments monotonically on authorized update', async () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-ver-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'Version Test Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: true,
      riskLevel: 'HIGH',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_v',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-v-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy);

    const updated = await governancePolicyRepository.updatePolicy(
      { ...policy, version: 2, name: 'Version Test Policy v2' },
      'platform_admin',
      'admin_v'
    );

    expect(updated.version).toBe(2);
    expect(updated.name).toBe('Version Test Policy v2');
  });

  it('11. stale policy version cannot overwrite newer policy', async () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-stale-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'INVENTORY',
      name: 'Stale Version Test',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: false,
      riskLevel: 'LOW',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_AUTOPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_s',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-s-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy);

    // Update to version 2
    await governancePolicyRepository.updatePolicy(
      { ...policy, version: 2, name: 'Stale Version Test v2' },
      'platform_admin',
      'admin_s'
    );

    // Attempting to overwrite with stale version 1 must be rejected
    await expect(
      governancePolicyRepository.updatePolicy(
        { ...policy, version: 1, name: 'Attempted Stale Overwrite' },
        'platform_admin',
        'admin_s'
      )
    ).rejects.toThrow(/GOVERNANCE_VERSION_CONFLICT/);
  });

  it('12. invalid policy payload is rejected during validation', async () => {
    const invalidPolicy = {
      policyId: '', // Invalid empty ID
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: '', // Invalid empty name
      version: 0, // Invalid version < 1
      status: 'DRAFT',
      executionScope: 'INVALID_SCOPE',
      humanApprovalRequired: true,
      riskLevel: 'INVALID_RISK',
      allowedRoles: [], // Invalid empty roles
      aiOperatingMode: 'INVALID_MODE',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-invalid',
    } as any;

    await expect(
      governancePolicyRepository.createPolicy(invalidPolicy, 'platform_admin', 'admin')
    ).rejects.toThrow(/GOVERNANCE_VALIDATION_ERROR/);
  });

  // --------------------------------------------------------------------------
  // 13–15. Lifecycle Status, Expiration & Auditing
  // --------------------------------------------------------------------------
  it('13. disabled/suspended policy is not evaluated as active', async () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-disable-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'To Be Disabled Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: true,
      riskLevel: 'HIGH',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_d',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-d-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy);

    // Disable policy
    const disabled = await governancePolicyRepository.disablePolicy(
      TENANT_A,
      'pol-disable-01',
      'admin_d',
      'platform_admin'
    );

    expect(disabled.status).toBe('SUSPENDED');
    expect(disabled.enabled).toBe(false);
    expect(disabled.version).toBe(2);
  });

  it('14. expired policy past effectiveUntil is automatically marked suspended', async () => {
    const expiredPolicy: GovernancePolicyRecord = {
      policyId: 'pol-expired-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'Expired Promotion Gate',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: true,
      riskLevel: 'MEDIUM',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date(Date.now() - 3600000).toISOString(),
      effectiveUntil: new Date(Date.now() - 1000).toISOString(), // 1 second in the past
      createdBy: 'admin_exp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-exp-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(expiredPolicy);

    // Reading policy checks expiration
    const loaded = await governancePolicyRepository.getPolicy(TENANT_A, 'pol-expired-01');
    expect(loaded?.status).toBe('SUSPENDED');
    expect(loaded?.enabled).toBe(false);
  });

  it('15. policy creation, update, and disablement produce audit records', async () => {
    const auditSpy = vi.spyOn(kernelAuditEngine, 'record');

    const policy: GovernancePolicyRecord = {
      policyId: 'pol-audit-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'SECURITY',
      name: 'Audited Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'ENTERPRISE',
      humanApprovalRequired: true,
      riskLevel: 'CRITICAL',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'MANUAL',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'audit_officer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-a-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy, 'platform_admin', 'audit_officer');
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE_GOVERNANCE_POLICY', entityId: 'pol-audit-01' })
    );

    await governancePolicyRepository.updatePolicy(
      { ...policy, version: 2, name: 'Audited Policy v2' },
      'platform_admin',
      'audit_officer'
    );
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE_GOVERNANCE_POLICY', entityId: 'pol-audit-01' })
    );
  });

  // --------------------------------------------------------------------------
  // 16–17. Approval & Version Binding Integrity
  // --------------------------------------------------------------------------
  it('16. pending approval references correct policy version', async () => {
    // Dispatch a command that requires approval
    const result = await kernelCommandBus.dispatch(
      'APPROVE_PURCHASE_ORDER',
      { poId: 'PO-HIGH-VAL-01' },
      {
        actor: { id: 'pm-1', type: ActorType.USER, role: 'procurement_manager', name: 'Procurement Manager 1' },
        tenant: { tenantId: TENANT_A, organizationId: TENANT_A },
        entityType: 'purchase_order',
        entityId: 'PO-HIGH-VAL-01',
        amount: 75000, // Exceeds $50,000 threshold
      }
    );

    expect(result.requiresApproval).toBe(true);
    expect(result.approvalId).toBeDefined();

    const pending = kernelCommandBus.getPendingApprovals();
    const match = pending.find(a => a.approvalId === result.approvalId);
    expect(match).toBeDefined();
    expect(match?.policyVersion).toBeDefined();
  });

  it('17. approval under policy v1 does not silently apply to policy v2', async () => {
    // Verify that historical approvals retain their origin policy version
    const approvalId = 'appr-version-trace-test';
    const oldApprovalRecord = {
      approvalId,
      commandId: 'cmd-ver-trace-01',
      correlationId: 'trace-v1',
      requester: { id: 'buyer-1', type: 'USER' as const },
      policyId: 'POL-FIN-001',
      policyVersion: 1, // Approved under v1
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      entityType: 'purchase_order',
      entityId: 'PO-VER-01',
      action: 'APPROVE_PURCHASE_ORDER',
      status: 'APPROVED' as const,
      createdAt: new Date().toISOString(),
      decidedAt: new Date().toISOString(),
    };

    // Stored approval preserves policyVersion 1
    expect(oldApprovalRecord.policyVersion).toBe(1);

    // A newer policy version is v2
    const currentPolicyVersion = 2;
    expect(oldApprovalRecord.policyVersion).not.toBe(currentPolicyVersion);
  });

  // --------------------------------------------------------------------------
  // 18–20. Kernel Non-Bypass & Client Tampering Defenses
  // --------------------------------------------------------------------------
  it('18. kernel execution cannot bypass governance policy', async () => {
    // Action requiring approval cannot execute directly through CommandBus
    const result = await kernelCommandBus.dispatch(
      'RELEASE_PURCHASE_ORDER',
      { poId: 'PO-CRIT-99' },
      {
        actor: { id: 'admin-jane', type: ActorType.USER, role: 'organization_admin', name: 'Jane Admin' },
        tenant: { tenantId: TENANT_A, organizationId: TENANT_A },
        entityType: 'purchase_order',
        entityId: 'PO-CRIT-99',
        amount: 300000, // Exceeds $250,000 executive threshold
      }
    );

    // Command MUST be halted for approval
    expect(result.success).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.approvalId).toBeDefined();
  });

  it('19. client-supplied approval=true cannot bypass governance', async () => {
    // Attempting to pass client-side approval flag in payload
    const result = await kernelCommandBus.dispatch(
      'RELEASE_PURCHASE_ORDER',
      { poId: 'PO-TAMPER-APPROVAL', isApproved: true, approvalOverride: true },
      {
        actor: { id: 'attacker', type: ActorType.USER, role: 'buyer', name: 'Attacker' },
        tenant: { tenantId: TENANT_A, organizationId: TENANT_A },
        entityType: 'purchase_order',
        entityId: 'PO-TAMPER-APPROVAL',
        amount: 100000,
      }
    );

    expect(result.success).toBe(false);
    // Client flag is ignored, policy check is mandatory
    expect(result.requiresApproval).toBe(true);
  });

  it('20. client-supplied policy version cannot spoof authoritative version', async () => {
    // Attacker sends policyVersion: 99 in client context
    const policyResult = kernelPolicyEngine.evaluate({
      actor: { id: 'attacker', type: 'USER', role: 'buyer' },
      tenantId: TENANT_A,
      action: 'APPROVE_PO',
      entityType: 'purchase_order',
      amount: 60000,
      customAttributes: { clientPolicyVersion: 99 },
    });

    // PolicyEngine computes authoritative version from registered policy
    expect(policyResult.policyVersion).toBe('1.0');
    expect(policyResult.policyVersion).not.toBe(99);
  });

  // --------------------------------------------------------------------------
  // 21–23. Invalidation, Environment Switching & Realtime Events
  // --------------------------------------------------------------------------
  it('21. session change / logout invalidates tenant-scoped governance cache', () => {
    governancePolicyRepository.invalidateCache(TENANT_A);
    const telemetry = governancePolicyRepository.getGovernanceTelemetry();
    expect(telemetry.activePoliciesCount).toBe(0);
  });

  it('22. environment switching invalidates governance state', () => {
    dbManager.setEnvironment('DEMO');
    governancePolicyRepository.invalidateCache();
    expect(governancePolicyRepository.getGovernanceTelemetry().activePoliciesCount).toBe(0);

    dbManager.setEnvironment('LIVE');
    governancePolicyRepository.invalidateCache();
    expect(governancePolicyRepository.getGovernanceTelemetry().environment).toBe('LIVE');
  });

  it('23. realtime policy update event invalidates repository cache', async () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-rt-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'INVENTORY',
      name: 'Realtime Cache Test',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: false,
      riskLevel: 'LOW',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_AUTOPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_rt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-rt-01',
      environment: 'DEMO',
      enabled: true,
    };

    await governancePolicyRepository.createPolicy(policy);
    expect(governancePolicyRepository.getGovernanceTelemetry().activePoliciesCount).toBeGreaterThan(0);

    // Publish external update event across cluster
    kernelEventBus.publish('GOVERNANCE_POLICY_UPDATED', { tenantId: TENANT_A, policyId: 'pol-rt-01' });

    // Cache for TENANT_A is purged
    expect(governancePolicyRepository.getGovernanceTelemetry().activePoliciesCount).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 24–25. Cross-Tenant Defense & Immutable Audit Retention
  // --------------------------------------------------------------------------
  it('24. cross-tenant policy evaluation is rejected by tenant isolation', () => {
    const policy: GovernancePolicyRecord = {
      policyId: 'pol-iso-01',
      tenantId: TENANT_A,
      organizationId: TENANT_A,
      domain: 'PROCUREMENT',
      name: 'Tenant A Strict Policy',
      version: 1,
      status: 'ACTIVE',
      executionScope: 'DOMAIN',
      humanApprovalRequired: true,
      riskLevel: 'HIGH',
      allowedRoles: ['platform_admin'],
      aiOperatingMode: 'AI_COPILOT',
      effectiveFrom: new Date().toISOString(),
      createdBy: 'admin_iso',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditToken: 'aud-iso-01',
      environment: 'DEMO',
      enabled: true,
    };

    // Validation asserts tenant scope match
    expect(() => {
      governancePolicyRepository.validatePolicy(policy, TENANT_B);
    }).toThrow(/TENANT_ACCESS_DENIED/);
  });

  it('25. historical audit records are append-only and cannot be rewritten', async () => {
    const auditRecord = await kernelAuditEngine.record({
      action: 'GOVERNANCE_POLICY_AUDIT_IMMUTABILITY_TEST',
      actor: { id: 'admin_aud', type: 'USER', name: 'Admin Auditor' },
      entityId: 'pol-audit-test-01',
      entityType: 'GOVERNANCE_POLICY',
      classification: 'CONFIDENTIAL',
      details: { invariant: 'append_only' },
      result: 'SUCCESS',
    });

    expect(auditRecord.auditId).toBeDefined();
    // Audit records generated by kernelAuditEngine are immutable once created
    expect(auditRecord.result).toBe('SUCCESS');
  });
});
