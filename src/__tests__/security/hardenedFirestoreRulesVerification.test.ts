/**
 * ORION-9 PHASE 1 HARDENED FIRESTORE RULES VERIFICATION SUITE
 * Rigorously validates Phase 1 security hardening against the active
 * Firebase Firestore Emulator (port 8080):
 * 1. Self-service role escalation prevention on /users/{userId}
 * 2. Unprivileged wallpaper selection tamper prevention on /wallpaperSelections
 * 3. Branding asset read access and admin-only mutation protections
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

describe.skipIf(!emulatorOnline)('Phase 1 Hardened Firestore Security Rules Verification', () => {
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

  // ── 1. USER PROFILE CREATION & ROLE ANTI-ESCALATION ────────────────────────

  describe('User Profile Creation & Anti-Escalation Gate', () => {
    it('blocks unauthenticated user from creating a user profile', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(
        unauthDb.collection('users').doc('attacker_user').set({
          role: 'user',
          email: 'attacker@evil.org',
        })
      );
    });

    it('denies authenticated user from self-assigning privileged role buyer', async () => {
      const userDb = testEnv.authenticatedContext('victim-user-1').firestore();
      await assertFails(
        userDb.collection('users').doc('victim-user-1').set({
          id: 'victim-user-1',
          email: 'victim@orion.network',
          role: 'buyer', // Privilege escalation attempt!
          organizationId: 'ORION_PLATFORM',
        })
      );
    });

    it('denies authenticated user from self-assigning privileged role planner or admin', async () => {
      const userDb = testEnv.authenticatedContext('victim-user-2').firestore();
      await assertFails(
        userDb.collection('users').doc('victim-user-2').set({
          id: 'victim-user-2',
          email: 'victim2@orion.network',
          role: 'admin',
          organizationId: 'ORION_PLATFORM',
        })
      );
    });

    it('denies authenticated user from self-granting arbitrary permissions array', async () => {
      const userDb = testEnv.authenticatedContext('victim-user-3').firestore();
      await assertFails(
        userDb.collection('users').doc('victim-user-3').set({
          id: 'victim-user-3',
          email: 'victim3@orion.network',
          role: 'user',
          permissions: ['admin.all', 'security.override'],
        })
      );
    });

    it('allows authenticated user to create self-profile with safe role "user" and default org', async () => {
      const userDb = testEnv.authenticatedContext('legit-user-1').firestore();
      await assertSucceeds(
        userDb.collection('users').doc('legit-user-1').set({
          id: 'legit-user-1',
          email: 'legit@orion.network',
          role: 'user',
          organizationId: 'ORION_PLATFORM',
        })
      );
    });

    it('allows authenticated user to create self-profile with safe role "viewer"', async () => {
      const userDb = testEnv.authenticatedContext('legit-viewer-1').firestore();
      await assertSucceeds(
        userDb.collection('users').doc('legit-viewer-1').set({
          id: 'legit-viewer-1',
          email: 'viewer@orion.network',
          role: 'viewer',
          organizationId: 'ORION_PLATFORM',
        })
      );
    });

    it('allows admin role to create users with any role', async () => {
      const adminDb = testEnv.authenticatedContext('admin-prov-1', {
        role: 'platform_admin',
        organizationId: 'ORION_PLATFORM',
      }).firestore();

      await assertSucceeds(
        adminDb.collection('users').doc('new-buyer-100').set({
          id: 'new-buyer-100',
          email: 'buyer100@orion.network',
          role: 'buyer',
          organizationId: 'ORION_PLATFORM',
        })
      );
    });
  });

  // ── 2. WALLPAPER SELECTION TAMPER RESISTANCE ───────────────────────────────

  describe('Wallpaper Selection Security Gate', () => {
    it('denies standard user from overwriting global login wallpaper selection', async () => {
      const userDb = testEnv.authenticatedContext('user-rogue-1').firestore();
      await assertFails(
        userDb.collection('wallpaperSelections').doc('global_login').set({
          wallpaperId: 'hacked-wallpaper',
          userId: 'global',
          target: 'login',
        })
      );
    });

    it('denies standard user from overwriting another user desktop wallpaper selection', async () => {
      const userDb = testEnv.authenticatedContext('user-rogue-1').firestore();
      await assertFails(
        userDb.collection('wallpaperSelections').doc('victim_desktop').set({
          wallpaperId: 'hacked-wallpaper',
          userId: 'victim',
          target: 'desktop',
        })
      );
    });

    it('allows authenticated user to update their own desktop wallpaper selection', async () => {
      const userDb = testEnv.authenticatedContext('my-user-id').firestore();
      await assertSucceeds(
        userDb.collection('wallpaperSelections').doc('my-user-id_desktop').set({
          wallpaperId: 'sys-orion-desktop-default',
          userId: 'my-user-id',
          target: 'desktop',
        })
      );
    });

    it('allows admin to update global login wallpaper selection', async () => {
      const adminDb = testEnv.authenticatedContext('admin-wp-1', {
        role: 'admin',
        organizationId: 'ORION_PLATFORM',
      }).firestore();

      await assertSucceeds(
        adminDb.collection('wallpaperSelections').doc('global_login').set({
          wallpaperId: 'sys-orion-desktop-default',
          userId: 'global',
          target: 'login',
        })
      );
    });
  });

  // ── 3. SYSTEM CONFIGS & BRANDING ACCESS CONTROLS ───────────────────────────

  describe('System Configs & Branding Security Gate', () => {
    it('allows public unauthenticated read to system_configs/branding', async () => {
      // First seed branding doc as admin
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('system_configs').doc('branding').set({
          appName: 'ORION-9',
          published: true,
        });
      });

      const unauthDb = testEnv.unauthenticatedContext().firestore();
      const docSnap = await unauthDb.collection('system_configs').doc('branding').get();
      expect(docSnap.exists).toBe(true);
      expect(docSnap.data()?.appName).toBe('ORION-9');
    });

    it('denies public unauthenticated read to non-branding system_configs', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('system_configs').doc('security_keys').set({
          secretKey: 'CONFIDENTIAL',
        });
      });

      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(
        unauthDb.collection('system_configs').doc('security_keys').get()
      );
    });

    it('denies unauthenticated or standard user from modifying system_configs/branding', async () => {
      const userDb = testEnv.authenticatedContext('regular-user').firestore();
      await assertFails(
        userDb.collection('system_configs').doc('branding').set({
          appName: 'HACKED-APP',
        })
      );
    });

    it('allows public read to system_branding_assets', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('system_branding_assets').doc('logo_header').set({
          mimeType: 'image/svg+xml',
          bytes: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        });
      });

      const unauthDb = testEnv.unauthenticatedContext().firestore();
      const snap = await unauthDb.collection('system_branding_assets').doc('logo_header').get();
      expect(snap.exists).toBe(true);
    });

    it('denies non-admin from creating or mutating system_branding_assets', async () => {
      const userDb = testEnv.authenticatedContext('regular-user').firestore();
      await assertFails(
        userDb.collection('system_branding_assets').doc('malicious_asset').set({
          mimeType: 'image/png',
          bytes: 'AAA',
        })
      );
    });

    it('allows admin to create or mutate system_branding_assets', async () => {
      const adminDb = testEnv.authenticatedContext('admin-branding-1', {
        role: 'platform_admin',
        organizationId: 'ORION_PLATFORM',
      }).firestore();

      await assertSucceeds(
        adminDb.collection('system_branding_assets').doc('admin_uploaded_logo').set({
          mimeType: 'image/png',
          bytes: 'VALID_BASE64_BYTES',
        })
      );
    });
  });
});
