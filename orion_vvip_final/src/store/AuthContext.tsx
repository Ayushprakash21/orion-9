import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { SessionState, PermissionCode, RoleCode, UserProfile, Organization, AuthUser } from '../types/auth';
import { authService, AuthSessionDetails } from '../services/authService';
import { userService } from '../services/userService';

export type BootState = 
  | 'BOOTING'
  | 'POWERED_OFF'
  | 'SYSTEM_INITIALIZING'
  | 'LOGIN_REQUIRED'
  | 'AUTHENTICATING'
  | 'POST_LOGIN_INITIALIZING'
  | 'READY'
  | 'LOCKED'
  | 'SLEEPING'
  | 'RESTARTING'
  | 'SHUTTING_DOWN';

export interface LoginOptions {
  destination?: string;
  requiredRoles?: RoleCode[];
  skipPostLoginInit?: boolean;
}

interface AuthContextType extends SessionState {
  currentUser: UserProfile | null;
  role: RoleCode | null;
  isAdmin: boolean;
  bootState: BootState;
  isInitializing: boolean;
  isFadingOut: boolean;
  isPostLoginInitializing: boolean;
  postLoginDestination: string | null;
  startPostLoginInitialization: (destination?: string) => void;
  completePostLoginInitialization: () => void;
  completeSystemInitialization: () => void;
  hasPermission: (permission: PermissionCode) => boolean;
  hasRole: (roles: RoleCode[]) => boolean;
  signIn: (identifier: string, password: string, options?: LoginOptions) => Promise<UserProfile>;
  login: (identifier: string, password: string, options?: LoginOptions) => Promise<UserProfile>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  triggerRestart: () => void;
  triggerLock: () => void;
  triggerSleep: () => void;
  triggerShutdown: () => void;
  completeShutdown: () => void;
  unlock: () => void;
  wake: () => void;
  powerOn: () => void;
  logout: () => Promise<void>;
}

