import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SessionState, PermissionCode, RoleCode, UserProfile, Organization, AuthUser } from '../types/auth';
import { authService, AuthSessionDetails } from '../services/authService';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType extends SessionState {
  currentUser: UserProfile | null;
  role: RoleCode | null;
  isAdmin: boolean;
  isInitializing: boolean;
  isFadingOut: boolean;
  hasPermission: (permission: PermissionCode) => boolean;
  hasRole: (roles: RoleCode[]) => boolean;
  signIn: (identifier: string, password: string) => Promise<UserProfile>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
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
  isInitializing: true,
  isFadingOut: false,
  hasPermission: () => false,
  hasRole: () => false,
  signIn: async () => ({} as UserProfile),
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SessionState>(defaultState);
  const [role, setRole] = useState<RoleCode | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

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

  // Startup splash lifecycle: Guarantees LoadingScreen is authoritative on start and refresh
  useEffect(() => {
    let mounted = true;
    let fadeTimer: any = null;
    let finishTimer: any = null;

    const startup = async () => {
      const startTime = Date.now();
      try {
        const session = await authService.getSession();
        if (session?.user) {
          const details = await authService.loadFullSession(session.user.id, session.user.email);
          if (mounted) {
            applySessionDetails(details);
          }
        } else {
          if (mounted) {
            clearSessionState();
          }
        }
      } catch (err) {
        console.warn('Startup session restore error:', err);
        if (mounted) {
          clearSessionState();
        }
      } finally {
        if (!mounted) return;
        const elapsed = Date.now() - startTime;
        // Minimum 1.4s display to ensure visual stability and brand compliance
        const delay = Math.max(1400 - elapsed, 50);

        fadeTimer = setTimeout(() => {
          if (!mounted) return;
          setIsFadingOut(true);

          finishTimer = setTimeout(() => {
            if (!mounted) return;
            setIsInitializing(false);
            setIsFadingOut(false);
          }, 300);
        }, delay);
      }
    };

    startup();

    return () => {
      mounted = false;
      if (fadeTimer) clearTimeout(fadeTimer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [applySessionDetails, clearSessionState]);

  const hasPermission = useCallback((permission: PermissionCode) => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const hasRole = useCallback((roles: RoleCode[]) => {
    if (!role && !state.profile?.role) return false;
    const currentRole = role || state.profile?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }, [role, state.profile?.role]);

  const signIn = async (identifier: string, password: string): Promise<UserProfile> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const details = await authService.authenticate(identifier, password);
      applySessionDetails(details);
      return details.profile;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || 'Invalid credentials' }));
      throw err;
    }
  };

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
    }
  };

  // Authoritative admin validation: Based strictly on database role model
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
        isInitializing,
        isFadingOut,
        hasPermission,
        hasRole,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
