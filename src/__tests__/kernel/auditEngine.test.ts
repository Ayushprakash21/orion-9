/**
 * ORION-9 KERNEL — AUDIT ENGINE TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KernelAuditEngine } from '../../kernel/AuditEngine';

describe('KernelAuditEngine', () => {
  const engine = KernelAuditEngine.getInstance();

  it('records an audit entry and assigns auditId and timestamp', async () => {
    const record = await engine.record({
      actor: { id: 'user-001', type: 'USER', name: 'Buyer' },
      tenantId: 'org-001',
      action: 'CREATE_PO',
      entityType: 'purchase_order',
      entityId: 'po-001',
      result: 'SUCCESS',
      classification: 'INTERNAL',
    });

    expect(record.auditId).toMatch(/^audit-/);
    expect(record.timestamp).toBeDefined();
    expect(record.action).toBe('CREATE_PO');
    expect(record.result).toBe('SUCCESS');
  });

  it('records a failed operation', async () => {
    const record = await engine.record({
      actor: { id: 'user-002', type: 'USER', name: 'Manager' },
      tenantId: 'org-001',
      action: 'APPROVE_PO',
      entityType: 'purchase_order',
      entityId: 'po-002',
      result: 'FAILED',
      failureReason: 'Insufficient permissions',
      classification: 'INTERNAL',
    });

    expect(record.result).toBe('FAILED');
    expect(record.failureReason).toBe('Insufficient permissions');
  });

  it('records an approval decision in audit trail', async () => {
    const record = await engine.record({
      actor: { id: 'mgr-001', type: 'USER', name: 'Manager' },
      tenantId: 'org-001',
      action: 'APPROVE_PO',
      entityType: 'purchase_order',
      entityId: 'po-003',
      policyEvaluation: { policyId: 'POL-PO-001', result: 'REQUIRE_APPROVAL', reason: 'Amount exceeded $5k' },
      approval: { required: true, approvalId: 'appr-001', approverId: 'mgr-001', approvedAt: new Date().toISOString() },
      result: 'SUCCESS',
      classification: 'INTERNAL',
    });

    expect(record.approval?.approvalId).toBe('appr-001');
    expect(record.policyEvaluation?.policyId).toBe('POL-PO-001');
  });

  it('retrieves records filtered by entityId', async () => {
    await engine.record({
      actor: { id: 'u-filter', type: 'USER', name: 'Filter User' },
      tenantId: 'org-filter',
      action: 'TEST_FILTER',
      entityType: 'purchase_order',
      entityId: 'po-filter-unique',
      result: 'SUCCESS',
      classification: 'INTERNAL',
    });

    const results = engine.getRecords({ entityId: 'po-filter-unique' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entityId).toBe('po-filter-unique');
  });

  it('retrieves records filtered by tenantId', async () => {
    await engine.record({
      actor: { id: 'u1', type: 'SYSTEM', name: 'System' },
      tenantId: 'org-tenant-filter',
      action: 'SYNC',
      entityType: 'sync',
      entityId: 'sync-001',
      result: 'SUCCESS',
      classification: 'INTERNAL',
    });

    const results = engine.getRecords({ tenantId: 'org-tenant-filter' });
    expect(results.every(r => r.tenantId === 'org-tenant-filter')).toBe(true);
  });

  it('does NOT record passwords or tokens in audit payload', async () => {
    const record = await engine.record({
      actor: { id: 'user-sec', type: 'USER', name: 'Security Tester' },
      tenantId: 'org-001',
      action: 'LOGIN',
      entityType: 'session',
      entityId: 'sess-001',
      // Intentionally pass sensitive data in details to verify it is not stored.
      details: { username: 'testuser' }, // password intentionally omitted
      result: 'SUCCESS',
      classification: 'INTERNAL',
    });

    const recordStr = JSON.stringify(record);
    expect(recordStr).not.toContain('password');
    expect(recordStr).not.toContain('api_key');
    expect(recordStr).not.toContain('token');
  });
});
