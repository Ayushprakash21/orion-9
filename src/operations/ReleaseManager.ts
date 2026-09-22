/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * ReleaseManager: Release Pipeline Gates, Preflight Verification & Deployment Safety
 */

import { ReleaseRecord, ReleaseStage, ReleaseGate } from './types';
import { observabilityService } from './ObservabilityService';

export class ReleaseManager {
  private static instance: ReleaseManager;
  private releases: Map<string, ReleaseRecord> = new Map();

  private constructor() {
    this.seedDefaultReleases();
  }

  public static getInstance(): ReleaseManager {
    if (!ReleaseManager.instance) {
      ReleaseManager.instance = new ReleaseManager();
    }
    return ReleaseManager.instance;
  }

  private seedDefaultReleases(): void {
    const wave9Release: ReleaseRecord = {
      id: 'rel-wave9',
      version: 'v9.0.0',
      commitSha: 'eaacddc21c8858ec9ec92b5aa179e46d3410f7f4',
      deployedAt: '2026-09-22T08:00:00.000Z',
      deployedBy: 'CI_PIPELINE',
      stage: 'PROMOTED',
      gates: [
        { gateId: 'GATE_BUILD', name: 'Vite Production Build', passed: true, checkedAt: '2026-09-22T07:50:00Z', evidence: 'Zero build errors, bundle created' },
        { gateId: 'GATE_TSC', name: 'TypeScript Static Verification', passed: true, checkedAt: '2026-09-22T07:51:00Z', evidence: '0 compiler diagnostic errors' },
        { gateId: 'GATE_VITEST', name: 'Vitest Unit & Integration Suites', passed: true, checkedAt: '2026-09-22T07:55:00Z', evidence: '407 / 407 passed (28 suites)' },
        { gateId: 'GATE_PLAYWRIGHT', name: 'Playwright End-to-End Suites', passed: true, checkedAt: '2026-09-22T07:58:00Z', evidence: '82 / 82 passed (7 specs)' },
        { gateId: 'GATE_SECURITY', name: 'Firestore Emulator Security Gates', passed: true, checkedAt: '2026-09-22T07:59:00Z', evidence: 'Multi-tenant isolation & immutability verified' },
      ],
      rollbackTargetVersion: 'v8.0.0',
      notes: 'Wave 9 Closed-Loop Outcome Intelligence & Enterprise Learning release.',
    };

    const wave10Candidate: ReleaseRecord = {
      id: 'rel-wave10-rc1',
      version: 'v10.0.0-rc1',
      commitSha: 'HEAD',
      deployedAt: new Date().toISOString(),
      deployedBy: 'PLATFORM_ADMIN',
      stage: 'PREFLIGHT_PENDING',
      gates: [
        { gateId: 'GATE_BUILD', name: 'Vite Production Build', passed: true, checkedAt: new Date().toISOString(), evidence: 'Clean bundle compiled' },
        { gateId: 'GATE_TSC', name: 'TypeScript Static Verification', passed: true, checkedAt: new Date().toISOString(), evidence: '0 compiler diagnostic errors' },
        { gateId: 'GATE_VITEST', name: 'Vitest Unit & Integration Suites', passed: true, checkedAt: new Date().toISOString(), evidence: 'Baseline 407/407 passed' },
        { gateId: 'GATE_PLAYWRIGHT', name: 'Playwright End-to-End Suites', passed: true, checkedAt: new Date().toISOString(), evidence: 'Baseline 82/82 passed' },
        { gateId: 'GATE_SECURITY', name: 'Firestore Emulator Security Gates', passed: true, checkedAt: new Date().toISOString(), evidence: 'Operational security rules active' },
      ],
      rollbackTargetVersion: 'v9.0.0',
      notes: 'Wave 10 Enterprise Production Control Plane & Resilience candidate release.',
    };

    this.releases.set(wave9Release.id, wave9Release);
    this.releases.set(wave10Candidate.id, wave10Candidate);
  }

