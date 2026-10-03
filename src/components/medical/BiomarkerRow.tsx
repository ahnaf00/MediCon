import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LabResult, LabResultStatus } from '../../services/api/reportsService';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';
import { useTranslation } from 'react-i18next';

interface BiomarkerRowProps {
  result: LabResult;
  isLast?: boolean;
}

export const STATUS_COLORS: Record<LabResultStatus, string> = {
  low: Colors.warning,
  normal: Colors.success,
  high: Colors.danger,
  unknown: Colors.textTertiary,
};

export function BiomarkerRow({ result, isLast }: BiomarkerRowProps) {
  const { t } = useTranslation();
  const isFlagged = result.status === 'low' || result.status === 'high';
  const statusColor = STATUS_COLORS[result.status];
  const statusLabel =
    result.status === 'high'
      ? t('report_analysis.status_high', 'High')
      : result.status === 'low'
        ? t('report_analysis.status_low', 'Low')
        : null;

  return (
    <View
      style={[styles.container, isLast && { borderBottomWidth: 0 }]}
      testID={`biomarker-${result.id}`}
      accessible
      accessibilityLabel={[result.name, result.value, result.unit, statusLabel]
        .filter(Boolean)
        .join(' ')}
    >
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <View
            style={[styles.statusDot, { backgroundColor: statusColor }]}
            testID={`status-dot-${result.status}`}
          />
          <Text style={[styles.name, isFlagged && styles.nameFlagged]}>{result.name}</Text>
        </View>

        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: isFlagged ? statusColor : Colors.textPrimary }]}>
            {result.value}
          </Text>
          {result.unit ? <Text style={styles.unit}>{result.unit}</Text> : null}
          {statusLabel ? (
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          ) : null}
        </View>
      </View>

      {result.referenceText ? (
        <View style={styles.bottomRow}>
          <Text style={styles.referenceLabel}>
            {t('report_analysis.reference_intervals', 'Reference Intervals:')}
          </Text>
          {/* Shown exactly as printed, including sex-specific ranges. */}
          <Text style={styles.referenceValue}>{result.referenceText}</Text>
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  nameFlagged: {
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
  statusLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    marginLeft: 2,
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
