import { Alert } from 'react-native';

import type { EnableResult } from '../../store/reminderStore';

/** Tells the patient why a reminder was not turned on. Returns true when it was. */
export const reportReminderResult = (result: EnableResult | 'error'): boolean => {
  switch (result) {
    case 'ok':
      return true;
    case 'denied':
      Alert.alert(
        'Notifications are off',
        'Allow notifications for Medicon in your phone settings to get medicine reminders.',
      );
      return false;
    case 'ended':
      Alert.alert('Course finished', 'This prescription course has ended, so no reminder was set.');
      return false;
    case 'none':
      Alert.alert(
        'No dose times',
        'This prescription has no morning, noon or night times, so reminders cannot be set.',
      );
      return false;
    case 'error':
      Alert.alert('Reminder not changed', 'Something went wrong. Please try again.');
      return false;
  }
};
