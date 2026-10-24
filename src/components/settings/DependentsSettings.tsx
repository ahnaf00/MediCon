import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';

/** The server has no dependents / family profiles yet, so this says so. */
export function DependentsSettings() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="account-multiple-outline"
        size={48}
        color={Colors.textTertiary}
      />
      <Text style={styles.text}>
        {t(
          'settings.dependentsUnavailable',
          'Adding family members is not available yet. Each person needs their own account for now.',
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  text: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
});