const defaultState: SessionState = {
  user: null,
  profile: null,
  organization: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType>({
  ...defaultState,
  currentUser: null,
  role: null,
  isAdmin: false,
  bootState: 'BOOTING',
  isInitializing: true,
  isFadingOut: false,
  isPostLoginInitializing: false,
  postLoginDestination: null,
  startPostLoginInitialization: () => {},
  completePostLoginInitialization: () => {},
  completeSystemInitialization: () => {},
  hasPermission: () => false,
  hasRole: () => false,
  signIn: async () => ({} as UserProfile),
  login: async () => ({} as UserProfile),
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshSession: async () => {},
  triggerRestart: () => {},
  triggerLock: () => {},
  triggerSleep: () => {},
  triggerShutdown: () => {},
  completeShutdown: () => {},
  unlock: () => {},
  wake: () => {},
  powerOn: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ORION OS always starts powered off. The user must explicitly press TURN ON.
  const [bootState, setBootState] = useState<BootState>('POWERED_OFF');

  const [state, setState] = useState<SessionState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('orion_auth_session');
        if (sessionStr) {
          const details = JSON.parse(sessionStr) as AuthSessionDetails;
          if (details?.user) {
            return {
              user: details.user,
              profile: details.profile,
              organization: details.organization,
              permissions: details.permissions || [],
              isAuthenticated: true,
              isLoading: false,
              error: null,
            };
          }
        }
      } catch (e) {}
    }
    return defaultState;
  });

  const [role, setRole] = useState<RoleCode | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('orion_auth_session');
        if (sessionStr) {
          const details = JSON.parse(sessionStr) as AuthSessionDetails;
          return details?.role || null;
        }
      } catch (e) {}
    }
    return null;
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [postLoginDestination, setPostLoginDestination] = useState<string | null>(null);

  const isInitializing = bootState === 'BOOTING';
  const isPostLoginInitializing = bootState === 'POST_LOGIN_INITIALIZING';

  const startPostLoginInitialization = useCallback((destination?: string) => {
    setBootState('POST_LOGIN_INITIALIZING');
    setPostLoginDestination(destination || null);
  }, []);

  const completePostLoginInitialization = useCallback(() => {
    setBootState('READY');
    setPostLoginDestination(null);
  }, []);

  const completeSystemInitialization = useCallback(() => {
    // Every physical power-on must land at authentication, even if a previous
    // browser session exists. Authentication is a deliberate post-boot step.
    setBootState('LOGIN_REQUIRED');
  }, []);

  const applySessionDetails = useCallback((details: AuthSessionDetails) => {
    setRole(details.role);
    setState({
      user: details.user,
      profile: details.profile,
      organization: details.organization,
      permissions: details.permissions,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearSessionState = useCallback(() => {
    setRole(null);
    setPostLoginDestination(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('orion_auth_session');
      } catch (e) {}
    }
    setState({
      ...defaultState,
      isLoading: false,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await authService.getSession();
      if (!session || !session.user) {
        clearSessionState();
        return;
      }

      const details = await authService.loadFullSession(session.user.id, session.user.email);
      applySessionDetails(details);
    } catch (err: any) {
      console.warn('Session refresh warning:', err);
      clearSessionState();
    }
  }, [applySessionDetails, clearSessionState]);

  // Boot is user-controlled: the OS never auto-powers-on or auto-redirects on load.

  const hasPermission = useCallback((permission: PermissionCode) => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const hasRole = useCallback((roles: RoleCode[]) => {
    if (!role && !state.profile?.role) return false;
    const currentRole = role || state.profile?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }, [role, state.profile?.role]);

  const login = async (identifier: string, passwordString: string, options?: LoginOptions): Promise<UserProfile> => {
    setBootState('AUTHENTICATING');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (!identifier || !identifier.trim()) {
        throw new Error('Enter your username or email.');
      }
      if (!passwordString) {
        throw new Error('Enter your password.');
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const localUsers = userService.getRawUsers();

      const matchedUser = localUsers.find((u: any) => {
        const uUsername = (u.username || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        return uUsername === cleanIdentifier || uEmail === cleanIdentifier;
      });

      if (!matchedUser) {
        console.warn('[AUTH_ERROR] User not found for identifier:', cleanIdentifier);
        throw new Error('Invalid username or password.');
      }

      if (matchedUser.status === 'inactive' || matchedUser.status === 'suspended') {
        console.warn('[AUTH_ERROR] Account inactive:', matchedUser.username);
        throw new Error('Account inactive. Please contact your administrator.');
      }

      // The normal USER LOGIN portal is strictly non-administrative.
      // Administrator identities must use /admin/login; never allow an admin
      // account to authenticate through the user portal.
      const isAdminUser = matchedUser.role === 'platform_admin' || matchedUser.role === 'organization_admin';
      if (isAdminUser && !options?.requiredRoles?.length) {
        console.warn('[AUTH_ERROR] Administrator attempted user-portal login:', matchedUser.username);
        throw new Error('Administrator accounts must use the Admin Console.');
      }

      const isPasswordMatch = 
        matchedUser.password === passwordString ||
        matchedUser.password === passwordString.trim() ||
        (!matchedUser.password && passwordString === passwordString.trim() && passwordString.length > 0);

      if (!isPasswordMatch) {
        console.warn('[AUTH_ERROR] Password mismatch for identifier:', cleanIdentifier);
        throw new Error('Invalid username or password.');
      }

      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const userRole = (matchedUser.role || (isAdminUser ? 'platform_admin' : 'viewer')) as RoleCode;
        const hasRequiredRole = options.requiredRoles.includes(userRole);
        if (!hasRequiredRole) {
          console.warn('[AUTH_ERROR] User does not meet required role for portal:', userRole);
          throw new Error('Access denied. Administrator privileges required for platform control plane.');
        }
      }

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

      const details = await authService.loadFullSession(matchedUser.id, matchedUser.email);
      if (typeof window !== 'undefined') {
        localStorage.setItem('orion_auth_session', JSON.stringify(details));
      }

      applySessionDetails(details);

      // Trigger authoritative post-login initialization
      if (!options?.skipPostLoginInit) {
        const isAdminRole = details.role === 'platform_admin' || details.role === 'organization_admin';
        const defaultDest = isAdminRole ? '/admin' : '/';
        const targetDest = options?.destination || defaultDest;
        setBootState('POST_LOGIN_INITIALIZING');
        setPostLoginDestination(targetDest);
      } else {
        setBootState('READY');
      }

      return details.profile;
    } catch (err: any) {
      setBootState('LOGIN_REQUIRED');
      setPostLoginDestination(null);
      setState(prev => ({ ...prev, isLoading: false, error: err.message || 'Invalid credentials' }));
      throw err;
    }
  };

  const signIn = login;

  const signUp = async () => {
    throw new Error('Self-signup is disabled. Contact your administrator.');
  };

  const resetPassword = async () => {
    throw new Error('Password reset is managed by your platform administrator.');
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } finally {
      clearSessionState();
      setBootState('LOGIN_REQUIRED');
    }
  };

  const logout = signOut;

  const triggerRestart = useCallback(() => {
    clearSessionState();
    setBootState('RESTARTING');
    setTimeout(() => {
      setBootState('SYSTEM_INITIALIZING');
    }, 2500);
  }, [clearSessionState]);

  const triggerShutdown = useCallback(() => {
    clearSessionState();
    setBootState('SHUTTING_DOWN');
  }, [clearSessionState]);

  const completeShutdown = useCallback(() => {
    clearSessionState();
    setBootState('POWERED_OFF');
  }, [clearSessionState]);

  const powerOn = useCallback(() => {
    // A real power-on starts a fresh OS session. Do not bypass login using
    // stale localStorage authentication from the previous powered-off session.
    clearSessionState();
    if (typeof window !== 'undefined') sessionStorage.setItem('orion_os_power_state', 'ON');
    setBootState('SYSTEM_INITIALIZING');
  }, [clearSessionState]);

  const triggerLock = useCallback(() => {
    setBootState('LOCKED');
  }, []);

  const unlock = useCallback(() => {
    setBootState('READY');
  }, []);

  const triggerSleep = useCallback(() => {
    setBootState('SLEEPING');
  }, []);

  const wake = useCallback(() => {
    setBootState('READY');
  }, []);

  const isAdmin = role === 'platform_admin' || 
                  role === 'organization_admin' || 
                  state.profile?.role === 'platform_admin' || 
                  state.profile?.role === 'organization_admin';

  const currentUser = state.profile;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        currentUser,
        role,
        isAdmin,
        bootState,
        isInitializing,
        isFadingOut,
        isPostLoginInitializing,
        postLoginDestination,
        startPostLoginInitialization,
        completePostLoginInitialization,
        completeSystemInitialization,
        hasPermission,
        hasRole,
        signIn,
        login,
        signUp,
        signOut,
        logout,
        resetPassword,
        refreshSession,
        triggerRestart,
        triggerLock,
        triggerSleep,
        triggerShutdown,
        completeShutdown,
        unlock,
        wake,
        powerOn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
