import { Alert, Linking } from 'react-native';
import { callEmergency } from '../callEmergency';

beforeEach(() => jest.restoreAllMocks());

it('opens the dialer with 999', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await callEmergency();
  expect(open).toHaveBeenCalledWith('tel:999');
  expect(alert).not.toHaveBeenCalled();
});

it('tells the user to dial 999 when the dialer cannot open', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no activity'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await callEmergency();
  expect(alert).toHaveBeenCalledWith('Call 999 now', expect.stringContaining('Dial 999'));
});
