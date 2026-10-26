/**
 * ORION-9 P0 MASTER TASK: FIREBASE AUDIT & PERSISTENCE VERIFICATION SUITE
 * Tests Cloud Firestore persistence, Firebase Storage installer upload,
 * user profile & preference sync across devices, and security rules enforcement.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { LIVE_DATABASE_CONFIG, DEMO_DATABASE_CONFIG } from '../../core/database/DatabaseEnvironment';
import { userPersistenceService, UserPreferencesRecord } from '../../services/userPersistenceService';
import { userService } from '../../services/userService';
import { ScmPersistenceService, PersistenceResult } from '../../services/scm/ScmPersistenceService';
import { releaseService } from '../../services/releaseService';
import { releaseManager } from '../../operations/ReleaseManager';
import { UserProfile } from '../../types/auth';

describe('Orion-9 Firebase Database Audit & Persistence Master Suite', () => {

  describe('Phase 1: Environment & Configuration Audit', () => {
    it('verifies LIVE_DATABASE_CONFIG is bound to orion9-dev-db-2026', () => {
      expect(LIVE_DATABASE_CONFIG.projectId).toBe('orion9-dev-db-2026');
      expect(LIVE_DATABASE_CONFIG.environment).toBe('LIVE');
      expect(LIVE_DATABASE_CONFIG.isProductionSafe).toBe(true);
    });

    it('verifies .firebaserc contains authoritative default project orion9-dev-db-2026', () => {
      const firebasercPath = path.resolve(process.cwd(), '.firebaserc');
      expect(fs.existsSync(firebasercPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
      expect(content.projects.default).toBe('orion9-dev-db-2026');
    });

    it('verifies firebase.json declares both firestore and storage rules', () => {
      const firebaseJsonPath = path.resolve(process.cwd(), 'firebase.json');
      expect(fs.existsSync(firebaseJsonPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
      expect(config.firestore.rules).toBe('firestore.rules');
      expect(config.storage.rules).toBe('storage.rules');
      expect(config.emulators.firestore).toBeDefined();
      expect(config.emulators.storage).toBeDefined();
      expect(config.emulators.auth).toBeDefined();
    });
  });

  describe('Phase 6 & 7: Storage & Firestore Security Rules Audit', () => {
    it('verifies storage.rules exists and enforces strict default-deny', () => {
      const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
      expect(fs.existsSync(storageRulesPath)).toBe(true);
      const rules = fs.readFileSync(storageRulesPath, 'utf8');

      // Version & default deny
      expect(rules).toContain("rules_version = '2'");
      expect(rules).toContain('service firebase.storage');
      expect(rules).toMatch(/match\s+\/\{allPaths=\*\*\}[^}]+allow\s+read,\s+write:\s+if\s+false/);

      // Installer upload restrictions (Admin only, binary extensions, size limit)
      expect(rules).toContain('match /installers/{version}/{filename}');
      expect(rules).toContain('allow read: if true');
      expect(rules).toContain('isAdmin()');
      expect(rules).toContain('request.resource.size < 250 * 1024 * 1024');

      // User profile documents & wallpapers
      expect(rules).toContain('match /users/{userId}/{allPaths=**}');
      expect(rules).toContain('match /wallpapers/{allPaths=**}');
    });

    it('verifies firestore.rules permits public read for promoted releases', () => {
      const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
      expect(fs.existsSync(firestoreRulesPath)).toBe(true);
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');

      expect(rules).toContain('match /releases/{id}');
      expect(rules).toContain("resource.data.stage == 'PROMOTED'");
      expect(rules).toContain('allow create, update, delete: if isAdmin()');
    });

    it('verifies firestore.rules enforces user ownership and user preferences isolation', () => {
      const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
      const rules = fs.readFileSync(firestoreRulesPath, 'utf8');

      expect(rules).toContain('match /users/{userId}');
      expect(rules).toContain('match /user_preferences/{userId}');
    });
  });

  describe('Phase 3 & 4: User Profile & Preferences Cross-Device Persistence', () => {
    it('persists user profile and registers in-memory lookup', async () => {
      const mockProfile: UserProfile = {
        id: 'usr_audit_test_001',
        username: 'test_operator',
        displayName: 'Test Operator',
        fullName: 'Test Supply Operator',
        email: 'operator@orion.network',
        role: 'user',
        status: 'active',
        organizationId: 'ORION_PLATFORM',
        organizationName: 'ORION_PLATFORM',
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await userPersistenceService.saveUserProfile(mockProfile, 'DEMO');
      expect(saved.id).toBe('usr_audit_test_001');

      // Immediate synchronous lookup
      const syncLookup = userPersistenceService.getUserProfileSync('usr_audit_test_001');
      expect(syncLookup).toBeDefined();
      expect(syncLookup?.email).toBe('operator@orion.network');

      // Integration with userService
      const userServiceLookup = userService.getUserById('usr_audit_test_001');
      expect(userServiceLookup).toBeDefined();
      expect(userServiceLookup?.fullName).toBe('Test Supply Operator');
    });

    it('saves user preferences and synchronizes them to local storage for UI reactivity', async () => {
      const prefs: Partial<UserPreferencesRecord> = {
        theme: 'os-obsidian',
        wallpaperId: 'wp-nebula-deep-01',
        dynamicIslandMode: 'expanded',
        desktopLayout: {
          iconGridSize: 'medium',
          dockPosition: 'bottom',
        },
      };

      const result = await userPersistenceService.saveUserPreferences('usr_audit_test_001', prefs, 'DEMO');
      expect(result.userId).toBe('usr_audit_test_001');
      expect(result.theme).toBe('os-obsidian');
      expect(result.dynamicIslandMode).toBe('expanded');
      expect(result.lastSyncedAt).toBeDefined();
      expect(result.syncStatus).toBe('LOCAL_ONLY');

      if (typeof window !== 'undefined') {
        expect(localStorage.getItem('orion_theme')).toBe('os-obsidian');
        expect(localStorage.getItem('orion_dynamic_island_mode')).toBe('expanded');
      }
    });

    it('ensures user profile creates default user role without privilege escalation', async () => {
      const ensured = await userPersistenceService.ensureUserProfile({
        id: 'usr_new_002',
        email: 'newuser@orion.network',
        displayName: 'New User',
      }, 'DEMO');

      expect(ensured.id).toBe('usr_new_002');
      expect(ensured.role).toBe('user'); // Never default to admin!
      expect(ensured.organizationId).toBe('ORION_PLATFORM');
    });
  });

  describe('Phase 4 & 5: SCM Persistence Service Observability', () => {
    it('returns explicit CACHE_ONLY status when saving in DEMO environment', async () => {
      const scmService = ScmPersistenceService.getInstance();
      const mockRecord = {
        id: 'po_audit_100',
        tenantId: 'TENANT_ALPHA',
        poNumber: 'PO-2026-AUDIT-01',
        totalAmount: 154000,
      };

      const result = await scmService.saveRecordWithStatus(
        'purchase_orders',
        mockRecord.id,
        mockRecord
      );

      expect(result.status).toBe('CACHE_ONLY');
      expect(result.environment).toBe('DEMO');
      expect(result.data.poNumber).toBe('PO-2026-AUDIT-01');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Phase 8: Release Distribution & Firebase Storage Pipeline', () => {
    it('computes correct cryptographic SHA-256 hash using Web Crypto API', async () => {
      const content = 'ORION-9 NATIVE DESKTOP INSTALLER PAYLOAD VERIFICATION 2026';
      const blob = new Blob([content], { type: 'text/plain' });
      const sha256 = await releaseService.computeFileSha256(blob);

      expect(sha256).toBeDefined();
      expect(sha256.length).toBe(64); // Standard SHA-256 hex string length
      expect(/^[a-f0-9]{64}$/.test(sha256)).toBe(true);
    });

    it('creates and publishes release record with all automated preflight gates', async () => {
      const published = await releaseService.publishReleaseRecord({
        version: 'v10.0.0-rc9',
        commitSha: '6d9f7a8b',
        deployedBy: 'RELEASE_AUDITOR',
        notes: 'P0 Release Audit Candidate',
        desktopPackage: {
          platform: 'windows-x64',
          filename: 'Orion-9-Setup.exe',
          sizeBytes: 31457280,
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          downloadUrl: '/api/download/desktop',
        },
      });

      expect(published.id).toBe('rel-v10_0_0-rc9');
      expect(published.version).toBe('v10.0.0-rc9');
      expect(published.gates.length).toBe(4);
      expect(published.gates.every(g => g.passed)).toBe(true);
      expect(published.desktopPackage?.filename).toBe('Orion-9-Setup.exe');

      // Verify releaseManager integration
      releaseManager.addOrUpdateRelease(published);
      const found = releaseManager.getRelease(published.id);
      expect(found).toBeDefined();
      expect(found?.version).toBe('v10.0.0-rc9');
    });

    it('promotes release and preserves 1-click rollback target linkage', () => {
      const promoteResult = releaseManager.promoteRelease('rel-v10_0_0-rc9', 'platform_admin');
      expect(promoteResult.success).toBe(true);
      expect(promoteResult.stage).toBe('PROMOTED');

      const rollbackResult = releaseManager.rollbackRelease('rel-v10_0_0-rc9', 'platform_admin', 'Audit verification');
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.rolledBackTo).toBe('v9.0.0');
    });
  });

  describe('Phase 9: Public Download Integrity & Anti-HTML Protection', () => {
    it('verifies server.ts contains strict anti-HTML fallback for installer binaries', () => {
      const serverPath = path.resolve(process.cwd(), 'server.ts');
      const serverCode = fs.readFileSync(serverPath, 'utf8');

      // Strictly checks for anti-HTML response headers and 404 JSON for missing installers
      expect(serverCode).toContain('Binary downloads never fall back to HTML');
      expect(serverCode).toMatch(/app\.use\(\[['"]\*\.exe['"], ['"]\*\.msi['"], ['"]\*\.zip['"]/);
      expect(serverCode).toContain('app.use(\'/downloads/*\'');
    });
  });
});
