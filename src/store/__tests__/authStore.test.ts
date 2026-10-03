import axios from 'axios';
import { useAuthStore } from '../authStore';
import { queryClient } from '../../services/queryClient';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return { ...actual, post: jest.fn(() => Promise.resolve({})) };
});

const session = {
  token: 'tok-123',
  role: 'patient' as const,
  status: 'active' as const,
  userId: '7',
};

describe('authStore logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.setQueryData(['prescriptions'], [{ id: 1 }]);
    useAuthStore.getState().login(session);
  });

  it('clears auth state, the query cache, and revokes the token server-side', () => {
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().userId).toBeNull();
    expect(queryClient.getQueryData(['prescriptions'])).toBeUndefined();
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      null,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok-123' }),
      }),
    );
  });

  it('skips the server call when remote is false (token already rejected)', () => {
    useAuthStore.getState().logout({ remote: false });

    expect(useAuthStore.getState().token).toBeNull();
    expect(queryClient.getQueryData(['prescriptions'])).toBeUndefined();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
