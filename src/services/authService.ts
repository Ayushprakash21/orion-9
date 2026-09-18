import { UserProfile, Organization, RoleCode, PermissionCode } from '../types/auth';
import { permissionService } from './permissionService';
import { userService } from './userService';
import { organizationService } from './organizationService';

// TEMPORARY LOCAL AUTH MODE — replace with Supabase/enterprise IdP before production.
// admin / admin is development-only and must be replaced before production deployment.

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
   * Checks if session is present in localStorage.
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('orion_auth_session');
  },

  /**
   * Resolves a username or email identifier into an email locally.
   */
  resolveIdentity: async (identifier: string): Promise<string> => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error('Enter your username.');
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
   * Authenticates user locally using username/email and password.
   * Single source of truth: 'orion_users' via userService.getRawUsers().
   */
  authenticate: async (identifier: string, passwordString: string): Promise<AuthSessionDetails> => {
    console.log('[LOCAL_AUTH_START] Authenticating identifier:', identifier);
    if (!identifier || !identifier.trim()) {
      throw new Error('Enter your username or email.');
    }
    if (!passwordString) {
      throw new Error('Enter your password.');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    
    // Single source of truth: Get all raw users (including passwords and admin assurance)
    const localUsers = userService.getRawUsers();

    // Case-insensitive matching for both usernames and emails
    const matchedUser = localUsers.find((u: any) => {
      const uUsername = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      return uUsername === cleanIdentifier || uEmail === cleanIdentifier;
    });

    if (!matchedUser) {
      console.warn('[LOCAL_AUTH_ERROR] User not found:', cleanIdentifier);
      throw new Error('Invalid username or password.');
    }

    // Validate user status
    if (matchedUser.status === 'inactive' || matchedUser.status === 'suspended') {
      console.warn('[LOCAL_AUTH_ERROR] Account inactive/suspended:', matchedUser.username);
      throw new Error('Account inactive. Please contact your administrator.');
    }

    const isAdminUser = 
      cleanIdentifier === 'admin' || 
      (matchedUser.username || '').trim().toLowerCase() === 'admin' ||
      (matchedUser.email || '').trim().toLowerCase() === 'admin@orion.local' ||
      matchedUser.role === 'platform_admin';

    // Match password against stored credentials (with default admin support)
    const isPasswordMatch = 
      matchedUser.password === passwordString ||
      matchedUser.password === passwordString.trim() ||
      (isAdminUser && (passwordString === 'admin' || passwordString.trim() === 'admin' || !matchedUser.password)) ||
      (!matchedUser.password && passwordString === 'admin');

    if (!isPasswordMatch) {
      console.warn('[LOCAL_AUTH_ERROR] Password mismatch for user:', cleanIdentifier);
      throw new Error('Invalid username or password.');
    }

    // Synchronize password in storage if it was unset or updated
    if (matchedUser.password !== passwordString) {
      matchedUser.password = passwordString;
      const currentUsers = userService.getRawUsers();
      const uIdx = currentUsers.findIndex(u => u.id === matchedUser.id);
      if (uIdx !== -1) {
        currentUsers[uIdx].password = passwordString;
        if (typeof window !== 'undefined') {
          localStorage.setItem('orion_users', JSON.stringify(currentUsers));
        }
      }
    }

    // Load session details
    const details = await authService.loadFullSession(matchedUser.id, matchedUser.email);
    
    // Save session locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('orion_auth_session', JSON.stringify(details));
    }
    console.log('[LOCAL_AUTH_SUCCESS] Created local session for user:', matchedUser.id);
    return details;
  },

  // Legacy alias for authenticate
  login: async (identifier: string, passwordString: string): Promise<AuthSessionDetails> => {
    return authService.authenticate(identifier, passwordString);
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
        email: user.email || authEmail || 'admin@orion.local',
      },
      profile: user,
      organization,
      role: roleCode,
      permissions,
      token: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'orion-session-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9),
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString()
    };
  },

  /**
   * Signs out the current user by removing local session.
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('orion_auth_session');
    console.log('[LOCAL_AUTH_LOGOUT] Cleared local session.');
  },

  /**
   * Retrieves the current local session.
   */
  getSession: async () => {
    const sessionStr = localStorage.getItem('orion_auth_session');
    if (!sessionStr) return null;
    try {
      const details = JSON.parse(sessionStr) as AuthSessionDetails;
      return {
        user: details.user,
        access_token: details.token || 'local-development-mode-token',
        expires_at: details.expiresAt ? new Date(details.expiresAt).getTime() : 9999999999
      };
    } catch (e) {
      localStorage.removeItem('orion_auth_session');
      return null;
    }
  },

  /**
   * Retrieves the current local authenticated user.
   */
  getCurrentUser: () => {
    const sessionStr = localStorage.getItem('orion_auth_session');
    if (!sessionStr) return null;
    try {
      const details = JSON.parse(sessionStr) as AuthSessionDetails;
      return details.profile;
    } catch (e) {
      return null;
    }
  },

  // Delegate user-management helpers
  createUser: async (userData: any) => userService.createUser(userData),
  updateUser: async (id: string, updates: any) => userService.updateUser(id, updates),
  deleteUser: async (id: string) => userService.deleteUser(id),
  changePassword: async (id: string, passwordString: string) => userService.resetPassword(id, passwordString),
};