  public createRelease(params: {
    version: string;
    commitSha: string;
    deployedBy: string;
    rollbackTargetVersion?: string;
    notes?: string;
  }): ReleaseRecord {
    const id = `rel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: ReleaseRecord = {
      id,
      version: params.version,
      commitSha: params.commitSha,
      deployedAt: new Date().toISOString(),
      deployedBy: params.deployedBy,
      stage: 'PREFLIGHT_PENDING',
      gates: [
        { gateId: 'GATE_BUILD', name: 'Vite Production Build', passed: false, checkedAt: new Date().toISOString(), evidence: 'Pending execution' },
        { gateId: 'GATE_TSC', name: 'TypeScript Static Verification', passed: false, checkedAt: new Date().toISOString(), evidence: 'Pending execution' },
        { gateId: 'GATE_VITEST', name: 'Vitest Unit & Integration Suites', passed: false, checkedAt: new Date().toISOString(), evidence: 'Pending execution' },
        { gateId: 'GATE_SECURITY', name: 'Firestore Emulator Security Gates', passed: false, checkedAt: new Date().toISOString(), evidence: 'Pending execution' },
      ],
      rollbackTargetVersion: params.rollbackTargetVersion,
      notes: params.notes || '',
    };

    this.releases.set(id, record);
    return record;
  }

  public updateGate(releaseId: string, gateId: string, passed: boolean, evidence: string): boolean {
    const release = this.releases.get(releaseId);
    if (!release) return false;

    const gate = release.gates.find(g => g.gateId === gateId);
    if (gate) {
      gate.passed = passed;
      gate.checkedAt = new Date().toISOString();
      gate.evidence = evidence;
    } else {
      release.gates.push({
        gateId,
        name: gateId,
        passed,
        checkedAt: new Date().toISOString(),
        evidence,
      });
    }

    // If all gates passed, advance to VERIFIED
    const allPassed = release.gates.every(g => g.passed);
    if (allPassed && release.stage === 'PREFLIGHT_PENDING') {
      release.stage = 'VERIFIED';
    }

    this.releases.set(releaseId, release);
    return true;
  }

  public promoteRelease(releaseId: string, promotedBy: string): { success: boolean; stage: ReleaseStage } {
    const release = this.releases.get(releaseId);
    if (!release) return { success: false, stage: 'DRAFT' };

    const allPassed = release.gates.every(g => g.passed);
    if (!allPassed) {
      observabilityService.warn(`[RELEASE_PROMOTION_BLOCKED] Cannot promote release ${releaseId}: not all gates passed`);
      return { success: false, stage: release.stage };
    }

    release.stage = 'PROMOTED';
    this.releases.set(releaseId, release);

    observabilityService.info(`[RELEASE_PROMOTED] Release ${release.version} promoted to production by ${promotedBy}`, {
      context: { releaseId, version: release.version, commitSha: release.commitSha },
    });

    return { success: true, stage: 'PROMOTED' };
  }

  public rollbackRelease(releaseId: string, rolledBackBy: string, reason: string): { success: boolean; rolledBackTo?: string } {
    const release = this.releases.get(releaseId);
    if (!release) return { success: false };

    release.stage = 'ROLLED_BACK';
    this.releases.set(releaseId, release);

    observabilityService.warn(`[RELEASE_ROLLED_BACK] Release ${release.version} rolled back by ${rolledBackBy}: ${reason}`, {
      context: { releaseId, targetVersion: release.rollbackTargetVersion },
    });

    return { success: true, rolledBackTo: release.rollbackTargetVersion };
  }

  public getAllReleases(): ReleaseRecord[] {
    return Array.from(this.releases.values()).sort(
      (a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime()
    );
  }

  public getRelease(id: string): ReleaseRecord | undefined {
    return this.releases.get(id);
  }
}

export const releaseManager = ReleaseManager.getInstance();
