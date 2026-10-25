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
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { useAuthStore } from '../../../src/store';
import {
  chatPartner,
  chatTime,
  DirectChat,
  iAmPatient,
  useDirectChats,
} from '../../../src/services/api/directChatService';

/** Doctor-patient chats (audit M1). */
export default function ChatListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.userId);
  const { data: chats = [], isLoading, isError, refetch, isRefetching } = useDirectChats();

  const renderChat = ({ item }: { item: DirectChat }) => {
    const partner = chatPartner(item, userId);
    const last = item.latestMessage;
    const lastIsMine = last ? last.fromPatient === iAmPatient(item, userId) : false;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(app)/chat/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${partner?.name ?? ''}`}
      >
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={26} color={Colors.primary} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.name} numberOfLines={1}>
              {partner?.name ?? t('chat.unknown', 'Unknown')}
            </Text>
            {last && <Text style={styles.time}>{chatTime(last.createdAt)}</Text>}
          </View>
          <View style={styles.rowTop}>
            <Text style={styles.preview} numberOfLines={1}>
              {last
                ? `${lastIsMine ? t('chat.you', 'You') + ': ' : ''}${last.body}`
                : t('chat.noMessages', 'No messages yet')}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.headerTitle}>{t('chat.title', 'Messages')}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {t('chat.loadError', 'Could not load your messages.')}
          </Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.id}
          renderItem={renderChat}
          contentContainerStyle={chats.length === 0 ? styles.center : undefined}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={56}
                color={Colors.textTertiary}
              />
              <Text style={styles.emptyText}>
                {t(
                  'chat.empty',
                  'No messages yet. After booking a visit you can message your doctor from their profile.',
                )}
              </Text>
            </View>
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
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyBox: { alignItems: 'center', gap: Spacing.sm },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  retry: { marginTop: Spacing.sm, color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  time: { fontSize: FontSize.sm, color: Colors.textTertiary },
  preview: { flex: 1, fontSize: FontSize.base, color: Colors.textSecondary },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: Colors.surface, fontSize: FontSize.sm, fontWeight: '700' },
});
