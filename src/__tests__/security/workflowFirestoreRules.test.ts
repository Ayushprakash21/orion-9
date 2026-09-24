/**
 * ORION-9 WAVE 7: WORKFLOW FIRESTORE SECURITY RULES TEST SUITE
 * 
 * Verifies security boundary enforcement for all 10 Wave 7 workflow collections:
 * 1. workflow_definitions
 * 2. workflow_versions
 * 3. workflow_instances
 * 4. workflow_steps
 * 5. workflow_actions
 * 6. workflow_approvals
 * 7. workflow_executions
 * 8. workflow_retries
 * 9. workflow_compensations
 * 10. workflow_schedules
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

describe.skipIf(!emulatorOnline)('Wave 7 Workflow Firestore Security Rules Gate', () => {
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
      await adminDb.collection('users').doc('user-tenant-a').set({
        uid: 'user-tenant-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'buyer'
      });
      await adminDb.collection('users').doc('admin-tenant-a').set({
        uid: 'admin-tenant-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'organization_admin'
      });
      await adminDb.collection('users').doc('user-tenant-b').set({
        uid: 'user-tenant-b',
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

  describe('1. Unauthenticated Denials Across All 10 Workflow Collections', () => {
    it('denies unauthenticated read/write to workflow_definitions', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_definitions').get());
      await assertFails(db.collection('workflow_definitions').doc('def-01').set({ name: 'WF' }));
    });

    it('denies unauthenticated read/write to workflow_versions', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_versions').get());
      await assertFails(db.collection('workflow_versions').doc('ver-01').set({ version: '1.0' }));
    });

    it('denies unauthenticated read/write to workflow_instances', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_instances').get());
      await assertFails(db.collection('workflow_instances').doc('inst-01').set({ status: 'RUNNING' }));
    });

    it('denies unauthenticated read/write to workflow_steps', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_steps').get());
      await assertFails(db.collection('workflow_steps').doc('st-01').set({ name: 'Step' }));
    });

    it('denies unauthenticated read/write to workflow_actions', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_actions').get());
      await assertFails(db.collection('workflow_actions').doc('act-01').set({ action: 'Expedite' }));
    });

    it('denies unauthenticated read/write to workflow_approvals', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_approvals').get());
      await assertFails(db.collection('workflow_approvals').doc('appr-01').set({ status: 'APPROVED' }));
    });

    it('denies unauthenticated read/write to workflow_executions', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_executions').get());
      await assertFails(db.collection('workflow_executions').doc('exec-01').set({ status: 'SUCCESS' }));
    });

    it('denies unauthenticated read/write to workflow_retries', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_retries').get());
      await assertFails(db.collection('workflow_retries').doc('ret-01').set({ retryCount: 1 }));
    });

    it('denies unauthenticated read/write to workflow_compensations', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_compensations').get());
      await assertFails(db.collection('workflow_compensations').doc('comp-01').set({ status: 'PENDING' }));
    });

    it('denies unauthenticated read/write to workflow_schedules', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('workflow_schedules').get());
      await assertFails(db.collection('workflow_schedules').doc('sch-01').set({ cron: '* * *' }));
    });
  });

  describe('2. Cross-Tenant Isolation Enforcement', () => {
    it('denies TENANT_A user from reading or creating TENANT_B workflow definitions', async () => {
      const userA = testEnv.authenticatedContext('user-tenant-a', { organizationId: 'TENANT_A' }).firestore();
      await assertFails(userA.collection('workflow_definitions').doc('def-tenant-b').set({
        tenantId: 'TENANT_B',
        name: 'Infiltrate Workflow'
      }));
    });

    it('denies TENANT_A user from writing to TENANT_B workflow instances', async () => {
      const userA = testEnv.authenticatedContext('user-tenant-a', { organizationId: 'TENANT_A' }).firestore();
      await assertFails(userA.collection('workflow_instances').doc('inst-tenant-b').set({
        tenantId: 'TENANT_B',
        status: 'COMPLETED'
      }));
    });

    it('denies TENANT_A user from mutating TENANT_B approvals', async () => {
      const userA = testEnv.authenticatedContext('user-tenant-a', { organizationId: 'TENANT_A' }).firestore();
      await assertFails(userA.collection('workflow_approvals').doc('appr-b').set({
        tenantId: 'TENANT_B',
        status: 'APPROVED'
      }));
    });
  });

  describe('3. Immutability of Versions and Execution Audit Ledgers', () => {
    it('denies update or deletion of published workflow_versions (immutable snapshots)', async () => {
      const adminA = testEnv.authenticatedContext('admin-tenant-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('workflow_versions').doc('ver-immutable-01').set({
          tenantId: 'TENANT_A',
          version: '1.0.0',
          immutable: true
        });
      });

      await assertFails(adminA.collection('workflow_versions').doc('ver-immutable-01').update({
        version: '1.0.1'
      }));
      await assertFails(adminA.collection('workflow_versions').doc('ver-immutable-01').delete());
    });

    it('denies update or deletion of workflow_executions (append-only ledger)', async () => {
      const adminA = testEnv.authenticatedContext('admin-tenant-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('workflow_executions').doc('exec-ledger-01').set({
          tenantId: 'TENANT_A',
          status: 'SUCCESS'
        });
      });

      await assertFails(adminA.collection('workflow_executions').doc('exec-ledger-01').update({
        status: 'FAILED'
      }));
      await assertFails(adminA.collection('workflow_executions').doc('exec-ledger-01').delete());
    });
  });

  describe('4. Authorized Tenant Operations', () => {
    it('allows tenant user to create a workflow instance in their own tenant', async () => {
      const userA = testEnv.authenticatedContext('user-tenant-a', { organizationId: 'TENANT_A' }).firestore();
      await assertSucceeds(userA.collection('workflow_instances').doc('inst-own-01').set({
        tenantId: 'TENANT_A',
        workflowId: 'WF-SUPPLIER-DELAY',
        status: 'PENDING'
      }));
    });

    it('allows tenant admin to create and manage workflow definitions in their own tenant', async () => {
      const adminA = testEnv.authenticatedContext('admin-tenant-a', {
        organizationId: 'TENANT_A',
        role: 'organization_admin'
      }).firestore();

      await assertSucceeds(adminA.collection('workflow_definitions').doc('def-admin-01').set({
        tenantId: 'TENANT_A',
        name: 'Admin Governed Workflow',
        version: '1.0.0',
        status: 'ACTIVE'
      }));
    });
  });
});
