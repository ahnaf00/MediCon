import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AuthOTPForm } from '../AuthOTPForm';

const typeCode = async (code: string) => {
  for (let i = 0; i < code.length; i++) {
    await fireEvent.changeText(screen.getByLabelText(`OTP digit ${i + 1}`), code[i]);
  }
};

// A mistyped code must be correctable: clearing a box empties it.
it('lets the user clear a wrong digit and submit the corrected code', async () => {
  const onSubmit = jest.fn();
  await render(
    <AuthOTPForm
      onSubmit={onSubmit}
      isLoading={false}
      phone="+8801811000001"
      onResend={jest.fn()}
    />,
  );

  await typeCode('999999');
  expect(onSubmit).toHaveBeenLastCalledWith('999999');

  await fireEvent.changeText(screen.getByLabelText('OTP digit 6'), '');
  expect(screen.getByLabelText('OTP digit 6').props.value).toBe('');

  await typeCode('123456');
  expect(onSubmit).toHaveBeenLastCalledWith('123456');
});
