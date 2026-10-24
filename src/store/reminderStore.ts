import { create } from 'zustand';

import {
  courseEndFor,
  reminderId,
  reminderService,
  type DosePeriod,
  type PeriodReminder,
} from '../services/notifications/reminderService';
import type { Prescription } from '../types/medical.types';
import { toLocalDateString } from '../utils/localDate';

/** Result of turning a reminder on. */
export type EnableResult = 'ok' | 'denied' | 'ended' | 'none';

const PERIODS: DosePeriod[] = ['morning', 'noon', 'night'];

const scheduleOf = (prescription: Prescription, period: DosePeriod): string | undefined =>
  prescription.medicines
    .map((m) => (m.dosageSchedule as Record<string, string> | undefined)?.[period])
    .find(Boolean);

const namesFor = (prescription: Prescription, period: DosePeriod): string[] =>
  prescription.medicines
    .filter((m) => (m.dosageSchedule as Record<string, string> | undefined)?.[period])
    .map((m) => (m.dosage ? `${m.name} ${m.dosage}` : m.name));

/**
 * In-memory mirror of the medicine reminders the OS has scheduled on this phone.
 * The OS is the source of truth; `refresh` re-reads it. Only one prescription has
 * reminders at a time (the "active prescription").
 */
interface ReminderState {
  reminders: Record<string, PeriodReminder>;
  refresh: () => Promise<void>;
  /** Turns on (or moves) the reminder for one period, at `time` ("HH:mm"). */
  enable: (prescription: Prescription, period: DosePeriod, time: string) => Promise<EnableResult>;
  /** Turns on every dose period of a prescription at its prescribed time. */
  enableAll: (prescription: Prescription) => Promise<EnableResult>;
  disable: (prescriptionId: string | number, period: DosePeriod) => Promise<void>;
  disableAll: (prescriptionId: string | number) => Promise<void>;
  /** Cancels every reminder on this phone (logout). */
  clearAll: () => Promise<void>;
  /** Stops reminders for any of these prescriptions the doctor has cancelled (audit G1). */
  dropCancelled: (prescriptions: Prescription[]) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => {
  /** Cancels reminders that belong to any other prescription. */
  const cancelOthers = async (prescriptionId: string) => {
    await Promise.all(
      Object.values(get().reminders)
        .filter((r) => r.prescriptionId !== prescriptionId)
        .map((r) => reminderService.cancel(r.prescriptionId, r.period)),
    );
  };

  const scheduleOne = async (
    prescription: Prescription,
    period: DosePeriod,
    time: string,
  ): Promise<EnableResult> => {
    const endsOn = courseEndFor(prescription, period);
    if (!endsOn) return 'none';
    if (endsOn < toLocalDateString(new Date())) return 'ended';
    await reminderService.schedule(
      { prescriptionId: String(prescription.id), period, time, endsOn },
      namesFor(prescription, period),
    );
    return 'ok';
  };

  return {
    reminders: {},

    refresh: async () => {
      await reminderService.pruneExpired();
      set({ reminders: await reminderService.list() });
    },

    enable: async (prescription, period, time) => {
      if (!(await reminderService.requestPermissions())) return 'denied';
      await cancelOthers(String(prescription.id));
      const result = await scheduleOne(prescription, period, time);
      await get().refresh();
      return result;
    },

    enableAll: async (prescription) => {
      if (!(await reminderService.requestPermissions())) return 'denied';
      await cancelOthers(String(prescription.id));
      const results: EnableResult[] = [];
      for (const period of PERIODS) {
        const prescribed = scheduleOf(prescription, period);
        if (!prescribed) continue;
        // Keep a time the patient already moved.
        const current = get().reminders[reminderId(prescription.id, period)]?.time;
        results.push(await scheduleOne(prescription, period, current ?? prescribed));
      }
      await get().refresh();
      if (results.includes('ok')) return 'ok';
      return results.includes('ended') ? 'ended' : 'none';
    },

    disable: async (prescriptionId, period) => {
      await reminderService.cancel(prescriptionId, period);
      await get().refresh();
    },

    disableAll: async (prescriptionId) => {
      await Promise.all(PERIODS.map((p) => reminderService.cancel(prescriptionId, p)));
      await get().refresh();
    },

    clearAll: async () => {
      await reminderService.cancelAll();
      set({ reminders: {} });
    },

    dropCancelled: async (prescriptions) => {
      const cancelled = new Set(
        prescriptions.filter((p) => p.status === 'cancelled').map((p) => String(p.id)),
      );
      if (cancelled.size === 0) return;
      // Read the OS schedule itself: the in-memory mirror may not be loaded yet.
      const scheduled = await reminderService.list();
      const stale = Object.values(scheduled).filter((r) => cancelled.has(r.prescriptionId));
      if (stale.length === 0) return;
      await Promise.all(stale.map((r) => reminderService.cancel(r.prescriptionId, r.period)));
      await get().refresh();
    },
  };
});

/** The prescription that has reminders on this phone, if any. */
export const selectActivePrescriptionId = (state: ReminderState): string | null =>
  Object.values(state.reminders)[0]?.prescriptionId ?? null;

/** Last day of a prescription's course across all periods (local YYYY-MM-DD), or null. */
export const prescriptionEndsOn = (prescription: Prescription): string | null => {
  const ends = PERIODS.map((p) => courseEndFor(prescription, p)).filter(
    (d): d is string => d !== null,
  );
  return ends.length ? ends.sort().at(-1)! : null;
};
