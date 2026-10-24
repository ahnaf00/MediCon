import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

const setItem = SecureStore.setItemAsync as jest.Mock;
const deleteItem = SecureStore.deleteItemAsync as jest.Mock;

// The module preloads keys at import, so each test gets a fresh copy.
const load = () => {
  let mod!: typeof import('../storage');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh module per test
    mod = require('../storage');
  });
  return mod;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

it('keeps saving to SecureStore after one write fails (audit API-009)', async () => {
  const { secureStorage, flushSecureWrites } = load();
  setItem.mockRejectedValueOnce(new Error('keystore busy'));

  secureStorage.setItem('settings-storage', '{"a":1}');
  await flushSecureWrites();
  secureStorage.setItem('auth-storage', '{"token":"t"}');
  await flushSecureWrites();

  expect(setItem).toHaveBeenLastCalledWith('auth-storage', '{"token":"t"}');
  expect(await secureStorage.getItem('auth-storage')).toBe('{"token":"t"}');
});

it('applies writes to one key in order, so a logout delete cannot undo the next login', async () => {
  const { secureStorage, flushSecureWrites } = load();
  const order: string[] = [];
  let releaseDelete!: () => void;
  deleteItem.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        releaseDelete = () => {
          order.push('delete');
          resolve();
        };
      }),
  );
  setItem.mockImplementationOnce(async () => {
    order.push('set');
  });

  secureStorage.removeItem('auth-storage'); // logout, slow
  secureStorage.setItem('auth-storage', '{"token":"new"}'); // next login
  await Promise.resolve();
  expect(order).toEqual([]); // the save waits for the delete
  releaseDelete();
  await flushSecureWrites();

  expect(order).toEqual(['delete', 'set']);
});

it('still saves after the boot-time read failed', async () => {
  (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('locked'));
  const { secureStorage, flushSecureWrites } = load();
  secureStorage.setItem('auth-storage', 'x');
  await flushSecureWrites();
  expect(setItem).toHaveBeenCalledWith('auth-storage', 'x');
});
