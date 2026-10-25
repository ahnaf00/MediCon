import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize } from '@theme';
import { useUnreadNoticeCount } from '../../services/api/inAppNotificationsService';

/** Header bell with the number of unread in-app notifications (audit L5). */
export const NotificationBell = (): React.JSX.Element => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: unread = 0 } = useUnreadNoticeCount();
  const label = t('dashboard.notifications') || 'Notifications';

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/notifications')}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `${label}, ${unread} unread` : label}
    >
      <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.textSecondary} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Colors.surface, fontSize: FontSize.xs - 2, fontWeight: '700' },
});
