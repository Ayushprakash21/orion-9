import { UserProfile, BrandingConfig } from '../types/auth';
import { userService } from './userService';
import { brandingRepository } from '../repositories/BrandingRepository';

const SESSION_KEY = 'orion9_session';

/**
 * StorageService provides backward compatibility while delegating
 * directly to the single source of truth services (userService, brandingRepository).
 */
export const storageService = {
  getUsers: (): UserProfile[] => {
    return userService.getUsers();
  },

  saveUsers: (users: UserProfile[]) => {
    userService.saveUsers(users);
  },

  addUser: async (user: any): Promise<UserProfile> => {
    return userService.createUser(user);
  },

  updateUser: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    return userService.updateUser(id, updates);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    return userService.deleteUser(id);
  },

  getBranding: (): BrandingConfig => {
    return brandingRepository.getBrandingSync();
  },

  saveBranding: (_config: Partial<BrandingConfig>): BrandingConfig => {
    return brandingRepository.getBrandingSync();
  },

  getAdminCredentials: () => {
    const admin = userService.getUserByUsername('admin') || userService.getUsers().find(u => u.role === 'platform_admin');
    return {
      adminId: admin?.username || 'admin',
      email: admin?.email || 'ayush@orion.com',
    };
  },

  saveAdminCredentials: async (adminId: string, password: string) => {
    const admin = userService.getUserByUsername('admin') || userService.getUsers().find(u => u.role === 'platform_admin');
    if (admin) {
      await userService.updateUser(admin.id, {
        username: adminId.trim(),
      });
      if (password) {
        await userService.resetPassword(admin.id, password);
      }
    }
  },

  getSession: (): { type: 'admin' | 'user'; userId: string; identifier: string } | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.userId) return null;
      return {
        type: parsed.role === 'platform_admin' || parsed.type === 'admin' ? 'admin' : 'user',
        userId: parsed.userId,
        identifier: parsed.username || parsed.identifier || 'admin'
      };
    } catch {
      return null;
    }
  },

  setSession: (session: { type: 'admin' | 'user'; userId: string; identifier: string }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...session,
        role: session.type === 'admin' ? 'platform_admin' : 'user',
        username: session.identifier,
        timestamp: new Date().toISOString()
      }));
    }
  },

  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('orion9_admin_session');
      localStorage.removeItem('orion9_user_session');
      localStorage.removeItem('demo_session');
    }
  }
};
