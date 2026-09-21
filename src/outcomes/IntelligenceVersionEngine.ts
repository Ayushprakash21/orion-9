/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Intelligence Version Engine
 * 
 * Manages immutable, versioned configurations of production models and thresholds.
 * Enforces atomic promotions and 1-click governed rollback.
 */

import { IntelligenceVersion, VersionStatus } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class IntelligenceVersionEngine {
  private static instance: IntelligenceVersionEngine;
  private versions: Map<string, IntelligenceVersion> = new Map(); // key: `${tenantId}:${versionId}`

  private constructor() {}

  public static getInstance(): IntelligenceVersionEngine {
    if (!IntelligenceVersionEngine.instance) {
      IntelligenceVersionEngine.instance = new IntelligenceVersionEngine();
    }
    return IntelligenceVersionEngine.instance;
  }

  /**
   * Initializes baseline default version if none exists
   */
  public ensureBaselineVersion(tenantId: string): IntelligenceVersion {
    const defaultVersionId = 'v1.0.0';
    const key = `${tenantId}:${defaultVersionId}`;
    if (this.versions.has(key)) {
      return this.versions.get(key)!;
    }

    const baseline: IntelligenceVersion = {
      versionId: defaultVersionId,
      tenantId,
      status: 'ACTIVE',
      parameters: {
        safetyStockMultiplier: 1.2,
        leadTimeBufferDays: 2.0,
        supplierMaxRiskTolerance: 65,
        defaultFillRateTargetPct: 95.0,
      },
      policyThresholds: {
        autoApprovalPoLimit: 50000,
        carrierSlaThresholdHours: 24,
        divergenceAlertThresholdPct: 15.0,
      },
      checksum: 'chk_baseline_v100',
      promotedBy: 'PLATFORM_INIT',
      promotedAt: new Date().toISOString(),
    };

    this.versions.set(key, baseline);
    this.persistVersion(baseline);
    return baseline;
  }

  /**
   * Promote a candidate version to ACTIVE
   */
  public promoteVersion(params: {
    tenantId: string;
    versionId: string;
    parameters: Record<string, any>;
    policyThresholds: Record<string, any>;
    promotedFromProposalId?: string;
    promotedBy: string;
    userRole: string;
    isAIAgent?: boolean;
  }): { success: boolean; version?: IntelligenceVersion; error?: string } {
    // Check AI promotion attempt
    if (params.isAIAgent || params.promotedBy.startsWith('AGENT-') || params.promotedBy.startsWith('AI-')) {
      return {
        success: false,
        error: 'GOVERNANCE_VIOLATION: AI agents are strictly forbidden from promoting intelligence versions.'
      };
    }

    const isAdmin = ['platform_admin', 'organization_admin', 'admin'].includes(params.userRole.toLowerCase());
    if (!isAdmin) {
      return {
        success: false,
        error: 'PERMISSION_DENIED: Only Platform or Organization Admins can promote intelligence versions.'
      };
    }

    // Retire currently ACTIVE version
    const existingActive = this.getActiveVersion(params.tenantId);
    if (existingActive) {
      existingActive.status = 'RETIRED';
      existingActive.retiredAt = new Date().toISOString();
      this.versions.set(`${params.tenantId}:${existingActive.versionId}`, existingActive);
      this.persistVersion(existingActive);
    }

    const newVersion: IntelligenceVersion = {
      versionId: params.versionId,
      tenantId: params.tenantId,
      status: 'ACTIVE',
      parameters: params.parameters,
      policyThresholds: params.policyThresholds,
      promotedFromProposalId: params.promotedFromProposalId,
      checksum: `chk_${params.versionId}_${Date.now().toString(16)}`,
      promotedBy: params.promotedBy,
      promotedAt: new Date().toISOString(),
    };

    this.versions.set(`${params.tenantId}:${params.versionId}`, newVersion);
    this.persistVersion(newVersion);

    return { success: true, version: newVersion };
  }

  /**
   * Governed Rollback — reverts to a prior verified version
   */
  public rollbackToVersion(params: {
    tenantId: string;
    targetVersionId: string;
    executedBy: string;
    userRole: string;
    reason: string;
    isAIAgent?: boolean;
  }): { success: boolean; rolledBackVersion?: IntelligenceVersion; activeVersion?: IntelligenceVersion; error?: string } {
    if (params.isAIAgent || params.executedBy.startsWith('AGENT-') || params.executedBy.startsWith('AI-')) {
      return {
        success: false,
        error: 'GOVERNANCE_VIOLATION: AI agents cannot execute version rollbacks.'
      };
    }

    const isAdmin = ['platform_admin', 'organization_admin', 'admin'].includes(params.userRole.toLowerCase());
    if (!isAdmin) {
      return {
        success: false,
        error: 'PERMISSION_DENIED: Only Platform or Organization Admins can trigger rollbacks.'
      };
    }

    const target = this.versions.get(`${params.tenantId}:${params.targetVersionId}`);
    if (!target) {
      return { success: false, error: `Target rollback version ${params.targetVersionId} not found.` };
    }

    const currentActive = this.getActiveVersion(params.tenantId);
    if (currentActive) {
      currentActive.status = 'ROLLED_BACK';
      currentActive.retiredAt = new Date().toISOString();
      this.versions.set(`${params.tenantId}:${currentActive.versionId}`, currentActive);
      this.persistVersion(currentActive);
    }

    // Re-activate target version
    target.status = 'ACTIVE';
    target.rollbackTargetVersion = currentActive?.versionId;
    this.versions.set(`${params.tenantId}:${target.versionId}`, target);
    this.persistVersion(target);

    return { success: true, rolledBackVersion: currentActive, activeVersion: target };
  }

  public getActiveVersion(tenantId: string): IntelligenceVersion | undefined {
    for (const [key, value] of this.versions.entries()) {
      if (key.startsWith(`${tenantId}:`) && value.status === 'ACTIVE') {
        return value;
      }
    }
    return undefined;
  }

  public listVersions(tenantId: string): IntelligenceVersion[] {
    const list: IntelligenceVersion[] = [];
    for (const [key, value] of this.versions.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.promotedAt).getTime() - new Date(a.promotedAt).getTime());
  }

  private async persistVersion(version: IntelligenceVersion): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'intelligence_versions', `${version.tenantId}_${version.versionId}`), version);
      }
    } catch {
      // Best-effort Firestore write
    }
  }

  public clear(): void {
    this.versions.clear();
  }
}
