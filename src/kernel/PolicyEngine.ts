/**
 * ORION-9 CONTROL PLANE — KERNEL POLICY ENGINE
 * Layer 3: Independent governance engine evaluating all state-changing operations
 * against monetary thresholds, role limits, risk scores, data classification, and tenant policies.
 */

import { PolicyRule, PolicyEvaluationResult, DataClassification } from './types';
import { kernelEventBus } from './EventBus';

export interface PolicyEvaluationContext {
  actor: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM' | 'EXTERNAL_INTEGRATION';
    role?: string;
    name?: string;
    agentId?: string;
  };
  tenantId: string;
  action: string;
  entityType: string;
  entityId?: string;
  amount?: number;
  supplierRiskScore?: number;
  classification?: DataClassification;
  customAttributes?: Record<string, any>;
}

export interface PolicyEvaluationOutcome {
  result: PolicyEvaluationResult;
  ruleId?: string;
  ruleName?: string;
  reason: string;
  requiresApproval: boolean;
  approvalRole?: string;
  evaluatedAt: string;
}

export class KernelPolicyEngine {
  private static instance: KernelPolicyEngine;
  private policies: Map<string, PolicyRule> = new Map();

  private constructor() {
    this.registerDefaultPolicies();
  }

  public static getInstance(): KernelPolicyEngine {
    if (!KernelPolicyEngine.instance) {
      KernelPolicyEngine.instance = new KernelPolicyEngine();
    }
    return KernelPolicyEngine.instance;
  }

