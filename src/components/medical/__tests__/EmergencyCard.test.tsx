import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmergencyCard } from '../EmergencyCard';
import { callEmergency } from '../../../utils/callEmergency';
import '../../../i18n';

jest.mock('../../../utils/callEmergency', () => ({ callEmergency: jest.fn() }));

describe('EmergencyCard', () => {
  it('shows the translated red-flag message and calls 999', async () => {
    await render(<EmergencyCard redFlag={{ code: 'poisoning', message: 'server text' }} />);
    expect(screen.getByText(/Poisoning or an overdose needs urgent care/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Call 999'));
    expect(callEmergency).toHaveBeenCalled();
  });

  it('falls back to the server message for a code the app does not know', async () => {
    await render(<EmergencyCard redFlag={{ code: 'new_rule', message: 'Server says go now.' }} />);
    expect(screen.getByText('Server says go now.')).toBeTruthy();
  });

  it('can be dismissed in a chat', async () => {
    const onDismiss = jest.fn();
    await render(<EmergencyCard redFlag={null} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
