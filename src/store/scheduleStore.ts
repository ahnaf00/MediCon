import { create } from 'zustand';

export interface ScheduleStore {
  // Day of week (0=Sun, 1=Mon...) -> Array of available slot times e.g., ['09:00 AM', '10:00 AM']
  regularSchedule: Record<number, string[]>;

  // Date ('YYYY-MM-DD') -> Slot Time -> isAvailable (false means disabled by doctor)
  scheduleExceptions: Record<string, Record<string, boolean>>;

  // Date ('YYYY-MM-DD') -> Array of one-off custom slots added manually
  customSlots: Record<string, string[]>;

  // Date ('YYYY-MM-DD') -> Slot Time -> count of booked patients
  bookings: Record<string, Record<string, number>>;

  // Actions
  setRegularSchedule: (dayOfWeek: number, slots: string[]) => void;
  toggleException: (date: string, time: string) => void;
  addCustomSlot: (date: string, time: string) => void;
  incrementBooking: (date: string, time: string) => void;
}

// Default 9-5 schedule for Mon-Fri
const defaultSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

const initialRegularSchedule = {
  0: [...defaultSlots], // Sun
  1: [...defaultSlots], // Mon
  2: [...defaultSlots], // Tue
  3: [...defaultSlots], // Wed
  4: [...defaultSlots], // Thu
  5: [...defaultSlots], // Fri
  6: [...defaultSlots], // Sat
};

export const useScheduleStore = create<ScheduleStore>((set) => ({
  regularSchedule: initialRegularSchedule,
  scheduleExceptions: {},
  customSlots: {},
  bookings: {},

  setRegularSchedule: (dayOfWeek, slots) =>
    set((state) => ({
      regularSchedule: {
        ...state.regularSchedule,
        [dayOfWeek]: slots,
      },
    })),

  toggleException: (date, time) =>
    set((state) => {
      const dateExceptions = state.scheduleExceptions[date] || {};
      const currentStatus = dateExceptions[time] !== undefined ? dateExceptions[time] : true;
      return {
        scheduleExceptions: {
          ...state.scheduleExceptions,
          [date]: {
            ...dateExceptions,
            [time]: !currentStatus,
          },
        },
      };
    }),

  addCustomSlot: (date, time) =>
    set((state) => {
      const existing = state.customSlots[date] || [];
      if (existing.includes(time)) return state;
      return {
        customSlots: {
          ...state.customSlots,
          [date]: [...existing, time],
        },
      };
    }),

  incrementBooking: (date, time) =>
    set((state) => {
      const dateBookings = state.bookings[date] || {};
      const currentCount = dateBookings[time] || 0;
      return {
        bookings: {
          ...state.bookings,
          [date]: {
            ...dateBookings,
            [time]: currentCount + 1,
          },
        },
      };
    }),
}));
