import { create } from 'zustand';

interface AlarmState {
  mutedPeriods: Record<string, boolean>;
  toggleMute: (periodId: string) => void;
}

export const useAlarmStore = create<AlarmState>((set) => ({
  mutedPeriods: {},
  toggleMute: (periodId: string) =>
    set((state) => ({
      mutedPeriods: { ...state.mutedPeriods, [periodId]: !state.mutedPeriods[periodId] },
    })),
}));
