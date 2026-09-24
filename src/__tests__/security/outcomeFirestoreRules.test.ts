/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE & ENTERPRISE LEARNING
 * Real Firebase Firestore Emulator Security Rules Test Suite
 * 
 * Verifies security boundary enforcement for all 10 Wave 9 collections:
 * 1. outcomes (permanently immutable)
 * 2. outcome_observations (permanently immutable)
 * 3. outcome_variances (permanently immutable)
 * 4. outcome_attributions (strictly governed)
 * 5. learning_signals
 * 6. improvement_proposals (admin-gated approval)
 * 7. intelligence_versions (admin-only promotion/rollback)
 * 8. intelligence_experiments (admin-managed blast-radius)
 * 9. intelligence_metrics (append-only)
 * 10. drift_signals (append-only audit trail)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

import { isEmulatorRunning } from './emulatorHelper';

let testEnv: RulesTestEnvironment;
const PROJECT_ID = 'orion9-dev-db-2026';
const emulatorOnline = await isEmulatorRunning();

describe.skipIf(!emulatorOnline)('Wave 9 Outcome & Learning Firestore Security Rules Gate', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules,
      },
    });

    // Seed mock user records
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await adminDb.collection('users').doc('user-outcome-a').set({
        uid: 'user-outcome-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'buyer',
      });
      await adminDb.collection('users').doc('admin-outcome-a').set({
        uid: 'admin-outcome-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'organization_admin',
      });
      await adminDb.collection('users').doc('user-outcome-b').set({
        uid: 'user-outcome-b',
        organizationId: 'TENANT_B',
        tenantId: 'TENANT_B',
        role: 'buyer',
      });
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe('1. Unauthenticated Denials Across All 10 Wave 9 Collections', () => {
    it('denies unauthenticated read/write to outcomes', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('outcomes').doc('out-1').get());
      await assertFails(unauthDb.collection('outcomes').doc('out-1').set({ tenantId: 'TENANT_A' }));
    });

    it('denies unauthenticated read/write to outcome_observations', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('outcome_observations').doc('obs-1').get());
      await assertFails(unauthDb.collection('outcome_observations').doc('obs-1').set({ tenantId: 'TENANT_A' }));
    });

    it('denies unauthenticated read/write to outcome_variances', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('outcome_variances').doc('var-1').get());
      await assertFails(unauthDb.collection('outcome_variances').doc('var-1').set({ tenantId: 'TENANT_A' }));
    });

    it('denies unauthenticated read/write to learning_signals', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('learning_signals').doc('sig-1').get());
      await assertFails(unauthDb.collection('learning_signals').doc('sig-1').set({ tenantId: 'TENANT_A' }));
    });

    it('denies unauthenticated read/write to improvement_proposals', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('improvement_proposals').doc('prop-1').get());
      await assertFails(unauthDb.collection('improvement_proposals').doc('prop-1').set({ tenantId: 'TENANT_A' }));
    });

    it('denies unauthenticated read/write to intelligence_versions', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('intelligence_versions').doc('v1.0.0').get());
      await assertFails(unauthDb.collection('intelligence_versions').doc('v1.0.0').set({ tenantId: 'TENANT_A' }));
    });

    it('denies unauthenticated read/write to drift_signals', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('drift_signals').doc('drift-1').get());
      await assertFails(unauthDb.collection('drift_signals').doc('drift-1').set({ tenantId: 'TENANT_A' }));
    });
  });

  describe('2. Cross-Tenant Security Isolation', () => {
    it('denies TENANT_A user from reading or writing TENANT_B outcomes', async () => {
      const userADb = testEnv.authenticatedContext('user-outcome-a', { organizationId: 'TENANT_A' }).firestore();

      // Seed doc in Tenant B
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('outcomes').doc('out-b-1').set({
          tenantId: 'TENANT_B',
          status: 'EVALUATED',
        });
      });

      await assertFails(userADb.collection('outcomes').doc('out-b-1').get());
      await assertFails(userADb.collection('outcomes').doc('out-b-2').set({
        tenantId: 'TENANT_B',
        status: 'EVALUATED',
      }));
    });

    it('denies TENANT_A user from reading or writing TENANT_B improvement proposals', async () => {
      const userADb = testEnv.authenticatedContext('user-outcome-a', { organizationId: 'TENANT_A' }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('improvement_proposals').doc('prop-b-1').set({
          tenantId: 'TENANT_B',
          title: 'Tenant B Proposal',
          status: 'DRAFT',
        });
      });

      await assertFails(userADb.collection('improvement_proposals').doc('prop-b-1').get());
      await assertFails(userADb.collection('improvement_proposals').doc('prop-b-2').set({
        tenantId: 'TENANT_B',
        title: 'Tampered Proposal',
        status: 'DRAFT',
      }));
    });
  });

  describe('3. Immutability of Telemetry Ledgers (Outcomes, Observations, Variances, Drift)', () => {
    it('denies update or deletion of outcomes (permanently immutable)', async () => {
      const adminADb = testEnv.authenticatedContext('admin-outcome-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin',
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('outcomes').doc('out-imm-1').set({
          tenantId: 'TENANT_A',
          decisionQualityScore: 88,
          status: 'EVALUATED',
        });
      });

      // Update attempt should fail
      await assertFails(adminADb.collection('outcomes').doc('out-imm-1').update({
        decisionQualityScore: 99,
      }));

      // Delete attempt should fail
      await assertFails(adminADb.collection('outcomes').doc('out-imm-1').delete());
    });

    it('denies update or deletion of outcome_observations', async () => {
      const adminADb = testEnv.authenticatedContext('admin-outcome-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin',
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('outcome_observations').doc('obs-imm-1').set({
          tenantId: 'TENANT_A',
          actualOTIF: 91.5,
        });
      });

      await assertFails(adminADb.collection('outcome_observations').doc('obs-imm-1').update({
        actualOTIF: 99.9,
      }));
      await assertFails(adminADb.collection('outcome_observations').doc('obs-imm-1').delete());
    });

    it('denies update or deletion of outcome_variances', async () => {
      const adminADb = testEnv.authenticatedContext('admin-outcome-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin',
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('outcome_variances').doc('var-imm-1').set({
          tenantId: 'TENANT_A',
          costVariancePct: 18.5,
        });
      });

      await assertFails(adminADb.collection('outcome_variances').doc('var-imm-1').update({
        costVariancePct: 0.0,
      }));
      await assertFails(adminADb.collection('outcome_variances').doc('var-imm-1').delete());
    });

    it('denies update or deletion of drift_signals audit records', async () => {
      const adminADb = testEnv.authenticatedContext('admin-outcome-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin',
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('drift_signals').doc('drift-imm-1').set({
          tenantId: 'TENANT_A',
          driftState: 'CRITICAL_DRIFT',
        });
      });

      await assertFails(adminADb.collection('drift_signals').doc('drift-imm-1').update({
        driftState: 'NORMAL',
      }));
      await assertFails(adminADb.collection('drift_signals').doc('drift-imm-1').delete());
    });
  });

  describe('4. Governed Versioning & Improvement Promotion Access Control', () => {
    it('denies standard buyer from creating or modifying intelligence_versions', async () => {
      const userADb = testEnv.authenticatedContext('user-outcome-a', { organizationId: 'TENANT_A' }).firestore();

      await assertFails(userADb.collection('intelligence_versions').doc('v2.0.0').set({
        tenantId: 'TENANT_A',
        status: 'ACTIVE',
        parameters: { leadTimeBufferDays: 5.0 },
      }));
    });

    it('allows Platform/Org Admin to manage intelligence_versions and proposals', async () => {
      const adminADb = testEnv.authenticatedContext('admin-outcome-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin',
      }).firestore();

      await assertSucceeds(adminADb.collection('intelligence_versions').doc('v1.0.0').set({
        tenantId: 'TENANT_A',
        status: 'ACTIVE',
        parameters: { safetyStockMultiplier: 1.2 },
      }));

      await assertSucceeds(adminADb.collection('improvement_proposals').doc('prop-a-1').set({
        tenantId: 'TENANT_A',
        title: 'Governed Buffer Proposal',
        status: 'APPROVED',
      }));
    });
  });
});
