/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Unit Tests: Environment, Configuration, Secrets & Feature Flags
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  environmentService,
  configurationService,
  secretReferenceService,
  featureFlagService,
} from '../../operations';

describe('Wave 10 Environment & Configuration Governance Suite', () => {
  beforeEach(() => {
    environmentService.setEnvironment('TEST');
  });

  // --------------------------------------------------------------------------
  // 1. EnvironmentService
  // --------------------------------------------------------------------------
  describe('EnvironmentService', () => {
    it('correctly reports current runtime environment', () => {
      expect(environmentService.getEnvironment()).toBe('TEST');
      expect(environmentService.isTest()).toBe(true);
      expect(environmentService.isProduction()).toBe(false);
    });

    it('supports controlled environment switching', () => {
      environmentService.setEnvironment('STAGING');
      expect(environmentService.isStaging()).toBe(true);
      environmentService.setEnvironment('TEST');
    });

    it('enforces execution authorization check', () => {
      const auth = environmentService.assertExecutionAllowed('TEST_ACTION');
      expect(auth.allowed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. ConfigurationService
  // --------------------------------------------------------------------------
  describe('ConfigurationService', () => {
    it('provides baseline default configurations with categories', () => {
      const maxWorkflows = configurationService.getConfig('system.maxConcurrentWorkflows');
      expect(maxWorkflows).toBe(50);

      const aiConfidence = configurationService.getConfig('ai.decisionConfidenceThreshold');
      expect(aiConfidence).toBe(0.85);

      const logLevel = configurationService.getConfig('observability.logLevel');
      expect(logLevel).toBe('INFO');
    });

    it('supports parameter updates with automatic version bumping and audit trail', () => {
      const initialVer = configurationService.getAllVersions()[0];
      expect(initialVer).toBeDefined();

      const updateResult = configurationService.setConfig(
        'ai.decisionConfidenceThreshold',
        0.90,
        'ops_admin',
        'Tuned AI confidence for high-risk order routing'
      );

      expect(updateResult.success).toBe(true);
      expect(configurationService.getConfig('ai.decisionConfidenceThreshold')).toBe(0.90);

      const newVersions = configurationService.getAllVersions();
      expect(newVersions.length).toBeGreaterThan(1);
      expect(newVersions[0].reason).toContain('Tuned AI confidence');
      expect(newVersions[0].parameters['ai.decisionConfidenceThreshold']).toBe(0.90);
    });

    it('computes structured diffs between configuration versions', () => {
      const versions = configurationService.getAllVersions();
      expect(versions.length).toBeGreaterThanOrEqual(2);

      const fromVer = versions[1].versionId;
      const toVer = versions[0].versionId;

      const diff = configurationService.diffVersions(fromVer, toVer);
      expect(diff).not.toBeNull();
      expect(diff?.modifiedKeys.some(m => m.key === 'ai.decisionConfidenceThreshold')).toBe(true);
    });

    it('executes 1-click rollback restoring previous parameter values', () => {
      const versions = configurationService.getAllVersions();
      const targetBaseline = versions[versions.length - 1]; // oldest baseline

      const rollbackResult = configurationService.rollbackToVersion(
        targetBaseline.versionId,
        'platform_admin',
        'Rollback to initial verified baseline'
      );

      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.restoredKeysCount).toBeGreaterThan(0);
      expect(configurationService.getConfig('ai.decisionConfidenceThreshold')).toBe(0.85);
    });
  });

  // --------------------------------------------------------------------------
  // 3. SecretReferenceService
  // --------------------------------------------------------------------------
  describe('SecretReferenceService', () => {
    it('returns client-safe references with 100% masked secret values', () => {
      const geminiRef = secretReferenceService.getSecretReference('sec-gemini-api-key');
      expect(geminiRef).toBeDefined();
      expect(geminiRef?.isRedacted).toBe(true);
      expect(geminiRef?.maskedValue).toBe('********');
      expect(geminiRef?.provider).toBe('GOOGLE_SECRET_MANAGER');
    });

    it('supports registration of multi-provider secret references', () => {
      const newRef = secretReferenceService.registerSecretReference(
        'sec-custom-vault-key',
        'HASHICORP_VAULT',
        'secret/data/orion/keys/custom'
      );
      expect(newRef.secretId).toBe('sec-custom-vault-key');
      expect(newRef.isRedacted).toBe(true);
      expect(newRef.maskedValue).toBe('********');
    });

    it('lists all registered references with zero plaintext leakage', () => {
      const allRefs = secretReferenceService.getAllSecretReferences();
      expect(allRefs.length).toBeGreaterThanOrEqual(4);
      for (const ref of allRefs) {
        expect(ref.isRedacted).toBe(true);
        expect(ref.maskedValue).toBe('********');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. FeatureFlagService
  // --------------------------------------------------------------------------
  describe('FeatureFlagService', () => {
    it('evaluates enabled feature flags', () => {
      const isEnabled = featureFlagService.isEnabled('enable_closed_loop_learning', {
        tenantId: 'TENANT_A',
      });
      expect(isEnabled).toBe(true);
    });

    it('respects targeted environments', () => {
      featureFlagService.setFlag({
        key: 'test_env_flag',
        description: 'Flag targeted strictly to STAGING',
        enabled: true,
        rolloutPercentage: 100,
        targetedTenants: ['*'],
        targetedEnvironments: ['STAGING'],
        emergencyKillSwitch: false,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'TEST',
      });

      // In TEST environment -> false
      expect(featureFlagService.isEnabled('test_env_flag')).toBe(false);

      // In STAGING environment -> true
      expect(featureFlagService.isEnabled('test_env_flag', { environment: 'STAGING' })).toBe(true);
    });

    it('immediately disables feature flag when emergency kill switch is tripped', () => {
      const flagKey = 'enable_ai_agent_autonomous_dispatch';
      expect(featureFlagService.isEnabled(flagKey)).toBe(true);

      // Trip emergency kill switch
      featureFlagService.tripEmergencyKillSwitch(flagKey, 'sec_lead');
      expect(featureFlagService.isEnabled(flagKey)).toBe(false);

      // Reset kill switch
      featureFlagService.resetEmergencyKillSwitch(flagKey, 'sec_lead');
      expect(featureFlagService.isEnabled(flagKey)).toBe(true);
    });
  });
});
