// 1. IMPORTS
import React, { useRef, useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { useLocalSearchParams, router } from 'expo-router';
import { useChatStore, ChatMessage } from '../../../src/store/chatStore';
import { ChatBubble } from '../../../src/components/medical/ChatBubble';
import { chatService, AiChatMessage } from '../../../src/services/ai/chatService';

// 2. COMPONENT

export default function AiChatScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId: rawSessionId, title } = useLocalSearchParams<{
    sessionId: string;
    title?: string;
  }>();

  // Track the real backend session ID. If user navigated with "new", it starts null
  // and gets assigned after the first message is sent.
  const [backendSessionId, setBackendSessionId] = useState<number | null>(
    rawSessionId && rawSessionId !== 'new' ? Number(rawSessionId) : null,
  );

  // Use the rawSessionId as the local store key (so "new" chats get their own bucket)
  const storeKey = rawSessionId || 'new';

  const { conversations, addMessage, updateMessage, clearHistory } = useChatStore();
  const messages = conversations[storeKey] || [];

  const [inputText, setInputText] = useState('');
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(title || 'MediCon AI');

  const flashListRef = useRef<any>(null);

  // ─── Load existing session history ──────────────────────────────────────────

  useEffect(() => {
    if (rawSessionId === 'new' || !backendSessionId) {
      // New chat — clear any stale local messages and show welcome
      clearHistory(storeKey);
      addMessage(storeKey, 'Hello! I\'m MediCon AI, your health assistant. Ask me anything about your symptoms, medications, or general health questions. Remember, I\'m not a substitute for a real doctor! 😊', 'system');
      return;
    }

    // Existing session — fetch messages from backend
    let isMounted = true;
    (async () => {
      setLoadingHistory(true);
      try {
        clearHistory(storeKey);
        const msgs = await chatService.getMessages(backendSessionId);
        if (isMounted) {
          msgs.forEach((m: AiChatMessage) => {
            addMessage(storeKey, m.content, m.role === 'user' ? 'user' : 'ai');
          });
        }
      } catch {
        if (isMounted) {
          addMessage(storeKey, 'Failed to load chat history. You can still send new messages.', 'system');
        }
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    })();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Keyboard tracking ─────────────────────────────────────────────────────

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
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ─── Send message ───────────────────────────────────────────────────────────

  const handleSend = async (text: string) => {
    if (!text.trim() || activeStreamingId) return;

    const trimmed = text.trim();

    // Add user bubble immediately
    addMessage(storeKey, trimmed, 'user');
    setInputText('');

    // Add empty AI placeholder bubble
    const aiMessageId = addMessage(storeKey, '', 'ai');
    setActiveStreamingId(aiMessageId);

    try {
      const response = await chatService.sendMessage(trimmed, backendSessionId ?? undefined);
      const fullContent = response.message.content;

      // If this was a new chat, capture the backend session ID for future messages
      if (!backendSessionId && response.sessionId) {
        setBackendSessionId(response.sessionId);
        // Update header title from the session's auto-generated title
        if (rawSessionId === 'new') {
          setHeaderTitle(trimmed.substring(0, 40) + (trimmed.length > 40 ? '…' : ''));
        }
      }

      // Client-side character-reveal animation
      let revealed = '';
      for (let i = 0; i < fullContent.length; i++) {
        revealed += fullContent[i];
        updateMessage(storeKey, aiMessageId, revealed);
        if (i % 5 === 0) await new Promise((r) => setTimeout(r, 10));
      }
    } catch {
      updateMessage(
        storeKey,
        aiMessageId,
        'Sorry, I encountered an error processing your request. Please try again.',
      );
    } finally {
      setActiveStreamingId(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {headerTitle}
            </Text>
            <View style={styles.headerBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>AI Assistant</Text>
            </View>
          </View>
          <View style={styles.emptyRightSlot} />
        </View>

        {/* Chat Messages */}
        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading conversation…</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlashList<ChatMessage>
              ref={flashListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <ChatBubble message={item} isTyping={item.id === activeStreamingId} />
              )}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => {
                if (messages.length > 0) {
                  flashListRef.current?.scrollToEnd({ animated: true });
                }
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputWrapperContainer,
            { paddingBottom: isKeyboardVisible ? Spacing.md : insets.bottom + Spacing.md },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about symptoms, meds, health…"
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              editable={!loadingHistory}
            />
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || !!activeStreamingId) && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSend(inputText)}
                disabled={!inputText.trim() || !!activeStreamingId}
              >
                {activeStreamingId ? (
                  <ActivityIndicator size="small" color={Colors.textTertiary} />
                ) : (
                  <MaterialCommunityIcons
                    name="arrow-up"
                    size={20}
                    color={
                      !inputText.trim() ? Colors.textTertiary : Colors.surface
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.disclaimer}>
            MediCon AI can make mistakes. Always consult a real doctor.
          </Text>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// 3. STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 5,
    paddingLeft: 5,
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
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: '500',
  },
  emptyRightSlot: {
    width: 44,
    height: 44,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },

  // Chat list
  listContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },

  // Input area
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
