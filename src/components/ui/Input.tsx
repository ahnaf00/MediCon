// 1. IMPORTS
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '@theme';

// 2. TYPES
export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  disabled?: boolean;
}

// 3. COMPONENT
export const Input = ({
  label,
  error,
  disabled = false,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: InputProps): React.JSX.Element => {
  const [isFocused, setIsFocused] = useState(false);

  const inputBorderColor = error ? Colors.danger : isFocused ? Colors.primary : Colors.textTertiary;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, { borderColor: inputBorderColor }, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    includeFontPadding: false,
    paddingTop: 0,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.background,
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
});
