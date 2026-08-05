import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, TextStyles } from '../../theme';

export interface PlaceholderScreenProps {
  title: string;
  description?: string;
}

export const PlaceholderScreen = ({ title, description }: PlaceholderScreenProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...TextStyles.h2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
