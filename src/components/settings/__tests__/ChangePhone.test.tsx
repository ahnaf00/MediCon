import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChangePhone } from '../ChangePhone';
import { authService } from '../../../services/api/authService';

jest.mock('../../../services/api/authService', () => ({
  authService: { sendPhoneChangeCode: jest.fn(), confirmPhoneChange: jest.fn() },
}));

// Audit F12: the number changes only after the code sent to it is entered.
it('sends a code to the new number and switches only after it is confirmed', async () => {
  (authService.sendPhoneChangeCode as jest.Mock).mockResolvedValue(undefined);
  (authService.confirmPhoneChange as jest.Mock).mockResolvedValue({ phone: '+8801911000002' });
  const onChanged = jest.fn();
  await render(<ChangePhone currentPhone="+8801811000001" onChanged={onChanged} />);

  await fireEvent.press(screen.getByLabelText('Change phone number'));
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. 01711000000'), '01911000002');
  await fireEvent.press(screen.getByLabelText('Send code'));
  expect(authService.sendPhoneChangeCode).toHaveBeenCalledWith('01911000002');
  expect(onChanged).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByPlaceholderText('123456'), '123456');
  await fireEvent.press(screen.getByLabelText('Confirm new number'));

  expect(authService.confirmPhoneChange).toHaveBeenCalledWith('01911000002', '123456');
  expect(onChanged).toHaveBeenCalledWith('+8801911000002');
  expect(
    await screen.findByText('Phone number changed. Use the new number to log in.'),
  ).toBeTruthy();
});

it('shows the server message and keeps the old number when the code is wrong', async () => {
  (authService.sendPhoneChangeCode as jest.Mock).mockResolvedValue(undefined);
  (authService.confirmPhoneChange as jest.Mock).mockRejectedValue({
    isAxiosError: true,
    response: { status: 400, data: { message: 'Invalid OTP.' } },
  });
  const onChanged = jest.fn();
  await render(<ChangePhone currentPhone="+8801811000001" onChanged={onChanged} />);

  await fireEvent.press(screen.getByLabelText('Change phone number'));
  await fireEvent.changeText(screen.getByPlaceholderText('e.g. 01711000000'), '01911000002');
  await fireEvent.press(screen.getByLabelText('Send code'));
  await fireEvent.changeText(screen.getByPlaceholderText('123456'), '999999');
  await fireEvent.press(screen.getByLabelText('Confirm new number'));

  expect(await screen.findByText('Invalid OTP.')).toBeTruthy();
  expect(onChanged).not.toHaveBeenCalled();
});
