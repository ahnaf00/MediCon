import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MedicineLabel } from '../../services/ai/medicineAiService';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';

const PREVIEW_CHARS = 350;

/** FDA label sections start with their own heading ("Purpose …", "Warnings …"); drop it. */
export const stripHeading = (text: string): string =>
  text
    .replace(/^\s*(purpose|uses|indications (and|&) usage|warnings( and cautions)?)[\s:.-]+/i, '')
    .trim();

/** A long label section, shortened until the reader asks for all of it. */
const LongText = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const long = text.length > PREVIEW_CHARS;
  return (
    <>
      <Text style={styles.body}>
        {open || !long ? text : `${text.slice(0, PREVIEW_CHARS).trimEnd()}…`}
      </Text>
      {long && (
        <TouchableOpacity onPress={() => setOpen((v) => !v)} accessibilityRole="button">
          <Text style={styles.more}>{open ? 'Show less' : 'Show more'}</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

/** The fields of one US FDA drug label. Missing fields say so instead of being guessed. */
export const MedicineLabelView = ({ label }: { label: MedicineLabel }): React.JSX.Element => {
  const { t } = useTranslation();
  const notListed = t('explainer.not_listed', 'Not listed on the label.');
  const rows: [string, string | null][] = [
    [t('explainer.generic_name', 'Generic name'), label.genericName],
    [t('explainer.manufacturer', 'Manufacturer'), label.manufacturer],
  ];
  return (
    <View>
      <Text style={styles.title}>{label.brandName}</Text>
      {label.searchedAs ? (
        <Text style={styles.searchedAs}>
          {`${t('explainer.searched_as', 'US label found under its US name:')} ${label.searchedAs}.`}
        </Text>
      ) : null}
      {rows.map(([name, value]) => (
        <View key={name} style={styles.row}>
          <Text style={styles.label}>{name}</Text>
          <Text style={styles.value}>{value ?? notListed}</Text>
        </View>
      ))}
      <Text style={styles.section}>{t('explainer.uses', 'Uses')}</Text>
      {label.purpose ? (
        <LongText text={stripHeading(label.purpose)} />
      ) : (
        <Text style={styles.body}>{notListed}</Text>
      )}
      <Text style={styles.section}>{t('explainer.warnings', 'Warnings')}</Text>
      {label.warnings ? (
        <LongText text={stripHeading(label.warnings)} />
      ) : (
        <Text style={styles.body}>{notListed}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  searchedAs: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.xs },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  value: { fontFamily: FontFamily.medium, fontSize: FontSize.sm, color: Colors.textSecondary },
  section: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  body: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  more: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
});
