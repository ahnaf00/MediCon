import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Text,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { useLocalSearchParams, router } from 'expo-router';
import { useChatStore, ChatMessage } from '../../../src/store/chatStore';
import { ChatBubble } from '../../../src/components/medical/ChatBubble';
import { chatService } from '../../../src/services/ai/chatService';

export default function ConsultationChatScreen() {
  const insets = useSafeAreaInsets();
  const { consultationId, doctorName } = useLocalSearchParams<{
    consultationId: string;
    doctorName?: string;
  }>();
  const { conversations, addMessage, updateMessage, clearHistory } = useChatStore();
  const messages = conversations[consultationId] || [];

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);

  const flashListRef = useRef<any>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Clear history on mount to ensure chat is empty initially
    clearHistory(consultationId);
  }, [consultationId, clearHistory]);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim() || activeStreamingId) return;

    // Add user message
    addMessage(consultationId, text.trim(), 'user');
    setInputText('');
    // Add empty AI message placeholder
    const aiMessageId = addMessage(consultationId, '', 'ai');
    setActiveStreamingId(aiMessageId);

    try {
      const stream = chatService.streamResponse(consultationId, text.trim());
      let currentResponse = '';

      // eslint-disable-next-line @typescript-eslint/await-thenable
      for await (const chunk of stream) {
        currentResponse += chunk;
        updateMessage(consultationId, aiMessageId, currentResponse);
        // Scroll to bottom during streaming occasionally or on every chunk if it's smooth
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'NETWORK_ERROR') {
        // Fallback offline message for Tier 3 DoD
        updateMessage(
          consultationId,
          aiMessageId,
          'You appear to be offline. I cannot assist without a network connection. In an emergency, please use the offline protocols on the dashboard.',
        );
      } else {
        updateMessage(
          consultationId,
          aiMessageId,
          'Sorry, I encountered an error processing your request.',
        );
      }
    } finally {
      setActiveStreamingId(null);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      setIsRecording(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    } else {
      setIsRecording(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Mock setting some text after a delay if user doesn't stop it
      setTimeout(() => {
        setIsRecording(false);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        setInputText((prev) => prev + ' Hello, I have a headache.');
      }, 3000);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {doctorName || 'Doctor'}
          </Text>
          <View style={styles.emptyRightSlot} />
        </View>

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

        <View
          style={[
            styles.inputWrapperContainer,
            { paddingBottom: isKeyboardVisible ? Spacing.md : insets.bottom + Spacing.md },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="What do you want to know?"
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.micButton}
                onPress={handleMicPress}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[styles.micIconContainer, { transform: [{ scale: pulseAnim }] }]}
                >
                  <MaterialCommunityIcons
                    name={isRecording ? 'stop-circle-outline' : 'microphone-outline'}
                    size={24}
                    color={isRecording ? Colors.danger : Colors.textSecondary}
                  />
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || activeStreamingId) && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSend(inputText)}
                disabled={!inputText.trim() || !!activeStreamingId}
              >
                <MaterialCommunityIcons
                  name="arrow-up"
                  size={20}
                  color={
                    !inputText.trim() || activeStreamingId ? Colors.textTertiary : Colors.surface
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

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
  emptyRightSlot: {
    width: 44,
    height: 44,
  },
  listContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  inputWrapperContainer: {
    padding: Spacing.md,
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
  micButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  micIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
