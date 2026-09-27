/**
 * ORION-9 SCM BUSINESS RULE & POLICY GOVERNANCE ENGINE
 * Layer 7 / Wave 4-5 Track 2
 *
 * Centralizes SCM business rules:
 * - Approval thresholds & Segregation of Duties (no self-approval)
 * - Quantity & Tolerance checks (over-receipt limits, partial delivery bounds)
 * - Supplier & Product qualification status guards
 * - Cancellation and State progression guards
 */

import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { PurchaseOrderRecord, PurchaseRequisitionRecord, ASNRecord, CustomerOrderRecord } from './types';

export interface RuleEvaluationResult {
  allowed: boolean;
  ruleId: string;
  ruleName: string;
  severity: 'INFO' | 'WARNING' | 'BLOCKING';
  reason?: string;
  context?: Record<string, any>;
}

export class ScmBusinessRuleEngine {
  private static instance: ScmBusinessRuleEngine;

  private constructor() {}

  public static getInstance(): ScmBusinessRuleEngine {
    if (!ScmBusinessRuleEngine.instance) {
      ScmBusinessRuleEngine.instance = new ScmBusinessRuleEngine();
    }
    return ScmBusinessRuleEngine.instance;
  }

  /**
   * Evaluates Purchase Requisition creation and approval rules
   */
  public evaluatePRApproval(params: {
    pr: PurchaseRequisitionRecord;
    approver: AuthorizationActor;
  }): RuleEvaluationResult {
    const { pr, approver } = params;

    // Rule 1: Segregation of Duties (SoD) - Requester cannot approve their own PR
    if (pr.requesterId === approver.id) {
      return {
        allowed: false,
        ruleId: 'RULE-PR-SOD-001',
        ruleName: 'Segregation of Duties - No Self Approval',
        severity: 'BLOCKING',
        reason: `User [${approver.id}] requested PR [${pr.prId}] and cannot approve their own requisition.`,
        context: { requesterId: pr.requesterId, approverId: approver.id },
      };
    }

    // Rule 2: Minimum value check
    if (pr.totalEstimatedValue <= 0) {
      return {
        allowed: false,
        ruleId: 'RULE-PR-VAL-002',
        ruleName: 'Positive Value Constraint',
        severity: 'BLOCKING',
        reason: `PR total estimated value must be greater than zero (current: ${pr.totalEstimatedValue}).`,
      };
    }

    return {
      allowed: true,
      ruleId: 'RULE-PR-PASS',
      ruleName: 'PR Approval Policy Passed',
      severity: 'INFO',
    };
  }

  /**
   * Evaluates Purchase Order approval and issuance rules
   */
  public evaluatePOApproval(params: {
    po: PurchaseOrderRecord;
    approver: AuthorizationActor;
  }): RuleEvaluationResult {
    const { po, approver } = params;

    // Rule 1: Empty or zero lines
    if (!po.items || po.items.length === 0) {
      return {
        allowed: false,
        ruleId: 'RULE-PO-LINES-001',
        ruleName: 'Non-Empty Line Items Required',
        severity: 'BLOCKING',
        reason: 'Purchase order must contain at least one line item.',
      };
    }

    // Rule 2: Negative or zero quantity check
    for (const line of po.items) {
      if (line.quantity <= 0) {
        return {
          allowed: false,
          ruleId: 'RULE-PO-QTY-002',
          ruleName: 'Strict Positive Quantity Constraint',
          severity: 'BLOCKING',
          reason: `Line [${line.lineId}] for product [${line.productId}] has non-positive quantity (${line.quantity}).`,
          context: { lineId: line.lineId, quantity: line.quantity },
        };
      }
      if (line.unitPrice < 0) {
        return {
          allowed: false,
          ruleId: 'RULE-PO-PRICE-003',
          ruleName: 'Strict Non-Negative Price Constraint',
          severity: 'BLOCKING',
          reason: `Line [${line.lineId}] has negative unit price (${line.unitPrice}).`,
        };
      }
    }

    // Rule 3: High-Value Threshold Approval Authorization (e.g. POs > $100,000 require admin role)
    if (po.totalAmount > 100000) {
      const isAdmin = approver.roles.includes('platform_admin') || approver.roles.includes('executive') || approver.roles.includes('vp_procurement');
      if (!isAdmin) {
        return {
          allowed: false,
          ruleId: 'RULE-PO-HIGH-VAL-004',
          ruleName: 'Executive High-Value Approval Required',
          severity: 'BLOCKING',
          reason: `PO total value [$${po.totalAmount}] exceeds threshold $100,000 and requires Executive/VP role.`,
          context: { totalAmount: po.totalAmount, approverRoles: approver.roles },
        };
      }
    }

    return {
      allowed: true,
      ruleId: 'RULE-PO-PASS',
      ruleName: 'PO Approval Policy Passed',
      severity: 'INFO',
    };
  }

  /**
   * Evaluates ASN submission quantity tolerance
   */
  public evaluateASNQuantity(params: {
    asnQuantity: number;
    openPoQuantity: number;
    tolerancePercent?: number; // default 10%
  }): RuleEvaluationResult {
    const { asnQuantity, openPoQuantity, tolerancePercent = 10 } = params;
    const maxAllowed = openPoQuantity * (1 + tolerancePercent / 100);

    if (asnQuantity <= 0) {
      return {
        allowed: false,
        ruleId: 'RULE-ASN-QTY-001',
        ruleName: 'Positive ASN Quantity Required',
        severity: 'BLOCKING',
        reason: `ASN quantity must be greater than zero (received: ${asnQuantity}).`,
      };
    }

    if (asnQuantity > maxAllowed) {
      return {
        allowed: false,
        ruleId: 'RULE-ASN-TOLERANCE-002',
        ruleName: 'ASN Quantity Exceeds Open PO Tolerance',
        severity: 'BLOCKING',
        reason: `Shipped quantity [${asnQuantity}] exceeds open PO quantity [${openPoQuantity}] beyond ${tolerancePercent}% tolerance limit (max: ${maxAllowed}).`,
        context: { asnQuantity, openPoQuantity, maxAllowed },
      };
    }

    return {
      allowed: true,
      ruleId: 'RULE-ASN-PASS',
      ruleName: 'ASN Quantity Accepted',
      severity: 'INFO',
    };
  }

  /**
   * Evaluates Customer Order cancellation rules
   */
  public evaluateOrderCancellation(order: CustomerOrderRecord): RuleEvaluationResult {
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return {
        allowed: false,
        ruleId: 'RULE-ORD-CANCEL-001',
        ruleName: 'Dispatched Order Cancellation Prohibited',
        severity: 'BLOCKING',
        reason: `Order [${order.orderNumber}] in status [${order.status}] cannot be cancelled because goods have already been dispatched.`,
      };
    }

    return {
      allowed: true,
      ruleId: 'RULE-ORD-CANCEL-PASS',
      ruleName: 'Order Cancellation Permitted',
      severity: 'INFO',
    };
  }
}

export const scmBusinessRuleEngine = ScmBusinessRuleEngine.getInstance();
