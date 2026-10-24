import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { ComparisonResult, MedicineLabel } from '../../services/ai/medicineAiService';
import { MedicineLabelView } from './MedicineLabelView';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';

interface MedicineCompareCardProps {
  medA: string;
  medB: string;
  comparison: ComparisonResult;
}

const LabelSection = ({ name, label }: { name: string; label: MedicineLabel | null }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      {label ? (
        <MedicineLabelView label={label} />
      ) : (
        <>
          <Text style={styles.missingTitle}>{name}</Text>
          <Text style={styles.body}>
            {t('medicinecomparecard.no_label', 'No FDA label found for this name.')}
          </Text>
        </>
      )}
    </View>
  );
};

/**
 * Two medicines' FDA labels side by side, plus whether the pair was checked for an
 * interaction. Nothing here is generated: absent data is shown as absent.
 */
export function MedicineCompareCard({ medA, medB, comparison }: MedicineCompareCardProps) {
  const { t } = useTranslation();
  const pair = comparison.interaction;
  const flagged = pair?.checked && pair.severity === 'high';

  return (
    <View style={styles.container}>
      <View style={[styles.section, flagged ? styles.flagged : styles.notChecked]}>
        <Text style={styles.sectionTitle}>
          {t('medicinecomparecard.together', 'Taken together')}
        </Text>
        <View style={styles.flagRow}>
          <MaterialCommunityIcons
            name={flagged ? 'alert' : 'help-circle-outline'}
            size={18}
            color={flagged ? Colors.danger : Colors.textSecondary}
          />
          <Text style={[styles.flagText, flagged && { color: Colors.danger }]}>
            {flagged
              ? pair!.warning
              : t('interaction-checker.not_checked_explanation', {
                  defaultValue:
                    'This combination was not checked. Ask your doctor or pharmacist before taking them together.',
                })}
          </Text>
        </View>
        <Text style={styles.disclaimer}>{comparison.disclaimer}</Text>
      </View>

      <LabelSection name={medA} label={comparison.labelA} />
      <LabelSection name={medB} label={comparison.labelB} />

      <Text style={styles.source}>
        {t(
          'explainer.source',
          'Source: US FDA drug label (openFDA). General information, not medical advice.',
        )}
      </Text>
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
  section: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  notChecked: { backgroundColor: '#F5F8FA' },
  flagged: { backgroundColor: '#FEF2F2' },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  flagRow: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'flex-start' },
  flagText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
  disclaimer: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.5,
  },
  missingTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  source: {
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: FontSize.xs * 1.5,
  },
});
