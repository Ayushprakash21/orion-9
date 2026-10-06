import { AutonomyLevel, AutonomyThresholdConfig, RiskClass } from './types';

export interface PolicyRule {
  id: string;
  tenantId: string;
  actionType: string;
  maxAutonomousLevel: AutonomyLevel;
  financialThreshold: number; // e.g. 50000 USD
  requiresApprovalIfMaterial: boolean;
  prohibitedForAi: boolean;
  businessUnit?: string;
  country?: string;
  riskClassThreshold?: RiskClass;
}

export class AutonomyPolicyEngine {
  private static defaultThresholds: Record<string, AutonomyThresholdConfig> = {};
  private static policyRules: Map<string, PolicyRule[]> = new Map();

  /**
   * Register or update threshold settings for a tenant
   */
  public static setThresholdConfig(config: AutonomyThresholdConfig): void {
    this.defaultThresholds[config.tenantId] = config;
  }

  public static getThresholdConfig(tenantId: string): AutonomyThresholdConfig {
    return this.defaultThresholds[tenantId] || {
      tenantId,
      currency: 'USD',
      maxAutonomousFinancialLimit: 50000,
      autoApproveReplenishment: true,
      autoApproveStockTransfers: true,
      autoApproveRerouting: true,
      autoApproveReminders: true,
      escalationTimeoutMinutes: 15,
      secondaryApproverRole: 'organization_admin',
      safeFallbackAction: 'PAUSE'
    };
  }

  /**
   * Adds custom organization policy rule
   */
  public static addPolicyRule(rule: PolicyRule): void {
    const list = this.policyRules.get(rule.tenantId) || [];
    list.push(rule);
    this.policyRules.set(rule.tenantId, list);
  }

  /**
   * Evaluates policy compliance for an action
   */
  public static evaluatePolicy(
    tenantId: string,
    actionType: string,
    financialExposure: number,
    riskClass: RiskClass
  ): { maxAllowedLevel: AutonomyLevel; approvalRequired: boolean; reason: string } {
    const rules = this.policyRules.get(tenantId) || [];
    const matchedRule = rules.find(r => r.actionType === actionType || r.actionType === '*');

    if (matchedRule) {
      if (matchedRule.prohibitedForAi) {
        return {
          maxAllowedLevel: 'LEVEL_5_PROHIBITED',
          approvalRequired: true,
          reason: `Policy rule ${matchedRule.id} explicitly prohibits autonomous execution for ${actionType}`
        };
      }
      if (financialExposure > matchedRule.financialThreshold) {
        return {
          maxAllowedLevel: 'LEVEL_3_APPROVAL_GATED',
          approvalRequired: true,
          reason: `Financial exposure ($${financialExposure}) exceeds policy threshold ($${matchedRule.financialThreshold})`
        };
      }
      return {
        maxAllowedLevel: matchedRule.maxAutonomousLevel,
        approvalRequired: matchedRule.requiresApprovalIfMaterial && (riskClass === 'MATERIAL' || riskClass === 'HIGH' || riskClass === 'CRITICAL'),
        reason: `Matched tenant policy rule ${matchedRule.id}`
      };
    }

    // Default Fallback Policy Evaluation
    const config = this.getThresholdConfig(tenantId);

    // Default Autonomous Action Types
    const routineActions = new Set([
      'INVENTORY_REPLENISHMENT',
      'STOCK_TRANSFER',
      'PURCHASE_ORDER_ROUTINE',
      'SUPPLIER_REMINDER',
      'SHIPMENT_REROUTING',
      'WAREHOUSE_TASK_CREATE',
      'FORECAST_REFRESH',
      'ALLOCATION_CHANGE',
      'EXCEPTION_RESOLUTION',
      'CARRIER_SELECTION',
      'APPOINTMENT_SCHEDULE',
      'ASN_PROCESSING',
      'INVOICE_MATCH_ROUTINE',
      'CUSTOMER_NOTIFICATION',
      'SUPPLIER_NOTIFICATION',
      'WORKFLOW_CREATE',
      'PRODUCTION_RESCHEDULE_ROUTINE',
      'RETURNS_PROCESSING_ROUTINE'
    ]);

    if (routineActions.has(actionType) && financialExposure <= config.maxAutonomousFinancialLimit && riskClass !== 'HIGH' && riskClass !== 'CRITICAL') {
      return {
        maxAllowedLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
        approvalRequired: false,
        reason: `Action '${actionType}' is pre-authorized routine action under threshold ($${config.maxAutonomousFinancialLimit})`
      };
    }

    // High / Material Actions Require Human Approval
    if (financialExposure > config.maxAutonomousFinancialLimit || riskClass === 'HIGH' || riskClass === 'CRITICAL' || riskClass === 'MATERIAL') {
      return {
        maxAllowedLevel: 'LEVEL_3_APPROVAL_GATED',
        approvalRequired: true,
        reason: `Action requires human approval due to risk class '${riskClass}' or financial exposure ($${financialExposure})`
      };
    }

    return {
      maxAllowedLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
      approvalRequired: false,
      reason: 'Low risk standard action'
    };
  }
}
