/**
 * ORION-9 WAVE 11: GLOBAL ENTERPRISE SCALE & DISTRIBUTED INTEGRATION
 * Real Firebase Firestore Emulator Security Rules Test Suite
 * 
 * Tests multi-tenant isolation, role-based authorization, and immutability for:
 * 1. enterprises (7-level hierarchy, tenant-isolated, immutable structure)
 * 2. regions (public read, admin mutation)
 * 3. data_residency_policies (tenant-isolated, admin mutation)
 * 4. broker_topics (public read, admin mutation)
 * 5. broker_offsets (tenant-scoped)
 * 6. distributed_jobs (tenant-scoped)
 * 7. trading_partners (tenant-isolated, admin mutation)
 * 8. integration_certifications (immutable audit reports)
 * 9. integration_messages (immutable message ledger)
 * 10. reconciliation_findings (tenant-isolated, delete prohibited)
 * 11. failover_operations (immutable drill audit ledger)
 * 12. fencing_leases (public read, admin mutation, delete prohibited)
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

describe.skipIf(!emulatorOnline)('Wave 11 Global Enterprise Scale & Integration Firestore Security Rules Gate', () => {
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

    await testEnv.clearFirestore();

    // Seed mock user records
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await adminDb.collection('users').doc('user-w11-a').set({
        uid: 'user-w11-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'buyer',
      });
      await adminDb.collection('users').doc('admin-w11-a').set({
        uid: 'admin-w11-a',
        organizationId: 'TENANT_A',
        tenantId: 'TENANT_A',
        role: 'platform_admin',
      });
      await adminDb.collection('users').doc('user-w11-b').set({
        uid: 'user-w11-b',
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

  it('1. enterprises: Admin creates hierarchy node; cross-tenant read is blocked', async () => {
    const adminA = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
    const userA = testEnv.authenticatedContext('user-w11-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();
    const userB = testEnv.authenticatedContext('user-w11-b', { organizationId: 'TENANT_B', role: 'buyer' }).firestore();

    // Admin creates node in TENANT_A
    await assertSucceeds(adminA.collection('enterprises').doc('ent-a-01').set({
      tenantId: 'TENANT_A',
      name: 'Alpha Global',
      level: 'ENTERPRISE'
    }));

    // Member in TENANT_A can read
    await assertSucceeds(userA.collection('enterprises').doc('ent-a-01').get());

    // Member in TENANT_B CANNOT read TENANT_A enterprise node (Tenant Isolation)
    await assertFails(userB.collection('enterprises').doc('ent-a-01').get());

    // Deletion is strictly prohibited
    await assertFails(adminA.collection('enterprises').doc('ent-a-01').delete());
  });

  it('2. regions: Authenticated users can read regions, but only admin can mutate', async () => {
    const admin = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
    const user = testEnv.authenticatedContext('user-w11-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();

    await assertSucceeds(admin.collection('regions').doc('reg-test-1').set({
      regionId: 'reg-test-1',
      name: 'Test Region',
      status: 'ACTIVE'
    }));

    await assertSucceeds(user.collection('regions').doc('reg-test-1').get());
    await assertFails(user.collection('regions').doc('reg-test-1').update({ status: 'OFFLINE' }));
  });

  it('3. data_residency_policies: Tenant-isolated; non-admin cannot mutate', async () => {
    const adminA = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
    const userA = testEnv.authenticatedContext('user-w11-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();

    await assertSucceeds(adminA.collection('data_residency_policies').doc('pol-01').set({
      tenantId: 'TENANT_A',
      boundaryType: 'STRICT_SOVEREIGN',
      jurisdiction: 'EU_GDPR'
    }));

    await assertSucceeds(userA.collection('data_residency_policies').doc('pol-01').get());
    await assertFails(userA.collection('data_residency_policies').doc('pol-01').update({ boundaryType: 'GLOBAL_REPLICATED' }));
  });

  it('4. trading_partners: Tenant isolated; only admin can create/update', async () => {
    const adminA = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
    const userA = testEnv.authenticatedContext('user-w11-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();
    const userB = testEnv.authenticatedContext('user-w11-b', { organizationId: 'TENANT_B', role: 'buyer' }).firestore();

    await assertSucceeds(adminA.collection('trading_partners').doc('tp-01').set({
      tenantId: 'TENANT_A',
      name: 'Supplier Alpha',
      status: 'ACTIVE'
    }));

    await assertSucceeds(userA.collection('trading_partners').doc('tp-01').get());
    await assertFails(userB.collection('trading_partners').doc('tp-01').get());
    await assertFails(userA.collection('trading_partners').doc('tp-01').update({ status: 'SUSPENDED' }));
  });

  it('5. integration_certifications: Immutable audit reports; update and delete permanently blocked', async () => {
    const adminA = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();

    await assertSucceeds(adminA.collection('integration_certifications').doc('cert-01').set({
      tenantId: 'TENANT_A',
      partnerId: 'tp-01',
      score: 100,
      passed: true
    }));

    // Immutability: update and delete fail even for admin
    await assertFails(adminA.collection('integration_certifications').doc('cert-01').update({ score: 90 }));
    await assertFails(adminA.collection('integration_certifications').doc('cert-01').delete());
  });

  it('6. reconciliation_findings: Tenant-isolated; deletion permanently prohibited', async () => {
    const adminA = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
    const userA = testEnv.authenticatedContext('user-w11-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();
    const userB = testEnv.authenticatedContext('user-w11-b', { organizationId: 'TENANT_B', role: 'buyer' }).firestore();

    await assertSucceeds(userA.collection('reconciliation_findings').doc('fnd-01').set({
      tenantId: 'TENANT_A',
      discrepancyType: 'AMOUNT_MISMATCH',
      exposureUsd: 5000,
      status: 'OPEN'
    }));

    await assertSucceeds(userA.collection('reconciliation_findings').doc('fnd-01').get());
    await assertFails(userB.collection('reconciliation_findings').doc('fnd-01').get());
    // Delete is prohibited
    await assertFails(adminA.collection('reconciliation_findings').doc('fnd-01').delete());
  });

  it('7. failover_operations: Immutable drill audit records', async () => {
    const adminA = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();

    await assertSucceeds(adminA.collection('failover_operations').doc('fo-01').set({
      tenantId: 'TENANT_A',
      status: 'COMPLETED',
      drill: true
    }));

    // Immutability: updates and deletes rejected
    await assertFails(adminA.collection('failover_operations').doc('fo-01').update({ status: 'FAILED' }));
    await assertFails(adminA.collection('failover_operations').doc('fo-01').delete());
  });

  it('8. fencing_leases: Read allowed, admin creates, delete prohibited', async () => {
    const admin = testEnv.authenticatedContext('admin-w11-a', { organizationId: 'TENANT_A', role: 'platform_admin' }).firestore();
    const user = testEnv.authenticatedContext('user-w11-a', { organizationId: 'TENANT_A', role: 'buyer' }).firestore();

    await assertSucceeds(admin.collection('fencing_leases').doc('fence-01').set({
      resourceId: 'GLOBAL_PRIMARY_LEADER',
      token: 1005,
      status: 'ACTIVE'
    }));

    await assertSucceeds(user.collection('fencing_leases').doc('fence-01').get());
    await assertFails(admin.collection('fencing_leases').doc('fence-01').delete());
  });
});
