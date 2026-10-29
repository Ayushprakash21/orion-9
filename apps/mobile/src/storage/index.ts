/**
 * ORION-9 SECURE STORAGE LAYER
 * Encrypted device-local keychain persistence via expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';

const memoryStore: Record<string, string> = {};

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;
    try {
      if (typeof SecureStore?.setItemAsync === 'function') {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
    } catch (e) {
      // In-memory fallback
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof SecureStore?.getItemAsync === 'function') {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null && val !== undefined) {
          memoryStore[key] = val;
          return val;
        }
      }
    } catch (e) {}
    return memoryStore[key] ?? null;
  },

  async removeItem(key: string): Promise<void> {
    delete memoryStore[key];
    try {
      if (typeof SecureStore?.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {}
  },

  async clear(): Promise<void> {
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
      try {
        if (typeof SecureStore?.deleteItemAsync === 'function') {
          await SecureStore.deleteItemAsync(key);
        }
      } catch (e) {}
    }
  },

  async setJson<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
};
