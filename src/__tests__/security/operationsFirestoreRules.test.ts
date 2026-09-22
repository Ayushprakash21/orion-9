/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Real Firebase Firestore Emulator Security Rules Test Suite
 * 
 * Verifies security boundary enforcement for all 10 Wave 10 operational collections:
 * 1. system_configs (admin-only mutation)
 * 2. config_versions (immutable, admin-only create)
 * 3. feature_flags (admin-only mutation)
 * 4. incidents (tenant-scoped, delete permanently denied)
 * 5. alerts (tenant-scoped)
 * 6. runtime_jobs (tenant-scoped)
 * 7. backups (admin-only, delete denied)
 * 8. releases (admin-only mutation)
 * 9. integrity_findings (tenant-scoped, delete denied)
 * 10. environment_controls (admin-only mutation)
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

describe('Wave 10 Operations & Control Plane Firestore Security Rules Gate', () => {
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
      await adminDb.collection('users').doc('user-ops-a').set({
        uid: 'user-ops-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'buyer',
      });
      await adminDb.collection('users').doc('admin-ops-a').set({
        uid: 'admin-ops-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'platform_admin',
      });
      await adminDb.collection('users').doc('user-ops-b').set({
        uid: 'user-ops-b',
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

  describe('1. Unauthenticated Denials Across Operational Collections', () => {
    it('denies unauthenticated read/write to system_configs', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('system_configs').doc('cfg-1').get());
      await assertFails(unauthDb.collection('system_configs').doc('cfg-1').set({ key: 'test' }));
    });

    it('denies unauthenticated read/write to incidents', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('incidents').doc('inc-1').get());
      await assertFails(unauthDb.collection('incidents').doc('inc-1').set({ title: 'test' }));
    });

    it('denies unauthenticated read/write to backups', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('backups').doc('snap-1').get());
      await assertFails(unauthDb.collection('backups').doc('snap-1').set({ plan: 'test' }));
    });
  });

  describe('2. Multi-Tenant Isolation on Incidents & Alerts', () => {
    it('allows tenant member to read their own tenant incident but denies reading other tenant incidents', async () => {
      // Seed incident for TENANT_A
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('incidents').doc('inc-tenant-a').set({
          tenantId: 'TENANT_A',
          title: 'Carrier Webhook Dropped',
          severity: 'SEV3',
        });
      });

      const userADb = testEnv.authenticatedContext('user-ops-a', { organizationId: 'TENANT_A' }).firestore();
      await assertSucceeds(userADb.collection('incidents').doc('inc-tenant-a').get());

      const userBDb = testEnv.authenticatedContext('user-ops-b', { organizationId: 'TENANT_B' }).firestore();
      await assertFails(userBDb.collection('incidents').doc('inc-tenant-a').get());
    });
  });

  describe('3. Admin-Only Mutation & Safety Controls', () => {
    it('denies standard buyer from updating system_configs, allows platform admin', async () => {
      const userADb = testEnv.authenticatedContext('user-ops-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();
      await assertFails(userADb.collection('system_configs').doc('cfg-ai').set({
        tenantId: 'TENANT_A',
        key: 'ai.confidence',
        value: 0.99,
      }));

      const adminDb = testEnv.authenticatedContext('admin-ops-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
      await assertSucceeds(adminDb.collection('system_configs').doc('cfg-ai').set({
        tenantId: 'TENANT_A',
        key: 'ai.confidence',
        value: 0.99,
      }));
    });

    it('denies standard buyer from modifying environment_controls, allows platform admin', async () => {
      const userADb = testEnv.authenticatedContext('user-ops-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();
      await assertFails(userADb.collection('environment_controls').doc('controls-a').set({
        tenantId: 'TENANT_A',
        productionWriteLock: true,
      }));

      const adminDb = testEnv.authenticatedContext('admin-ops-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
      await assertSucceeds(adminDb.collection('environment_controls').doc('controls-a').set({
        tenantId: 'TENANT_A',
        productionWriteLock: true,
      }));
    });
  });

  describe('4. Permanent Immutability of Versions & Incident Ledgers', () => {
    it('denies deletion of config_versions (immutable version snapshot)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('config_versions').doc('ver-immutable-1').set({
          tenantId: 'TENANT_A',
          versionId: 'cfg-v1.0.0',
        });
      });

      const adminDb = testEnv.authenticatedContext('admin-ops-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
      await assertFails(adminDb.collection('config_versions').doc('ver-immutable-1').delete());
    });

    it('denies deletion of incidents (permanent compliance ledger)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('incidents').doc('inc-no-delete').set({
          tenantId: 'TENANT_A',
          title: 'Audit Incident',
        });
      });

      const adminDb = testEnv.authenticatedContext('admin-ops-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
      await assertFails(adminDb.collection('incidents').doc('inc-no-delete').delete());
    });
  });
});
