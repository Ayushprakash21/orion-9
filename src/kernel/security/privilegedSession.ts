/**
 * ORION-9 PRIVILEGED ADMIN SESSION ENGINE
 * 
 * Enforces step-up authentication for administrative operations:
 * Normal Session -> Admin Console Requested -> Step-Up Authentication -> 
 * Privileged Session -> Admin Authorization -> Admin Operation.
 * 
 * Never simply sets `isAdmin = true` on the client.
 */

import { PrivilegedAdminSession, RoleCode, PermissionCode } from '../../types/auth';
import { generateCorrelationId } from './crypto';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { userService } from '../../services/userService';

const PRIVILEGED_TTL_MS = 15 * 60 * 1000; // Strict 15-minute TTL
const SESSION_STORAGE_KEY = 'orion_privileged_admin_session';

class PrivilegedSessionManager {
  private currentSession: PrivilegedAdminSession | null = null;
  private listeners: Array<(session: PrivilegedAdminSession | null) => void> = [];

  constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage(): void {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as PrivilegedAdminSession;
        if (session && new Date(session.expiresAt).getTime() > Date.now()) {
          // Verify environment boundary on restore
          const activeEnv = dbManager.getEnvironment();
          if (session.environment && session.environment !== activeEnv) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            this.currentSession = null;
            return;
          }
          this.currentSession = session;
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          this.currentSession = null;
        }
      }
    } catch (e) {
      this.currentSession = null;
    }
  }

  /**
   * Generates a new cryptographically bounded privileged session upon verified step-up authentication.
   */
  public issuePrivilegedSession(
    userId: string,
    organizationId: string,
    role: RoleCode,
    authMethod: 'step_up_password' | 'mfa_totp' | 'enterprise_sso' = 'step_up_password',
    environment?: 'DEMO' | 'LIVE'
  ): PrivilegedAdminSession {
    if (role !== 'platform_admin' && role !== 'organization_admin') {
      throw new Error(`Forbidden: Role ${role} is not authorized for privileged administrative access.`);
    }

    const activeEnv = environment || dbManager.getEnvironment();

    // RULE: DEMO identities cannot create a LIVE privileged session!
    if (activeEnv === 'LIVE' && (userId === 'local-admin' || userId === 'admin' || userId === 'user' || userId === 'local-user')) {
      throw new Error('Forbidden: DEMO identities cannot create a privileged session in the LIVE environment.');
    }

    // RULE: Deprovisioned/suspended identities cannot create a privileged session
    const user = userService.getUserById(userId);
    if (user && (user.status === 'inactive' || user.status === 'suspended')) {
      throw new Error(`Forbidden: User ${userId} is ${user.status} and cannot be issued a privileged session.`);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + PRIVILEGED_TTL_MS);

    // Cryptographic token generation
    const randomBytes = new Uint8Array(24);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      for (let i = 0; i < 24; i++) randomBytes[i] = Math.floor(Math.random() * 256);
    }
    const token = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const session: PrivilegedAdminSession = {
      token,
      userId,
      organizationId,
      role,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      authenticationMethod: authMethod,
      correlationId: generateCorrelationId('priv-stepup'),
      environment: activeEnv,
    };

    this.currentSession = session;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    this.notifyListeners();
    return session;
  }

  /**
   * Validates whether the active privileged session is valid, unexpired, and belongs to the specified user.
   */
  public validate(expectedUserId?: string): { valid: boolean; reason?: string; session?: PrivilegedAdminSession } {
    if (!this.currentSession) {
      this.restoreFromStorage();
    }

    if (!this.currentSession) {
      return { valid: false, reason: 'No active privileged session. Step-up authentication required.' };
    }

    const expiryTime = new Date(this.currentSession.expiresAt).getTime();
    if (Date.now() >= expiryTime) {
      this.revoke('Session expired');
      return { valid: false, reason: 'Privileged session expired. Re-authentication required.' };
    }

    if (expectedUserId && this.currentSession.userId !== expectedUserId) {
      this.revoke('Identity mismatch');
      return { valid: false, reason: 'Privileged session does not match the active user identity.' };
    }

    // Check environment boundary: privileged session must belong to active environment
    const activeEnv = dbManager.getEnvironment();
    if (this.currentSession.environment && this.currentSession.environment !== activeEnv) {
      this.revoke('Environment mismatch');
      return { valid: false, reason: `Privileged session belongs to ${this.currentSession.environment}, but active environment is ${activeEnv}.` };
    }

    // Check if user has become deprovisioned, inactive, or suspended
    if (this.currentSession.userId) {
      const user = userService.getUserById(this.currentSession.userId);
      if (user && (user.status === 'inactive' || user.status === 'suspended')) {
        this.revoke('User identity disabled');
        return { valid: false, reason: 'User identity is disabled or deprovisioned.' };
      }
    }

    return { valid: true, session: this.currentSession };
  }

  /**
   * Returns remaining milliseconds of the privileged session.
   */
  public getRemainingMs(): number {
    const val = this.validate();
    if (!val.valid || !this.currentSession) return 0;
    return Math.max(0, new Date(this.currentSession.expiresAt).getTime() - Date.now());
  }

  /**
   * Explicitly revokes and destroys the privileged session.
   */
  public revoke(reason?: string): void {
    this.currentSession = null;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this.notifyListeners();
  }

  public getSession(): PrivilegedAdminSession | null {
    const val = this.validate();
    return val.valid ? this.currentSession : null;
  }

  public subscribe(listener: (session: PrivilegedAdminSession | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.getSession());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const s = this.getSession();
    this.listeners.forEach(l => {
      try { l(s); } catch (e) {}
    });
  }
}

export const privilegedSessionManager = new PrivilegedSessionManager();
