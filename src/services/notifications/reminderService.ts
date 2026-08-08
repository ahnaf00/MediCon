import { Platform } from 'react-native';

// MOCKED FOR EXPO GO SDK 53
// 'expo-notifications' throws a fatal error on import in Expo Go.
// We mock this service so the UI can be built and tested without a dev client.

export const reminderService = {
  requestPermissions: async (): Promise<boolean> => {
    console.log('[Mock Notifications] requestPermissions called');
    return true;
  },

  scheduleDailyReminder: async (
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
  ): Promise<string> => {
    console.log(`[Mock Notifications] Scheduled: ${title} at ${hour}:${minute}`);
    return `mock-id-${Date.now()}`;
  },

  cancelReminder: async (identifier: string): Promise<void> => {
    console.log(`[Mock Notifications] Cancelled: ${identifier}`);
  },

  cancelAllReminders: async (): Promise<void> => {
    console.log('[Mock Notifications] Cancelled all reminders');
  },
};
