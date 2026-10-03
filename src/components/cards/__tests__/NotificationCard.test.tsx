import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { NotificationCard } from '../NotificationCard';
import { SystemNotification } from '../../../types/medical.types';

const mockNotification: SystemNotification = {
  id: 'n-test',
  userId: 'patient-1',
  title: 'Test Notification',
  message: 'This is a test notification message.',
  type: 'SYSTEM',
  isRead: false,
  createdAt: '2023-10-01T10:00:00Z',
};

describe('NotificationCard', () => {
  it('renders correctly with unread state', async () => {
    await render(<NotificationCard notification={mockNotification} />);

    expect(screen.getByText('Test Notification')).toBeTruthy();
    expect(screen.getByText('This is a test notification message.')).toBeTruthy();
    expect(screen.getByLabelText(/Unread$/)).toBeTruthy();
  });

  it('renders correctly with read notification', async () => {
    const readNotification = { ...mockNotification, isRead: true };
    await render(<NotificationCard notification={readNotification} />);

    expect(screen.getByLabelText(/\. Read$/)).toBeTruthy();
    expect(screen.queryByLabelText(/Unread$/)).toBeNull();
  });

  it('calls onPress when the card is pressed', async () => {
    const onPressMock = jest.fn();
    const { getByRole } = await render(
      <NotificationCard notification={mockNotification} onPress={onPressMock} />,
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledWith(mockNotification);
  });

  it('calls onPress with the notification when a read card is pressed', async () => {
    const onPressMock = jest.fn();
    const readNotification = { ...mockNotification, isRead: true };
    await render(<NotificationCard notification={readNotification} onPress={onPressMock} />);

    fireEvent.press(screen.getByText('Test Notification'));
    expect(onPressMock).toHaveBeenCalledWith(readNotification);
  });
});
