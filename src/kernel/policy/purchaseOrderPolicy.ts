/**
 * Purchase Order Policy Registration
 *
 * Registers PO-specific policies into the KernelPolicyEngine instance.
 * Import this module once at application startup to activate PO governance rules.
 *
 * Rule hierarchy (evaluated in order of severity):
 *  1. POL-PO-003 – AI-initiated PO always requires human approval
 *  2. POL-PO-002 – PO amount > $50,000 → senior approval (already covered by POL-FIN-001)
 *  3. POL-PO-001 – PO amount > $5,000  → manager approval
 */

import { kernelPolicyEngine } from '../PolicyEngine';

/** Auto-approve threshold: POs at or below this amount pass without approval. */
export const PO_AUTO_APPROVE_LIMIT = 5_000;

/** Standard approval threshold: amounts above this require 1 manager sign-off. */
export const PO_MANAGER_APPROVAL_THRESHOLD = 5_000;

/** High-value threshold: amounts above this require senior/executive sign-off. */
export const PO_SENIOR_APPROVAL_THRESHOLD = 50_000;

export const COMMAND_CREATE_PO  = 'CREATE_PURCHASE_ORDER';
export const COMMAND_APPROVE_PO = 'APPROVE_PURCHASE_ORDER';
export const COMMAND_REJECT_PO  = 'REJECT_PURCHASE_ORDER';
export const COMMAND_RELEASE_PO = 'RELEASE_PURCHASE_ORDER';
export const COMMAND_CANCEL_PO  = 'CANCEL_PURCHASE_ORDER';

/** Register all PO-specific policies into the global policy engine. */
export function registerPurchaseOrderPolicies(): void {
  // Standard amount-based approval gate ($5k–$50k → manager)
  kernelPolicyEngine.addPolicy({
    id: 'POL-PO-001',
    name: 'PO Standard Amount Approval Gate',
    description: 'Purchase orders exceeding $5,000 require procurement manager approval.',
    enabled: true,
    version: '1.0',
    targetActions: [COMMAND_CREATE_PO],
    targetEntities: ['purchase_order'],
    conditions: {
      maxMonetaryAmount: PO_MANAGER_APPROVAL_THRESHOLD,
    },
    outcome: 'REQUIRE_APPROVAL',
    reason: `Purchase order amount exceeds $${PO_MANAGER_APPROVAL_THRESHOLD.toLocaleString()} — procurement manager approval required.`,
  });

  // High-value gate ($50k+ → senior/executive) — supplements POL-FIN-001
  kernelPolicyEngine.addPolicy({
    id: 'POL-PO-002',
    name: 'PO High-Value Senior Approval Gate',
    description: 'Purchase orders exceeding $50,000 require senior management approval.',
    enabled: true,
    version: '1.0',
    targetActions: [COMMAND_CREATE_PO, COMMAND_APPROVE_PO],
    targetEntities: ['purchase_order'],
    conditions: {
      maxMonetaryAmount: PO_SENIOR_APPROVAL_THRESHOLD,
      requiredRoles: ['organization_admin', 'platform_admin'],
    },
    outcome: 'REQUIRE_APPROVAL',
    reason: `Purchase order amount exceeds $${PO_SENIOR_APPROVAL_THRESHOLD.toLocaleString()} — senior management approval required.`,
  });

  // AI-generated PO always requires human approval (AI Constitution Rule)
  kernelPolicyEngine.addPolicy({
    id: 'POL-PO-003',
    name: 'AI-Generated PO Human Approval Mandate',
    description: 'Any purchase order initiated by an AI agent must receive human approval before execution.',
    enabled: true,
    version: '1.0',
    targetActions: [COMMAND_CREATE_PO],
    targetEntities: ['purchase_order'],
    conditions: {},
    outcome: 'REQUIRE_APPROVAL',
    reason: 'AI-generated purchase orders require mandatory human review and approval before state change.',
  });
}
