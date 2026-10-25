import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { useTranslation } from 'react-i18next';
import {
  AppNotice,
  NoticeKind,
  noticeRoute,
  useInAppNotifications,
  useMarkAllNoticesRead,
  useMarkNoticeRead,
} from '../../src/services/api/inAppNotificationsService';
import { chatTime } from '../../src/services/api/directChatService';

const ICONS: Record<NoticeKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  question_answered: 'comment-question-outline',
  chat_message: 'message-text-outline',
  report_ready: 'file-document-outline',
  report_failed: 'file-alert-outline',
  summary_shared: 'clipboard-text-outline',
  visit_reminder: 'calendar-clock',
  account_reviewed: 'shield-account-outline',
  other: 'bell-outline',
};

/**
 * In-app notifications from the server (audit L5). They appear here while the app
 * is open; there is no phone push for them.
 */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: notices = [], isLoading, isError, refetch, isRefetching } = useInAppNotifications();
  const markRead = useMarkNoticeRead();
  const markAll = useMarkAllNoticesRead();
  const hasUnread = notices.some((n) => !n.readAt);

  const open = (n: AppNotice) => {
    if (!n.readAt) markRead.mutate(n.id);
    const route = noticeRoute(n);
    if (route) router.push(route as any);
  };

  const renderNotice = ({ item }: { item: AppNotice }) => (
    <TouchableOpacity
      style={[styles.row, !item.readAt && styles.rowUnread]}
      onPress={() => open(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.readAt ? '' : 'Unread. '}${item.title}. ${item.body}`}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name={ICONS[item.kind] ?? ICONS.other}
          size={22}
          color={item.kind === 'report_failed' ? Colors.danger : Colors.primary}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.title, !item.readAt && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.time}>{chatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.readAt && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={{ backgroundColor: Colors.surface, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back', 'Back')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('notifications.title', 'Notifications')}</Text>
          {hasUnread && (
            <TouchableOpacity
              onPress={() => markAll.mutate()}
              disabled={markAll.isPending}
              accessibilityRole="button"
            >
              <Text style={styles.markAll}>{t('notifications.markAllRead', 'Mark all read')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {t('notifications.loadError', 'Could not load your notifications.')}
          </Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.markAll}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(n) => n.id}
          renderItem={renderNotice}
          contentContainerStyle={notices.length === 0 ? styles.center : undefined}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="bell-outline" size={56} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>
                {t(
                  'notifications.empty',
                  'No notifications yet. Answers, messages, report results and visit reminders appear here while you use the app.',
                )}
              </Text>
            </View>
          }
          ListFooterComponent={
            notices.length > 0 ? (
              <Text style={styles.footer}>
                {t(
                  'notifications.inAppOnly',
                  'These appear only inside the app. Medicine reminders you turn on still arrive as phone notifications.',
                )}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  markAll: { color: Colors.primary, fontSize: FontSize.base, fontWeight: '600' },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyBox: { alignItems: 'center', gap: Spacing.sm },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.textTertiary,
  },
  rowUnread: { backgroundColor: Colors.tertiaryLight },
  icon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  titleUnread: { fontWeight: '700' },
  time: { fontSize: FontSize.sm, color: Colors.textTertiary },
  body: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 19 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  footer: {
    padding: Spacing.base,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
