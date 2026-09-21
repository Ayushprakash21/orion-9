/**
 * ORION-9 DEMO / LOCAL AUTHENTICATION TEST SUITE
 *
 * DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
 *
 * Positive & Negative Verification Matrix:
 * 1. user/user → PASS
 * 2. admin/admin → PASS
 * 3. user/wrong-password → DENY
 * 4. admin/wrong-password → DENY
 * 5. wrong-user/user → DENY
 * 6. wrong-user/wrong-password → DENY
 * 7. empty username → DENY
 * 8. empty password → DENY
 * 9. user cannot obtain admin privileges
 * 10. admin receives the existing admin role/session
 * 11. AI_AGENT cannot authenticate as admin
 * 12. changing client-side role/session data cannot escalate user → admin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { privilegedSessionManager } from '../../kernel/security/privilegedSession';

// Simple in-memory localStorage polyfill for Node test runner
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

describe('Orion-9 Demo / Local Authentication Engine', () => {

  beforeEach(() => {
    localStorage.clear();
    privilegedSessionManager.revoke('Test setup clean');
  });

  // 1. user/user → PASS
  it('1. authenticates normal user with credentials "user" / "user" successfully', async () => {
    const session = await authService.authenticate('user', 'user');
    expect(session).toBeDefined();
    expect(session.user.id).toBe('local-user');
    expect(session.role).toBe('user');
    expect(session.profile.username).toBe('user');
    expect(session.permissions).toContain('inventory.read');
    expect(session.permissions).not.toContain('settings.manage');
    expect(session.permissions).not.toContain('roles.manage');
  });

  // 2. admin/admin → PASS
  it('2. authenticates administrator with credentials "admin" / "admin" successfully', async () => {
    const session = await authService.authenticate('admin', 'admin');
    expect(session).toBeDefined();
    expect(session.user.id).toBe('local-admin');
    expect(session.role).toBe('platform_admin');
    expect(session.profile.username).toBe('admin');
    expect(session.permissions).toContain('settings.manage');
    expect(session.permissions).toContain('roles.manage');
  });

  // 3. user/wrong-password → DENY
  it('3. denies login when user enters an incorrect password', async () => {
    await expect(authService.authenticate('user', 'wrong-password')).rejects.toThrow(
      'Invalid username or password.'
    );
  });

  // 4. admin/wrong-password → DENY
  it('4. denies login when admin enters an incorrect password', async () => {
    await expect(authService.authenticate('admin', 'wrong-password')).rejects.toThrow(
      'Invalid username or password.'
    );
  });

  // 5. wrong-user/user → DENY
  it('5. denies login when an unknown user enters password "user"', async () => {
    await expect(authService.authenticate('wrong-user', 'user')).rejects.toThrow(
      'Invalid username or password.'
    );
  });

  // 6. wrong-user/wrong-password → DENY
  it('6. denies login when unknown credentials are provided', async () => {
    await expect(authService.authenticate('wrong-user', 'wrong-password')).rejects.toThrow(
      'Invalid username or password.'
    );
  });

  // 7. empty username → DENY
  it('7. denies login when username is empty or whitespace only', async () => {
    await expect(authService.authenticate('', 'user')).rejects.toThrow(
      'Enter your username or email.'
    );
    await expect(authService.authenticate('   ', 'user')).rejects.toThrow(
      'Enter your username or email.'
    );
  });

  // 8. empty password → DENY
  it('8. denies login when password is empty or whitespace only', async () => {
    await expect(authService.authenticate('user', '')).rejects.toThrow(
      'Enter your password.'
    );
    await expect(authService.authenticate('user', '   ')).rejects.toThrow(
      'Enter your password.'
    );
  });

  // 9. user cannot obtain admin privileges
  it('9. ensures normal user session cannot step up or obtain admin privileges', async () => {
    const userSession = await authService.authenticate('user', 'user');
    expect(userSession.role).toBe('user');

    // Attempt step-up with normal user ID -> MUST REJECT
    await expect(authService.requestAdminStepUp(userSession.user.id, 'user')).rejects.toThrow(
      'Access denied. Administrator privileges required.'
    );

    // Privileged session manager MUST NOT grant privileged session to standard user
    expect(() => {
      privilegedSessionManager.issuePrivilegedSession(
        userSession.user.id,
        userSession.organization?.id || 'ORION_PLATFORM',
        userSession.role
      );
    }).toThrow(/Forbidden/);
  });

  // 10. admin receives the existing admin role/session
  it('10. establishes privileged admin session and permissions upon admin authentication', async () => {
    const adminSession = await authService.authenticate('admin', 'admin');
    expect(adminSession.role).toBe('platform_admin');

    const activePrivileged = privilegedSessionManager.getSession();
    expect(activePrivileged).toBeDefined();
    expect(activePrivileged?.userId).toBe('local-admin');
    expect(activePrivileged?.role).toBe('platform_admin');

    // Step-up verification with admin credentials
    const stepUpSession = await authService.requestAdminStepUp(adminSession.user.id, 'admin');
    expect(stepUpSession).toBeDefined();
    expect(stepUpSession.role).toBe('platform_admin');
  });

  // 11. AI_AGENT cannot authenticate as admin
  it('11. denies AI_AGENT or synthetic non-human actors from authenticating as admin', async () => {
    await expect(authService.authenticate('AI_AGENT', 'admin')).rejects.toThrow(
      'Invalid username or password.'
    );
    await expect(authService.authenticate('ai_agent', 'admin')).rejects.toThrow(
      'Invalid username or password.'
    );
    await expect(authService.authenticate('system', 'admin')).rejects.toThrow(
      'Invalid username or password.'
    );
  });

  // 12. changing client-side role/session data cannot escalate user → admin
  it('12. ensures mutating client-side session payload cannot escalate user to admin', async () => {
    // 1. Log in as user
    const userSession = await authService.authenticate('user', 'user');
    expect(userSession.role).toBe('user');

    // 2. Tamper with localStorage session payload to fake platform_admin role
    const tamperedSession = {
      ...userSession,
      role: 'platform_admin',
      profile: {
        ...userSession.profile,
        role: 'platform_admin',
      },
    };
    localStorage.setItem('orion_auth_session', JSON.stringify(tamperedSession));

    // 3. Authoritative getCurrentUser() checks back with userService records
    const verifiedUser = authService.getCurrentUser();
    expect(verifiedUser).toBeDefined();
    // Authoritative profile role must remain 'user'
    expect(verifiedUser?.role).toBe('user');

    // 4. Authoritative loadFullSession ignores client claim and uses database record
    const reloaded = await authService.loadFullSession(userSession.user.id);
    expect(reloaded.role).toBe('user');
    expect(reloaded.permissions).not.toContain('sys:admin');

    // 5. Attempting step-up with tampered user ID fails
    await expect(authService.requestAdminStepUp(userSession.user.id, 'admin')).rejects.toThrow(
      'Access denied. Administrator privileges required.'
    );
  });
});
