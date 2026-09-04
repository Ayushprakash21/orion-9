import { supabase } from '../lib/supabaseClient';
import { UserProfile, RoleCode } from '../types/auth';

// TEMPORARY LOCAL AUTH MODE — replace with Supabase/enterprise IdP before production.
// admin / admin is development-only and must be replaced before production deployment.

const DEFAULT_USERS: any[] = [
  {
    id: "local-admin",
    username: "admin",
    password: "admin", // TEMPORARY LOCAL AUTH MODE
    fullName: "Orion SCM OS Administrator",
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
  }
];

const getLocalUsers = (): any[] => {
  const data = localStorage.getItem('orion_users');
  if (!data) {
    localStorage.setItem('orion_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    console.warn('Error parsing orion_users from localStorage, resetting:', err);
    localStorage.setItem('orion_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
};

const saveLocalUsers = (users: any[]): void => {
  localStorage.setItem('orion_users', JSON.stringify(users));
};

export const userService = {
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
   * Gets a user profile by username from local storage.
   */
  getUserByUsername: (username: string): UserProfile | undefined => {
    if (!username) return undefined;
    const clean = username.trim().toLowerCase();
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => u.username.toLowerCase() === clean);
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
    
    const exists = localUsers.some(u => u.username.toLowerCase() === userData.username.trim().toLowerCase());
    if (exists) {
      throw new Error('Username already exists. Please choose another');
    }

    const newId = 'user-' + Math.random().toString(36).substr(2, 9);
    const newUser: any = {
      id: newId,
      username: userData.username.trim(),
      password: userData.password || 'admin', // TEMPORARY LOCAL AUTH MODE
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
      fullName: updates.fullName !== undefined ? updates.fullName : existingUser.fullName,
      displayName: updates.fullName !== undefined ? updates.fullName.split(' ')[0] : existingUser.displayName,
      username: updates.username !== undefined ? updates.username : existingUser.username,
      email: updates.email !== undefined ? updates.email : existingUser.email,
      phone: updates.phone !== undefined ? updates.phone : existingUser.phone,
      status: updates.status !== undefined ? (updates.status === 'suspended' ? 'inactive' : updates.status) : existingUser.status,
      role: updates.role !== undefined ? updates.role : existingUser.role,
      organizationId: updates.organizationId !== undefined ? updates.organizationId : existingUser.organizationId,
      organizationName: updates.organizationName !== undefined ? updates.organizationName : existingUser.organizationName,
      jobTitle: updates.jobTitle !== undefined ? updates.jobTitle : existingUser.jobTitle,
      department: updates.department !== undefined ? updates.department : existingUser.department,
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

    localUsers[userIndex].password = passwordString;
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
    const merged = localUsers.map(lu => {
      const match = updatedUsers.find(u => u.id === lu.id);
      if (match) {
        return {
          ...lu,
          ...match
        };
      }
      return lu;
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
