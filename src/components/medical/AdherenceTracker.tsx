import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AdherenceRecord } from '../../types/medical.types';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { prescriptionsService } from '../../services/api/prescriptionsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export function AdherenceTracker() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<AdherenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await prescriptionsService.getDailyAdherence(today);
        if (isMounted) setRecords(data);
      } catch {
        // Silently handle error for now
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  const taken = records.filter((r) => r.status === 'TAKEN').length;
  const missed = records.filter((r) => r.status === 'MISSED').length;
  const pending = records.filter((r) => r.status === 'PENDING').length;
  const total = records.length;

  const threshold = prescriptionsService.calculateAdherenceThreshold(taken, total);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('adherencetracker.todays_adherence') || "Today's Adherence"}
      </Text>

      {total === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="check-circle-outline" size={24} color={Colors.success} />
          <Text style={styles.emptyText}>
            {t('adherencetracker.no_medicines_scheduled_for_tod') ||
              'No medicines scheduled for today.'}
          </Text>
        </View>
      ) : (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: Colors.success }]}>{taken}</Text>
            <Text style={styles.statLabel}>{t('adherencetracker.taken') || 'Taken'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: Colors.warning }]}>{pending}</Text>
            <Text style={styles.statLabel}>{t('adherencetracker.pending') || 'Pending'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: Colors.danger }]}>{missed}</Text>
            <Text style={styles.statLabel}>{t('adherencetracker.missed') || 'Missed'}</Text>
          </View>

          <View style={styles.gradeBox}>
            <Text style={styles.gradeLabel}>{t('adherencetracker.status') || 'Status'}</Text>
            <Text
              style={[
                styles.gradeText,
                threshold === 'GOOD'
                  ? { color: Colors.success }
                  : threshold === 'FAIR'
                    ? { color: Colors.warning }
                    : { color: Colors.danger },
              ]}
            >
              {threshold}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
  },
  statLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  gradeBox: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  gradeLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  gradeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    marginTop: 2,
    lineHeight: FontSize.md * 1.5,
  },
});
