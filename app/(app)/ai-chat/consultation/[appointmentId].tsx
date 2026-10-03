// 1. IMPORTS
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../../src/theme';
import type { ChatMessage } from '../../../../src/store/chatStore';
import { ChatBubble } from '../../../../src/components/medical/ChatBubble';
import { useAiMessages } from '../../../../src/services/ai/chatService';
import {
  ConsultationChatStream,
  streamConsultationChat,
} from '../../../../src/services/ai/consultationChatService';
import { useConsultation } from '../../../../src/services/api/consultationsService';

// 2. HELPERS
const formatDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

let localIdCounter = 0;
const makeMessage = (text: string, sender: ChatMessage['sender']): ChatMessage => ({
  id: `local-${Date.now()}-${localIdCounter++}`,
  text,
  sender,
  timestamp: new Date().toISOString(),
});

// 3. COMPONENT
/**
 * Patient's AI chat about one completed consultation. Answers stream token by
 * token from POST /ai/consultation-chat and are grounded in the summary the
 * doctor wrote; without that summary the chat is shown as unavailable.
 */
export default function ConsultationChatScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  const queryClient = useQueryClient();
  const consultation = useConsultation(appointmentId);
  const details = consultation.data;
  const historySessionId = details?.chatSessionId ?? null;
  const history = useAiMessages(historySessionId ?? 0);

  // The visible transcript: seeded from the saved history, then appended to
  // locally while answers stream in (ephemeral UI state).
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const streamRef = useRef<ConsultationChatStream | null>(null);
  const listRef = useRef<FlashListRef<ChatMessage>>(null);

  const doctorName = details?.doctor.name ?? t('consultation_chat.your_doctor', 'Your doctor');
  const consultationDate = formatDate(details?.appointment.datetime);
  const available = details?.appointment.status === 'completed' && !!details.summary;
  const historyReady = !historySessionId || history.isSuccess || history.isError;

  // Seed once, when the consultation (and any earlier chat) has loaded.
  if (!seeded && details && available && historyReady) {
    setSeeded(true);
    const greeting = makeMessage(
      t(
        'consultation_chat.greeting',
        'Hi! I can answer questions about your recent consultation with {{doctor}} on {{date}}, based on the notes your doctor recorded.',
        { doctor: doctorName, date: consultationDate },
      ),
      'system',
    );
    const previous = (history.data ?? []).map((m) => ({
      id: `server-${m.id}`,
      text: m.content,
      sender: m.role === 'user' ? ('user' as const) : ('ai' as const),
      timestamp: m.createdAt,
    }));
    setMessages([greeting, ...previous]);
  }

  // Stop reading the stream if the screen closes mid-answer.
  useEffect(() => () => streamRef.current?.abort(), []);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const appendToMessage = (id: string, text: string) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + text } : m)));

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streamingId || !appointmentId) return;

    const userMessage = makeMessage(trimmed, 'user');
    const aiMessage = makeMessage('', 'ai');
    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInputText('');
    setStreamingId(aiMessage.id);

    streamRef.current = streamConsultationChat(appointmentId, trimmed, {
      onDelta: (delta) => appendToMessage(aiMessage.id, delta),
      onDone: () => {
        streamRef.current = null;
        setStreamingId(null);
        // Refresh the cached session id/history so reopening this chat shows it.
        queryClient.invalidateQueries({
          queryKey: ['consultation-summary', String(appointmentId)],
        });
        queryClient.invalidateQueries({ queryKey: ['ai-messages'] });
      },
      onError: (message) => {
        streamRef.current = null;
        setStreamingId(null);
        setMessages((prev) => [
          ...prev.filter((m) => !(m.id === aiMessage.id && m.text === '')),
          makeMessage(message, 'system'),
        ]);
      },
    });
  };

  const handleStop = () => {
    streamRef.current?.abort();
    streamRef.current = null;
    if (streamingId) {
      appendToMessage(streamingId, ` ${t('consultation_chat.stopped', '(stopped)')}`);
    }
    setStreamingId(null);
  };

  const suggestions = [
    t('consultation_chat.suggest_discussed', 'What was discussed between us?'),
    t('consultation_chat.suggest_medicines', 'How should I take my medicines?'),
    t('consultation_chat.suggest_urgent', 'When should I seek urgent care?'),
  ];
  const hasUserMessages = messages.some((m) => m.sender === 'user');

  // ─── Unavailable / loading states ──────────────────────────────────────────
  const renderBody = () => {
    if (consultation.isLoading || (available && !seeded)) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (consultation.isError || !details) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={44}
            color={Colors.textTertiary}
          />
          <Text style={styles.stateText}>
            {t('consultation_chat.load_failed', 'Could not load this consultation.')}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => consultation.refetch()}>
            <Text style={styles.retryText}>{t('consultation_chat.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!available) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={44}
            color={Colors.textTertiary}
          />
          <Text style={styles.stateTitle}>
            {t('consultation_chat.unavailable_title', 'AI chat not available yet')}
          </Text>
          <Text style={styles.stateText}>
            {t(
              'consultation_chat.unavailable_body',
              '{{doctor}} has not added a summary for this consultation yet. The AI only answers from your doctor’s notes, so this chat opens once they do.',
              { doctor: doctorName },
            )}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <FlashList<ChatMessage>
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ChatBubble message={item} isTyping={item.id === streamingId} />
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
        {!hasUserMessages && !streamingId && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.chip}
                onPress={() => handleSend(s)}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {details?.doctor.name ?? ''}
            </Text>
            {!!consultationDate && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {t('consultation_chat.subtitle', 'AI assistant · Consultation on {{date}}', {
                  date: consultationDate,
                })}
              </Text>
            )}
          </View>
          <View style={styles.emptyRightSlot} />
        </View>

        {renderBody()}

        {available && seeded && (
          <View
            style={[
              styles.inputWrapperContainer,
              { paddingBottom: isKeyboardVisible ? Spacing.md : insets.bottom + Spacing.md },
            ]}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder={t('consultation_chat.placeholder', 'What do you want to know?')}
                placeholderTextColor={Colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
              />
              <View style={styles.actionButtonsContainer}>
                {streamingId ? (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleStop}
                    accessibilityRole="button"
                    accessibilityLabel={t('consultation_chat.stop', 'Stop answer')}
                  >
                    <MaterialCommunityIcons name="stop" size={18} color={Colors.surface} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={() => handleSend(inputText)}
                    disabled={!inputText.trim()}
                    accessibilityRole="button"
                    accessibilityLabel={t('consultation_chat.send', 'Send')}
                  >
                    <MaterialCommunityIcons
                      name="arrow-up"
                      size={20}
                      color={!inputText.trim() ? Colors.textTertiary : Colors.surface}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.disclaimer}>
              {t(
                'consultation_chat.disclaimer',
                'AI answers are based on your doctor’s notes and can make mistakes. Not a substitute for medical advice — in an emergency, call 999.',
              )}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  emptyRightSlot: {
    width: 44,
    height: 44,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.background,
  },
  stateTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },
  retryButton: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  chipsRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  inputWrapperContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  inputWrapper: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  textInput: {
    width: '100%',
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 120,
    minHeight: 24,
    padding: 0,
    textAlignVertical: 'top',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.tertiary,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
