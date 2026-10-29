/**
 * ORION-9 AUTHENTICATION & SECURITY SERVICE
 * Governed enterprise session engine supporting DEMO simulation & LIVE production authentication.
 */

import { MobileAuthSession, MobileUserProfile } from '../../types';
import { storage } from '../../storage';
import { api } from '../api';

const SESSION_STORAGE_KEY = 'orion_auth_session';
const ENVIRONMENT_KEY = 'orion_environment';

export const CANONICAL_DEMO_ADMIN: MobileUserProfile = {
  id: 'usr-admin-v2',
  username: 'admin',
  email: 'admin@orion.network',
  fullName: 'Platform Admin',
  role: 'platform_admin',
  organizationId: 'org-global-corp',
  organizationName: 'Global Autonomous Supply Chain Network',
  jobTitle: 'Chief Supply Chain Technologist',
  department: 'Autonomous Operations',
  status: 'active',
};

export const CANONICAL_DEMO_USER: MobileUserProfile = {
  id: 'usr-user-v2',
  username: 'user',
  email: 'user@orion.network',
  fullName: 'Elena Rostova',
  role: 'user',
  organizationId: 'org-global-corp',
  organizationName: 'Global Autonomous Supply Chain Network',
  jobTitle: 'Supply Chain Operations Specialist',
  department: 'Operations',
  status: 'active',
};

export const auth = {
  async getEnvironment(): Promise<'DEMO' | 'LIVE'> {
    const saved = await storage.getItem(ENVIRONMENT_KEY);
    return saved === 'LIVE' ? 'LIVE' : 'DEMO';
  },

  async setEnvironment(env: 'DEMO' | 'LIVE'): Promise<void> {
    const current = await this.getEnvironment();
    if (current !== env) {
      await this.signOut();
      await storage.setItem(ENVIRONMENT_KEY, env);
    }
  },

  async getSession(): Promise<MobileAuthSession | null> {
    const session = await storage.getJson<MobileAuthSession>(SESSION_STORAGE_KEY);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.signOut();
      return null;
    }

    const activeEnv = await this.getEnvironment();
    if (session.environment !== activeEnv) {
      await this.signOut();
      return null;
    }

    return session;
  },

  async signIn(identifier: string, passwordString: string): Promise<MobileAuthSession> {
    const cleanId = (identifier || '').trim().toLowerCase();
    const rawPass = passwordString || '';
    const activeEnv = await this.getEnvironment();

    if (!cleanId) {
      throw new Error('Enter your username or email address.');
    }
    if (!rawPass) {
      throw new Error('Enter your password.');
    }

    // 1. LIVE Environment Protection: Reject demo credentials & connect to live backend
    if (activeEnv === 'LIVE') {
      if (
        (cleanId === 'admin' || cleanId === 'admin@orion.network') &&
        (rawPass === 'admin' || rawPass === 'OrionAdmin2026!' || rawPass === 'demo123')
      ) {
        throw new Error('Demo credentials are strictly prohibited in the LIVE environment.');
      }
      if (
        (cleanId === 'user' || cleanId === 'user@orion.network') &&
        (rawPass === 'user' || rawPass === 'OrionUser2026!' || rawPass === 'demo123')
      ) {
        throw new Error('Demo credentials are strictly prohibited in the LIVE environment.');
      }

      // Live authentication via server API
      try {
        const res = await api.post<{
          success: boolean;
          session?: MobileAuthSession;
          token?: string;
          user?: MobileUserProfile;
          expiresAt?: string;
          error?: string;
        }>(
          '/api/auth/login',
          { identifier: cleanId, password: rawPass },
          { skipAuth: true }
        );

        if (!res) {
          throw new Error('Authentication failed: no response from server.');
        }

        if (res.session && res.session.token && res.session.user) {
          await storage.setJson(SESSION_STORAGE_KEY, res.session);
          return res.session;
        }

        if (res.token && res.user) {
          const liveSession: MobileAuthSession = {
            token: res.token,
            user: res.user,
            environment: 'LIVE',
            expiresAt: res.expiresAt || new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
          };
          await storage.setJson(SESSION_STORAGE_KEY, liveSession);
          return liveSession;
        }

        throw new Error(res.error || 'Authentication failed. Please verify your credentials.');
      } catch (err: any) {
        throw new Error(err.message || 'Authentication failed. Please verify your credentials.');
      }
    }

    // 2. DEMO Environment Authentication (Deterministic, Offline-Capable, Zero Firebase Dependency)
    const isDemoAdmin = cleanId === 'admin' || cleanId === 'admin@orion.network';
    const isDemoUser = cleanId === 'user' || cleanId === 'user@orion.network';

    if (isDemoAdmin) {
      if (rawPass !== 'admin' && rawPass !== 'OrionAdmin2026!' && rawPass !== 'demo123') {
        throw new Error('Invalid demo credentials');
      }

      const session: MobileAuthSession = {
        token: `orion_sess:DEMO:admin:platform_admin:${Date.now() + 12 * 3600 * 1000}:sig_demo_admin`,
        user: CANONICAL_DEMO_ADMIN,
        environment: 'DEMO',
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      };

      await storage.setJson(SESSION_STORAGE_KEY, session);
      return session;
    }

    if (isDemoUser) {
      if (rawPass !== 'user' && rawPass !== 'OrionUser2026!' && rawPass !== 'demo123') {
        throw new Error('Invalid demo credentials');
      }

      const session: MobileAuthSession = {
        token: `orion_sess:DEMO:user:user:${Date.now() + 12 * 3600 * 1000}:sig_demo_user`,
        user: CANONICAL_DEMO_USER,
        environment: 'DEMO',
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      };

      await storage.setJson(SESSION_STORAGE_KEY, session);
      return session;
    }

    throw new Error('Invalid demo credentials');
  },

  async signOut(): Promise<void> {
    await storage.removeItem(SESSION_STORAGE_KEY);
  },
};
