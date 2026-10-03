import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

// Clean, synchronous-compatible, fail-safe in-memory store
const memoryStore = new Map<string, string>();

let isSecureStoreAvailable = true;

// Pre-test SecureStore availability synchronously if possible or safely handle promises
const safeSetItem = (key: string, value: string): void => {
  memoryStore.set(key, value);
  if (isSecureStoreAvailable) {
    SecureStore.setItemAsync(key, value).catch(() => {
      isSecureStoreAvailable = false;
    });
  }
};

// Reads wait for the boot-time preload below; otherwise Zustand would hydrate
// from an empty memory store and a returning user would appear logged out.
const safeGetItem = async (key: string): Promise<string | null> => {
  await preloadReady;
  return memoryStore.get(key) ?? null;
};

const safeRemoveItem = (key: string): void => {
  memoryStore.delete(key);
  if (isSecureStoreAvailable) {
    SecureStore.deleteItemAsync(key).catch(() => {
      isSecureStoreAvailable = false;
    });
  }
};

// Populate memory store from SecureStore asynchronously on boot
const preloadKey = async (key: string) => {
  try {
    const val = await SecureStore.getItemAsync(key);
    // Don't clobber a value written while the preload was in flight.
    if (val !== null && val !== undefined && !memoryStore.has(key)) {
      memoryStore.set(key, val);
    }
  } catch {
    isSecureStoreAvailable = false;
  }
};

// Pre-load common storage keys
const preloadReady = Promise.all([
  preloadKey('auth-storage'),
  preloadKey('settings-storage'),
  preloadKey('onboarding-state'),
  preloadKey('medicon-chat-storage'),
]);

// 1. Synchronous state storage adapter for Zustand
export const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    safeSetItem(name, value);
  },
  getItem: (name) => {
    return safeGetItem(name);
  },
  removeItem: (name) => {
    safeRemoveItem(name);
  },
};

// 2. Secure storage adapter for Zustand
export const secureStorage: StateStorage = {
  setItem: (name, value) => {
    safeSetItem(name, value);
  },
  getItem: (name) => {
    return safeGetItem(name);
  },
  removeItem: (name) => {
    safeRemoveItem(name);
  },
};
