import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  timestamp: string;
  isOutgoing: boolean;
  dateGroup: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello Doctor, I have been feeling a bit dizzy since yesterday.',
    timestamp: '10:00 AM',
    isOutgoing: false,
    dateGroup: 'Yesterday',
  },
  {
    id: '2',
    text: 'Hi there. Could you tell me if you are taking any new medications?',
    timestamp: '10:05 AM',
    isOutgoing: true,
    dateGroup: 'Yesterday',
  },
  {
    id: '3',
    text: 'No new medications, just the ones you prescribed last time.',
    timestamp: '10:10 AM',
    isOutgoing: false,
    dateGroup: 'Yesterday',
  },
  {
    id: '4',
    text: 'I see. How is your blood pressure?',
    timestamp: '9:00 AM',
    isOutgoing: true,
    dateGroup: 'Today',
  },
  {
    id: '5',
    text: 'It was 130/85 this morning.',
    timestamp: '9:15 AM',
    isOutgoing: false,
    dateGroup: 'Today',
  },
];

export default function ChatScreen() {
  const { id, patientName } = useLocalSearchParams<{ id: string; patientName: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Keyboard visibility listener
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOutgoing: true,
      dateGroup: 'Today',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View>
        <View
          style={[
            styles.messageBubbleWrapper,
            item.isOutgoing ? styles.wrapperOutgoing : styles.wrapperIncoming,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              item.isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.isOutgoing ? styles.textOutgoing : styles.textIncoming,
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                item.isOutgoing ? styles.timestampOutgoing : styles.timestampIncoming,
              ]}
            >
              {item.timestamp}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']} />
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{patientName || 'Patient'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        {/* ── CHAT FEED ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.feedContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* ── BOTTOM INPUT CONTROL BAR ── */}
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: isKeyboardVisible ? Spacing.base : insets.bottom + Spacing.base,
            },
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="paperclip" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <MaterialCommunityIcons name="microphone" size={24} color={Colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={inputText.trim() ? Colors.surface : Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
    zIndex: 10,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.surface,
    opacity: 0.8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  feedContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateHeaderText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiaryLight,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  wrapperIncoming: {
    justifyContent: 'flex-start',
  },
  wrapperOutgoing: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleIncoming: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleOutgoing: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
  },
  textIncoming: {
    color: Colors.textPrimary,
  },
  textOutgoing: {
    color: Colors.surface,
  },
  timestamp: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampIncoming: {
    color: Colors.textTertiary,
  },
  timestampOutgoing: {
    color: Colors.surface,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.lg,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    maxHeight: 100,
    minHeight: 48,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: 4,
  },
  iconButton: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    paddingLeft: 3,
    ...Shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.tertiary,
    elevation: 0,
    shadowOpacity: 0,
  },
});
