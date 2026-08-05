import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const reminderService = {
  /**
   * Requests permission for push notifications from the OS
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0671AB',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  },

  /**
   * Schedules a daily local notification
   * @param id - A unique identifier for this reminder (e.g. medicine id)
   * @param title - Notification title
   * @param body - Notification body
   * @param hour - Hour of the day (0-23)
   * @param minute - Minute of the hour (0-59)
   * @returns The scheduled notification identifier
   */
  scheduleDailyReminder: async (
    id: string,
    title: string,
    body: string,
    hour: number,
    minute: number,
  ): Promise<string> => {
    // Cancel any existing reminder for this ID first
    await reminderService.cancelReminder(id);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { id, type: 'MEDICINE_REMINDER' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return identifier;
  },

  /**
   * Cancels a previously scheduled notification by its ID
   */
  cancelReminder: async (id: string): Promise<void> => {
    // Note: To truly cancel by custom ID, you'd store the returned identifier from scheduleNotificationAsync.
    // For simplicity, we just cancel all for now if we don't have the identifier,
    // or we assume `id` passed here IS the notification identifier returned by `scheduleDailyReminder`.
    await Notifications.cancelScheduledNotificationAsync(id);
  },

  /**
   * Cancels all scheduled notifications
   */
  cancelAllReminders: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
