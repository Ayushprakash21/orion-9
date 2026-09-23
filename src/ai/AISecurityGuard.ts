/**
 * ORION-9 PART 4 TRACK 5 — HARDENED AI SECURITY GUARD & SENTINEL
 *
 * Enforces absolute security boundaries around the Orion-9 AI Workforce:
 * 1. Advanced Prompt Injection & Jailbreak Defense (sanitizes untrusted input, wraps delimiters, detects overrides).
 * 2. Strict Anti-Self-Approval Prevention (AI agents cannot approve their own or peer proposals/workflows).
 * 3. Secret & Credential Access Denial (blocks exfiltration of keys, tokens, passwords, private certificates).
 * 4. Multi-Tenant Perimeter Enforcement (blocks cross-tenant queries, references, and tool outputs).
 * 5. Auto-Quarantine Trigger Engine (automatically suspends compromised or rogue agents upon threshold breaches).
 * 6. Kernel Bypass & Arbitrary Code/SQL Prevention (zero direct DB or SQL writes).
 */

import { AIOperatingMode, QuarantineReason } from './types';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { agentRegistry } from './AgentRegistry';

export interface SecurityViolationEvent {
  tenantId: string;
  agentId: string;
  violationType: QuarantineReason;
  severity: 'WARNING' | 'CRITICAL' | 'FATAL';
  message: string;
  payload?: any;
  timestamp: string;
}

export class AISecurityGuard {
  private static instance: AISecurityGuard;

  private forbiddenSecretPatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /private[_-]?key/i,
    /credential/i,
    /bearer\s+[a-z0-9_.-]+/i,
    /authorization/i,
    /connection[_-]?string/i,
    /id_token/i,
    /access_token/i,
  ];

  private promptInjectionPatterns = [
    /(ignore|disregard)\s+(all\s+)?(previous|prior)\s+(instructions|rules|prompts|guardrails|directives)/i,
    /you\s+are\s+now\s+(an?\s+)?(admin|superuser|root|god\s*mode|developer|system\s+operator)/i,
    /bypass\s+(kernel|policy|approval|security|governance|guardrail|validation)/i,
    /system\s+(override|prompt|reset|takeover)/i,
    /escalate\s+privilege/i,
    /disable\s+(audit|guardrail|safety|quarantine|filter|rules)/i,
    /approve\s+(this\s+)?(po|order|requisition|proposal)\s+without\s+approval/i,
    /drop\s+table/i,
    /execute\s+sql/i,
    /delete\s+from/i,
    /truncate\s+table/i,
    /eval\s*\(/i,
    /new\s+Function\s*\(/i,
    /pretend\s+you\s+have\s+no\s+(rules|restrictions|limits)/i,
    /jailbreak/i,
    /DAN\s+mode/i,
  ];

  private violationCounts: Map<string, number> = new Map();
  private incidentLog: SecurityViolationEvent[] = [];

  private constructor() {}

  public static getInstance(): AISecurityGuard {
    if (!AISecurityGuard.instance) {
      AISecurityGuard.instance = new AISecurityGuard();
    }
    return AISecurityGuard.instance;
  }

  /**
   * Evaluates external untrusted text to detect prompt injection attempts.
   * Neutralizes instruction hijacking while preserving safe operational data.
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

    const isFlagged = detectedThreats.length > 0;
    // Strict boundary wrapping: untrusted data is always segmented and never injected directly into system prompts
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
  public assertNoSecretAccess(queryOrKey: string, tenantId?: string, agentId?: string): void {
    if (!queryOrKey || typeof queryOrKey !== 'string') return;

    for (const pattern of this.forbiddenSecretPatterns) {
      if (pattern.test(queryOrKey)) {
        if (tenantId && agentId) {
          this.recordViolation(tenantId, agentId, 'POLICY_VIOLATION', 'CRITICAL', `Attempted secret access: ${queryOrKey}`);
        }
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
    commandId?: string,
    tenantId?: string
  ): void {
    // 1. Approver cannot be an AI agent
    if (approver.type === 'AI_AGENT' || approver.roles?.includes('ai_agent') || (approver as any).isAi === true) {
      if (tenantId && approver.id) {
        this.recordViolation(tenantId, approver.id, 'ATTEMPTED_SELF_APPROVAL', 'FATAL', 'AI agent attempted to approve a transaction');
      }
      throw new Error('AI Self-Approval Violation: AI agents are strictly prohibited from approving transactions.');
    }

    // 2. Approver cannot be identical to the requester
    if (approver.id === requesterActor.id) {
      throw new Error('Self-Approval Violation: Requester cannot approve their own transaction.');
    }

    // 3. Human approver must possess explicit approval role
    const allowedRoles = ['platform_admin', 'organization_admin', 'procurement_manager', 'admin'];
    const hasRole = approver.roles?.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      throw new Error(`Approval Violation: Actor '${approver.id}' lacks required approval role.`);
    }
  }

  /**
   * Assert agent is not in quarantined state
   */
  public assertNotQuarantined(agentStatus: string, agentName: string): void {
    if (agentStatus === 'QUARANTINED') {
      throw new Error(`AI Execution Violation: Agent '${agentName}' is currently in QUARANTINED state due to security policies.`);
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

  /**
   * Record security violation and trigger auto-quarantine upon threshold breach
   */
  public recordViolation(
    tenantId: string,
    agentId: string,
    violationType: QuarantineReason,
    severity: 'WARNING' | 'CRITICAL' | 'FATAL',
    message: string,
    payload?: any
  ): void {
    const key = `${tenantId}:${agentId}`;
    const count = (this.violationCounts.get(key) || 0) + 1;
    this.violationCounts.set(key, count);

    const event: SecurityViolationEvent = {
      tenantId,
      agentId,
      violationType,
      severity,
      message,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.incidentLog.push(event);

    // Auto-quarantine condition: FATAL violation or >= 3 violations
    if (severity === 'FATAL' || count >= 3) {
      agentRegistry.quarantineAgent(
        tenantId,
        agentId,
        violationType,
        `Auto-quarantined by AISecurityGuard: ${message} (Total violations: ${count})`,
        { lastViolation: event, totalViolations: count }
      ).catch(() => {});
    }
  }

  /**
   * Get all security incidents for a tenant
   */
  public getIncidents(tenantId?: string): SecurityViolationEvent[] {
    if (!tenantId) return this.incidentLog;
    return this.incidentLog.filter(e => e.tenantId === tenantId);
  }

  /**
   * Reset security counters (for testing)
   */
  public reset(): void {
    this.violationCounts.clear();
    this.incidentLog = [];
  }
}

export const aiSecurityGuard = AISecurityGuard.getInstance();
