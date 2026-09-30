/**
 * ORION-9 — PERMANENT DEMO AUTHENTICATION & RESILIENCE TEST SUITE
 *
 * Authoritative 27-point verification matrix:
 *
 * DEMO positive tests:
 *  1. admin/admin → successful login
 *  2. user/user → successful login
 *  3. admin@orion.network/admin → successful login
 *  4. user@orion.network/user → successful login
 *  5. Admin/admin → successful login
 *  6. User/user → successful login
 *
 * DEMO negative tests:
 *  7. admin/wrong → rejected
 *  8. user/wrong → rejected
 *  9. admin/user → rejected
 * 10. user/admin → rejected
 * 11. unknown/admin → rejected
 * 12. empty username → rejected
 * 13. empty password → rejected
 *
 * Admin authorization tests:
 * 14. DEMO admin role is platform_admin
 * 15. DEMO admin receives every currently defined permission
 * 16. DEMO admin can obtain privileged session
 * 17. DEMO normal user cannot obtain privileged session
 * 18. DEMO normal user cannot become admin through localStorage tampering
 *
 * LIVE isolation tests:
 * 19. admin/admin rejected in LIVE
 * 20. user/user rejected in LIVE
 * 21. DEMO session rejected when environment changes to LIVE
 * 22. DEMO privileged session cannot be created in LIVE
 * 23. LIVE login still requires Firebase Authentication
 *
 * Resilience tests:
 * 24. DEMO admin login works with Firebase unavailable
 * 25. DEMO user login works with Firebase unavailable
 * 26. DEMO login works with Firestore unavailable
 * 27. Missing/corrupt DEMO local identity data is repaired from canonical definitions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../../services/authService';
import { userService, CANONICAL_DEMO_ADMIN, CANONICAL_DEMO_USER } from '../../services/userService';
import { permissionService } from '../../services/permissionService';
import { privilegedSessionManager } from '../../kernel/security/privilegedSession';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import * as firebaseClient from '../../lib/firebaseClient';
import { signInWithEmailAndPassword } from 'firebase/auth';

// In-memory localStorage polyfill for Node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] !== undefined ? this.store[key] : null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}

// Mock firebase/auth methods
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<any>('firebase/auth');
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };
});

describe('Orion-9 Permanent Demo Authentication Test Suite', () => {

  beforeEach(() => {
    localStorage.clear();
    dbManager.setEnvironment('DEMO');
    privilegedSessionManager.revoke('Test setup clean');
    vi.clearAllMocks();
  });

  afterEach(() => {
    dbManager.setEnvironment('LIVE');
    vi.restoreAllMocks();
  });

  // =========================================================================
  // DEMO POSITIVE TESTS (1–6)
  // =========================================================================
  describe('DEMO positive tests', () => {
    it('1. admin/admin → successful login', async () => {
      const session = await authService.authenticate('admin', 'admin');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-admin');
      expect(session.user.email).toBe('admin@orion.network');
      expect(session.role).toBe('platform_admin');
      expect(session.environment).toBe('DEMO');
      expect(session.organization?.id).toBe('ORION_PLATFORM');
    });

    it('2. user/user → successful login', async () => {
      const session = await authService.authenticate('user', 'user');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-user');
      expect(session.user.email).toBe('user@orion.network');
      expect(session.role).toBe('user');
      expect(session.environment).toBe('DEMO');
      expect(session.organization?.id).toBe('ORION_PLATFORM');
    });

    it('3. admin@orion.network/admin → successful login', async () => {
      const session = await authService.authenticate('admin@orion.network', 'admin');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-admin');
      expect(session.role).toBe('platform_admin');
    });

    it('4. user@orion.network/user → successful login', async () => {
      const session = await authService.authenticate('user@orion.network', 'user');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-user');
      expect(session.role).toBe('user');
    });

    it('5. Admin/admin → successful login (case-insensitive identifier)', async () => {
      const session = await authService.authenticate('Admin', 'admin');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-admin');
      expect(session.role).toBe('platform_admin');

      const upperSession = await authService.authenticate('ADMIN', 'admin');
      expect(upperSession.user.id).toBe('local-admin');
      expect(upperSession.role).toBe('platform_admin');
    });

    it('6. User/user → successful login (case-insensitive identifier)', async () => {
      const session = await authService.authenticate('User', 'user');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-user');
      expect(session.role).toBe('user');

      const upperSession = await authService.authenticate('USER', 'user');
      expect(upperSession.user.id).toBe('local-user');
      expect(upperSession.role).toBe('user');
    });
  });

  // =========================================================================
  // DEMO NEGATIVE TESTS (7–13)
  // =========================================================================
  describe('DEMO negative tests', () => {
    it('7. admin/wrong → rejected', async () => {
      await expect(authService.authenticate('admin', 'wrong')).rejects.toThrow(
        'Invalid username or password.'
      );
    });

    it('8. user/wrong → rejected', async () => {
      await expect(authService.authenticate('user', 'wrong')).rejects.toThrow(
        'Invalid username or password.'
      );
    });

    it('9. admin/user → rejected', async () => {
      await expect(authService.authenticate('admin', 'user')).rejects.toThrow(
        'Invalid username or password.'
      );
    });

    it('10. user/admin → rejected', async () => {
      await expect(authService.authenticate('user', 'admin')).rejects.toThrow(
        'Invalid username or password.'
      );
    });

    it('11. unknown/admin → rejected', async () => {
      await expect(authService.authenticate('unknown', 'admin')).rejects.toThrow(
        'Invalid username or password.'
      );
    });

    it('12. empty username → rejected', async () => {
      await expect(authService.authenticate('', 'admin')).rejects.toThrow(
        'Enter your username or email.'
      );
      await expect(authService.authenticate('   ', 'admin')).rejects.toThrow(
        'Enter your username or email.'
      );
    });

    it('13. empty password → rejected', async () => {
      await expect(authService.authenticate('admin', '')).rejects.toThrow(
        'Enter your password.'
      );
      await expect(authService.authenticate('admin', '   ')).rejects.toThrow(
        'Enter your password.'
      );
    });
  });

  // =========================================================================
  // ADMIN AUTHORIZATION TESTS (14–18)
  // =========================================================================
  describe('Admin authorization tests', () => {
    it('14. DEMO admin role is platform_admin', async () => {
      const session = await authService.authenticate('admin', 'admin');
      expect(session.role).toBe('platform_admin');
      expect(session.profile.role).toBe('platform_admin');
    });

    it('15. DEMO admin receives every currently defined permission', async () => {
      const session = await authService.authenticate('admin', 'admin');
      const allExpectedPermissions = permissionService.getPlatformAdminPermissions();
      
      expect(session.permissions).toEqual(allExpectedPermissions);
      expect(session.permissions).toContain('users.delete');
      expect(session.permissions).toContain('roles.manage');
      expect(session.permissions).toContain('settings.manage');
      expect(session.permissions).toContain('governance.manage');
      expect(session.permissions).toContain('system_status.manage');
      expect(session.permissions).toContain('backup.manage');
      expect(session.permissions).toContain('admin.access');
      expect(session.permissions).toContain('platform.controls');
      expect(session.permissions).toContain('dashboard.read');
      expect(session.permissions).toContain('control_tower.read');
    });

    it('16. DEMO admin can obtain privileged session', async () => {
      const session = await authService.authenticate('admin', 'admin');
      const stepUp = await authService.requestAdminStepUp(session.user.id, 'admin');
      expect(stepUp).toBeDefined();
      expect(stepUp.role).toBe('platform_admin');
      expect(stepUp.userId).toBe('local-admin');
      expect(stepUp.environment).toBe('DEMO');

      const validation = privilegedSessionManager.validate('local-admin');
      expect(validation.valid).toBe(true);
    });

    it('17. DEMO normal user cannot obtain privileged session', async () => {
      const session = await authService.authenticate('user', 'user');
      
      // Step-up with normal password -> rejected
      await expect(authService.requestAdminStepUp(session.user.id, 'user')).rejects.toThrow(
        'Access denied. Administrator privileges required.'
      );

      // Step-up with admin password -> rejected because role is not admin
      await expect(authService.requestAdminStepUp(session.user.id, 'admin')).rejects.toThrow(
        'Access denied. Administrator privileges required.'
      );

      // Direct privileged issuance attempt -> throws Forbidden
      expect(() => {
        privilegedSessionManager.issuePrivilegedSession(
          session.user.id,
          'ORION_PLATFORM',
          session.role,
          'step_up_password',
          'DEMO'
        );
      }).toThrow(/Forbidden/);
    });

    it('18. DEMO normal user cannot become admin through localStorage tampering', async () => {
      const userSession = await authService.authenticate('user', 'user');
      expect(userSession.role).toBe('user');

      // Attempt to tamper with localStorage to claim platform_admin
      const tampered = {
        ...userSession,
        role: 'platform_admin',
        profile: {
          ...userSession.profile,
          role: 'platform_admin',
        },
      };
      localStorage.setItem('orion_auth_session', JSON.stringify(tampered));

      // 1. Authoritative getCurrentUser() cross-verifies with identity store
      const verified = authService.getCurrentUser();
      expect(verified?.role).toBe('user');

      // 2. Authoritative loadFullSession() uses database identity
      const reloaded = await authService.loadFullSession(userSession.user.id);
      expect(reloaded.role).toBe('user');
      expect(reloaded.permissions).not.toContain('roles.manage');

      // 3. Step-up still fails
      await expect(authService.requestAdminStepUp(userSession.user.id, 'admin')).rejects.toThrow(
        'Access denied. Administrator privileges required.'
      );
    });
  });

  // =========================================================================
  // LIVE ISOLATION TESTS (19–23)
  // =========================================================================
  describe('LIVE isolation tests', () => {
    it('19. admin/admin rejected in LIVE', async () => {
      dbManager.setEnvironment('LIVE');
      await expect(authService.authenticate('admin', 'admin')).rejects.toThrow(
        'DEMO credentials are not permitted in the LIVE environment.'
      );
    });

    it('20. user/user rejected in LIVE', async () => {
      dbManager.setEnvironment('LIVE');
      await expect(authService.authenticate('user', 'user')).rejects.toThrow(
        'DEMO credentials are not permitted in the LIVE environment.'
      );
    });

    it('21. DEMO session rejected when environment changes to LIVE', async () => {
      // 1. Authenticate in DEMO
      dbManager.setEnvironment('DEMO');
      await authService.authenticate('admin', 'admin');
      expect(authService.isAuthenticated()).toBe(true);

      // 2. Switch environment to LIVE
      dbManager.setEnvironment('LIVE');
      expect(authService.isAuthenticated()).toBe(false);
      expect(await authService.getSession()).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('22. DEMO privileged session cannot be created in LIVE', () => {
      dbManager.setEnvironment('LIVE');
      expect(() => {
        privilegedSessionManager.issuePrivilegedSession(
          'local-admin',
          'ORION_PLATFORM',
          'platform_admin',
          'step_up_password',
          'LIVE'
        );
      }).toThrow(/DEMO identities cannot create a privileged session in the LIVE environment/);
    });

    it('23. LIVE login still requires Firebase Authentication', async () => {
      dbManager.setEnvironment('LIVE');
      
      const liveUser = await userService.createUser({
        fullName: 'Enterprise User',
        username: 'enterpriseuser',
        email: 'enterpriseuser@orion.network',
        password: 'SecretPass2026!',
        role: 'platform_admin',
        organizationId: 'ORION_PLATFORM',
      });

      // When Firebase Auth is unavailable in LIVE, login must fail
      vi.spyOn(firebaseClient, 'getFirebaseAuth').mockReturnValue(null as any);
      await expect(authService.authenticate('enterpriseuser@orion.network', 'SecretPass2026!')).rejects.toThrow(
        'Firebase Authentication service is unavailable.'
      );

      // When Firebase Auth is present, it must call signInWithEmailAndPassword
      const mockAuth = {} as any;
      vi.spyOn(firebaseClient, 'getFirebaseAuth').mockReturnValue(mockAuth);
      (signInWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: liveUser.id, email: liveUser.email }
      });

      const session = await authService.authenticate('enterpriseuser@orion.network', 'SecretPass2026!');
      expect(session).toBeDefined();
      expect(session.environment).toBe('LIVE');
      expect(session.user.id).toBe(liveUser.id);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'enterpriseuser@orion.network', 'SecretPass2026!');
    });
  });

  // =========================================================================
  // RESILIENCE TESTS (24–27)
  // =========================================================================
  describe('Resilience tests', () => {
    it('24. DEMO admin login works with Firebase unavailable', async () => {
      dbManager.setEnvironment('DEMO');
      vi.spyOn(firebaseClient, 'getFirebaseAuth').mockReturnValue(null as any);

      const session = await authService.authenticate('admin', 'admin');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-admin');
      expect(session.role).toBe('platform_admin');
    });

    it('25. DEMO user login works with Firebase unavailable', async () => {
      dbManager.setEnvironment('DEMO');
      vi.spyOn(firebaseClient, 'getFirebaseAuth').mockReturnValue(null as any);

      const session = await authService.authenticate('user', 'user');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-user');
      expect(session.role).toBe('user');
    });

    it('26. DEMO login works with Firestore unavailable', async () => {
      dbManager.setEnvironment('DEMO');
      vi.spyOn(firebaseClient, 'getFirebaseFirestore').mockReturnValue(null as any);

      const session = await authService.authenticate('admin', 'admin');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-admin');
      expect(session.role).toBe('platform_admin');
    });

    it('27. Missing/corrupt DEMO local identity data is repaired from canonical definitions', async () => {
      dbManager.setEnvironment('DEMO');

      // 1. Test missing store (localStorage cleared)
      localStorage.removeItem('orion_users');
      const usersAfterClear = userService.getUsers();
      expect(usersAfterClear.length).toBeGreaterThanOrEqual(2);
      expect(usersAfterClear.find(u => u.id === 'local-admin')?.role).toBe('platform_admin');
      expect(usersAfterClear.find(u => u.id === 'local-user')?.role).toBe('user');

      // 2. Test malformed JSON in localStorage
      localStorage.setItem('orion_users', '{ bad-json-corrupted: true ');
      const usersAfterCorrupt = userService.getUsers();
      expect(usersAfterCorrupt.find(u => u.id === 'local-admin')?.role).toBe('platform_admin');

      // 3. Test empty array in localStorage
      localStorage.setItem('orion_users', '[]');
      const usersAfterEmpty = userService.getUsers();
      expect(usersAfterEmpty.find(u => u.id === 'local-admin')?.role).toBe('platform_admin');

      // 4. Test malicious tampering: trying to downgrade admin or escalate user
      localStorage.setItem('orion_users', JSON.stringify([
        { id: 'local-admin', username: 'admin', role: 'viewer', status: 'inactive' },
        { id: 'local-user', username: 'user', role: 'platform_admin', status: 'active' },
        { id: 'custom-demo-user', username: 'custom', role: 'user', status: 'active' }
      ]));

      const repaired = userService.getUsers();
      const admin = repaired.find(u => u.id === 'local-admin');
      const normalUser = repaired.find(u => u.id === 'local-user');
      const customUser = repaired.find(u => u.id === 'custom-demo-user');

      // Admin restored to platform_admin and active
      expect(admin?.role).toBe('platform_admin');
      expect(admin?.status).toBe('active');

      // Normal user restored to user
      expect(normalUser?.role).toBe('user');

      // Custom legitimate demo user preserved!
      expect(customUser).toBeDefined();
      expect(customUser?.username).toBe('custom');

      // Login succeeds deterministically with repaired identity
      const session = await authService.authenticate('admin', 'admin');
      expect(session.role).toBe('platform_admin');
    });
  });
});