  /**
   * Registers default enterprise governance rules
   */
  private registerDefaultPolicies(): void {
    // 1. High-Value Financial Threshold ($50,000)
    this.addPolicy({
      id: 'POL-FIN-001',
      name: 'High-Value Financial Threshold',
      description: 'Operations involving financial exposure greater than $50,000 require human manager approval.',
      enabled: true,
      version: '1.0',
      targetActions: ['APPROVE_PO', 'RELEASE_PO', 'APPROVE_INVOICE', 'EXECUTE_ACTION'],
      targetEntities: ['purchase_order', 'invoice', 'action'],
      conditions: {
        maxMonetaryAmount: 50000,
      },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Monetary value exceeds autonomous execution limit of $50,000. Human approval required.',
    });

    // 2. Executive Financial Threshold ($250,000)
    this.addPolicy({
      id: 'POL-FIN-002',
      name: 'Executive Financial Threshold',
      description: 'Operations exceeding $250,000 must escalate to platform director or organization admin.',
      enabled: true,
      version: '1.0',
      targetActions: ['APPROVE_PO', 'RELEASE_PO', 'APPROVE_INVOICE'],
      targetEntities: ['purchase_order', 'invoice'],
      conditions: {
        maxMonetaryAmount: 250000,
      },
      outcome: 'ESCALATE',
      reason: 'Monetary value exceeds $250,000. Escalated to Executive / Platform Director review.',
    });

    // 3. AI Direct Database Write Prohibition
    this.addPolicy({
      id: 'POL-AI-001',
      name: 'AI Unrestricted Write Guardrail',
      description: 'AI agents cannot directly execute state modifications without routing through governed tools.',
      enabled: true,
      version: '1.0',
      targetActions: ['DIRECT_DB_WRITE', 'DROP_TABLE', 'RAW_SQL'],
      targetEntities: ['*'],
      conditions: {},
      outcome: 'BLOCK',
      reason: 'Prohibited AI action: Unrestricted database manipulation is strictly forbidden.',
    });

    // 4. Critical Supplier Risk Gate
    this.addPolicy({
      id: 'POL-SUP-001',
      name: 'High-Risk Supplier Order Gate',
      description: 'Purchase orders placed with high-risk suppliers (risk score > 75) require risk review.',
      enabled: true,
      version: '1.0',
      targetActions: ['APPROVE_PO', 'RELEASE_PO'],
      targetEntities: ['purchase_order', 'supplier'],
      conditions: {
        supplierRiskThreshold: 75,
      },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Supplier risk index exceeds 75/100. Supply Chain Manager approval required.',
    });

    // 5. Restricted Data Protection (Confidentiality Rule)
    this.addPolicy({
      id: 'POL-SEC-001',
      name: 'Restricted Data Protection Rule',
      description: 'Prevents unauthorized actors from exporting or transmitting RESTRICTED supply chain records.',
      enabled: true,
      version: '1.0',
      targetActions: ['EXPORT_DATA', 'BROADCAST_TELEMETRY'],
      targetEntities: ['*'],
      conditions: {},
      outcome: 'BLOCK',
      reason: 'Classification is RESTRICTED: External transmission blocked without explicit cryptographic clearance.',
    });

    // 6. High-Value Strategic Contract Threshold ($100,000)
    this.addPolicy({
      id: 'POL-CTR-001',
      name: 'High-Value Contract Commitment Threshold',
      description: 'Contracts or RFQ awards exceeding $100,000 commitment require legal and executive approval.',
      enabled: true,
      version: '1.0',
      targetActions: ['APPROVE_CONTRACT', 'EXECUTE_CONTRACT', 'AWARD_RFQ'],
      targetEntities: ['contract', 'rfq'],
      conditions: {
        maxMonetaryAmount: 100000,
      },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Contract value exceeds $100,000 threshold. Legal counsel and Executive sign-off required.',
    });

    // 7. Stress Test Disruption Contingency Expenditure Gate ($50,000)
    this.addPolicy({
      id: 'POL-SCN-001',
      name: 'Stress Test Contingency Expenditure Gate',
      description: 'Scenario contingency plans exceeding $50,000 mitigation expenditure or rerouting critical network nodes require Executive Approval Center authorization.',
      enabled: true,
      version: '1.0',
      targetActions: ['COMMIT_CONTINGENCY_PLAN', 'DISPATCH_CONTINGENCY_TO_APPROVAL'],
      targetEntities: ['scenario', 'contingency_plan'],
      conditions: {
        maxMonetaryAmount: 50000,
      },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Contingency plan execution expenditure exceeds $50,000 autonomous threshold. Executive governance authorization required.',
    });

    // 8. Multimodal Expedited Freight & Reroute Gate ($20,000)
    this.addPolicy({
      id: 'POL-LOG-001',
      name: 'Multimodal Expedited Freight & Reroute Gate',
      description: 'Expedited multimodal air bookings or emergency reroute authorizations exceeding $20,000 require transportation management approval.',
      enabled: true,
      version: '1.0',
      targetActions: ['DISPATCH_FREIGHT_CONSIGNMENT', 'APPROVE_CONSOLIDATION_PLAN', 'TRIGGER_EMERGENCY_REROUTE'],
      targetEntities: ['freight_consignment', 'freight_consolidation', 'shipment'],
      conditions: {
        maxMonetaryAmount: 20000,
      },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Expedited multimodal freight expenditure or emergency reroute exceeds $20,000 autonomous threshold. Transportation Director approval required.',
    });

    // 9. Cold Chain & Tamper Integrity Gate
    this.addPolicy({
      id: 'POL-LOG-002',
      name: 'Cold Chain & Tamper Integrity Quarantine Gate',
      description: 'Automatically flags consignments for immediate physical quarantine if temperature boundaries or cryptographic tamper seals are compromised.',
      enabled: true,
      version: '1.0',
      targetActions: ['RECORD_IOT_TELEMETRY', 'VERIFY_COLD_CHAIN'],
      targetEntities: ['freight_consignment', 'telemetry'],
      conditions: {},
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Cold chain temperature excursion or cryptographic tamper seal violation detected. Consignment quarantined pending Quality Inspection release.',
    });

    // 10. Autonomous Replenishment & Reorder Capital Gate ($25,000)
    this.addPolicy({
      id: 'POL-MEIO-001',
      name: 'Autonomous Replenishment & Reorder Capital Gate',
      description: 'Autonomous purchase requisitions and stock transfers exceeding $25,000 require human authorization in Unified Approval Center.',
      enabled: true,
      version: '1.0',
      targetActions: ['GENERATE_REPLENISHMENT_ORDER', 'DISPATCH_REPLENISHMENT_TO_APPROVAL', 'REBALANCE_ECHELON_STOCK'],
      targetEntities: ['replenishment_order', 'sku_buffer'],
      conditions: {
        maxMonetaryAmount: 25000,
      },
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Autonomous replenishment requisition exceeds $25,000 threshold. Vice President of Supply Chain sign-off required.',
    });

    // 11. Critical Echelon Decoupling Buffer Excursion
    this.addPolicy({
      id: 'POL-MEIO-002',
      name: 'Critical Echelon Decoupling Buffer Excursion',
      description: 'Flags critical buffer breach when effective stock falls below 40% of safety stock, requiring mandatory inter-echelon STO rebalance.',
      enabled: true,
      version: '1.0',
      targetActions: ['OVERRIDE_SAFETY_STOCK', 'REBALANCE_ECHELON_STOCK'],
      targetEntities: ['sku_buffer'],
      conditions: {},
      outcome: 'REQUIRE_APPROVAL',
      reason: 'Decoupling buffer breached safety thresholds. Dynamic rebalancing or expedited replenishment required.',
    });
  }

