import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

// Clean, synchronous-compatible, fail-safe in-memory store
const memoryStore = new Map<string, string>();

// Writes to the same key run one after another, so a logout's delete can't land
// after the next login's save. A failed write affects only itself: the next
// write to that key tries SecureStore again (audit API-009 — one failure used
// to stop the session's token from ever being saved).
const writeQueue = new Map<string, Promise<void>>();

const persistWrite = (key: string, write: () => Promise<void>): void => {
  const next = (writeQueue.get(key) ?? Promise.resolve()).then(write).catch((err) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console -- dev-only hint; values are never logged
      console.warn(`SecureStore write failed for "${key}"`, err);
    }
  });
  writeQueue.set(key, next);
};

const safeSetItem = (key: string, value: string): void => {
  memoryStore.set(key, value);
  persistWrite(key, () => SecureStore.setItemAsync(key, value));
};

// Reads wait for the boot-time preload below; otherwise Zustand would hydrate
// from an empty memory store and a returning user would appear logged out.
const safeGetItem = async (key: string): Promise<string | null> => {
  await preloadReady;
  return memoryStore.get(key) ?? null;
};

const safeRemoveItem = (key: string): void => {
  memoryStore.delete(key);
  persistWrite(key, () => SecureStore.deleteItemAsync(key));
};

/** Settles once every queued write has finished (tests use it). */
export const flushSecureWrites = (): Promise<void> =>
  Promise.all([...writeQueue.values()]).then(() => undefined);

// Populate memory store from SecureStore asynchronously on boot
const preloadKey = async (key: string) => {
  try {
    const val = await SecureStore.getItemAsync(key);
    // Don't clobber a value written while the preload was in flight.
    if (val !== null && val !== undefined && !memoryStore.has(key)) {
      memoryStore.set(key, val);
    }
  } catch {
    // Unreadable this time: start from defaults; writes still go to SecureStore.
  }
};

// Pre-load common storage keys
const preloadReady = Promise.all([
  preloadKey('auth-storage'),
  preloadKey('settings-storage'),
  preloadKey('onboarding-state'),
]);

// Chat text used to be saved here; the chat store is memory-only now, so
// remove any copy an older version left on the phone.
SecureStore.deleteItemAsync('medicon-chat-storage').catch(() => {});

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
