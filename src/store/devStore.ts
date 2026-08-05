import { create } from 'zustand';

interface DevState {
  forceMockError: boolean;
  forceMockEmpty: boolean;
  setDevState: (state: Partial<DevState>) => void;
}

export const useDevStore = create<DevState>((set) => ({
  forceMockError: false,
  forceMockEmpty: false,
  setDevState: (partialState) => set((state) => ({ ...state, ...partialState })),
}));
