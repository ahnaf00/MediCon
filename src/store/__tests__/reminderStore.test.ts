import { useReminderStore, selectActivePrescriptionId } from '../reminderStore';
import { reminderService, type PeriodReminder } from '../../services/notifications/reminderService';
import type { Prescription } from '../../types/medical.types';

jest.mock('../../services/notifications/reminderService', () => {
  const actual = jest.requireActual('../../services/notifications/reminderService');
  const store: Record<string, PeriodReminder> = {};
  return {
    ...actual,
    __store: store,
    reminderService: {
      requestPermissions: jest.fn(() => Promise.resolve(true)),
      list: jest.fn(() => Promise.resolve({ ...store })),
      pruneExpired: jest.fn(() => Promise.resolve()),
      schedule: jest.fn((r: PeriodReminder) => {
        store[actual.reminderId(r.prescriptionId, r.period)] = r;
        return Promise.resolve();
      }),
      cancel: jest.fn((id: string, period: string) => {
        delete store[actual.reminderId(id, period)];
        return Promise.resolve();
      }),
      cancelAll: jest.fn(() => Promise.resolve()),
    },
  };
});

jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));

const store = (
  jest.requireMock('../../services/notifications/reminderService') as {
    __store: Record<string, PeriodReminder>;
  }
).__store;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const rx = (id: number, issuedAt: string): Prescription => ({
  id,
  issuedAt,
  medicines: [
    {
      id: 1,
      name: 'Napa',
      dosage: '500mg',
      durationDays: 5,
      dosageSchedule: { morning: '08:00', night: '21:00' },
    },
  ],
});

describe('reminderStore', () => {
  beforeEach(async () => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
    await useReminderStore.getState().refresh();
  });

  it('turns on every dose period of a running course', async () => {
    expect(await useReminderStore.getState().enableAll(rx(1, daysAgo(1)))).toBe('ok');
    expect(Object.values(store).map((r) => [r.period, r.time])).toEqual([
      ['morning', '08:00'],
      ['night', '21:00'],
    ]);
    expect(selectActivePrescriptionId(useReminderStore.getState())).toBe('1');
  });

  it('refuses a course that has already ended', async () => {
    expect(await useReminderStore.getState().enableAll(rx(1, daysAgo(30)))).toBe('ended');
    expect(reminderService.schedule).not.toHaveBeenCalled();
  });

  // Audit G1: a prescription the doctor cancelled must stop reminding.
  it('drops reminders of a cancelled prescription and leaves others alone', async () => {
    await useReminderStore.getState().enableAll(rx(1, daysAgo(1)));

    await useReminderStore
      .getState()
      .dropCancelled([{ ...rx(2, daysAgo(1)), status: 'cancelled' }]);
    expect(Object.keys(store)).toHaveLength(2);

    await useReminderStore
      .getState()
      .dropCancelled([{ ...rx(1, daysAgo(1)), status: 'cancelled' }]);
    expect(store).toEqual({});
    expect(selectActivePrescriptionId(useReminderStore.getState())).toBeNull();
  });

  it('keeps one active prescription: turning on another replaces the first', async () => {
    await useReminderStore.getState().enableAll(rx(1, daysAgo(1)));
    await useReminderStore.getState().enableAll(rx(2, daysAgo(0)));
    expect(new Set(Object.values(store).map((r) => r.prescriptionId))).toEqual(new Set(['2']));
  });

  it('keeps a time the patient moved when turning all reminders on again', async () => {
    const p = rx(1, daysAgo(1));
    await useReminderStore.getState().enable(p, 'morning', '07:15');
    await useReminderStore.getState().enableAll(p);
    expect(store['rx-1-morning'].time).toBe('07:15');
    expect(store['rx-1-night'].time).toBe('21:00');
  });

  it('reports a refused permission without scheduling', async () => {
    (reminderService.requestPermissions as jest.Mock).mockResolvedValueOnce(false);
    expect(await useReminderStore.getState().enableAll(rx(1, daysAgo(1)))).toBe('denied');
    expect(reminderService.schedule).not.toHaveBeenCalled();
  });
});
