import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

// 1. Unencrypted Fast Storage (Preferences, cached generic data)
// MMKV requires native bindings (NitroModules) which are not available in Expo Go.
// We attempt to load it, and fall back to an in-memory Map if it fails.

let mmkvInstance: {
  set: (k: string, v: string) => void;
  getString: (k: string) => string | undefined;
  remove: (k: string) => void;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv');
  mmkvInstance = createMMKV();
} catch {
  // Native MMKV unavailable (e.g. Expo Go). Data will not persist across reloads.
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️ MMKV native module unavailable — using in-memory fallback. Data will not persist across restarts.',
    );
  }
}

// In-memory fallback when MMKV is unavailable
const memoryStore = new Map<string, string>();

export const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    if (mmkvInstance) {
      mmkvInstance.set(name, value);
    } else {
      memoryStore.set(name, value);
    }
  },
  getItem: (name) => {
    if (mmkvInstance) {
      return mmkvInstance.getString(name) ?? null;
    }
    return memoryStore.get(name) ?? null;
  },
  removeItem: (name) => {
    if (mmkvInstance) {
      mmkvInstance.remove(name);
    } else {
      memoryStore.delete(name);
    }
  },
};

// 2. Encrypted Secure Storage (Auth tokens, sensitive health profile data)
// Note: SecureStore methods are async, but Zustand persist expects sync if possible,
// however we can wrap it in a promise if needed. Recent Zustand persist handles promises.
export const secureStorage: StateStorage = {
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  getItem: async (name) => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};
