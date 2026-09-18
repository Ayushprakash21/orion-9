import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SessionState, PermissionCode, RoleCode, UserProfile, Organization, AuthUser, PrivilegedAdminSession } from '../types/auth';
import { authService, AuthSessionDetails } from '../services/authService';
import { userService } from '../services/userService';
import { privilegedSessionManager } from '../kernel/security/privilegedSession';

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
  privilegedSession: PrivilegedAdminSession | null;
  requestAdminStepUp: (password: string) => Promise<PrivilegedAdminSession>;
  revokeAdminStepUp: () => void;
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
  privilegedSession: null,
  requestAdminStepUp: async () => ({} as PrivilegedAdminSession),
  revokeAdminStepUp: () => {},
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
  // ORION OS boot state (preserves active power-on state and session across navigations)
  const [bootState, setBootState] = useState<BootState>(() => {
    if (typeof window !== 'undefined') {
      const powerState = sessionStorage.getItem('orion_os_power_state');
      const hasAuth = localStorage.getItem('orion_auth_session');
      if (powerState === 'ON' || hasAuth) {
        return hasAuth ? 'READY' : 'LOGIN_REQUIRED';
      }
    }
    return 'POWERED_OFF';
  });

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

  const [privilegedSession, setPrivilegedSession] = useState<PrivilegedAdminSession | null>(() => {
    return privilegedSessionManager.getSession();
  });

  useEffect(() => {
    return privilegedSessionManager.subscribe(s => {
      setPrivilegedSession(s);
    });
  }, []);

  const requestAdminStepUp = useCallback(async (password: string): Promise<PrivilegedAdminSession> => {
    if (!state.profile?.id) throw new Error('No active authenticated user identity found');
    const session = await authService.requestAdminStepUp(state.profile.id, password);
    setPrivilegedSession(session);
    return session;
  }, [state.profile?.id]);

  const revokeAdminStepUp = useCallback(() => {
    privilegedSessionManager.revoke('Step-up manually revoked');
    setPrivilegedSession(null);
  }, []);

  const login = async (identifier: string, passwordString: string, options?: LoginOptions): Promise<UserProfile> => {
    setBootState('AUTHENTICATING');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (!identifier || !identifier.trim()) {
        throw new Error('Enter your username or email.');
      }
      if (!passwordString || !passwordString.trim()) {
        throw new Error('Enter your password.');
      }

      // Authoritative authentication via authService (no bypasses, no plaintext storage)
      const details = await authService.authenticate(identifier, passwordString);

      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const userRole = details.role;
        const hasRequiredRole = options.requiredRoles.includes(userRole);
        if (!hasRequiredRole) {
          throw new Error('Access denied. Administrator privileges required for platform control plane.');
        }
      }

      applySessionDetails(details);

      // Trigger authoritative post-login initialization
      if (!options?.skipPostLoginInit) {
        const defaultDest = '/';
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
        privilegedSession,
        requestAdminStepUp,
        revokeAdminStepUp,
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
