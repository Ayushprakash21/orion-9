/**
 * ORION-9 WAVE 5 — AI SECURITY GUARD
 *
 * Enforces absolute security boundaries around AI execution:
 * 1. Prompt injection defense (sanitizes untrusted content, enforces policy precedence).
 * 2. Self-approval prevention (AI cannot approve its own commands or act as human approver).
 * 3. Credential & secret access denial (blocks retrieval of keys, secrets, tokens).
 * 4. Tenant isolation checks.
 * 5. Kernel bypass & arbitrary code / SQL prevention.
 */

import { AIAgent, AIOperatingMode, AIRiskClass } from './types';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';

export class AISecurityGuard {
  private static instance: AISecurityGuard;

  private forbiddenSecretPatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /private[_-]?key/i,
    /credential/i,
    /bearer/i,
    /authorization/i,
    /connection[_-]?string/i,
  ];

  private promptInjectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+(instructions|rules|prompts)/i,
    /you\s+are\s+now\s+(an\s+)?admin/i,
    /bypass\s+(kernel|policy|approval|security)/i,
    /system\s+override/i,
    /escalate\s+privilege/i,
    /approve\s+(this\s+)?(po|order|requisition)\s+without\s+approval/i,
    /drop\s+table/i,
    /execute\s+sql/i,
    /eval\s*\(/i,
  ];

  private constructor() {}

  public static getInstance(): AISecurityGuard {
    if (!AISecurityGuard.instance) {
      AISecurityGuard.instance = new AISecurityGuard();
    }
    return AISecurityGuard.instance;
  }

  /**
   * Evaluates external untrusted text to detect prompt injection attempts.
   * Neutralizes instruction hijacking while allowing safe operational data.
   */
  public sanitizeExternalContent(rawContent: string, source: string = 'external'): {
    sanitized: string;
    isFlagged: boolean;
    detectedThreats: string[];
  } {
    if (!rawContent || typeof rawContent !== 'string') {
      return { sanitized: '', isFlagged: false, detectedThreats: [] };
    }

    const detectedThreats: string[] = [];
    for (const pattern of this.promptInjectionPatterns) {
      if (pattern.test(rawContent)) {
        detectedThreats.push(`Matched injection pattern: ${pattern.source}`);
      }
    }

    // Wrap untrusted content in strict boundary delimiters
    // Never allow raw text to sit directly in system instruction stream
    const isFlagged = detectedThreats.length > 0;
    const sanitized = `[UNTRUSTED_${source.toUpperCase()}_DATA_BEGIN]\n${rawContent.replace(/```/g, "'''")}\n[UNTRUSTED_${source.toUpperCase()}_DATA_END]`;

    return {
      sanitized,
      isFlagged,
      detectedThreats,
    };
  }

  /**
   * Verifies that requested queries / keys do not attempt secret or credential exfiltration.
   */
  public assertNoSecretAccess(queryOrKey: string): void {
    if (!queryOrKey || typeof queryOrKey !== 'string') return;

    for (const pattern of this.forbiddenSecretPatterns) {
      if (pattern.test(queryOrKey)) {
        throw new Error(
          `AI Security Violation: Access to secrets, credentials, or API tokens is strictly forbidden: '${queryOrKey}'`
        );
      }
    }
  }

  /**
   * Enforces self-approval protection:
   * AI cannot act as human approver, cannot approve its own requests,
   * and cannot approve other AI requests.
   */
  public assertCanApprove(
    approver: AuthorizationActor,
    requesterActor: AuthorizationActor,
    commandId?: string
  ): void {
    // 1. Approver cannot be an AI agent
    if (approver.type === 'AI_AGENT' || approver.roles?.includes('ai_agent')) {
      throw new Error('AI Self-Approval Violation: AI agents are strictly prohibited from approving transactions.');
    }

    // 2. Approver cannot be identical to the requester
    if (approver.id === requesterActor.id) {
      throw new Error('Self-Approval Violation: Requester cannot approve their own transaction.');
    }

    // 3. Human approver must possess explicit approval role
    const allowedRoles = ['platform_admin', 'organization_admin', 'procurement_manager'];
    const hasRole = approver.roles?.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      throw new Error(`Approval Violation: Actor '${approver.id}' lacks required approval role.`);
    }
  }

  /**
   * Enforces operating mode constraints on commands
   */
  public assertOperatingModePermitsAction(
    mode: AIOperatingMode,
    isMaterialMutation: boolean,
    hasHumanInitiator: boolean
  ): void {
    if (mode === 'PROHIBITED') {
      throw new Error('AI Execution Violation: Agent operating mode is PROHIBITED. All operations denied.');
    }

    if (mode === 'OBSERVE' && isMaterialMutation) {
      throw new Error('AI Execution Violation: Agent operating mode is OBSERVE (read-only). Mutations strictly forbidden.');
    }

    if (mode === 'RECOMMEND' && isMaterialMutation) {
      throw new Error('AI Execution Violation: Agent operating mode is RECOMMEND. Execution forbidden; recommendations only.');
    }

    if (mode === 'ASSIST' && isMaterialMutation && !hasHumanInitiator) {
      throw new Error('AI Execution Violation: Agent operating mode is ASSIST. Material actions require active human initiator.');
    }
  }

  /**
   * Validates tool output to ensure it matches tenant isolation and doesn't leak secrets
   */
  public validateToolOutput(tenantId: string, output: any): any {
    if (!output) return output;

    // Check stringified output for forbidden secrets
    const outputStr = JSON.stringify(output);
    for (const pattern of this.forbiddenSecretPatterns) {
      if (pattern.test(outputStr)) {
        throw new Error('AI Security Violation: Tool output contains potential secret or credential tokens.');
      }
    }

    // Tenant check if output has tenant / organization identifiers
    if (Array.isArray(output)) {
      for (const item of output) {
        if (item && typeof item === 'object') {
          const itemTenant = item.tenantId || item.organizationId;
          if (itemTenant && itemTenant !== tenantId && itemTenant !== 'org-global') {
            throw new Error(`AI Cross-Tenant Violation: Tool returned entity belonging to tenant '${itemTenant}' instead of '${tenantId}'.`);
          }
        }
      }
    } else if (typeof output === 'object') {
      const itemTenant = output.tenantId || output.organizationId;
      if (itemTenant && itemTenant !== tenantId && itemTenant !== 'org-global') {
        throw new Error(`AI Cross-Tenant Violation: Tool returned entity belonging to tenant '${itemTenant}' instead of '${tenantId}'.`);
      }
    }

    return output;
  }
}

export const aiSecurityGuard = AISecurityGuard.getInstance();
