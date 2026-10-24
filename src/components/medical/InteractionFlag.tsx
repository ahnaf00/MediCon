import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { InteractionConflict } from '../../services/ai/medicineAiService';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

interface InteractionFlagProps {
  conflict: InteractionConflict;
}

export function InteractionFlag({ conflict }: InteractionFlagProps) {
  const { t } = useTranslation();
  // Default is "not checked", shown neutral. There is no green/safe state:
  // a pair no rule covers has not been confirmed safe.
  let bgColor = '#F3F4F6'; // grey light
  let borderColor = '#E5E7EB';
  let iconColor = Colors.textSecondary;
  let iconName: any = 'help-circle';
  let label = t('interaction-checker.not_checked');
  const explanation =
    conflict.severity === 'NOT_CHECKED'
      ? t('interaction-checker.not_checked_explanation')
      : conflict.explanation;

  if (conflict.severity === 'MINOR') {
    bgColor = '#FFFBEB'; // yellow light
    borderColor = '#FEF3C7';
    iconColor = Colors.warning;
    iconName = 'alert';
    label = 'Minor Interaction';
  } else if (conflict.severity === 'SEVERE') {
    bgColor = '#FEF2F2'; // red light
    borderColor = '#FEE2E2';
    iconColor = Colors.danger;
    iconName = 'alert-octagon';
    label = 'Severe Interaction';
  }

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor, borderColor }]}
      testID={`interaction-flag-${conflict.severity}`}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
          <Text style={[styles.title, { color: iconColor }]}>{label}</Text>
        </View>
        <Text style={styles.medicineName}>{conflict.existingMedicineName}</Text>
      </View>
      <Text style={styles.explanation}>{explanation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
  },
  medicineName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  explanation: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
});
