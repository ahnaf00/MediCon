import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComparisonResult } from '../../services/ai/medicineAiService';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { AIDisclaimer } from './AIDisclaimer';
import { useTranslation } from 'react-i18next';

interface MedicineCompareCardProps {
  medA: string;
  medB: string;
  comparison: ComparisonResult;
}

export function MedicineCompareCard({ medA, medB, comparison }: MedicineCompareCardProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{medA}</Text>
        <MaterialCommunityIcons name="swap-horizontal" size={24} color={Colors.textSecondary} />
        <Text style={styles.headerTitle}>{medB}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('medicinecomparecard.similarities') || 'Similarities'}
        </Text>
        {comparison.similarities.map((item, index) => (
          <View key={`sim-${index}`} style={styles.listItem}>
            <MaterialCommunityIcons
              name="check"
              size={16}
              color={Colors.success}
              style={styles.listIcon}
            />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('medicinecomparecard.differences') || 'Differences'}
        </Text>
        {comparison.differences.map((item, index) => (
          <View key={`diff-${index}`} style={styles.listItem}>
            <MaterialCommunityIcons
              name="circle-medium"
              size={16}
              color={Colors.primary}
              style={styles.listIcon}
            />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.rationaleBox}>
        <AIDisclaimer />
        <Text style={styles.rationaleText}>{comparison.rationale}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  listIcon: {
    marginTop: 2,
    marginRight: Spacing.xs,
  },
  listText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  rationaleBox: {
    padding: Spacing.md,
    backgroundColor: '#F5F3FF', // light purple for AI insight
  },
  rationaleText: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
});
