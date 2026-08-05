import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize } from '@theme';
import { useAuthStore } from '../../src/store/authStore';
import { notificationsListService } from '../../src/services/notifications/notificationsListService';
import { NotificationCard } from '../../src/components/cards/NotificationCard';
import { SystemNotification } from '../../src/types/medical.types';
import { createAppError, AppError } from '../../src/utils/errors';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.userId) || 'patient-1'; // Default for mock
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsListService.getNotifications(userId);
      setNotifications(data);
    } catch (err) {
      setError(createAppError('NETWORK_ERROR', String(err)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleToggleRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
      await notificationsListService.markAsRead(id);
    } catch (err) {
      // Revert on error
      const e = createAppError('NETWORK_ERROR', String(err));
      alert(e.message);
      loadData();
    }
  };

  const handlePress = (notification: SystemNotification) => {
    if (!notification.isRead) {
      handleToggleRead(notification.id);
    }
    if (notification.actionUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(notification.actionUrl as any);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.md,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title') || 'Notifications'}</Text>
        </View>
      </View>

      {loading && !error ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState message={error.message} onRetry={loadData} />
        </View>
      ) : notifications.length === 0 ? (
        <View
          style={[styles.centerContainer, { paddingBottom: insets.bottom + 80, gap: Spacing.sm }]}
        >
          <MaterialCommunityIcons name="bell-cancel-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {t('notifications.empty') || 'You have no notifications.'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <NotificationCard notification={item} onPress={handlePress} />
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xxl * 3,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
});
