import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

class StorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] || null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockLocalStorage = new StorageMock();
const mockSessionStorage = new StorageMock();

// @ts-ignore
globalThis.localStorage = mockLocalStorage;
// @ts-ignore
globalThis.sessionStorage = mockSessionStorage;
// @ts-ignore
globalThis.window = { localStorage: mockLocalStorage, sessionStorage: mockSessionStorage };

describe('LocalStorage Authentication Tamper Resistance', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    dbManager.setEnvironment('DEMO');
  });

  it('detects forged admin role injected into standard user session and purges session', () => {
    // Legitimate user exists in userService
    const normalUser = userService.getUserById('local-user');
    expect(normalUser).toBeDefined();
    expect(normalUser?.role).toBe('user');

    // Attack scenario: Attacker edits localStorage to elevate their role to platform_admin
    const forgedSession = {
      user: { id: 'local-user', email: 'user@orion.network' },
      profile: { ...normalUser, role: 'platform_admin' },
      organization: { id: 'ORION_PLATFORM', name: 'ORION_PLATFORM' },
      role: 'platform_admin', // Tampered!
      permissions: ['ALL_PERMISSIONS'],
      token: 'forged-admin-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      environment: 'DEMO',
    };

    localStorage.setItem('orion_auth_session', JSON.stringify(forgedSession));

    // System must evaluate tamper resistance
    const isValid = authService.isAuthenticated();

    // Must be rejected
    expect(isValid).toBe(false);

    // Tampered session must be immediately removed from localStorage
    expect(localStorage.getItem('orion_auth_session')).toBeNull();
  });

  it('rejects forged sessions for non-existent users and purges storage', () => {
    const fakeSession = {
      user: { id: 'attacker-injected-id', email: 'attacker@evil.corp' },
      role: 'platform_admin',
      permissions: ['ALL'],
      token: 'evil-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      environment: 'DEMO',
    };

    localStorage.setItem('orion_auth_session', JSON.stringify(fakeSession));

    const isValid = authService.isAuthenticated();
    expect(isValid).toBe(false);
    expect(localStorage.getItem('orion_auth_session')).toBeNull();
  });

  it('rejects DEMO sessions in LIVE database environment', () => {
    const demoSession = {
      user: { id: 'local-admin', email: 'admin@orion.network' },
      role: 'platform_admin',
      permissions: [],
      token: 'demo-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      environment: 'DEMO',
    };

    localStorage.setItem('orion_auth_session', JSON.stringify(demoSession));

    // Switch environment to LIVE
    dbManager.setEnvironment('LIVE');

    const isValid = authService.isAuthenticated();
    expect(isValid).toBe(false);
  });
});
