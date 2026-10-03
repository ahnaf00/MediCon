import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

// No voice input: the app has no speech-to-text, and a mic that guesses
// symptoms can send a patient to the wrong specialist.

interface SymptomSearchBarProps {
  /** When true, the bar is a real input with submit. When false (default), it's a tap-to-navigate button. */
  interactive?: boolean;
  onSubmit?: (query: string) => void;
  /** Called when the user clears the input with the clear button. */
  onClear?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function SymptomSearchBar({
  interactive = false,
  onSubmit,
  onClear,
  autoFocus = false,
  placeholder,
}: SymptomSearchBarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit?.(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
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
      </View>
    );
  }

  // Interactive: real editable input
  return (
    <View style={styles.searchBar}>
      <MaterialCommunityIcons
        name="magnify"
        size={24}
        color={Colors.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder || t('search.placeholder') || 'Search by symptoms...'}
        placeholderTextColor={Colors.textTertiary}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      {query.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <MaterialCommunityIcons name="close-circle" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      )}
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
  },
});
