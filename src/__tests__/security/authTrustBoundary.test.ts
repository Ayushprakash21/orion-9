/**
 * ORION-9 COMPREHENSIVE AUTHENTICATION & TRUST BOUNDARY TEST SUITE
 * 
 * Strict 33-point verification matrix enforcing:
 * 1. DEMO Authentication Boundary (Tests 1–6)
 * 2. LIVE Authentication & Identity Trust Boundary (Tests 7–24)
 * 3. Security Invariants & Kernel Boundary (Tests 25–30)
 * 4. Enterprise SSO, SCIM & MFA Truthfulness (Tests 31–33)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { organizationService } from '../../services/organizationService';
import { privilegedSessionManager } from '../../kernel/security/privilegedSession';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { authorizationEngine, AuthorizationError } from '../../kernel/authorization/AuthorizationEngine';
import { enterpriseIdentityService } from '../../services/enterpriseIdentityService';
import { realtimeSubscriptionManager } from '../../core/visualization/RealtimeSubscriptionManager';
import { signInWithEmailAndPassword } from 'firebase/auth';

// In-memory localStorage mock for Node test runner
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
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

describe('Orion-9 Authentication Trust Boundary & Security Verification', () => {

  beforeEach(() => {
    localStorage.clear();
    dbManager.setEnvironment('LIVE');
    privilegedSessionManager.revoke('Test setup clean');
    vi.clearAllMocks();
  });

  afterEach(() => {
    dbManager.setEnvironment('LIVE');
    privilegedSessionManager.revoke('Test teardown clean');
  });

  // =========================================================================
  // CATEGORY 1: DEMO AUTHENTICATION BOUNDARY (Tests 1–6)
  // =========================================================================
  describe('Category 1: DEMO Authentication Boundary', () => {
    it('1. demo admin login works in DEMO environment', async () => {
      dbManager.setEnvironment('DEMO');
      const session = await authService.authenticate('admin', 'admin');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-admin');
      expect(session.role).toBe('platform_admin');
      expect(session.environment).toBe('DEMO');
    });

    it('2. demo user login works in DEMO environment', async () => {
      dbManager.setEnvironment('DEMO');
      const session = await authService.authenticate('user', 'user');
      expect(session).toBeDefined();
      expect(session.user.id).toBe('local-user');
      expect(session.role).toBe('user');
      expect(session.environment).toBe('DEMO');
    });

    it('3. demo admin cannot enter LIVE environment', async () => {
      dbManager.setEnvironment('LIVE');
      await expect(authService.authenticate('admin', 'admin')).rejects.toThrow(
        'DEMO credentials are not permitted in the LIVE environment.'
      );
    });

    it('4. demo user cannot enter LIVE environment', async () => {
      dbManager.setEnvironment('LIVE');
      await expect(authService.authenticate('user', 'user')).rejects.toThrow(
        'DEMO credentials are not permitted in the LIVE environment.'
      );
    });

    it('5. demo session cannot access LIVE Firestore or validate in LIVE', async () => {
      dbManager.setEnvironment('LIVE');
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'local-admin', email: 'admin@orion.network' },
        environment: 'DEMO',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }));

      const session = await authService.getSession();
      expect(session).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('orion_auth_session')).toBeNull();
    });

    it('6. demo session cannot create LIVE privileged session', () => {
      dbManager.setEnvironment('LIVE');
      expect(() => {
        privilegedSessionManager.issuePrivilegedSession(
          'local-admin',
          'ORION_PLATFORM',
          'platform_admin',
          'step_up_password',
          'LIVE'
        );
      }).toThrow('DEMO identities cannot create a privileged session in the LIVE environment.');
    });
  });

  // =========================================================================
  // CATEGORY 2: LIVE AUTHENTICATION & IDENTITY TRUST BOUNDARY (Tests 7–24)
  // =========================================================================
  describe('Category 2: LIVE Authentication & Identity Trust Boundary', () => {
    it('7. Firebase authenticated user can establish LIVE identity', async () => {
      dbManager.setEnvironment('LIVE');
      const liveUser = await userService.createUser({
        fullName: 'Live Executive',
        username: 'liveexec',
        email: 'liveexec@orion.network',
        password: 'ValidPassword2026!',
        role: 'platform_admin',
        organizationId: 'ORION_PLATFORM',
      });

      (signInWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: liveUser.id, email: liveUser.email },
      });

      const session = await authService.authenticate('liveexec@orion.network', 'ValidPassword2026!');
      expect(session).toBeDefined();
      expect(session.environment).toBe('LIVE');
      expect(session.user.id).toBe(liveUser.id);
      expect(session.organization.id).toBe('ORION_PLATFORM');
    });

    it('8. Firebase auth failure rejects login immediately', async () => {
      dbManager.setEnvironment('LIVE');
      (signInWithEmailAndPassword as any).mockRejectedValueOnce(new Error('auth/invalid-credential'));

      await expect(authService.authenticate('nonexistent@orion.network', 'wrong-pass')).rejects.toThrow(
        'Invalid username or password.'
      );
    });

    it('9. LIVE never falls back to demo credentials on Firebase failure', async () => {
      dbManager.setEnvironment('LIVE');
      (signInWithEmailAndPassword as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.authenticate('admin@orion.network', 'admin')).rejects.toThrow(
        'Invalid username or password.'
      );
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('10. localStorage demo session cannot authenticate LIVE', async () => {
      dbManager.setEnvironment('LIVE');
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'local-user', email: 'user@orion.network' },
        environment: 'DEMO',
        token: 'fake-demo-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }));

      const session = await authService.getSession();
      expect(session).toBeNull();
    });

    it('11. manipulated localStorage role cannot elevate privileges', () => {
      dbManager.setEnvironment('LIVE');
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'local-user', email: 'user@orion.network' },
        role: 'platform_admin',
        environment: 'LIVE',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }));

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.role).toBe('user'); // Authoritative userService role is preserved
    });

    it('12. manipulated localStorage tenant cannot change tenant', () => {
      dbManager.setEnvironment('LIVE');
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'local-user', email: 'user@orion.network' },
        organization: { id: 'ROGUE_ORGANIZATION' },
        environment: 'LIVE',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }));

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.organizationId).toBe('ORION_PLATFORM'); // Authoritative tenant preserved
    });

    it('13. missing tenant membership rejects access in LIVE', async () => {
      dbManager.setEnvironment('LIVE');
      // Create user without organization in localStorage
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]');
      const noOrgUser = {
        id: 'user-no-org',
        username: 'noorguser',
        email: 'noorguser@orion.network',
        fullName: 'No Org User',
        role: 'user',
        organizationId: '',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      users.push(noOrgUser);
      localStorage.setItem('orion_users', JSON.stringify(users));

      (signInWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: noOrgUser.id, email: noOrgUser.email },
      });

      await expect(authService.authenticate('noorguser@orion.network', 'Password123!')).rejects.toThrow(
        'Tenant membership verification failed: No assigned organization.'
      );
    });

    it('14. inactive tenant membership rejects access in LIVE', async () => {
      dbManager.setEnvironment('LIVE');
      // Register an inactive organization
      const orgs = JSON.parse(localStorage.getItem('orion_organizations') || '[]');
      orgs.push({
        id: 'INACTIVE_ORG',
        name: 'Inactive Corp',
        status: 'inactive',
        currency: 'USD',
        timezone: 'UTC',
      });
      localStorage.setItem('orion_organizations', JSON.stringify(orgs));

      const users = JSON.parse(localStorage.getItem('orion_users') || '[]');
      const inactiveOrgUser = {
        id: 'user-inactive-org',
        username: 'inactiveorguser',
        email: 'inactiveorguser@orion.network',
        fullName: 'Inactive Org User',
        role: 'user',
        organizationId: 'INACTIVE_ORG',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      users.push(inactiveOrgUser);
      localStorage.setItem('orion_users', JSON.stringify(users));

      (signInWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: inactiveOrgUser.id, email: inactiveOrgUser.email },
      });

      await expect(authService.authenticate('inactiveorguser@orion.network', 'Password123!')).rejects.toThrow(
        'Tenant membership verification failed or organization is inactive.'
      );
    });

    it('15. unauthorized RBAC action is rejected', () => {
      expect(() => {
        authorizationEngine.authorize({
          actor: { id: 'norm-user', roles: ['user'], organizationId: 'ORION_PLATFORM' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:approve',
          organizationId: 'ORION_PLATFORM',
        });
      }).toThrow(AuthorizationError);
    });

    it('16. privileged operation requires privileged session', () => {
      const result = privilegedSessionManager.validate('any-admin');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Step-up authentication required');
    });

    it('17. expired privileged session is rejected', () => {
      dbManager.setEnvironment('DEMO');
      const session = privilegedSessionManager.issuePrivilegedSession(
        'local-admin',
        'ORION_PLATFORM',
        'platform_admin',
        'step_up_password',
        'DEMO'
      );
      // Simulate expired timestamp
      session.expiresAt = new Date(Date.now() - 1000).toISOString();
      const result = privilegedSessionManager.validate('local-admin');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('18. revoked privileged session is rejected', () => {
      dbManager.setEnvironment('DEMO');
      privilegedSessionManager.issuePrivilegedSession(
        'local-admin',
        'ORION_PLATFORM',
        'platform_admin',
        'step_up_password',
        'DEMO'
      );
      privilegedSessionManager.revoke('Explicit test revocation');
      const result = privilegedSessionManager.validate('local-admin');
      expect(result.valid).toBe(false);
    });

    it('19. tenant A cannot access tenant B (tenant isolation)', () => {
      expect(() => {
        authorizationEngine.authorize({
          actor: { id: 'user-a', roles: ['procurement_manager'], organizationId: 'TENANT_A' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:create',
          organizationId: 'TENANT_B',
        });
      }).toThrow(AuthorizationError);
    });

    it('20. organization mismatch is rejected with TENANT_ACCESS_DENIED code', () => {
      try {
        authorizationEngine.authorize({
          actor: { id: 'user-x', roles: ['procurement_manager'], organizationId: 'ORG_ACME' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:create',
          organizationId: 'ORG_BETA',
        });
        expect.unreachable('Should have thrown AuthorizationError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AuthorizationError);
        expect(err.code).toBe('TENANT_ACCESS_DENIED');
      }
    });

    it('21. logout destroys application session state', async () => {
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'local-admin' },
        environment: 'LIVE',
      }));
      await authService.logout();
      expect(localStorage.getItem('orion_auth_session')).toBeNull();
      expect(privilegedSessionManager.getSession()).toBeNull();
    });

    it('22. logout cleans realtime subscriptions', async () => {
      const cleanupSpy = vi.spyOn(realtimeSubscriptionManager, 'cleanupUserSubscriptions');
      await authService.logout();
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('23. environment switch clears incompatible auth state', () => {
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'demo-user' },
        environment: 'DEMO',
      }));
      dbManager.setEnvironment('LIVE');
      expect(localStorage.getItem('orion_auth_session')).toBeNull();
    });

    it('24. expired Firebase session is handled correctly', async () => {
      dbManager.setEnvironment('LIVE');
      localStorage.setItem('orion_auth_session', JSON.stringify({
        user: { id: 'local-user' },
        environment: 'LIVE',
        expiresAt: new Date(Date.now() - 5000).toISOString(),
      }));

      const session = await authService.getSession();
      expect(session).toBeNull();
      expect(localStorage.getItem('orion_auth_session')).toBeNull();
    });
  });

  // =========================================================================
  // CATEGORY 3: SECURITY INVARIANTS & KERNEL BOUNDARY (Tests 25–30)
  // =========================================================================
  describe('Category 3: Security Invariants & Kernel Boundary', () => {
    it('25. unauthenticated Firestore access is rejected', () => {
      expect(() => {
        authorizationEngine.authorize({
          actor: { id: '', roles: [], organizationId: '' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:read',
          organizationId: 'ORION_PLATFORM',
        });
      }).toThrow(AuthorizationError);
    });

    it('26. cross-tenant Firestore access is rejected', () => {
      expect(() => {
        authorizationEngine.authorize({
          actor: { id: 'user-cross', roles: ['viewer'], organizationId: 'TENANT_ALPHA' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:read',
          organizationId: 'TENANT_OMEGA',
        });
      }).toThrow(AuthorizationError);
    });

    it('27. manipulated role is rejected by AuthorizationEngine', () => {
      expect(() => {
        authorizationEngine.authorize({
          actor: { id: 'user-attacker', roles: ['forged_super_role'], organizationId: 'ORION_PLATFORM' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:create',
          organizationId: 'ORION_PLATFORM',
        });
      }).toThrow(AuthorizationError);
    });

    it('28. manipulated tenant is rejected by AuthorizationEngine', () => {
      expect(() => {
        authorizationEngine.authorize({
          actor: { id: 'user-spoof', roles: ['platform_admin'], organizationId: 'ATTACKER_ORG' },
          resourceType: 'purchase_order',
          requiredPermission: 'purchase_order:create',
          organizationId: 'TARGET_ORG',
        });
      }).toThrow(AuthorizationError);
    });

    it('29. privileged operation without MFA/step-up where required is rejected', async () => {
      // Non-admin cannot request step-up
      await expect(authService.requestAdminStepUp('local-user', 'user')).rejects.toThrow(
        'Access denied. Administrator privileges required.'
      );
      // Admin with incorrect password cannot step up
      await expect(authService.requestAdminStepUp('local-admin', 'wrong_password')).rejects.toThrow(
        'Incorrect administrator password.'
      );
    });

    it('30. DEMO identity cannot reach LIVE kernel operations', () => {
      dbManager.setEnvironment('LIVE');
      const demoIdentities = ['local-admin', 'local-user', 'admin', 'user'];

      for (const id of demoIdentities) {
        expect(() => {
          authorizationEngine.authorize({
            actor: { id, roles: ['platform_admin'], organizationId: 'ORION_PLATFORM' },
            resourceType: 'purchase_order',
            requiredPermission: 'purchase_order:create',
            organizationId: 'ORION_PLATFORM',
          });
        }).toThrow('DEMO identity cannot execute kernel operations in the LIVE environment.');
      }
    });
  });

  // =========================================================================
  // CATEGORY 4: ENTERPRISE SSO, SCIM & MFA TRUTHFULNESS (Tests 31–33)
  // =========================================================================
  describe('Category 4: Enterprise SSO, SCIM & MFA Truthfulness', () => {
    it('31. configuration-only SSO is not reported as connected', () => {
      const ssoStatus = enterpriseIdentityService.getSsoStatus();
      expect(ssoStatus.architectureSupported).toBe(true);
      expect(ssoStatus.status).toBe('NOT_CONFIGURED');
      expect(ssoStatus.connectedIdp).toBeNull();
      expect(ssoStatus.isProductionReady).toBe(false);
      expect(ssoStatus.environmentDependent).toBe(true);
    });

    it('32. configuration-only SCIM is not reported as operational', () => {
      const scimStatus = enterpriseIdentityService.getScimStatus();
      expect(scimStatus.architectureSupported).toBe(true);
      expect(scimStatus.status).toBe('NOT_OPERATIONAL');
      expect(scimStatus.provisioningEndpoint).toBeNull();
      expect(scimStatus.isProductionReady).toBe(false);
      expect(scimStatus.environmentDependent).toBe(true);
    });

    it('33. disabled/deprovisioned identity cannot retain or obtain privileged access', async () => {
      dbManager.setEnvironment('DEMO');
      const liveUser = await userService.createUser({
        fullName: 'Admin To Suspend',
        username: 'admintosuspend',
        email: 'admintosuspend@orion.network',
        password: 'ValidPassword2026!',
        role: 'platform_admin',
        organizationId: 'ORION_PLATFORM',
      });

      // Issue privileged session while active
      privilegedSessionManager.issuePrivilegedSession(
        liveUser.id,
        'ORION_PLATFORM',
        'platform_admin',
        'step_up_password',
        'DEMO'
      );
      expect(privilegedSessionManager.validate(liveUser.id).valid).toBe(true);

      // Now suspend the user account
      const users = JSON.parse(localStorage.getItem('orion_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === liveUser.id);
      users[userIndex].status = 'suspended';
      localStorage.setItem('orion_users', JSON.stringify(users));

      // Privileged session validation must fail and revoke the session
      const validation = privilegedSessionManager.validate(liveUser.id);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('disabled or deprovisioned');

      // Attempting to issue a new privileged session must fail immediately
      expect(() => {
        privilegedSessionManager.issuePrivilegedSession(
          liveUser.id,
          'ORION_PLATFORM',
          'platform_admin',
          'step_up_password',
          'DEMO'
        );
      }).toThrow(/is suspended and cannot be issued a privileged session/);
    });
  });
});
