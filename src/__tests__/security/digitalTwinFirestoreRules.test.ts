/**
 * ORION-9 WAVE 8: DIGITAL TWIN & SCENARIO FIRESTORE SECURITY RULES TEST SUITE
 * 
 * Verifies security boundary enforcement for all 10 Wave 8 digital twin collections:
 * 1. digital_twins
 * 2. twin_snapshots (permanently immutable)
 * 3. twin_events (append-only ledger)
 * 4. twin_relationships
 * 5. twin_reconciliation (immutable discrepancy records)
 * 6. scenarios
 * 7. scenario_runs (immutable simulation runs)
 * 8. scenario_results (permanently immutable results)
 * 9. scenario_assumptions
 * 10. scenario_outcomes (append-only outcome ledger)
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

let testEnv: RulesTestEnvironment;
const PROJECT_ID = 'orion9-dev-db-2026';

describe('Wave 8 Digital Twin & Scenario Firestore Security Rules Gate', () => {
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
      await adminDb.collection('users').doc('user-twin-a').set({
        uid: 'user-twin-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'buyer'
      });
      await adminDb.collection('users').doc('admin-twin-a').set({
        uid: 'admin-twin-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'organization_admin'
      });
      await adminDb.collection('users').doc('user-twin-b').set({
        uid: 'user-twin-b',
        organizationId: 'TENANT_B',
        tenantId: 'TENANT_B',
        role: 'buyer'
      });
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  describe('1. Unauthenticated Denials Across All 10 Digital Twin Collections', () => {
    it('denies unauthenticated read/write to digital_twins', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('digital_twins').get());
      await assertFails(db.collection('digital_twins').doc('twin-01').set({ name: 'Twin' }));
    });

    it('denies unauthenticated read/write to twin_snapshots', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('twin_snapshots').get());
      await assertFails(db.collection('twin_snapshots').doc('snap-01').set({ checksum: 'abc' }));
    });

    it('denies unauthenticated read/write to twin_events', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('twin_events').get());
      await assertFails(db.collection('twin_events').doc('evt-01').set({ type: 'EVENT' }));
    });

    it('denies unauthenticated read/write to twin_relationships', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('twin_relationships').get());
      await assertFails(db.collection('twin_relationships').doc('rel-01').set({ type: 'SUPPLIES' }));
    });

    it('denies unauthenticated read/write to twin_reconciliation', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('twin_reconciliation').get());
      await assertFails(db.collection('twin_reconciliation').doc('rec-01').set({ type: 'CONFLICT' }));
    });

    it('denies unauthenticated read/write to scenarios', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('scenarios').get());
      await assertFails(db.collection('scenarios').doc('scen-01').set({ name: 'Surge' }));
    });

    it('denies unauthenticated read/write to scenario_runs', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('scenario_runs').get());
      await assertFails(db.collection('scenario_runs').doc('run-01').set({ status: 'COMPLETED' }));
    });

    it('denies unauthenticated read/write to scenario_results', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('scenario_results').get());
      await assertFails(db.collection('scenario_results').doc('res-01').set({ cost: 1000 }));
    });

    it('denies unauthenticated read/write to scenario_assumptions', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('scenario_assumptions').get());
      await assertFails(db.collection('scenario_assumptions').doc('assump-01').set({ source: 'SYSTEM' }));
    });

    it('denies unauthenticated read/write to scenario_outcomes', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('scenario_outcomes').get());
      await assertFails(db.collection('scenario_outcomes').doc('out-01').set({ variance: 0.05 }));
    });
  });

  describe('2. Cross-Tenant Isolation Enforcement', () => {
    it('denies TENANT_A user from writing to TENANT_B digital_twins', async () => {
      const userA = testEnv.authenticatedContext('user-twin-a', { organizationId: 'TENANT_A' }).firestore();
      await assertFails(userA.collection('digital_twins').doc('twin-tenant-b').set({
        tenantId: 'TENANT_B',
        name: 'Infiltrate Twin'
      }));
    });

    it('denies TENANT_A user from reading or creating TENANT_B scenarios', async () => {
      const userA = testEnv.authenticatedContext('user-twin-a', { organizationId: 'TENANT_A' }).firestore();
      await assertFails(userA.collection('scenarios').doc('scen-tenant-b').set({
        tenantId: 'TENANT_B',
        name: 'Cross Tenant Scenario',
        type: 'SUPPLIER_OUTAGE'
      }));
    });

    it('denies TENANT_A user from accessing TENANT_B simulation results', async () => {
      const userA = testEnv.authenticatedContext('user-twin-a', { organizationId: 'TENANT_A' }).firestore();
      await assertFails(userA.collection('scenario_results').doc('res-tenant-b').set({
        tenantId: 'TENANT_B',
        projectedCost: 500000
      }));
    });
  });

  describe('3. Immutability of Snapshots, Results and Audit Ledgers', () => {
    it('denies update or deletion of twin_snapshots (permanently immutable)', async () => {
      const adminA = testEnv.authenticatedContext('admin-twin-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('twin_snapshots').doc('snap-immutable-01').set({
          tenantId: 'TENANT_A',
          checksum: 'sha256-original-checksum',
          entityCount: 10
        });
      });

      await assertFails(adminA.collection('twin_snapshots').doc('snap-immutable-01').update({
        checksum: 'tampered-checksum'
      }));
      await assertFails(adminA.collection('twin_snapshots').doc('snap-immutable-01').delete());
    });

    it('denies update or deletion of scenario_results (permanently immutable)', async () => {
      const adminA = testEnv.authenticatedContext('admin-twin-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('scenario_results').doc('res-immutable-01').set({
          tenantId: 'TENANT_A',
          projectedCost: 150000,
          simulationMode: true
        });
      });

      await assertFails(adminA.collection('scenario_results').doc('res-immutable-01').update({
        projectedCost: 200000
      }));
      await assertFails(adminA.collection('scenario_results').doc('res-immutable-01').delete());
    });

    it('denies update or deletion of twin_reconciliation discrepancy records', async () => {
      const adminA = testEnv.authenticatedContext('admin-twin-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('twin_reconciliation').doc('rec-audit-01').set({
          tenantId: 'TENANT_A',
          discrepancyType: 'CONFLICT',
          entityId: 'INV-100'
        });
      });

      await assertFails(adminA.collection('twin_reconciliation').doc('rec-audit-01').update({
        resolved: true
      }));
      await assertFails(adminA.collection('twin_reconciliation').doc('rec-audit-01').delete());
    });

    it('denies update or deletion of scenario_outcomes tracking records', async () => {
      const adminA = testEnv.authenticatedContext('admin-twin-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('scenario_outcomes').doc('outcome-audit-01').set({
          tenantId: 'TENANT_A',
          accuracyScore: 0.94
        });
      });

      await assertFails(adminA.collection('scenario_outcomes').doc('outcome-audit-01').update({
        accuracyScore: 0.99
      }));
      await assertFails(adminA.collection('scenario_outcomes').doc('outcome-audit-01').delete());
    });
  });

  describe('4. Authorized Tenant Operations', () => {
    it('allows tenant user to create a scenario in their own tenant', async () => {
      const userA = testEnv.authenticatedContext('user-twin-a', { organizationId: 'TENANT_A' }).firestore();
      await assertSucceeds(userA.collection('scenarios').doc('scen-own-01').set({
        tenantId: 'TENANT_A',
        name: 'Port Congestion Simulation',
        type: 'PORT_CONGESTION',
        status: 'READY'
      }));
    });

    it('allows tenant admin to manage digital twins in their own tenant', async () => {
      const adminA = testEnv.authenticatedContext('admin-twin-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await assertSucceeds(adminA.collection('digital_twins').doc('twin-admin-01').set({
        tenantId: 'TENANT_A',
        name: 'Enterprise Supply Chain Twin',
        status: 'HEALTHY'
      }));
    });
  });
});
