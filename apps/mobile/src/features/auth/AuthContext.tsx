/**
 * ORION-9 AUTH CONTEXT
 * Provides enterprise identity, session restoration, and role verification to the mobile application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MobileAuthSession, RoleCode, AuthState } from '../../types';
import { auth } from '../../services/auth';

interface AuthContextType extends AuthState {
  signIn: (identifier: string, passwordString: string) => Promise<void>;
  signOut: () => Promise<void>;
  setEnvironment: (env: 'DEMO' | 'LIVE') => Promise<void>;
  toggleBiometrics: () => Promise<void>;
  hasRole: (roles: RoleCode[]) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    error: null,
    biometricsEnabled: false,
    environment: 'DEMO',
  });

  const loadSession = useCallback(async () => {
    try {
      const [session, env] = await Promise.all([
        auth.getSession(),
        auth.getEnvironment(),
      ]);

      setState(prev => ({
        ...prev,
        isAuthenticated: !!session,
        session,
        environment: env,
        isLoading: false,
      }));
    } catch (e: any) {
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        session: null,
        isLoading: false,
        error: e.message || 'Failed to restore session',
      }));
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signIn = async (identifier: string, passwordString: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const session = await auth.signIn(identifier, passwordString);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        session,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Sign in failed',
      }));
      throw err;
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await auth.signOut();
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      session: null,
      isLoading: false,
      error: null,
    }));
  };

  const setEnvironment = async (env: 'DEMO' | 'LIVE') => {
    await auth.setEnvironment(env);
    await auth.signOut();
    setState(prev => ({
      ...prev,
      environment: env,
      isAuthenticated: false,
      session: null,
    }));
  };

  const toggleBiometrics = async () => {
    setState(prev => ({ ...prev, biometricsEnabled: !prev.biometricsEnabled }));
  };

  const hasRole = (roles: RoleCode[]): boolean => {
    if (!state.session?.user) return false;
    if (state.session.user.role === 'platform_admin') return true;
    return roles.includes(state.session.user.role);
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        setEnvironment,
        toggleBiometrics,
        hasRole,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
