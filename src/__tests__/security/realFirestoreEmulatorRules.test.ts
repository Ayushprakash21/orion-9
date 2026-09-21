/**
 * ORION-9 REAL FIREBASE EMULATOR SECURITY & TENANT ISOLATION SUITE
 *
 * Executes real network security rules assertions against the active
 * Firebase Auth Emulator (port 9099) and Cloud Firestore Emulator (port 8080).
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

describe('Real Firebase Emulator Security Rules Gate', () => {
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

  // ── 1. UNAUTHENTICATED ACCESS (MUST DENY) ───────────────────────────────────

  describe('Unauthenticated Access Controls', () => {
    it('denies unauthenticated read to purchase_orders', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('purchase_orders').get());
    });

    it('denies unauthenticated write to inventory', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('inventory').doc('item-01').set({ item: 'widget' }));
    });

    it('denies unauthenticated read to audit_logs', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('audit_logs').get());
    });

    it('denies unauthenticated read to approvals', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('approvals').get());
    });

    it('denies unauthenticated read to events', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('events').get());
    });

    it('denies unauthenticated access to administration', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('administration').doc('config').get());
    });
  });

  // ── 2. SAME-TENANT AUTHORIZED ACCESS (TENANT_A -> TENANT_A ALLOW) ──────────

  describe('Same-Tenant Authorized Operations', () => {
    it('allows TENANT_A authenticated user to create TENANT_A purchase order', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertSucceeds(
        tenantADb.collection('purchase_orders').doc('po-tenant-a-101').set({
          poNumber: 'PO-101',
          organizationId: 'org-tenant-a',
          amount: 5000,
        })
      );
    });

    it('allows TENANT_A authenticated user to read TENANT_A purchase order', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertSucceeds(
        tenantADb.collection('purchase_orders').doc('po-tenant-a-101').get()
      );
    });

    it('allows TENANT_A user to write to TENANT_A inventory', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertSucceeds(
        tenantADb.collection('inventory').doc('inv-tenant-a-01').set({
          sku: 'SKU-A-01',
          quantity: 100,
          organizationId: 'org-tenant-a',
        })
      );
    });
  });

  // ── 3. CROSS-TENANT ISOLATION (TENANT_A -> TENANT_B DENY) ───────────────────

  describe('Cross-Tenant Security Boundary Isolation', () => {
    beforeAll(async () => {
      // Seed TENANT_B documents using admin context
      await testEnv.withSecurityRulesDisabled(async (adminContext) => {
        const db = adminContext.firestore();
        await db.collection('purchase_orders').doc('po-tenant-b-999').set({
          poNumber: 'PO-B-999',
          organizationId: 'org-tenant-b',
          amount: 99000,
        });
        await db.collection('inventory').doc('inv-tenant-b-999').set({
          sku: 'SKU-B-SECRET',
          organizationId: 'org-tenant-b',
        });
        await db.collection('audit_logs').doc('audit-tenant-b-999').set({
          action: 'SECRET_ACTION',
          organizationId: 'org-tenant-b',
        });
        await db.collection('approvals').doc('appr-tenant-b-999').set({
          status: 'PENDING',
          organizationId: 'org-tenant-b',
        });
        await db.collection('events').doc('evt-tenant-b-999').set({
          eventType: 'PURCHASE_ORDER_CREATED',
          organizationId: 'org-tenant-b',
        });
      });
    });

    it('denies TENANT_A user from reading TENANT_B purchase orders', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        tenantADb.collection('purchase_orders').doc('po-tenant-b-999').get()
      );
    });

    it('denies TENANT_A user from creating a purchase order in TENANT_B', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        tenantADb.collection('purchase_orders').doc('po-tenant-b-new').set({
          poNumber: 'PO-ATTACK',
          organizationId: 'org-tenant-b', // Cross-tenant target
        })
      );
    });

    it('denies TENANT_A user from updating TENANT_B inventory', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        tenantADb.collection('inventory').doc('inv-tenant-b-999').update({
          quantity: 0,
        })
      );
    });

    it('denies TENANT_A user from deleting TENANT_B audit logs', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        tenantADb.collection('audit_logs').doc('audit-tenant-b-999').delete()
      );
    });

    it('denies TENANT_A user from reading TENANT_B approvals', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        tenantADb.collection('approvals').doc('appr-tenant-b-999').get()
      );
    });

    it('denies TENANT_A user from reading TENANT_B events', async () => {
      const tenantADb = testEnv.authenticatedContext('user-tenant-a', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        tenantADb.collection('events').doc('evt-tenant-b-999').get()
      );
    });
  });

  // ── 4. ROLE-BASED PRIVILEGE ESCALATION BLOCKING ────────────────────────────

  describe('Role Privileges & Administration Access Controls', () => {
    it('denies standard buyer from accessing administration collection', async () => {
      const buyerDb = testEnv.authenticatedContext('user-buyer', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(buyerDb.collection('administration').doc('system-keys').get());
    });

    it('denies standard buyer from modifying policies collection', async () => {
      const buyerDb = testEnv.authenticatedContext('user-buyer', {
        organizationId: 'org-tenant-a',
        role: 'buyer',
      }).firestore();

      await assertFails(
        buyerDb.collection('policies').doc('policy-01').set({
          rule: 'ALLOW_ALL',
        })
      );
    });

    it('allows admin role to access administration collection', async () => {
      const adminDb = testEnv.authenticatedContext('user-admin', {
        organizationId: 'org-tenant-a',
        role: 'admin',
      }).firestore();

      await assertSucceeds(
        adminDb.collection('administration').doc('system-keys').set({
          configured: true,
        })
      );
    });
  });
});
