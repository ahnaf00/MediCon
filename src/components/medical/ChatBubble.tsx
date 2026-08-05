import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { ChatMessage } from '../../store/chatStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChatBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function ChatBubble({ message, isTyping = false }: ChatBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.textTertiary} />
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isUser ? styles.containerUser : styles.containerAi]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAi]}>
          {message.text}
          {isTyping && <Text style={styles.typingIndicator}> ▋</Text>}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    maxWidth: '85%',
  },
  containerUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerAi: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
  },
  textUser: {
    color: Colors.surface,
  },
  textAi: {
    color: Colors.textPrimary,
  },
  typingIndicator: {
    color: Colors.primary,
  },
  timestamp: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    marginHorizontal: 4,
  },
  systemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.xs,
  },
  systemText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    lineHeight: FontSize.sm * 1.5,
  },
});
