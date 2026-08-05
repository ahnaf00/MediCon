// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';

// 2. TYPES
export interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

// 3. COMPONENT
const badgeColors: Record<NonNullable<BadgeProps['variant']>, { bg: string; text: string }> = {
  default: { bg: Colors.tertiary, text: Colors.textSecondary },
  success: { bg: '#e6f9ed', text: '#1a7f37' },
  warning: { bg: '#fff7e0', text: '#9a6700' },
  danger: { bg: '#fde8eb', text: Colors.danger },
  info: { bg: Colors.tertiary, text: Colors.primary },
};

export const Badge = ({ label, variant = 'default' }: BadgeProps): React.JSX.Element => {
  const colors = badgeColors[variant];

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.bg }]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
  },
});
