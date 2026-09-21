import { UserProfile, Organization, RoleCode, PermissionCode, PrivilegedAdminSession } from '../types/auth';
import { permissionService } from './permissionService';
import { userService } from './userService';
import { organizationService } from './organizationService';
import { auditService } from './AuditService';
import { privilegedSessionManager } from '../kernel/security/privilegedSession';
import { getFirebaseAuth } from '../lib/firebaseClient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { generateCorrelationId } from '../kernel/security/crypto';

export interface AuthSessionDetails {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  organization: Organization | null;
  role: RoleCode;
  permissions: PermissionCode[];
  token?: string;
  expiresAt?: string;
}

export const authService = {
  /**
   * Checks if a valid session is present in localStorage.
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    const sessionStr = localStorage.getItem('orion_auth_session');
    if (!sessionStr) return false;
    try {
      const details = JSON.parse(sessionStr) as AuthSessionDetails;
      if (!details?.expiresAt) return false;
      return new Date(details.expiresAt).getTime() > Date.now();
    } catch (e) {
      return false;
    }
  },

  /**
   * Resolves a username or email identifier into an email.
   */
  resolveIdentity: async (identifier: string): Promise<string> => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error('Enter your username or email.');
    }

    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }

    const user = userService.getUserByUsername(trimmed);
    if (user) {
      return user.email;
    }
    throw new Error('Invalid username or password.');
  },

  /**
   * Authenticates user via DEMO / LOCAL credentials.
   *
   * DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
   * Required demo credentials:
   * Normal User: username === "user" AND password === "user"
   * Admin:       username === "admin" AND password === "admin"
   * Any other combination: DENY LOGIN.
   */
  authenticate: async (identifier: string, passwordString: string): Promise<AuthSessionDetails> => {
    const correlationId = generateCorrelationId('auth-login');

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      throw new Error('Enter your username or email.');
    }
    if (!passwordString || typeof passwordString !== 'string' || !passwordString.trim()) {
      throw new Error('Enter your password.');
    }

    // Normalize credentials (trim and case-insensitive identifier)
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (passwordString || '').trim();

    // DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
    const isNormalUser = (cleanId === 'user' || cleanId === 'user@orion.network' || cleanId === 'user@orion.local') && 
      (cleanPass === 'user' || cleanPass === 'OrionUser2026!');
    const isAdminUser = (cleanId === 'admin' || cleanId === 'admin@orion.network' || cleanId === 'admin@orion.local') && 
      (cleanPass === 'admin' || cleanPass === 'OrionAdmin2026!');

    if (!isNormalUser && !isAdminUser) {
      await auditService.log({
        actorUserId: identifier,
        actorName: identifier,
        action: 'LOGIN_FAILURE',
        operation: 'CREDENTIAL_REJECTED',
        resourceType: 'auth_session',
        status: 'failure',
        correlationId,
        metadata: { identifier, reason: 'Invalid username or password' }
      });
      throw new Error('Invalid username or password.');
    }

    // Resolve authoritative demo identity
    const targetUsername = isAdminUser ? 'admin' : 'user';
    const verifiedUser = await userService.verifyCredentials(targetUsername, cleanPass);

    if (!verifiedUser) {
      await auditService.log({
        actorUserId: targetUsername,
        actorName: targetUsername,
        action: 'LOGIN_FAILURE',
        operation: 'CREDENTIAL_REJECTED',
        resourceType: 'auth_session',
        status: 'failure',
        correlationId,
        metadata: { identifier: targetUsername, reason: 'Invalid username or password' }
      });
      throw new Error('Invalid username or password.');
    }

    // Validate active status
    if (verifiedUser.status === 'inactive' || verifiedUser.status === 'suspended') {
      await auditService.log({
        actorUserId: verifiedUser.id,
        actorName: verifiedUser.fullName,
        actorRole: verifiedUser.role,
        action: 'LOGIN_FAILURE',
        operation: 'ACCOUNT_SUSPENDED',
        resourceType: 'auth_session',
        status: 'failure',
        correlationId,
      });
      throw new Error('Account inactive. Please contact your administrator.');
    }

    // Admin privilege establishment
    if (isAdminUser) {
      privilegedSessionManager.issuePrivilegedSession(
        verifiedUser.id,
        verifiedUser.organizationId || 'ORION_PLATFORM',
        verifiedUser.role,
        'step_up_password'
      );
    } else {
      privilegedSessionManager.revoke('Normal user login');
    }

    // Load full session details (passwords are NOT contained in profile or session)
    const details = await authService.loadFullSession(verifiedUser.id, verifiedUser.email);

    // Save session locally (contains ONLY public identity and short-lived session token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('orion_auth_session', JSON.stringify(details));
    }

    await auditService.log({
      actorUserId: verifiedUser.id,
      actorName: verifiedUser.fullName,
      actorRole: verifiedUser.role,
      organizationId: verifiedUser.organizationId,
      action: 'LOGIN_SUCCESS',
      operation: 'DEMO_LOCAL_AUTH',
      resourceType: 'auth_session',
      resourceId: verifiedUser.id,
      status: 'success',
      correlationId,
    });

    return details;
  },

  login: async (identifier: string, passwordString: string): Promise<AuthSessionDetails> => {
    return authService.authenticate(identifier, passwordString);
  },

  /**
   * Performs step-up authentication for administrative operations.
   * Returns an authenticated PrivilegedAdminSession with strict 15-min TTL.
   */
  requestAdminStepUp: async (userId: string, passwordString: string): Promise<PrivilegedAdminSession> => {
    const correlationId = generateCorrelationId('stepup-req');
    const user = userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (user.role !== 'platform_admin' && user.role !== 'organization_admin') {
      await auditService.log({
        actorUserId: userId,
        actorName: user.fullName,
        actorRole: user.role,
        organizationId: user.organizationId,
        action: 'STEP_UP_UNAUTHORIZED',
        operation: 'ADMIN_STEP_UP',
        resourceType: 'privileged_session',
        status: 'failure',
        correlationId,
      });
      throw new Error('Access denied. Administrator privileges required.');
    }

    const isValid = await userService.verifyUserPassword(userId, passwordString);
    if (!isValid) {
      await auditService.log({
        actorUserId: userId,
        actorName: user.fullName,
        actorRole: user.role,
        organizationId: user.organizationId,
        action: 'STEP_UP_FAILED',
        operation: 'PASSWORD_INCORRECT',
        resourceType: 'privileged_session',
        status: 'failure',
        correlationId,
      });
      throw new Error('Incorrect administrator password.');
    }

    const session = privilegedSessionManager.issuePrivilegedSession(
      user.id,
      user.organizationId || 'ORION_PLATFORM',
      user.role,
      'step_up_password'
    );

    await auditService.log({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      organizationId: user.organizationId,
      action: 'STEP_UP_SUCCESS',
      operation: 'PRIVILEGED_SESSION_ISSUED',
      resourceType: 'privileged_session',
      resourceId: session.token,
      status: 'success',
      correlationId,
      metadata: { expiresAt: session.expiresAt }
    });

    return session;
  },

  /**
   * Fetches the complete session context locally.
   */
  loadFullSession: async (userId: string, authEmail?: string): Promise<AuthSessionDetails> => {
    const user = userService.getUserById(userId);
    if (!user) {
      throw new Error('Authenticated user profile not found.');
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      throw new Error('Account inactive. Please contact your administrator.');
    }

    const orgFromService = user.organizationId ? organizationService.getOrganizationById(user.organizationId) : undefined;

    const organization: Organization = orgFromService || {
      id: user.organizationId || 'ORION_PLATFORM',
      name: user.organizationName || 'ORION_PLATFORM',
      currency: 'USD',
      timezone: 'UTC',
      status: 'active',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
    };

    const roleCode = user.role;
    const permissions = permissionService.getDefaultPermissionsForRole(roleCode);

    return {
      user: {
        id: userId,
        email: user.email || authEmail || `${user.username}@orion.network`,
      },
      profile: user,
      organization,
      role: roleCode,
      permissions,
      token: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateCorrelationId('sess'),
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString()
    };
  },

  /**
   * Signs out the current user, clearing both normal session and privileged session.
   */
  logout: async (): Promise<void> => {
    privilegedSessionManager.revoke('User signed out');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orion_auth_session');
    }
  },

  /**
   * Retrieves the current local session.
   */
  getSession: async () => {
    if (typeof window === 'undefined') return null;
    const sessionStr = localStorage.getItem('orion_auth_session');
    if (!sessionStr) return null;
    try {
      const details = JSON.parse(sessionStr) as AuthSessionDetails;
      if (!details.expiresAt || new Date(details.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem('orion_auth_session');
        return null;
      }
      return {
        user: details.user,
        access_token: details.token || 'orion-session-token',
        expires_at: details.expiresAt ? new Date(details.expiresAt).getTime() : 0
      };
    } catch (e) {
      localStorage.removeItem('orion_auth_session');
      return null;
    }
  },

  /**
   * Retrieves the current authenticated user profile.
   */
  getCurrentUser: (): UserProfile | null => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    const sessionStr = localStorage.getItem('orion_auth_session');
    if (!sessionStr) return null;
    try {
      const details = JSON.parse(sessionStr) as AuthSessionDetails;
      if (!details?.user?.id) return null;
      // Cross-verify with authoritative userService record to prevent client tampering
      const authoritativeUser = userService.getUserById(details.user.id);
      return authoritativeUser || details.profile || null;
    } catch (e) {
      return null;
    }
  },

  createUser: async (userData: any) => userService.createUser(userData),
  updateUser: async (id: string, updates: any) => userService.updateUser(id, updates),
  deleteUser: async (id: string) => userService.deleteUser(id),
  changePassword: async (id: string, passwordString: string) => userService.resetPassword(id, passwordString),
};
