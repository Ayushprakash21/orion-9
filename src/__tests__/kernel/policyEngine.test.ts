/**
 * ORION-9 KERNEL — POLICY ENGINE TESTS
 *
 * Tests aligned with actual PolicyEngine behavior:
 * - AI constitution: AI_AGENT + (amount > 5000 || action includes APPROVE/ACTIVATE/PAY) → REQUIRE_APPROVAL
 * - POL-FIN-001: APPROVE_PO/RELEASE_PO on purchase_order with amount > $50k → REQUIRE_APPROVAL
 * - POL-PO-001 (registered via purchaseOrderPolicy): amount > $5k on purchase_order → REQUIRE_APPROVAL
 * - POL-SEC-001: EXPORT_DATA → BLOCK (no conditions — but only fires for conditions matches, not unconditional)
 * - POL-SUP-001: supplierRiskScore > 75 with APPROVE_PO → REQUIRE_APPROVAL
 */

import { describe, it, expect } from 'vitest';
import { KernelPolicyEngine } from '../../kernel/PolicyEngine';
import { registerPurchaseOrderPolicies } from '../../kernel/policy/purchaseOrderPolicy';

// Register PO policies before tests.
registerPurchaseOrderPolicies();

const engine = KernelPolicyEngine.getInstance();

function makeContext(overrides: Partial<Parameters<typeof engine.evaluate>[0]> = {}) {
  return {
    actor: { id: 'user-001', type: 'USER' as const, role: 'buyer', name: 'Buyer' },
    tenantId: 'org-001',
    action: 'CREATE_PURCHASE_ORDER',
    entityType: 'purchase_order',
    ...overrides,
  };
}

describe('KernelPolicyEngine', () => {
  // ── Default ALLOW ──────────────────────────────────────────────────────────

  it('ALLOWS a low-value PO (below $5k threshold)', () => {
    const result = engine.evaluate(makeContext({ amount: 1_000 }));
    expect(result.result).toBe('ALLOW');
    expect(result.requiresApproval).toBe(false);
  });

  it('ALLOWS no-amount USER command', () => {
    const result = engine.evaluate(makeContext({ amount: undefined }));
    expect(result.result).toBe('ALLOW');
  });

  // ── POL-PO-001 (PO amount > $5k) ──────────────────────────────────────────

  it('REQUIRES_APPROVAL for PO above $5k (POL-PO-001)', () => {
    const result = engine.evaluate(makeContext({ amount: 10_000 }));
    expect(result.requiresApproval).toBe(true);
    expect(result.ruleId).toBe('POL-PO-001');
  });

  it('REQUIRES_APPROVAL for PO above $50k', () => {
    const result = engine.evaluate(makeContext({ amount: 75_000 }));
    expect(result.requiresApproval).toBe(true);
  });

  // ── AI Constitution Rule ────────────────────────────────────────────────────

  it('REQUIRES_APPROVAL for AI agent creating high-value PO (AI constitution)', () => {
    const result = engine.evaluate(makeContext({
      actor: { id: 'ai-001', type: 'AI_AGENT', role: 'ai_agent', name: 'AI' },
      amount: 8_000,
    }));
    expect(result.requiresApproval).toBe(true);
    expect(result.ruleId).toBe('POL-AI-CONSTITUTION');
  });

  it('REQUIRES_APPROVAL for AI agent with action containing APPROVE (constitution)', () => {
    const result = engine.evaluate(makeContext({
      actor: { id: 'ai-001', type: 'AI_AGENT', role: 'ai_agent', name: 'AI' },
      action: 'APPROVE_PO',
      amount: undefined,
    }));
    expect(result.requiresApproval).toBe(true);
    expect(result.ruleId).toBe('POL-AI-CONSTITUTION');
  });

  it('REQUIRES_APPROVAL for AI agent with action containing ACTIVATE', () => {
    const result = engine.evaluate(makeContext({
      actor: { id: 'ai-001', type: 'AI_AGENT', role: 'ai_agent', name: 'AI' },
      action: 'ACTIVATE_VENDOR',
      amount: undefined,
    }));
    expect(result.requiresApproval).toBe(true);
  });

  // ── POL-FIN-001 (> $50k on APPROVE_PO) ────────────────────────────────────

  it('REQUIRES_APPROVAL for APPROVE_PO on PO > $50k (POL-FIN-001)', () => {
    const result = engine.evaluate({
      ...makeContext(),
      action: 'APPROVE_PO',
      entityType: 'purchase_order',
      amount: 60_000,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.ruleId).toBe('POL-FIN-001');
  });

  // ── POL-SUP-001 (high-risk supplier) ──────────────────────────────────────

  it('REQUIRES_APPROVAL for high-risk supplier (POL-SUP-001)', () => {
    const result = engine.evaluate({
      ...makeContext(),
      action: 'APPROVE_PO',
      entityType: 'purchase_order',
      supplierRiskScore: 90,
    });
    expect(result.requiresApproval).toBe(true);
    expect(result.ruleId).toBe('POL-SUP-001');
  });

  // ── Custom policies ────────────────────────────────────────────────────────

  it('custom REQUIRE_APPROVAL policy triggers on matching action + monetary condition', () => {
    engine.addPolicy({
      id: 'POL-TEST-CUSTOM-001',
      name: 'Test custom threshold policy',
      description: 'Test',
      enabled: true,
      version: '1.0',
      targetActions: ['CUSTOM_MONETARY_ACTION'],
      targetEntities: ['custom_entity'],
      conditions: { maxMonetaryAmount: 100 },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Custom test threshold exceeded',
    });

    const result = engine.evaluate(makeContext({
      action: 'CUSTOM_MONETARY_ACTION',
      entityType: 'custom_entity',
      amount: 500,
    }));
    expect(result.result).toBe('REQUIRE_APPROVAL');
    expect(result.ruleId).toBe('POL-TEST-CUSTOM-001');

    // Cleanup.
    engine.removePolicy('POL-TEST-CUSTOM-001');
  });

  it('disabled policies are skipped', () => {
    engine.addPolicy({
      id: 'POL-TEST-DISABLED-001',
      name: 'Disabled policy',
      description: 'Should never trigger',
      enabled: false,
      version: '1.0',
      targetActions: ['CREATE_PURCHASE_ORDER'],
      targetEntities: ['purchase_order'],
      conditions: { maxMonetaryAmount: 1 },
      outcome: 'BLOCK',
      reason: 'Should not see this',
    });

    const result = engine.evaluate(makeContext({ amount: 500 }));
    // Should NOT be blocked by disabled policy; should still trigger POL-PO-001 for $500 < $5k → ALLOW.
    expect(result.result).toBe('ALLOW');

    engine.removePolicy('POL-TEST-DISABLED-001');
  });
});
