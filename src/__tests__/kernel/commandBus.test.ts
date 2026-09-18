/**
 * ORION-9 KERNEL — COMMAND BUS TESTS
 *
 * Tests the CommandBus pipeline. Note: Tests use actual policy engine behavior —
 * see PolicyEngine.ts for exact trigger conditions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KernelCommandBus } from '../../kernel/CommandBus';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeActor(overrides: Partial<any> = {}) {
  return {
    id: 'user-001',
    type: 'USER' as const,
    name: 'Test User',
    role: 'buyer',
    ...overrides,
  };
}

function makeTenant(overrides: Partial<any> = {}) {
  return {
    organizationId: 'org-001',
    organizationName: 'Acme Corp',
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('KernelCommandBus', () => {
  let bus: KernelCommandBus;

  beforeEach(() => {
    bus = KernelCommandBus.getInstance();
  });

  // ── Handler registration ────────────────────────────────────────────────────

  it('registers and executes a command handler', async () => {
    const handler = vi.fn().mockResolvedValue({ done: true });
    bus.registerHandler('TEST_COMMAND_EXEC', handler);

    const result = await bus.dispatch('TEST_COMMAND_EXEC', { value: 42 }, {
      actor: makeActor(),
      tenant: makeTenant(),
      entityType: 'test_resource',
    });

    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  // ── Missing actor ───────────────────────────────────────────────────────────

  it('rejects command with missing actor id', async () => {
    const result = await bus.dispatch('ANY_COMMAND_CB', {}, {
      actor: { id: '', type: 'USER', name: '' } as any,
      tenant: makeTenant(),
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('IDENTITY_REQUIRED');
  });

  // ── Missing handler ─────────────────────────────────────────────────────────

  it('returns HANDLER_NOT_FOUND when no handler is registered', async () => {
    const result = await bus.dispatch('COMPLETELY_UNREGISTERED_CMD_99', {}, {
      actor: makeActor(),
      tenant: makeTenant(),
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('HANDLER_NOT_FOUND');
  });

  // ── Idempotency ─────────────────────────────────────────────────────────────

  it('deduplicates commands with the same idempotency key', async () => {
    const handler = vi.fn().mockResolvedValue({ created: true });
    bus.registerHandler('IDEMPOTENT_CMD_CB', handler);

    const ctx = {
      actor: makeActor(),
      tenant: makeTenant(),
      idempotencyKey: 'idem-test-key-cb-001',
    };

    await bus.dispatch('IDEMPOTENT_CMD_CB', {}, ctx);
    const second = await bus.dispatch('IDEMPOTENT_CMD_CB', {}, ctx);

    expect(second.success).toBe(false);
    expect(second.errorCode).toBe('DUPLICATE_SUPPRESSED');
    expect(handler).toHaveBeenCalledOnce();
  });

  // ── Policy approval gate (AI + monetary) ───────────────────────────────────

  it('halts command for AI_AGENT with amount > $5k (AI constitution rule)', async () => {
    const handler = vi.fn().mockResolvedValue({ poId: 'po-001' });
    bus.registerHandler('APPROVE_TEST_CMD_CB', handler);

    // The AI constitution rule: AI_AGENT + amount > 5000 → REQUIRE_APPROVAL
    const result = await bus.dispatch('APPROVE_TEST_CMD_CB', { amount: 20_000 }, {
      actor: { id: 'ai-001', type: 'AI_AGENT', name: 'DemandAI', role: 'ai_agent' } as any,
      tenant: makeTenant(),
      entityType: 'purchase_order',
      amount: 20_000,
    });

    expect(result.success).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.approvalId).toBeDefined();
    expect(handler).not.toHaveBeenCalled();
  });

  // ── Approval flow: APPROVED → resume ──────────────────────────────────────

  it('resumes command after human approval and returns success', async () => {
    const handler = vi.fn().mockResolvedValue({ poId: 'po-resume-001', state: 'APPROVED' });
    bus.registerHandler('RESUME_TEST_CMD_CB', handler);

    // First dispatch — AI actor with high amount triggers approval gate.
    const dispatchResult = await bus.dispatch('RESUME_TEST_CMD_CB', { amount: 60_000 }, {
      actor: { id: 'ai-002', type: 'AI_AGENT', name: 'AI Buyer', role: 'ai_agent' } as any,
      tenant: makeTenant(),
      entityType: 'purchase_order',
      amount: 60_000,
    });

    expect(dispatchResult.requiresApproval).toBe(true);
    const approvalId = dispatchResult.approvalId!;

    // Human resolves the approval.
    const resumeResult = await bus.resolveApproval(
      approvalId,
      'APPROVED',
      { id: 'manager-001', name: 'Supply Manager', role: 'procurement_manager' }
    );

    expect(resumeResult).not.toBeNull();
    expect(resumeResult!.success).toBe(true);
    expect(resumeResult!.approvalId).toBe(approvalId);
    expect(handler).toHaveBeenCalledOnce();
  });

  // ── Approval flow: REJECTED ────────────────────────────────────────────────

  it('returns rejection result when approval is rejected', async () => {
    const handler = vi.fn().mockResolvedValue({});
    bus.registerHandler('REJECT_TEST_CMD_CB', handler);

    const dispatchResult = await bus.dispatch('REJECT_TEST_CMD_CB', { amount: 60_000 }, {
      actor: { id: 'ai-003', type: 'AI_AGENT', name: 'AI Bot', role: 'ai_agent' } as any,
      tenant: makeTenant(),
      entityType: 'purchase_order',
      amount: 60_000,
    });

    expect(dispatchResult.requiresApproval).toBe(true);
    const approvalId = dispatchResult.approvalId!;

    const rejectResult = await bus.resolveApproval(
      approvalId,
      'REJECTED',
      { id: 'manager-002', name: 'Director', role: 'organization_admin' },
      'Insufficient budget'
    );

    expect(rejectResult!.success).toBe(false);
    expect(rejectResult!.errorCode).toBe('APPROVAL_REJECTED');
    expect(handler).not.toHaveBeenCalled();
  });

  // ── Pending approvals ───────────────────────────────────────────────────────

  it('returns null when resolving an unknown approval ID', async () => {
    const result = await bus.resolveApproval(
      'nonexistent-approval-id-cb',
      'APPROVED',
      { id: 'u1', name: 'User', role: 'buyer' }
    );
    expect(result).toBeNull();
  });

  it('getPendingApprovals returns only PENDING records', async () => {
    const pending = bus.getPendingApprovals();
    expect(Array.isArray(pending)).toBe(true);
    pending.forEach(p => expect(p.status).toBe('PENDING'));
  });
});
