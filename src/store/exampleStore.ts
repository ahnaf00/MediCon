import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './storage';

// 1. Non-persisted (Ephemeral) Store Example
// Used for: Emergency protocol step state, UI transient state, etc.
interface EphemeralState {
  currentStep: number;
  setStep: (step: number) => void;
}

export const useEphemeralStore = create<EphemeralState>((set) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),
}));

// 2. MMKV Persisted Store Example
// Used for: Health profile data, app preferences, language
interface AppPreferencesState {
  language: string;
  theme: 'light' | 'dark' | 'system';
  setPreferences: (prefs: Partial<AppPreferencesState>) => void;
}

export const usePreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'system',
      setPreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
    }),
    {
      name: 'app-preferences',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
