// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize } from '@theme';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';

// 2. TYPES
export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

// 3. COMPONENT
export const ErrorState = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          label={t('errorstate.retry') || 'Retry'}
          onPress={onRetry}
          variant="outline"
          accessibilityHint="Attempts to reload the content"
        />
      )}
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  icon: {
    fontSize: 48,
  },
  message: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
});
