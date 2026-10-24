import * as Notifications from 'expo-notifications';

import { courseEndFor, reminderId, reminderService } from '../reminderService';
import type { Prescription } from '../../../types/medical.types';

jest.mock('expo-notifications', () => {
  const scheduled: { identifier: string; content: { data: unknown } }[] = [];
  return {
    __scheduled: scheduled,
    setNotificationHandler: jest.fn(),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DAILY: 'daily' },
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false, canAskAgain: true })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    scheduleNotificationAsync: jest.fn(
      (req: { identifier: string; content: { data: unknown } }) => {
        scheduled.push(req);
        return Promise.resolve(req.identifier);
      },
    ),
    cancelScheduledNotificationAsync: jest.fn((id: string) => {
      const i = scheduled.findIndex((r) => r.identifier === id);
      if (i >= 0) scheduled.splice(i, 1);
      return Promise.resolve();
    }),
    getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([...scheduled])),
  };
});

const scheduled = (Notifications as unknown as { __scheduled: unknown[] }).__scheduled;

const rx: Prescription = {
  id: 5,
  issuedAt: '2026-10-20T03:00:00Z',
  medicines: [
    { id: 1, name: 'Napa', dosage: '500mg', durationDays: 3, dosageSchedule: { morning: '08:00' } },
    {
      id: 2,
      name: 'Seclo',
      dosage: '20mg',
      durationDays: 7,
      dosageSchedule: { morning: '08:00', night: '21:00' },
    },
  ],
};

describe('reminderService', () => {
  beforeEach(() => {
    scheduled.length = 0;
    jest.clearAllMocks();
  });

  it('ends a period on the last day of its longest medicine', () => {
    expect(courseEndFor(rx, 'morning')).toBe('2026-10-26');
    expect(courseEndFor(rx, 'noon')).toBeNull();
  });

  it('schedules a real daily notification and replaces the old one for the same period', async () => {
    const base = { prescriptionId: '5', period: 'morning' as const, endsOn: '2026-10-26' };
    await reminderService.schedule({ ...base, time: '08:00' }, ['Napa 500mg']);
    await reminderService.schedule({ ...base, time: '07:30' }, ['Napa 500mg']);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
      expect.objectContaining({
        identifier: reminderId(5, 'morning'),
        trigger: expect.objectContaining({ type: 'daily', hour: 7, minute: 30 }),
      }),
    );
    expect(Object.values(await reminderService.list())).toEqual([{ ...base, time: '07:30' }]);
  });

  it('rejects a malformed time instead of scheduling something wrong', async () => {
    await expect(
      reminderService.schedule(
        { prescriptionId: '5', period: 'night', time: 'soon', endsOn: '2026-10-26' },
        ['Seclo'],
      ),
    ).rejects.toThrow('Invalid reminder time');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('cancels reminders whose course has ended, and all of them on cancelAll', async () => {
    await reminderService.schedule(
      { prescriptionId: '5', period: 'morning', time: '08:00', endsOn: '2026-10-22' },
      ['Napa'],
    );
    await reminderService.schedule(
      { prescriptionId: '5', period: 'night', time: '21:00', endsOn: '2026-10-26' },
      ['Seclo'],
    );

    await reminderService.pruneExpired(new Date(2026, 9, 24));
    expect(Object.keys(await reminderService.list())).toEqual([reminderId(5, 'night')]);

    await reminderService.cancelAll();
    expect(await reminderService.list()).toEqual({});
  });

  it('asks for permission only when it is not yet granted', async () => {
    expect(await reminderService.requestPermissions()).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});
