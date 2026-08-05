import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureStorage } from './storage';

export type UserRole = 'patient' | 'doctor';
export type UserStatus = 'active' | 'pending';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  status: UserStatus | null;
  userId: string | null;
  login: (data: { token: string; role: UserRole; status: UserStatus; userId: string }) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
      logout: () =>
        set({
          token: null,
          role: null,
          status: null,
          userId: null,
        }),
      setRole: (role: UserRole) => set({ role }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
