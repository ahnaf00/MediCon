import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Biomarker } from '../../types/medical.types';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface BiomarkerRowProps {
  biomarker: Biomarker;
  isLast?: boolean;
}

export function BiomarkerRow({ biomarker, isLast }: BiomarkerRowProps) {
  const { t } = useTranslation();
  const valueColor = biomarker.isFlagged ? Colors.danger : Colors.textPrimary;

  return (
    <View style={[styles.container, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          {biomarker.isFlagged && (
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color={Colors.danger}
              style={styles.icon}
            />
          )}
          <Text style={[styles.name, biomarker.isFlagged && styles.nameFlagged]}>
            {biomarker.name}
          </Text>
        </View>

        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: valueColor }]}>{biomarker.value}</Text>
          {biomarker.unit ? <Text style={styles.unit}>{biomarker.unit}</Text> : null}
        </View>
      </View>

      {biomarker.referenceRange ? (
        <View style={styles.bottomRow}>
          <Text style={styles.referenceLabel}>Reference Intervals:</Text>
          <Text style={styles.referenceValue}>{biomarker.referenceRange}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  name: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  nameFlagged: {
    color: Colors.danger,
    fontFamily: FontFamily.bold,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
  },
  unit: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  referenceLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  referenceValue: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: '#000000',
    textAlign: 'right',
  },
});