  public addPolicy(policy: PolicyRule): void {
    this.policies.set(policy.id, policy);
  }

  public removePolicy(id: string): boolean {
    return this.policies.delete(id);
  }

  public getPolicies(): PolicyRule[] {
    return Array.from(this.policies.values());
  }

  /**
   * Evaluates context against registered policies
   */
  public evaluate(context: PolicyEvaluationContext): PolicyEvaluationOutcome {
    const evaluatedAt = new Date().toISOString();

    // AI Safety Constitution Rule: If an AI Actor attempts to execute an action without human approval
    if (context.actor.type === 'AI_AGENT') {
      // If action is monetary or contract or vendor activation, it is always at least APPROVAL_GATED
      if (
        (context.amount && context.amount > 5000) ||
        context.action.includes('ACTIVATE') ||
        context.action.includes('APPROVE') ||
        context.action.includes('PAY')
      ) {
        return {
          result: 'REQUIRE_APPROVAL',
          ruleId: 'POL-AI-CONSTITUTION',
          ruleName: 'AI Architectural Constitution Rule 9',
          reason: 'Where human approval is required, AI MUST STOP before execution. Approval required.',
          requiresApproval: true,
          approvalRole: 'supply_chain_manager',
          evaluatedAt,
        };
      }
    }

    // Iterate through policies in order of severity: BLOCK > ESCALATE > REQUIRE_APPROVAL > MASK > ALLOW
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      // Match action
      const matchesAction = policy.targetActions.includes('*') || policy.targetActions.includes(context.action);
      if (!matchesAction) continue;

      // Match entity
      const matchesEntity = policy.targetEntities.includes('*') || policy.targetEntities.includes(context.entityType);
      if (!matchesEntity) continue;

      // Check monetary threshold
      if (
        policy.conditions.maxMonetaryAmount !== undefined &&
        context.amount !== undefined &&
        context.amount > policy.conditions.maxMonetaryAmount
      ) {
        return {
          result: policy.outcome,
          ruleId: policy.id,
          ruleName: policy.name,
          reason: policy.reason,
          requiresApproval: policy.outcome === 'REQUIRE_APPROVAL' || policy.outcome === 'ESCALATE',
          approvalRole: policy.outcome === 'ESCALATE' ? 'platform_admin' : 'supply_chain_manager',
          evaluatedAt,
        };
      }

      // Check supplier risk
      if (
        policy.conditions.supplierRiskThreshold !== undefined &&
        context.supplierRiskScore !== undefined &&
        context.supplierRiskScore > policy.conditions.supplierRiskThreshold
      ) {
        return {
          result: policy.outcome,
          ruleId: policy.id,
          ruleName: policy.name,
          reason: policy.reason,
          requiresApproval: policy.outcome === 'REQUIRE_APPROVAL',
          approvalRole: 'supply_chain_manager',
          evaluatedAt,
        };
      }

      // Check classification / restricted roles
      if (
        policy.conditions.dataClassification &&
        context.classification &&
        policy.conditions.dataClassification.includes(context.classification)
      ) {
        if (
          !policy.conditions.restrictedRoles ||
          (context.actor.role && policy.conditions.restrictedRoles.includes(context.actor.role))
        ) {
          return {
            result: policy.outcome,
            ruleId: policy.id,
            ruleName: policy.name,
            reason: policy.reason,
            requiresApproval: false,
            evaluatedAt,
          };
        }
      }
    }

    // Default: ALLOW
    return {
      result: 'ALLOW',
      reason: 'No restrictive governance policies triggered. Action authorized.',
      requiresApproval: false,
      evaluatedAt,
    };
  }
}

export const kernelPolicyEngine = KernelPolicyEngine.getInstance();
