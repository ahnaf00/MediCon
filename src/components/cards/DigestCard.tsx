import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DigestData } from '../../services/api/appointmentsService';
import { useTranslation } from 'react-i18next';

interface DigestCardProps {
  data: DigestData;
}

export function DigestCard({ data }: DigestCardProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={Colors.primary} />
        <Text style={styles.title}>
          {t('digestcard.preconsultation_digest') || 'Pre-Consultation Digest'}
        </Text>
      </View>

      <Text style={styles.subtitle}>
        {t('digestcard.the_following_information_will') ||
          'The following information will be shared with your doctor for this consultation.'}
      </Text>

      {/* Vitals Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('digestcard.recent_vitals') || 'Recent Vitals'}</Text>
        <View style={styles.vitalsGrid}>
          <View style={styles.vitalItem}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color={Colors.danger} />
            <Text style={styles.vitalLabel}>{t('digestcard.bp') || 'BP'}</Text>
            <Text style={styles.vitalValue}>{data.vitals.bloodPressure}</Text>
          </View>
          <View style={styles.vitalItem}>
            <MaterialCommunityIcons name="timeline-alert" size={20} color={Colors.warning} />
            <Text style={styles.vitalLabel}>{t('digestcard.heart_rate') || 'Heart Rate'}</Text>
            <Text style={styles.vitalValue}>
              {data.vitals.heartRate} {t('digestcard.bpm') || 'bpm'}
            </Text>
          </View>
          <View style={styles.vitalItem}>
            <MaterialCommunityIcons name="thermometer" size={20} color={Colors.primary} />
            <Text style={styles.vitalLabel}>{t('digestcard.temp') || 'Temp'}</Text>
            <Text style={styles.vitalValue}>
              {data.vitals.temperature}
              {t('digestcard.f') || '°F'}
            </Text>
          </View>
          <View style={styles.vitalItem}>
            <MaterialCommunityIcons name="scale-bathroom" size={20} color={Colors.primary} />
            <Text style={styles.vitalLabel}>{t('digestcard.weight') || 'Weight'}</Text>
            <Text style={styles.vitalValue}>
              {data.vitals.weight} {t('digestcard.kg') || 'kg'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Medicines Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('digestcard.current_medicines') || 'Current Medicines'}
        </Text>
        {data.medicines.map((med, index) => (
          <View key={index} style={styles.listItem}>
            <MaterialCommunityIcons name="pill" size={16} color={Colors.textSecondary} />
            <Text style={styles.listText}>{med}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Reports Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('digestcard.attached_reports') || 'Attached Reports'}
        </Text>
        {data.reports.map((report) => (
          <View key={report.id} style={styles.listItem}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={16}
              color={Colors.textSecondary}
            />
            <Text style={styles.listText}>{report.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  vitalItem: {
    flexBasis: '45%',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'flex-start',
  },
  vitalLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  vitalValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.tertiary,
    marginVertical: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  listText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    lineHeight: FontSize.sm * 1.5,
  },
});
