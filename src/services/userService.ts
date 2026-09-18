import { UserProfile, RoleCode } from '../types/auth';
import { hashPassword } from '../kernel/security/crypto';

// TEMPORARY LOCAL AUTH MODE — replace with Supabase/enterprise IdP before production.
// admin / admin is development-only and must be replaced before production deployment.

const DEFAULT_USERS: any[] = [
  {
    id: "local-admin",
    username: "admin",
    password: "admin", // TEMPORARY LOCAL AUTH MODE
    fullName: "Orion-9 Administrator",
    displayName: "Admin",
    email: "admin@orion.local",
    role: "platform_admin",
    status: "active",
    organizationId: "ORION_PLATFORM",
    organizationName: "ORION_PLATFORM",
    onboardingCompleted: true,
    jobTitle: "Platform Director",
    department: "IT Administration",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "local-user",
    username: "user",
    password: "user",
    fullName: "Orion-9 User",
    displayName: "User",
    email: "user@orion.local",
    role: "user",
    status: "active",
    organizationId: "ORION_PLATFORM",
    organizationName: "ORION_PLATFORM",
    onboardingCompleted: true,
    jobTitle: "Supply Chain Specialist",
    department: "Operations",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const getLocalUsers = (): any[] => {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const data = localStorage.getItem('orion_users');
  if (!data) {
    localStorage.setItem('orion_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsSave = false;

      // Ensure the default admin always exists
      const adminIndex = parsed.findIndex(u => (u.username || '').toLowerCase() === 'admin');
      if (adminIndex === -1) {
        parsed.unshift(DEFAULT_USERS[0]);
        needsSave = true;
      } else {
        // Keep the built-in platform administrator deterministic for the local
        // demo/office submission environment.
        if (parsed[adminIndex].password !== 'admin') {
          parsed[adminIndex].password = 'admin';
          needsSave = true;
        }
        if (parsed[adminIndex].status !== 'active') {
          parsed[adminIndex].status = 'active';
          needsSave = true;
        }
        if (parsed[adminIndex].role !== 'platform_admin') {
          parsed[adminIndex].role = 'platform_admin';
          needsSave = true;
        }
        if (!parsed[adminIndex].email) {
          parsed[adminIndex].email = 'admin@orion.local';
          needsSave = true;
        }
      }

      // Ensure the default user always exists
      const userIndex = parsed.findIndex(u => (u.username || '').toLowerCase() === 'user');
      if (userIndex === -1) {
        parsed.push(DEFAULT_USERS[1]);
        needsSave = true;
      } else {
        // The built-in demo/operator account is intentionally deterministic so
        // the office demo login always works after refresh or an older build
        // has left a stale user record in localStorage.
        if (parsed[userIndex].password !== 'user') {
          parsed[userIndex].password = 'user';
          needsSave = true;
        }
        if (parsed[userIndex].status !== 'active') {
          parsed[userIndex].status = 'active';
          needsSave = true;
        }
        if (parsed[userIndex].role !== 'user') {
          parsed[userIndex].role = 'user';
          needsSave = true;
        }
        if (!parsed[userIndex].email) {
          parsed[userIndex].email = 'user@orion.local';
          needsSave = true;
        }
      }

      // Ensure all users have a fallback password in local auth mode if missing
      parsed.forEach(u => {
        if (!u.password) {
          u.password = (u.username || '').toLowerCase() === 'admin' ? 'admin' : 'user';
          needsSave = true;
        }
      });

      if (needsSave) {
        localStorage.setItem('orion_users', JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error parsing orion_users from localStorage, resetting:', err);
  }
  localStorage.setItem('orion_users', JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

const saveLocalUsers = (users: any[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orion_users', JSON.stringify(users));
  }
};

export const userService = {
  /**
   * Retrieves raw user records including passwords from single source of truth ('orion_users').
   */
  getRawUsers: (): any[] => {
    return getLocalUsers();
  },

  /**
   * Local user retrieval replacing database queries
   */
  fetchUsersAsync: async (): Promise<UserProfile[]> => {
    const localUsers = getLocalUsers();
    return localUsers.map(({ password, ...u }) => u as UserProfile);
  },

  /**
   * Synchronous getter returning local users.
   */
  getUsers: (): UserProfile[] => {
    const localUsers = getLocalUsers();
    return localUsers.map(({ password, ...u }) => u as UserProfile);
  },

  /**
   * Gets a user profile by ID from cache or local storage.
   */
  getUserById: (id: string): UserProfile | undefined => {
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => u.id === id);
    if (!user) return undefined;
    const { password, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Gets a user profile by username from local storage (case-insensitive).
   */
  getUserByUsername: (username: string): UserProfile | undefined => {
    if (!username) return undefined;
    const clean = username.trim().toLowerCase();
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => (u.username || '').trim().toLowerCase() === clean);
    if (!user) return undefined;
    const { password, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Gets a user profile by email from local storage (case-insensitive).
   */
  getUserByEmail: (email: string): UserProfile | undefined => {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => (u.email || '').trim().toLowerCase() === clean);
    if (!user) return undefined;
    const { password, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Gets a user profile by username or email from local storage (case-insensitive).
   */
  getUserByIdentifier: (identifier: string): UserProfile | undefined => {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => 
      (u.username || '').trim().toLowerCase() === clean || 
      (u.email || '').trim().toLowerCase() === clean
    );
    if (!user) return undefined;
    const { password, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Creates a user locally.
   */
  createUser: async (userData: {
    fullName: string;
    displayName?: string;
    username: string;
    password?: string;
    email: string;
    jobTitle?: string;
    department?: string;
    role: RoleCode;
    organizationId: string;
    organizationName?: string;
    status?: 'active' | 'inactive';
  }): Promise<UserProfile> => {
    const localUsers = getLocalUsers();
    
    const cleanUsername = userData.username.trim().toLowerCase();
    const exists = localUsers.some(u => (u.username || '').trim().toLowerCase() === cleanUsername);
    if (exists) {
      throw new Error('Username already exists. Please choose another');
    }

    const cleanEmail = userData.email.trim().toLowerCase();
    const emailExists = localUsers.some(u => (u.email || '').trim().toLowerCase() === cleanEmail);
    if (emailExists) {
      throw new Error('A user with this email address already exists.');
    }

    const newId = 'user-' + Math.random().toString(36).substr(2, 9);
    const passwordHash = await hashPassword(userData.password || 'admin');
    const newUser: any = {
      id: newId,
      username: userData.username.trim(),
      password: passwordHash,
      email: userData.email.trim(),
      fullName: userData.fullName.trim(),
      displayName: userData.displayName || userData.fullName.trim().split(' ')[0],
      jobTitle: userData.jobTitle || 'Supply Chain Specialist',
      department: userData.department || 'Operations',
      role: userData.role,
      organizationId: userData.organizationId || 'ORION_PLATFORM',
      organizationName: userData.organizationName || 'ORION_PLATFORM',
      status: userData.status || 'active',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    const { password, ...profile } = newUser;
    return profile as UserProfile;
  },

  addUser: (userData: any): Promise<UserProfile> => {
    return userService.createUser(userData);
  },

  /**
   * Updates user profile in local storage.
   */
  updateUser: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    const localUsers = getLocalUsers();
    const userIndex = localUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const existingUser = localUsers[userIndex];
    const updatedUser = {
      ...existingUser,
      // User-editable profile fields.
      fullName: updates.fullName !== undefined ? updates.fullName : existingUser.fullName,
      displayName: updates.displayName !== undefined
        ? updates.displayName
        : (updates.fullName !== undefined ? updates.fullName.split(' ')[0] : existingUser.displayName),
      phone: updates.phone !== undefined ? updates.phone : existingUser.phone,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : existingUser.avatarUrl,
      jobTitle: updates.jobTitle !== undefined ? updates.jobTitle : existingUser.jobTitle,
      department: updates.department !== undefined ? updates.department : existingUser.department,
      // Profile label only. The organization assignment/ID remains administrator-controlled.
      organizationName: updates.organizationName !== undefined ? updates.organizationName : existingUser.organizationName,
      // Protected identity/access fields are deliberately NOT writable from a profile edit.
      username: existingUser.username,
      email: existingUser.email,
      role: existingUser.role,
      organizationId: existingUser.organizationId,
      status: existingUser.status,
      updatedAt: new Date().toISOString(),
    };

    localUsers[userIndex] = updatedUser;
    saveLocalUsers(localUsers);

    const { password, ...profile } = updatedUser;
    return profile as UserProfile;
  },

  /**
   * Resets a user password locally.
   */
  resetPassword: async (id: string, passwordString: string): Promise<boolean> => {
    const localUsers = getLocalUsers();
    const userIndex = localUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const passwordHash = await hashPassword(passwordString);
    localUsers[userIndex].password = passwordHash;
    localUsers[userIndex].updatedAt = new Date().toISOString();
    saveLocalUsers(localUsers);
    return true;
  },

  /**
   * Toggles or sets user status in local storage.
   */
  setUserStatus: async (id: string, status: 'active' | 'inactive'): Promise<UserProfile | null> => {
    const localUsers = getLocalUsers();
    const userIndex = localUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    localUsers[userIndex].status = status;
    localUsers[userIndex].updatedAt = new Date().toISOString();
    saveLocalUsers(localUsers);

    const { password, ...profile } = localUsers[userIndex];
    return profile as UserProfile;
  },

  /**
   * Deletes a user locally.
   */
  deleteUser: async (id: string): Promise<boolean> => {
    const localUsers = getLocalUsers();
    const filtered = localUsers.filter(u => u.id !== id);
    saveLocalUsers(filtered);
    return true;
  },

  assignUserToOrganization: async (userId: string, orgId: string): Promise<boolean> => {
    const localUsers = getLocalUsers();
    const userIndex = localUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    localUsers[userIndex].organizationId = orgId;
    localUsers[userIndex].updatedAt = new Date().toISOString();
    saveLocalUsers(localUsers);
    return true;
  },

  saveUsers: (updatedUsers: UserProfile[]): void => {
    const localUsers = getLocalUsers();
    const existingMap = new Map<string, any>();
    localUsers.forEach(u => existingMap.set(u.id, u));

    const merged = updatedUsers.map(u => {
      const existing = existingMap.get(u.id);
      return {
        ...(existing || {}),
        ...u,
        password: (u as any).password || existing?.password || 'admin',
      };
    });
    saveLocalUsers(merged);
  }
};

export const getUsers = userService.getUsers;
export const createUser = userService.createUser;
export const addUser = userService.addUser;
export const updateUser = userService.updateUser;
export const deleteUser = userService.deleteUser;
export const assignUserToOrganization = userService.assignUserToOrganization;
