import { UserProfile, Organization, RoleCode, PermissionCode } from '../types/auth';
import { permissionService } from './permissionService';
import { userService } from './userService';

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
   */
  authenticate: async (identifier: string, passwordString: string): Promise<AuthSessionDetails> => {
    console.log('[LOCAL_AUTH_START] Authenticating identifier:', identifier);
    if (!identifier || !identifier.trim()) {
      throw new Error('Enter your username or email.');
    }
    if (!passwordString) {
      throw new Error('Enter your password.');
    }

    const trimmed = identifier.trim().toLowerCase();
    
    // Get all raw users (including passwords) from localStorage
    const storedUsersData = localStorage.getItem('orion_users');
    let localUsers: any[] = [];
    if (storedUsersData) {
      try {
        localUsers = JSON.parse(storedUsersData);
      } catch (err) {
        console.warn('Error parsing users in authService, using userService instead');
      }
    }
    if (localUsers.length === 0) {
      // Trigger default initialization
      await userService.fetchUsersAsync();
      const freshStored = localStorage.getItem('orion_users');
      if (freshStored) {
        localUsers = JSON.parse(freshStored);
      }
    }

    // Match by username or email
    const matchedUser = localUsers.find(u => 
      u.username.toLowerCase() === trimmed || 
      u.email.toLowerCase() === trimmed
    );

    if (!matchedUser) {
      console.error('[LOCAL_AUTH_ERROR] User not found:', trimmed);
      throw new Error('Invalid username or password.');
    }

    // Match password
    if (matchedUser.password !== passwordString) {
      console.error('[LOCAL_AUTH_ERROR] Password mismatch for user:', trimmed);
      throw new Error('Invalid username or password.');
    }

    // Validate user status
    if (matchedUser.status === 'inactive' || matchedUser.status === 'suspended') {
      console.error('[LOCAL_AUTH_ERROR] Account inactive/suspended:', matchedUser.username);
      throw new Error('Account suspended. Contact your administrator.');
    }

    // Load session details
    const details = await authService.loadFullSession(matchedUser.id, matchedUser.email);
    
    // Save session locally
    localStorage.setItem('orion_auth_session', JSON.stringify(details));
    console.log('[LOCAL_AUTH_SUCCESS] Created local session for user:', matchedUser.id);
    return details;
  },

  // Legacy alias for authenticate
  login: async (username: string, passwordString: string): Promise<AuthSessionDetails> => {
    return authService.authenticate(username, passwordString);
  },

  /**
   * Fetches the complete session context locally.
   */
  loadFullSession: async (userId: string, authEmail?: string): Promise<AuthSessionDetails> => {
    const user = userService.getUserById(userId);
    if (!user) {
      throw new Error('Authenticated user profile not found.');
    }

    const organization: Organization = {
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
        access_token: 'local-development-mode-token',
        expires_at: 9999999999
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
