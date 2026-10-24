import { Alert, Linking } from 'react-native';
import i18n from '../i18n';

export const EMERGENCY_NUMBER = '999';

/**
 * Opens the dialer with 999. If the device can't (a tablet, no SIM, a blocked
 * intent) the user is told to dial it themselves instead of nothing happening
 * (audit CLIN-010). No canOpenURL gate: on Android it can wrongly say no.
 */
export async function callEmergency(): Promise<void> {
  try {
    await Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
  } catch {
    Alert.alert(
      i18n.t('emergency.dial_failed_title', 'Call 999 now'),
      i18n.t(
        'emergency.dial_failed_body',
        'This device could not open the phone dialer. Dial 999 from any phone, or ask someone nearby to call.',
      ),
    );
  }
}
