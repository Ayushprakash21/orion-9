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

describe.skipIf(!emulatorOnline)('Real Firebase Emulator — Master Data Security & Tenant Isolation Rules', () => {
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
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  // 1. Unauthenticated Denials
  it('denies unauthenticated read/write to /master_data', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection('master_data').doc('md-01').get());
    await assertFails(unauthDb.collection('master_data').doc('md-01').set({ entityType: 'PRODUCT' }));
  });

  it('denies unauthenticated read/write to /golden_records', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection('golden_records').doc('gold-01').get());
    await assertFails(unauthDb.collection('golden_records').doc('gold-01').set({ entityType: 'PRODUCT' }));
  });

  // 2. Tenant Isolation
  it('allows authenticated member of Tenant Alpha to read their master_data', async () => {
    const alphaUser = testEnv.authenticatedContext('user_alpha_1', {
      tenantId: 'TENANT_ALPHA',
      organizationId: 'TENANT_ALPHA',
      role: 'procurement_specialist',
    }).firestore();

    // Setup record as admin context
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx.firestore().collection('master_data').doc('md_alpha_1').set({
        id: 'md_alpha_1',
        tenantId: 'TENANT_ALPHA',
        organizationId: 'TENANT_ALPHA',
        entityType: 'PRODUCT',
        state: 'DRAFT',
      });
    });

    await assertSucceeds(alphaUser.collection('master_data').doc('md_alpha_1').get());
  });

  it('denies member of Tenant Beta from reading Tenant Alpha master_data', async () => {
    const betaUser = testEnv.authenticatedContext('user_beta_1', {
      tenantId: 'TENANT_BETA',
      organizationId: 'TENANT_BETA',
      role: 'procurement_specialist',
    }).firestore();

    await assertFails(betaUser.collection('master_data').doc('md_alpha_1').get());
  });

  // 3. Golden Record Mutation Restrictions
  it('denies non-admin from creating golden_records directly (only stewards / admins allowed)', async () => {
    const viewerUser = testEnv.authenticatedContext('user_viewer_1', {
      tenantId: 'TENANT_ALPHA',
      organizationId: 'TENANT_ALPHA',
      role: 'viewer',
    }).firestore();

    await assertFails(viewerUser.collection('golden_records').doc('gold_test').set({
      id: 'gold_test',
      tenantId: 'TENANT_ALPHA',
      organizationId: 'TENANT_ALPHA',
      entityType: 'PRODUCT',
      version: 1,
    }));
  });

  // 4. Lineage is Append-Only (Update/Delete Denied)
  it('denies updates or deletions to master_data_lineage (append-only ledger)', async () => {
    const adminUser = testEnv.authenticatedContext('admin_user_1', {
      tenantId: 'TENANT_ALPHA',
      organizationId: 'TENANT_ALPHA',
      role: 'platform_admin',
    }).firestore();

    // Create lineage entry via disabled rules to guarantee existence
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx.firestore().collection('master_data_lineage').doc('lin_01').set({
        id: 'lin_01',
        tenantId: 'TENANT_ALPHA',
        organizationId: 'TENANT_ALPHA',
        action: 'INGEST',
        timestamp: new Date().toISOString(),
      });
    });

    // Update must fail (append-only)
    await assertFails(adminUser.collection('master_data_lineage').doc('lin_01').update({
      action: 'TAMPERED_ACTION',
    }));

    // Delete must fail (append-only)
    await assertFails(adminUser.collection('master_data_lineage').doc('lin_01').delete());
  });
});
