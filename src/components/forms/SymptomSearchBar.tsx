import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

interface SymptomSearchBarProps {
  /** When true, the bar is a real input with mic/submit. When false (default), it's a tap-to-navigate button. */
  interactive?: boolean;
  onSubmit?: (query: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SymptomSearchBar({
  interactive = false,
  onSubmit,
  autoFocus = false,
  placeholder,
}: SymptomSearchBarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const stopRecording = () => {
    setIsRecording(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleMicPress = () => {
    if (!interactive) {
      // Navigate to search screen and auto-start recording
      router.push({ pathname: '/(app)/doctors/search', params: { autoRecord: '1' } });
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      setIsRecording(true);
      inputRef.current?.blur();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
      // Mock: auto-fill after 3 s
      recordingTimerRef.current = setTimeout(() => {
        setQuery('sharp chest pain');
        stopRecording();
        inputRef.current?.focus();
      }, 3000);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit?.(query.trim());
    }
  };

  if (!interactive) {
    // Non-interactive: render as a tappable button that navigates to the search screen
    return (
      <View style={styles.searchBar}>
        <TouchableOpacity
          style={styles.searchContent}
          onPress={() => router.push('/(app)/doctors/search')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={placeholder || t('search.placeholder') || 'Search by symptoms'}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color={Colors.textTertiary}
            style={styles.searchIcon}
          />
          <Text style={styles.placeholder}>
            {placeholder || t('search.placeholder') || 'Search by symptoms...'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.micButton}
          onPress={handleMicPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voice search"
        >
          <View style={styles.micIconContainer}>
            <MaterialCommunityIcons name="microphone" size={20} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Interactive: real editable input with mic
  return (
    <View style={styles.searchBar}>
      <MaterialCommunityIcons
        name={isRecording ? 'microphone' : 'magnify'}
        size={24}
        color={isRecording ? Colors.primary : Colors.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={
          isRecording
            ? t('search.listening') || 'Listening...'
            : placeholder || t('search.placeholder') || 'Search by symptoms...'
        }
        placeholderTextColor={isRecording ? Colors.primary : Colors.textTertiary}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
          <MaterialCommunityIcons name="close-circle" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.micButton} onPress={handleMicPress} activeOpacity={0.7}>
        <Animated.View style={[styles.micIconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialCommunityIcons
            name={isRecording ? 'stop-circle' : 'microphone'}
            size={20}
            color={isRecording ? Colors.danger : Colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(64, 86, 109, 0.2)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  placeholder: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textTertiary,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    height: '100%',
  },
  clearButton: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  micButton: {
    padding: Spacing.xs,
  },
  micIconContainer: {
    backgroundColor: Colors.tertiary,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
