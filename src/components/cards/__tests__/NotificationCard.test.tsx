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
    expect(screen.getByLabelText('Mark as read')).toBeTruthy();
  });

  it('renders correctly with read notification', async () => {
    const readNotification = { ...mockNotification, isRead: true };
    await render(<NotificationCard notification={readNotification} />);

    expect(screen.getByLabelText('Mark as unread')).toBeTruthy();
  });

  it('calls onToggleRead when toggle button is pressed', async () => {
    const onPressMock = jest.fn();
    const { getByRole } = await render(
      <NotificationCard notification={mockNotification} onPress={onPressMock} />,
    );

    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledWith(mockNotification);
  });

  it('navigates to actionUrl when pressed and notification is read', async () => {
    const onPressMock = jest.fn();
    const { getByRole } = await render(
      <NotificationCard
        notification={{ ...mockNotification, isRead: true }}
        onPress={onPressMock}
      />,
    );

    fireEvent.press(screen.getByText('Test Notification'));
    expect(onPressMock).toHaveBeenCalledWith(mockNotification);
  });
});
