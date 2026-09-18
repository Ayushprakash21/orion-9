/**
 * ORION-9 KERNEL — PURCHASE ORDER END-TO-END INTEGRATION TEST
 *
 * Tests the complete reference workflow:
 *
 *   CreatePurchaseOrder command
 *     → CommandBus (idempotency, identity, policy)
 *     → Policy: REQUIRES_APPROVAL (amount > $5k)
 *     → Command HALTS
 *     → Human approves via resolveApproval
 *     → PurchaseOrderHandler executes
 *     → State: DRAFT (then handler applies APPROVED)
 *     → PurchaseOrderApproved event published
 *     → Audit record created
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { kernelCommandBus } from '../../../kernel/CommandBus';
import { kernelEventBus } from '../../../kernel/EventBus';
import { kernelAuditEngine } from '../../../kernel/AuditEngine';
import { poStateMachine } from '../../../kernel/StateMachine';
import { registerPurchaseOrderHandlers, COMMAND_CREATE_PO } from '../../../kernel/handlers/PurchaseOrderHandler';

// Register handlers before tests.
beforeAll(() => {
  registerPurchaseOrderHandlers();
});

// ─── Helper actor/tenant ──────────────────────────────────────────────────────

const USER_ACTOR = { id: 'user-buyer-001', type: 'USER' as const, name: 'Alice Chen', role: 'buyer' };
const MANAGER_ACTOR = { id: 'mgr-001', type: 'USER' as const, name: 'Bob Smith', role: 'procurement_manager' };
const TENANT = { organizationId: 'org-acme-001', organizationName: 'Acme Corp' };
const AI_ACTOR = { id: 'ai-demand-001', type: 'AI_AGENT' as const, name: 'DemandPlanner', role: 'ai_agent' };

// ─── LOW-VALUE PO: auto-approved (< $5,000) ──────────────────────────────────

describe('Purchase Order Reference Workflow — Low Value (auto-approve)', () => {
  it('creates a PO under $5k without requiring approval', async () => {
    const result = await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      {
        title: 'Office Supplies',
        amount: 1_200,
        currency: 'USD',
        description: 'Q1 office supplies restock',
      },
      {
        actor: USER_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 1_200,
        idempotencyKey: `low-value-po-${Date.now()}`,
      }
    );

    // Low-value PO should succeed without approval gate.
    expect(result.success).toBe(true);
    expect(result.requiresApproval).toBeFalsy();
    expect(result.result).toBeDefined();
    expect(result.result.state).toBe('DRAFT');
  });
});

// ─── MEDIUM-VALUE PO: requires approval ──────────────────────────────────────

describe('Purchase Order Reference Workflow — Approval Required → Human Approves', () => {
  it('halts command and creates approval request for PO > $5k', async () => {
    const dispatchResult = await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      {
        title: 'Server Equipment',
        supplierId: 'sup-001',
        supplierName: 'Tech Supplies Inc.',
        amount: 12_500,
        currency: 'USD',
        description: 'New development servers for Q2',
        lines: [
          { description: 'Dell PowerEdge R740', quantity: 2, unitPrice: 6_250 },
        ],
      },
      {
        actor: USER_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 12_500,
        idempotencyKey: `medium-po-${Date.now()}`,
        correlationId: 'corr-e2e-001',
      }
    );

    // Command MUST halt.
    expect(dispatchResult.success).toBe(false);
    expect(dispatchResult.requiresApproval).toBe(true);
    expect(dispatchResult.approvalId).toBeDefined();
    expect(dispatchResult.errorCode).toBeUndefined(); // Not an error, just pending.

    // Verify approvalId is tracked.
    const pending = kernelCommandBus.getPendingApprovals();
    const found = pending.find(p => p.approvalId === dispatchResult.approvalId);
    expect(found).toBeDefined();
    expect(found!.status).toBe('PENDING');
  });

  it('resumes and completes after manager approval', async () => {
    // Subscribe to events before dispatching.
    const events: string[] = [];
    const unsub1 = kernelEventBus.subscribe('PURCHASE_ORDER_CREATED', () => { events.push('CREATED'); });
    const unsub2 = kernelEventBus.subscribe('APPROVAL_REQUIRED', () => { events.push('APPROVAL_REQUIRED'); });
    const unsub3 = kernelEventBus.subscribe('APPROVAL_GRANTED', () => { events.push('APPROVAL_GRANTED'); });
    const unsub4 = kernelEventBus.subscribe('PURCHASE_ORDER_APPROVED', () => { events.push('APPROVED'); });

    const correlationId = `corr-approval-e2e-${Date.now()}`;

    // Dispatch PO that requires approval.
    const dispatchResult = await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      {
        title: 'Warehouse Racking System',
        amount: 18_000,
        currency: 'USD',
        description: 'New racking for Warehouse A',
      },
      {
        actor: USER_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 18_000,
        correlationId,
        idempotencyKey: `racking-po-${Date.now()}`,
      }
    );

    expect(dispatchResult.requiresApproval).toBe(true);
    const approvalId = dispatchResult.approvalId!;

    // Human manager approves.
    const resumeResult = await kernelCommandBus.resolveApproval(
      approvalId,
      'APPROVED',
      { id: MANAGER_ACTOR.id, name: MANAGER_ACTOR.name, role: MANAGER_ACTOR.role }
    );

    // After approval, command should complete successfully.
    expect(resumeResult).not.toBeNull();
    expect(resumeResult!.success).toBe(true);
    expect(resumeResult!.approvalId).toBe(approvalId);

    // Verify event sequence: APPROVAL_REQUIRED then APPROVAL_GRANTED.
    expect(events).toContain('APPROVAL_REQUIRED');
    expect(events).toContain('APPROVAL_GRANTED');

    // Clean up subscriptions.
    unsub1(); unsub2(); unsub3(); unsub4();
  });

  it('correctly rejects PO when manager rejects approval', async () => {
    const dispatchResult = await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      {
        title: 'Luxury Office Chairs',
        amount: 9_500,
        currency: 'USD',
      },
      {
        actor: USER_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 9_500,
        idempotencyKey: `chair-po-${Date.now()}`,
      }
    );

    expect(dispatchResult.requiresApproval).toBe(true);
    const approvalId = dispatchResult.approvalId!;

    // Manager rejects.
    const rejectResult = await kernelCommandBus.resolveApproval(
      approvalId,
      'REJECTED',
      { id: MANAGER_ACTOR.id, name: MANAGER_ACTOR.name, role: MANAGER_ACTOR.role },
      'Not approved: over budget for non-essential items'
    );

    expect(rejectResult!.success).toBe(false);
    expect(rejectResult!.errorCode).toBe('APPROVAL_REJECTED');
  });
});

// ─── AI ACTOR — must always be gated ─────────────────────────────────────────

describe('Purchase Order — AI Actor Governance', () => {
  it('blocks AI agent creating high-value PO without approval', async () => {
    const result = await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      { title: 'AI Bulk Order', amount: 75_000 },
      {
        actor: AI_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 75_000,
        idempotencyKey: `ai-po-${Date.now()}`,
      }
    );

    // AI constitution: AI + monetary > $5k → REQUIRE_APPROVAL.
    expect(result.requiresApproval).toBe(true);
    expect(result.success).toBe(false);
  });

  it('AI command still requires human approval even for medium amounts', async () => {
    const result = await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      { title: 'AI Small Order', amount: 6_000 },
      {
        actor: AI_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 6_000,
        idempotencyKey: `ai-small-po-${Date.now()}`,
      }
    );

    expect(result.requiresApproval).toBe(true);
  });
});

// ─── STATE MACHINE INTEGRATION ────────────────────────────────────────────────

describe('Purchase Order State Machine — Kernel Integration', () => {
  it('DRAFT → PENDING_APPROVAL is valid', () => {
    const r = poStateMachine.canTransition('DRAFT', 'PENDING_APPROVAL');
    expect(r.valid).toBe(true);
  });

  it('PENDING_APPROVAL → APPROVED is valid', () => {
    const r = poStateMachine.canTransition('PENDING_APPROVAL', 'APPROVED');
    expect(r.valid).toBe(true);
  });

  it('DRAFT → CLOSED is invalid (must go through full lifecycle)', () => {
    const r = poStateMachine.canTransition('DRAFT', 'CLOSED');
    expect(r.valid).toBe(false);
  });

  it('APPROVED → RELEASED is valid', () => {
    const r = poStateMachine.canTransition('APPROVED', 'RELEASED');
    expect(r.valid).toBe(true);
  });
});

// ─── AUDIT INTEGRATION ───────────────────────────────────────────────────────

describe('Audit Trail Integration', () => {
  it('records audit entries for successful commands', async () => {
    const pre = kernelAuditEngine.getRecords().length;

    await kernelCommandBus.dispatch(
      COMMAND_CREATE_PO,
      { title: 'Audit Test PO', amount: 500 },
      {
        actor: USER_ACTOR,
        tenant: TENANT,
        entityType: 'purchase_order',
        amount: 500,
        idempotencyKey: `audit-test-po-${Date.now()}`,
      }
    );

    const post = kernelAuditEngine.getRecords().length;
    expect(post).toBeGreaterThan(pre);
  });
});
