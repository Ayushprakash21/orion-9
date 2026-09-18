/**
 * Vitest global test setup.
 * Mocks browser-only APIs that the kernel uses but are not available in Node.
 */

import { vi } from 'vitest';

// Create a no-op localforage instance factory.
const makeNoopStore = () => ({
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  keys: vi.fn().mockResolvedValue([]),
  length: vi.fn().mockResolvedValue(0),
  iterate: vi.fn().mockResolvedValue(undefined),
});

// Mock the entire data/db module so kernel engines don't try to access IndexedDB.
vi.mock('../data/db', () => ({
  db: new Proxy({}, {
    get: () => makeNoopStore(),
  }),
  loadData: vi.fn().mockResolvedValue([]),
  saveData: vi.fn().mockResolvedValue(undefined),
}));

// Mock localforage to suppress module-level initialization errors.
vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    createInstance: vi.fn(() => makeNoopStore()),
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
  },
}));

// Suppress Supabase network calls — always return null (local fallback mode).
vi.mock('../lib/supabaseClient', () => ({
  getSupabase: vi.fn().mockReturnValue(null),
}));
