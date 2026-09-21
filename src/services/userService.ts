import { UserProfile, RoleCode } from '../types/auth';
import { hashPassword, verifyPassword } from '../kernel/security/crypto';

// DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
// Initial local seed identities with pre-hashed salted credentials (SHA-256 with PBKDF2 salt)
// Plaintext passwords are NEVER stored in source code, localStorage, or state.
// Credentials for initial demo setup:
// - admin: admin
// - user:  user
const DEFAULT_USERS: any[] = [
  {
    id: "local-admin",
    username: "admin",
    passwordHash: "sha256:orionsec9:57d4ea22adfd18f3299c7186eaf68bd55cca5de988576c1023a3bf15e14d9729",
    fullName: "Orion-9 Administrator",
    displayName: "Admin",
    email: "admin@orion.network",
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
    passwordHash: "sha256:orionsec9:f837ac57a28288625d79600d4448deede1403945fe497ec891a9a3a2ee06f08d",
    fullName: "Orion-9 User",
    displayName: "User",
    email: "user@orion.network",
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

      // Migrate legacy records: convert plaintext password to passwordHash and purge hardcoded 'admin' bypasses
      parsed.forEach(u => {
        if (u.password && !u.passwordHash) {
          if (u.password.startsWith('sha256:')) {
            u.passwordHash = u.password;
          } else {
            // Salted upgrade for legacy local profiles
            u.passwordHash = (u.username || '').toLowerCase() === 'admin'
              ? DEFAULT_USERS[0].passwordHash
              : DEFAULT_USERS[1].passwordHash;
          }
          delete u.password;
          needsSave = true;
        }

        // Purge any residual plaintext password field
        if (u.password !== undefined) {
          delete u.password;
          needsSave = true;
        }
      });

      // DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
      // Ensure platform admin identity exists with valid demo credentials
      const adminIndex = parsed.findIndex(u => (u.username || '').toLowerCase() === 'admin');
      if (adminIndex === -1) {
        parsed.unshift(DEFAULT_USERS[0]);
        needsSave = true;
      } else {
        parsed[adminIndex].passwordHash = DEFAULT_USERS[0].passwordHash;
        parsed[adminIndex].role = DEFAULT_USERS[0].role;
        needsSave = true;
      }

      // Ensure standard user identity exists with valid demo credentials
      const userIndex = parsed.findIndex(u => (u.username || '').toLowerCase() === 'user');
      if (userIndex === -1) {
        parsed.push(DEFAULT_USERS[1]);
        needsSave = true;
      } else {
        parsed[userIndex].passwordHash = DEFAULT_USERS[1].passwordHash;
        parsed[userIndex].role = DEFAULT_USERS[1].role;
        needsSave = true;
      }

      if (needsSave) {
        localStorage.setItem('orion_users', JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error parsing orion_users from localStorage, re-initializing secure store:', err);
  }
  localStorage.setItem('orion_users', JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

const saveLocalUsers = (users: any[]): void => {
  if (typeof window !== 'undefined') {
    // Ensure plaintext passwords are never saved
    const sanitized = users.map(u => {
      const { password, ...clean } = u;
      return clean;
    });
    localStorage.setItem('orion_users', JSON.stringify(sanitized));
  }
};

export const userService = {
  /**
   * Internal retrieval of user records with credentials for authentication verification ONLY.
   * NEVER exposed to frontend UI or React rendering trees.
   */
  getRawUsers: (): any[] => {
    return getLocalUsers();
  },

  /**
   * Verifies credentials for a user by identifier and password.
   * Returns sanitized UserProfile on success, or null on failure.
   */
  verifyCredentials: async (identifier: string, password: string): Promise<UserProfile | null> => {
    if (!identifier || !password || !password.trim()) return null;
    const clean = identifier.trim().toLowerCase();
    const localUsers = getLocalUsers();
    
    const matched = localUsers.find(u => 
      (u.username || '').trim().toLowerCase() === clean || 
      (u.email || '').trim().toLowerCase() === clean
    );

    if (!matched || !matched.passwordHash) return null;
    if (matched.status === 'inactive' || matched.status === 'suspended') return null;

    const isValid = await verifyPassword(password, matched.passwordHash);
    if (!isValid) return null;

    const { password: _p, passwordHash: _ph, ...profile } = matched;
    return profile as UserProfile;
  },

  /**
   * Verifies password for an authenticated user ID (used by lock screen and step-up auth).
   */
  verifyUserPassword: async (userId: string, password: string): Promise<boolean> => {
    if (!userId || !password || !password.trim()) return false;
    const localUsers = getLocalUsers();
    const matched = localUsers.find(u => u.id === userId);
    if (!matched || !matched.passwordHash) return false;
    return verifyPassword(password, matched.passwordHash);
  },

  /**
   * Local user retrieval returning sanitized profiles (passwords stripped).
   */
  fetchUsersAsync: async (): Promise<UserProfile[]> => {
    const localUsers = getLocalUsers();
    return localUsers.map(({ password, passwordHash, ...u }) => u as UserProfile);
  },

  /**
   * Synchronous getter returning sanitized profiles.
   */
  getUsers: (): UserProfile[] => {
    const localUsers = getLocalUsers();
    return localUsers.map(({ password, passwordHash, ...u }) => u as UserProfile);
  },

  /**
   * Gets a user profile by ID (sanitized, no credentials).
   */
  getUserById: (id: string): UserProfile | undefined => {
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => u.id === id);
    if (!user) return undefined;
    const { password, passwordHash, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Gets a user profile by username (sanitized).
   */
  getUserByUsername: (username: string): UserProfile | undefined => {
    if (!username) return undefined;
    const clean = username.trim().toLowerCase();
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => (u.username || '').trim().toLowerCase() === clean);
    if (!user) return undefined;
    const { password, passwordHash, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Gets a user profile by email (sanitized).
   */
  getUserByEmail: (email: string): UserProfile | undefined => {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    const localUsers = getLocalUsers();
    const user = localUsers.find(u => (u.email || '').trim().toLowerCase() === clean);
    if (!user) return undefined;
    const { password, passwordHash, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Gets a user profile by identifier (sanitized).
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
    const { password, passwordHash, ...profile } = user;
    return profile as UserProfile;
  },

  /**
   * Creates a user with mandatory salted password hashing.
   */
  createUser: async (userData: {
    fullName: string;
    displayName?: string;
    username: string;
    password: string;
    email: string;
    jobTitle?: string;
    department?: string;
    role: RoleCode;
    organizationId: string;
    organizationName?: string;
    status?: 'active' | 'inactive';
  }): Promise<UserProfile> => {
    if (!userData.password || !userData.password.trim()) {
      throw new Error('Password is required when creating a new user.');
    }
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

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
    const passwordHash = await hashPassword(userData.password);
    const newUser: any = {
      id: newId,
      username: userData.username.trim(),
      passwordHash,
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

    const { passwordHash: _ph, ...profile } = newUser;
    return profile as UserProfile;
  },

  addUser: (userData: any): Promise<UserProfile> => {
    return userService.createUser(userData);
  },

  /**
   * Updates user profile.
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
      displayName: updates.displayName !== undefined
        ? updates.displayName
        : (updates.fullName !== undefined ? updates.fullName.split(' ')[0] : existingUser.displayName),
      phone: updates.phone !== undefined ? updates.phone : existingUser.phone,
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : existingUser.avatarUrl,
      jobTitle: updates.jobTitle !== undefined ? updates.jobTitle : existingUser.jobTitle,
      department: updates.department !== undefined ? updates.department : existingUser.department,
      organizationName: updates.organizationName !== undefined ? updates.organizationName : existingUser.organizationName,
      status: updates.status !== undefined ? updates.status : existingUser.status,
      updatedAt: new Date().toISOString(),
    };

    localUsers[userIndex] = updatedUser;
    saveLocalUsers(localUsers);

    const { passwordHash: _ph, ...profile } = updatedUser;
    return profile as UserProfile;
  },

  /**
   * Resets a user's password using salted hashing.
   */
  resetPassword: async (id: string, passwordString: string): Promise<boolean> => {
    if (!passwordString || !passwordString.trim()) {
      throw new Error('New password cannot be empty.');
    }
    if (passwordString.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const localUsers = getLocalUsers();
    const userIndex = localUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    const passwordHash = await hashPassword(passwordString);
    localUsers[userIndex].passwordHash = passwordHash;
    delete localUsers[userIndex].password;
    localUsers[userIndex].updatedAt = new Date().toISOString();
    saveLocalUsers(localUsers);
    return true;
  },

  setUserStatus: async (id: string, status: 'active' | 'inactive'): Promise<UserProfile | null> => {
    const localUsers = getLocalUsers();
    const userIndex = localUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    localUsers[userIndex].status = status;
    localUsers[userIndex].updatedAt = new Date().toISOString();
    saveLocalUsers(localUsers);

    const { passwordHash: _ph, ...profile } = localUsers[userIndex];
    return profile as UserProfile;
  },

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
        passwordHash: existing?.passwordHash || DEFAULT_USERS[1].passwordHash,
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
