/**
 * ORION-9 KERNEL — AUTHORIZATION ENGINE TESTS
 */

import { describe, it, expect } from 'vitest';
import { AuthorizationEngine } from '../../kernel/authorization/AuthorizationEngine';
import { ActorType } from '../../kernel/authorization/AuthorizationEngine';

const engine = new AuthorizationEngine();

function makeCtx(overrides: Partial<Parameters<typeof engine.authorize>[0]> = {}) {
  return {
    actor: {
      id: 'user-001',
      type: ActorType.USER,
      name: 'Test Buyer',
      roles: ['buyer'],
      organizationId: 'org-001',
    },
    resourceType: 'purchase_order',
    requiredPermission: 'purchase_order:create',
    organizationId: 'org-001',
    ...overrides,
  };
}

describe('AuthorizationEngine', () => {
  it('authorizes a buyer to create a purchase order', () => {
    const result = engine.authorize(makeCtx());
    expect(result.authorized).toBe(true);
    expect(result.matchedRole).toBe('buyer');
  });

  it('authorizes a procurement_manager to approve a PO', () => {
    const result = engine.authorize(makeCtx({
      actor: {
        id: 'mgr-001',
        type: ActorType.USER,
        name: 'Manager',
        roles: ['procurement_manager'],
        organizationId: 'org-001',
      },
      requiredPermission: 'purchase_order:approve',
    }));
    expect(result.authorized).toBe(true);
    expect(result.matchedRole).toBe('procurement_manager');
  });

  it('denies a viewer attempting to approve a PO', () => {
    expect(() => {
      engine.authorize(makeCtx({
        actor: {
          id: 'view-001',
          type: ActorType.USER,
          name: 'Viewer',
          roles: ['viewer'],
          organizationId: 'org-001',
        },
        requiredPermission: 'purchase_order:approve',
      }));
    }).toThrow();
  });

  it('denies actor from wrong organization (tenant isolation)', () => {
    expect(() => {
      engine.authorize(makeCtx({
        actor: {
          id: 'user-other',
          type: ActorType.USER,
          name: 'Other User',
          roles: ['buyer'],
          organizationId: 'org-999', // Different org
        },
        organizationId: 'org-001',
      }));
    }).toThrow(/does not match command organization/i);
  });

  it('allows internal SYSTEM actor from orion-kernel to bypass', () => {
    const result = engine.authorize(makeCtx({
      actor: {
        id: 'orion-kernel',
        type: ActorType.SYSTEM,
        name: 'Orion Kernel',
        roles: [],
        organizationId: 'org-001',
      },
    }));
    expect(result.authorized).toBe(true);
    expect(result.matchedRole).toBe('SYSTEM');
  });

  it('denies unknown permission (fail closed)', () => {
    expect(() => {
      engine.authorize(makeCtx({ requiredPermission: 'totally:unknown' }));
    }).toThrow(/No permission rule defined/i);
  });
});
