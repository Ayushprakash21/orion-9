/**
 * ORION-9 SECURITY & FIRESTORE RULES VERIFICATION SUITE
 *
 * Verifies security boundary enforcement, unauthenticated access blocks,
 * tenant isolation (TENANT_A vs TENANT_B), role privilege limits,
 * and AI-context tenant isolation.
 */

import { describe, it, expect } from 'vitest';
import { AuthorizationEngine, ActorType } from '../../kernel/authorization/AuthorizationEngine';

describe('Orion-9 Security & Tenant Isolation Suite', () => {
  const authEngine = new AuthorizationEngine();

  const TENANT_A_USER = {
    id: 'user-tenant-a',
    type: ActorType.USER,
    name: 'Alice TenantA',
    roles: ['buyer'],
    organizationId: 'org-tenant-a',
  };

  const TENANT_B_USER = {
    id: 'user-tenant-b',
    type: ActorType.USER,
    name: 'Bob TenantB',
    roles: ['buyer'],
    organizationId: 'org-tenant-b',
  };

  const TENANT_A_ADMIN = {
    id: 'admin-tenant-a',
    type: ActorType.ADMIN,
    name: 'Admin TenantA',
    roles: ['organization_admin'],
    organizationId: 'org-tenant-a',
  };

  const AI_AGENT_TENANT_A = {
    id: 'ai-agent-a',
    type: ActorType.AI_AGENT,
    name: 'DemandCopilot',
    roles: ['ai_agent'],
    organizationId: 'org-tenant-a',
  };

  // ── 1. UNAUTHENTICATED & MISSING TOKEN ACCESS ──────────────────────────────

  it('blocks unauthenticated access when actor identity is missing', () => {
    expect(() => {
      authEngine.authorize({
        actor: { id: '', type: 'USER', roles: [], organizationId: '' },
        resourceType: 'purchase_order',
        requiredPermission: 'purchase_order:read',
        organizationId: 'org-tenant-a',
      });
    }).toThrow();
  });

  // ── 2. SAME-TENANT AUTHORIZED ACCESS ──────────────────────────────────────

  it('allows same-tenant authorized read for valid buyer', () => {
    const result = authEngine.authorize({
      actor: TENANT_A_USER,
      resourceType: 'purchase_order',
      requiredPermission: 'purchase_order:read',
      organizationId: 'org-tenant-a',
    });
    expect(result.authorized).toBe(true);
    expect(result.matchedRole).toBe('buyer');
  });

  // ── 3. CROSS-TENANT ATTACK TESTS ───────────────────────────────────────────

  it('blocks TENANT_A user from reading TENANT_B purchase orders', () => {
    expect(() => {
      authEngine.authorize({
        actor: TENANT_A_USER,
        resourceType: 'purchase_order',
        requiredPermission: 'purchase_order:read',
        organizationId: 'org-tenant-b', // Cross-tenant target
      });
    }).toThrow(/does not match command organization/);
  });

  it('blocks TENANT_A user from writing to TENANT_B inventory', () => {
    expect(() => {
      authEngine.authorize({
        actor: TENANT_A_USER,
        resourceType: 'inventory',
        requiredPermission: 'inventory:update',
        organizationId: 'org-tenant-b',
      });
    }).toThrow(/does not match command organization/);
  });

  it('blocks TENANT_A user from accessing TENANT_B audit traces', () => {
    expect(() => {
      authEngine.authorize({
        actor: TENANT_A_USER,
        resourceType: 'audit_logs',
        requiredPermission: 'audit:read',
        organizationId: 'org-tenant-b',
      });
    }).toThrow(/does not match command organization/);
  });

  it('blocks TENANT_A user from reading TENANT_B approvals', () => {
    expect(() => {
      authEngine.authorize({
        actor: TENANT_A_USER,
        resourceType: 'approvals',
        requiredPermission: 'purchase_order:approve',
        organizationId: 'org-tenant-b',
      });
    }).toThrow(/does not match command organization/);
  });

  it('blocks TENANT_A user from accessing TENANT_B events', () => {
    expect(() => {
      authEngine.authorize({
        actor: TENANT_A_USER,
        resourceType: 'events',
        requiredPermission: 'event:read',
        organizationId: 'org-tenant-b',
      });
    }).toThrow(/does not match command organization/);
  });

  // ── 4. AI-CONTEXT TENANT ISOLATION ────────────────────────────────────────

  it('blocks AI Agent of TENANT_A from reading TENANT_B context data', () => {
    expect(() => {
      authEngine.authorize({
        actor: AI_AGENT_TENANT_A,
        resourceType: 'purchase_order',
        requiredPermission: 'purchase_order:read',
        organizationId: 'org-tenant-b',
      });
    }).toThrow(/does not match command organization/);
  });

  // ── 5. PRIVILEGE ESCALATION BLOCKING ──────────────────────────────────────

  it('blocks standard buyer from approving purchase orders', () => {
    expect(() => {
      authEngine.authorize({
        actor: TENANT_A_USER,
        resourceType: 'purchase_order',
        requiredPermission: 'purchase_order:approve',
        organizationId: 'org-tenant-a',
      });
    }).toThrow(/requires one of/);
  });

  it('allows organization admin to approve purchase orders', () => {
    const result = authEngine.authorize({
      actor: TENANT_A_ADMIN,
      resourceType: 'purchase_order',
      requiredPermission: 'purchase_order:approve',
      organizationId: 'org-tenant-a',
    });
    expect(result.authorized).toBe(true);
    expect(result.matchedRole).toBe('organization_admin');
  });
});
