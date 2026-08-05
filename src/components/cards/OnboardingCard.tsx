// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, TextStyles } from '@theme';

// 2. TYPES
export interface OnboardingCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor?: string;
}

// 3. COMPONENT
export const OnboardingCard = ({
  icon,
  title,
  description,
  accentColor = Colors.primary,
}: OnboardingCardProps): React.JSX.Element => {
  return (
    <View style={styles.container}>
      <View
        style={[styles.iconContainer, { backgroundColor: accentColor + '1A' }]}
        accessibilityLabel={title}
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    ...TextStyles.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...TextStyles.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
