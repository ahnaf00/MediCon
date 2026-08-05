import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SystemNotification } from '../../types/medical.types';
import { Colors, Spacing, FontFamily, FontSize } from '@theme';

interface NotificationCardProps {
  notification: SystemNotification;
  onPress?: (notification: SystemNotification) => void;
}

export const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  const isAppointment = notification.title.toLowerCase().includes('appointment');
  const isMedicine = notification.type === 'REMINDER' && !isAppointment;
  const isPrescription = notification.title.toLowerCase().includes('prescription');

  const getIcon = () => {
    if (isAppointment) return 'clock-outline';
    if (isMedicine) return 'pill';
    if (isPrescription) return 'file-document-outline';

    switch (notification.type) {
      case 'CONFIRMATION':
        return 'check-circle-outline';
      case 'QNA_ANSWER':
        return 'message-text-outline';
      case 'SYSTEM':
      default:
        return 'information-outline';
    }
  };

  const getIconSize = () => {
    switch (notification.type) {
      case 'QNA_ANSWER':
        return 20;
      default:
        return 24;
    }
  };

  const getIconColor = () => {
    if (isAppointment) return '#6B21A8'; // Dark purple
    if (isMedicine) return '#C2410C'; // Dark orange
    if (isPrescription) return '#166534'; // Dark green

    switch (notification.type) {
      case 'QNA_ANSWER':
        return '#991B1B'; // Dark red
      case 'SYSTEM':
        return Colors.success;
      case 'CONFIRMATION':
      default:
        return Colors.textTertiary;
    }
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(notification.createdAt));

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead ? styles.containerUnread : styles.containerRead,
      ]}
      onPress={() => onPress?.(notification)}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${notification.title}. ${notification.message}. ${
        notification.isRead ? 'Read' : 'Unread'
      }`}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
        <MaterialCommunityIcons name={getIcon()} size={getIconSize()} color={getIconColor()} />
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, !notification.isRead ? styles.textUnread : styles.textRead]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
        <Text
          style={[styles.message, notification.isRead ? styles.textRead : null]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    paddingRight: Spacing.base,
    paddingLeft: 15,
    width: '100%',
  },
  containerUnread: {
    backgroundColor: 'transparent',
  },
  containerRead: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  textUnread: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
  },
  textRead: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  time: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
});
