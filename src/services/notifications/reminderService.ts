import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Prescription } from '../../types/medical.types';
import { toLocalDateString } from '../../utils/localDate';
import { courseLastDay } from '../../utils/courseDates';

/**
 * Daily medicine reminders, scheduled as local notifications on this phone.
 *
 * One reminder per prescription and dose period (morning / noon / night). The OS keeps
 * the schedule, so it survives app restarts; nothing is sent to the server. A reminder
 * repeats daily and is cancelled on the first app start after the course has ended
 * (`pruneExpired`), and all reminders are cancelled on logout.
 */

export type DosePeriod = 'morning' | 'noon' | 'night';

export interface PeriodReminder {
  prescriptionId: string;
  period: DosePeriod;
  /** 24-hour "HH:mm". */
  time: string;
  /** Last day of the course, local YYYY-MM-DD. */
  endsOn: string;
}

const CHANNEL_ID = 'medicine-reminders';
const ID_PREFIX = 'rx-';

export const reminderId = (prescriptionId: string | number, period: DosePeriod): string =>
  `${ID_PREFIX}${prescriptionId}-${period}`;

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady: Promise<unknown> | null = null;
const ensureChannel = (): Promise<unknown> => {
  if (Platform.OS !== 'android') return Promise.resolve();
  channelReady ??= Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Medicine reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
  return channelReady;
};

const parseTime = (time: string): { hour: number; minute: number } | null => {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
};

/** Last day any medicine taken in `period` is due, as local YYYY-MM-DD. */
export const courseEndFor = (prescription: Prescription, period: DosePeriod): string | null => {
  const ends = prescription.medicines
    .filter((m) => (m.dosageSchedule as Record<string, string> | undefined)?.[period])
    .map((m) => courseLastDay(prescription.issuedAt, m))
    .filter(Boolean)
    .sort();
  return ends.at(-1) ?? null;
};

const toReminder = (request: Notifications.NotificationRequest): PeriodReminder | null => {
  if (!request.identifier.startsWith(ID_PREFIX)) return null;
  const data = request.content.data as Partial<PeriodReminder> | undefined;
  if (!data?.prescriptionId || !data.period || !data.time || !data.endsOn) return null;
  return {
    prescriptionId: String(data.prescriptionId),
    period: data.period,
    time: data.time,
    endsOn: data.endsOn,
  };
};

export const reminderService = {
  /** Asks for notification permission if it has not been decided yet. */
  requestPermissions: async (): Promise<boolean> => {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  },

  /** Every medicine reminder scheduled on this phone, keyed by `reminderId`. */
  list: async (): Promise<Record<string, PeriodReminder>> => {
    const requests = await Notifications.getAllScheduledNotificationsAsync();
    const out: Record<string, PeriodReminder> = {};
    for (const request of requests) {
      const reminder = toReminder(request);
      if (reminder) out[request.identifier] = reminder;
    }
    return out;
  },

  /**
   * Schedules (or moves) the daily reminder for one dose period. Replaces any earlier
   * reminder for the same prescription and period.
   */
  schedule: async (reminder: PeriodReminder, medicineNames: string[]): Promise<void> => {
    const parsed = parseTime(reminder.time);
    if (!parsed) throw new Error(`Invalid reminder time "${reminder.time}"`);
    await ensureChannel();
    const id = reminderId(reminder.prescriptionId, reminder.period);
    await Notifications.cancelScheduledNotificationAsync(id);
    const label = reminder.period.charAt(0).toUpperCase() + reminder.period.slice(1);
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: `${label} medicine`,
        body: `Time to take: ${medicineNames.join(', ')}`,
        data: { ...reminder },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
        channelId: CHANNEL_ID,
      },
    });
  },

  cancel: async (prescriptionId: string | number, period: DosePeriod): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(reminderId(prescriptionId, period));
  },

  /** Cancels reminders whose course ended before today. */
  pruneExpired: async (today: Date = new Date()): Promise<void> => {
    const todayStr = toLocalDateString(today);
    const all = await reminderService.list();
    await Promise.all(
      Object.entries(all)
        .filter(([, r]) => r.endsOn < todayStr)
        .map(([id]) => Notifications.cancelScheduledNotificationAsync(id)),
    );
  },

  /** Cancels every medicine reminder (used on logout). */
  cancelAll: async (): Promise<void> => {
    const all = await reminderService.list();
    await Promise.all(
      Object.keys(all).map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
  },
};
