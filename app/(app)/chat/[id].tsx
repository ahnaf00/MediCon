import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { useAuthStore } from '../../../src/store';
import {
  ChatMessage,
  chatPartner,
  chatTime,
  iAmPatient,
  useChatMessages,
  useDirectChats,
  useSendChatMessage,
} from '../../../src/services/api/directChatService';

const MAX_LENGTH = 5000;

/** One doctor-patient chat (audit M1). Polls for new messages while open. */
export default function ChatThreadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const { data: chats } = useDirectChats();
  const chat = chats?.find((c) => c.id === id);
  const { data: messages = [], isLoading, isError } = useChatMessages(id);
  const send = useSendChatMessage(id as string);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const partner = chat ? chatPartner(chat, userId) : null;
  const meIsPatient = chat ? iAmPatient(chat, userId) : false;

  const onSend = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    setSendError(null);
    send.mutate(body, {
      onSuccess: () => setDraft(''),
      onError: (err: any) =>
        setSendError(err?.message || t('chat.sendError', 'Message not sent. Try again.')),
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.fromPatient === meIsPatient;
    return (
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.body}</Text>
        <Text style={[styles.bubbleTime, mine && styles.mineTime]}>{chatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {partner?.name ?? t('chat.title', 'Messages')}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('chat.threadError', 'Could not load this chat.')}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={messages.length === 0 ? styles.center : styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t('chat.startHint', 'Send a message to start the conversation.')}
            </Text>
          }
        />
      )}

      {sendError && <Text style={styles.sendError}>{sendError}</Text>}
      <View style={[styles.inputRow, { paddingBottom: Spacing.sm + insets.bottom }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.placeholder', 'Write a message')}
          placeholderTextColor={Colors.textTertiary}
          multiline
          maxLength={MAX_LENGTH}
          accessibilityLabel="Message"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!draft.trim() || send.isPending) && styles.sendDisabled]}
          onPress={onSend}
          disabled={!draft.trim() || send.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('chat.send', 'Send')}
        >
          {send.isPending ? (
            <ActivityIndicator color={Colors.surface} size="small" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color={Colors.surface} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  list: { padding: Spacing.base, gap: Spacing.sm },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 20 },
  mineText: { color: Colors.surface },
  bubbleTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  mineTime: { color: Colors.tertiary },
  sendError: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
