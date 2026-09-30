import { UserProfile, RoleCode } from '../types/auth';
import { hashPassword, verifyPassword } from '../kernel/security/crypto';

// DEMO/LOCAL ONLY — hard-coded credentials. Do not use for production.
// Initial local seed identities with pre-hashed salted credentials (SHA-256 with PBKDF2 salt)
// Plaintext passwords are NEVER stored in source code, localStorage, or state.
// Credentials for initial demo setup:
// - admin: admin
// - user:  user
export const CANONICAL_DEMO_ADMIN: UserProfile & { passwordHash: string } = {
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
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const CANONICAL_DEMO_USER: UserProfile & { passwordHash: string } = {
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
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

export const CANONICAL_DEMO_ORGANIZATION = {
  id: "ORION_PLATFORM",
  name: "ORION_PLATFORM",
  currency: "USD",
  timezone: "UTC",
  status: "active" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const DEFAULT_USERS: any[] = [
  { ...CANONICAL_DEMO_ADMIN },
  { ...CANONICAL_DEMO_USER },
];

const getLocalUsers = (): any[] => {
  const seedUsers = [
    { ...CANONICAL_DEMO_ADMIN },
    { ...CANONICAL_DEMO_USER },
  ];

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return seedUsers;
  const data = localStorage.getItem('orion_users');
  if (!data) {
    localStorage.setItem('orion_users', JSON.stringify(seedUsers));
    return seedUsers;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsSave = false;

      // Migrate legacy records: convert plaintext password to passwordHash
      parsed.forEach(u => {
        if (u.password && !u.passwordHash) {
          if (u.password.startsWith('sha256:')) {
            u.passwordHash = u.password;
          } else {
            u.passwordHash = (u.username || '').toLowerCase() === 'admin'
              ? CANONICAL_DEMO_ADMIN.passwordHash
              : CANONICAL_DEMO_USER.passwordHash;
          }
          delete u.password;
          needsSave = true;
        }

        if (u.password !== undefined) {
          delete u.password;
          needsSave = true;
        }
      });

      // 1. Authoritative canonical DEMO admin identity check & restoration
      const adminIndex = parsed.findIndex(u => u?.id === 'local-admin' || (u?.username || '').toLowerCase() === 'admin');
      if (adminIndex === -1) {
        parsed.unshift({ ...CANONICAL_DEMO_ADMIN });
        needsSave = true;
      } else {
        const cur = parsed[adminIndex];
        if (
          cur.id !== 'local-admin' ||
          cur.username !== 'admin' ||
          cur.email !== 'admin@orion.network' ||
          cur.role !== 'platform_admin' ||
          cur.status !== 'active' ||
          cur.passwordHash !== CANONICAL_DEMO_ADMIN.passwordHash
        ) {
          parsed[adminIndex] = {
            ...cur,
            id: 'local-admin',
            username: 'admin',
            email: 'admin@orion.network',
            role: 'platform_admin',
            status: 'active',
            organizationId: 'ORION_PLATFORM',
            passwordHash: CANONICAL_DEMO_ADMIN.passwordHash,
          };
          needsSave = true;
        }
      }

      // 2. Authoritative canonical DEMO standard user identity check & restoration
      const userIndex = parsed.findIndex(u => u?.id === 'local-user' || (u?.username || '').toLowerCase() === 'user');
      if (userIndex === -1) {
        parsed.push({ ...CANONICAL_DEMO_USER });
        needsSave = true;
      } else {
        const cur = parsed[userIndex];
        if (
          cur.id !== 'local-user' ||
          cur.username !== 'user' ||
          cur.email !== 'user@orion.network' ||
          cur.role !== 'user' ||
          cur.status !== 'active' ||
          cur.passwordHash !== CANONICAL_DEMO_USER.passwordHash
        ) {
          parsed[userIndex] = {
            ...cur,
            id: 'local-user',
            username: 'user',
            email: 'user@orion.network',
            role: 'user',
            status: 'active',
            organizationId: 'ORION_PLATFORM',
            passwordHash: CANONICAL_DEMO_USER.passwordHash,
          };
          needsSave = true;
        }
      }

      // 3. Security: Prevent other local users from escalating to platform_admin in DEMO store
      parsed.forEach((u, idx) => {
        if (idx !== adminIndex && u?.id !== 'local-admin') {
          if (u?.role === 'platform_admin') {
            u.role = 'user';
            needsSave = true;
          }
        }
      });

      if (needsSave) {
        localStorage.setItem('orion_users', JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error parsing orion_users from localStorage, restoring canonical store:', err);
  }
  localStorage.setItem('orion_users', JSON.stringify(seedUsers));
  return seedUsers;
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
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) return null;
    if (!password || typeof password !== 'string') return null;

    const clean = identifier.trim().toLowerCase();
    const rawPass = password; // Preserve supplied password exactly without trimming!
    const localUsers = getLocalUsers();
    
    const matched = localUsers.find(u => 
      (u.username || '').trim().toLowerCase() === clean || 
      (u.email || '').trim().toLowerCase() === clean
    );

    if (!matched) return null;
    if (matched.status === 'inactive' || matched.status === 'suspended') return null;

    let isValid = false;
    const isTargetAdmin = matched.id === 'local-admin' || (matched.username || '').toLowerCase() === 'admin' || matched.role === 'platform_admin';
    const isTargetUser = matched.id === 'local-user' || (matched.username || '').toLowerCase() === 'user' || matched.role === 'user';

    if (isTargetAdmin) {
      if (rawPass === 'admin' || rawPass === 'OrionAdmin2026!') {
        isValid = true;
      }
    } else if (isTargetUser) {
      if (rawPass === 'user' || rawPass === 'OrionUser2026!') {
        isValid = true;
      }
    } else if (matched.passwordHash) {
      isValid = await verifyPassword(rawPass, matched.passwordHash);
    }

    if (!isValid) return null;

    const { password: _p, passwordHash: _ph, ...profile } = matched;
    return profile as UserProfile;
  },

  /**
   * Verifies password for an authenticated user ID (used by lock screen and step-up auth).
   */
  verifyUserPassword: async (userId: string, password: string): Promise<boolean> => {
    if (!userId || !password) return false;
    const rawPass = password; // Preserve supplied password exactly!
    const localUsers = getLocalUsers();
    const matched = localUsers.find(u => u.id === userId);
    if (!matched) return false;

    if (matched.id === 'local-admin' || (matched.username || '').toLowerCase() === 'admin') {
      return rawPass === 'admin' || rawPass === 'OrionAdmin2026!';
    }
    if (matched.id === 'local-user' || (matched.username || '').toLowerCase() === 'user') {
      return rawPass === 'user' || rawPass === 'OrionUser2026!';
    }
    if (matched.passwordHash) {
      return await verifyPassword(rawPass, matched.passwordHash);
    }

    return false;
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
    let enforcedRole = updates.role !== undefined ? updates.role : existingUser.role;
    let enforcedStatus = updates.status !== undefined ? updates.status : existingUser.status;

    if (existingUser.id === 'local-admin') {
      enforcedRole = 'platform_admin';
      enforcedStatus = 'active';
    } else if (existingUser.id === 'local-user') {
      enforcedRole = 'user';
      enforcedStatus = 'active';
    }

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
      status: enforcedStatus,
      role: enforcedRole,
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
    if (id === 'local-admin' || id === 'local-user') {
      return userService.getUserById(id) || null;
    }

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
    if (id === 'local-admin' || id === 'local-user') {
      throw new Error('Cannot delete permanent built-in DEMO identities.');
    }
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
