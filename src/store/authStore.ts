import axios from 'axios';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './storage';
import { queryClient } from '../services/queryClient';
import { Config } from '../constants/config';

export type UserRole = 'patient' | 'doctor';
export type UserStatus = 'active' | 'pending' | 'suspended';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  status: UserStatus | null;
  userId: string | null;
  login: (data: { token: string; role: UserRole; status: UserStatus; userId: string }) => void;
  /** `remote: false` skips revoking the token server-side (e.g. it is already invalid). */
  logout: (options?: { remote?: boolean }) => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      status: null,
      userId: null,
      login: (data) =>
        set({
          token: data.token,
          role: data.role,
          status: data.status,
          userId: data.userId,
        }),
      logout: (options) => {
        const { token } = get();

        set({
          token: null,
          role: null,
          status: null,
          userId: null,
        });

        // Drop every cached server response so the next user on this device sees none of it.
        queryClient.clear();

        // Revoke the token server-side. Plain axios (not axiosClient) so a 401 here
        // cannot re-enter the logout interceptor; failure is non-fatal locally.
        if (token && options?.remote !== false) {
          axios
            .post(`${Config.API.BASE_URL}/auth/logout`, null, {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            })
            .catch(() => {});
        }
      },
      setRole: (role: UserRole) => set({ role }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
