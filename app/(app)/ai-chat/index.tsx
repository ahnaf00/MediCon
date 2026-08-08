// 1. IMPORTS
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { chatService, AiChatSession } from '../../../src/services/ai/chatService';
import { ErrorState } from '../../../src/components/ui/ErrorState';

// 2. COMPONENT

export default function AiChatSessionsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const data = await chatService.getSessions();
      setSessions(data);
    } catch {
      setError('Unable to load chat history.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSessions();
      setLoading(false);
    })();
  }, [loadSessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleNewChat = () => {
    // Navigate to the chat screen with sessionId = "new" to start a fresh session
    router.push({
      pathname: '/(app)/ai-chat/[sessionId]',
      params: { sessionId: 'new' },
    });
  };

  const handleSessionPress = (session: AiChatSession) => {
    router.push({
      pathname: '/(app)/ai-chat/[sessionId]',
      params: { sessionId: String(session.id), title: session.title },
    });
  };

  // ─── Session card renderer ──────────────────────────────────────────────────

  const renderSessionCard = ({ item }: { item: AiChatSession }) => {
    const date = new Date(item.createdAt);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const preview = item.latestMessage?.content ?? 'No messages yet';

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.75}
        accessibilityLabel={`Chat session: ${item.title}`}
      >
        <View style={styles.sessionIconCircle}>
          <MaterialCommunityIcons name="chat-processing-outline" size={22} color={Colors.primary} />
        </View>
        <View style={styles.sessionContent}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.sessionPreview} numberOfLines={2}>
            {preview}
          </Text>
          <Text style={styles.sessionDate}>{dateStr} · {timeStr}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dashboard.aiChat') || 'AI Health Assistant'}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero / New Chat CTA */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons name="robot-outline" size={32} color={Colors.primary} />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>Ask me anything about your health</Text>
          <Text style={styles.heroSubtitle}>
            Powered by AI · Not a substitute for a real doctor
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={handleNewChat}
          accessibilityRole="button"
          accessibilityLabel="Start a new AI chat"
        >
          <MaterialCommunityIcons name="plus" size={18} color={Colors.surface} />
          <Text style={styles.newChatBtnText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              loadSessions().finally(() => setLoading(false));
            }}
          />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSessionCard}
          contentContainerStyle={[
            styles.listContent,
            sessions.length === 0 && styles.listContentEmpty,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            sessions.length > 0 ? (
              <Text style={styles.sectionLabel}>Recent Conversations</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="chat-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "New Chat" above to start your first conversation with MediCon AI
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// 3. STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
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
    textAlign: 'center',
  },

  // Hero
  heroBanner: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  heroTextWrap: {
    alignItems: 'center',
    gap: 2,
  },
  heroTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  newChatBtnText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.surface,
  },

  // List
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Session card
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    gap: Spacing.md,
  },
  sessionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionContent: {
    flex: 1,
    gap: 2,
  },
  sessionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sessionPreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  sessionDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
  },
});
