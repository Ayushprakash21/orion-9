/**
 * ORION-9 WAVE 5 — AI CONTEXT MANAGER
 *
 * Assembles strictly tenant-scoped, permission-scoped, and purpose-limited
 * context packages for AI reasoning.
 * External data is filtered and marked as untrusted blocks.
 * Cross-tenant context assembly fails closed.
 */

import { AIAgent, AIExecutionContext } from './types';
import { aiSecurityGuard } from './AISecurityGuard';

export interface AssembleContextOptions {
  tenantId: string;
  agent: AIAgent;
  purpose: string;
  requestedDataSources?: string[];
  externalInput?: {
    source: string;
    content: string;
  };
}

export interface AssembledAIContext {
  tenantId: string;
  agentId: string;
  purpose: string;
  timestamp: string;
  systemBoundaries: {
    operatingMode: string;
    riskClass: string;
    allowedCapabilities: string[];
    isGoverned: boolean;
  };
  operationalData: Record<string, any>;
  sanitizedExternalData?: {
    sanitized: string;
    flaggedThreats: string[];
  };
}

export class AIContextManager {
  private static instance: AIContextManager;

  private constructor() {}

  public static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }

  /**
   * Assembles a controlled context bundle
   */
  public assembleContext(options: AssembleContextOptions): AssembledAIContext {
    if (!options.tenantId) {
      throw new Error('AI Context Violation: Missing tenantId. Context assembly must be tenant-scoped.');
    }

    if (options.agent.tenantId !== options.tenantId && options.agent.tenantId !== 'org-global') {
      throw new Error(
        `AI Cross-Tenant Violation: Agent '${options.agent.agentId}' (tenant '${options.agent.tenantId}') cannot assemble context for tenant '${options.tenantId}'.`
      );
    }

    // 1. System Policy & Boundary Header
    const systemBoundaries = {
      operatingMode: options.agent.operatingMode,
      riskClass: options.agent.riskClass,
      allowedCapabilities: options.agent.capabilities,
      isGoverned: true,
    };

    // 2. Filter requested data sources by agent capabilities
    const operationalData: Record<string, any> = {};
    const sources = options.requestedDataSources || ['inventory', 'suppliers', 'po'];

    for (const src of sources) {
      // Capability check
      const capKey = `${src}:read`;
      if (options.agent.capabilities.includes(capKey)) {
        operationalData[src] = {
          tenantId: options.tenantId,
          scope: options.purpose,
          verifiedFreshness: new Date().toISOString(),
        };
      }
    }

    // 3. Process untrusted external content
    let sanitizedExternalData;
    if (options.externalInput) {
      const sanitizedRes = aiSecurityGuard.sanitizeExternalContent(
        options.externalInput.content,
        options.externalInput.source
      );
      sanitizedExternalData = {
        sanitized: sanitizedRes.sanitized,
        flaggedThreats: sanitizedRes.detectedThreats,
      };
    }

    return {
      tenantId: options.tenantId,
      agentId: options.agent.agentId,
      purpose: options.purpose,
      timestamp: new Date().toISOString(),
      systemBoundaries,
      operationalData,
      sanitizedExternalData,
    };
  }
}

export const aiContextManager = AIContextManager.getInstance();
