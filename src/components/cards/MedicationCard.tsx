// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DashboardMedication } from '../../hooks/usePatientDashboard';
import { Card } from '../ui/Card';
import { useTranslation } from 'react-i18next';
import { useAlarmStore } from '../../store/alarmStore';

// 2. TYPES
export interface MedicationCardProps {
  medication: DashboardMedication | null;
  onPress?: () => void;
}

const statusConfig: Record<
  DashboardMedication['status'],
  { variant: 'info' | 'success' | 'danger'; label: string }
> = {
  upcoming: { variant: 'info', label: 'Upcoming' },
  taken: { variant: 'success', label: 'Taken' },
  missed: { variant: 'danger', label: 'Missed' },
};

// 3. COMPONENT
export const MedicationCard = ({ medication, onPress }: MedicationCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { mutedPeriods, toggleMute } = useAlarmStore();

  const isMuted = medication?.periodName
    ? mutedPeriods[medication.periodName.toLowerCase()]
    : false;
  if (!medication || !medication.medicines || medication.medicines.length === 0) {
    return (
      <Card accessibilityLabel="No active medications">
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="clipboard-outline" size={32} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>
            {t('medicationcard.no_prescription_scheduled') || 'No prescription scheduled'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('medicationcard.your_scheduled_medicines_will_appear') ||
              'Your scheduled medicines will appear here.'}
          </Text>
        </View>
      </Card>
    );
  }

  const config = statusConfig[medication.status];

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Next medication period: ${medication.periodName} at ${medication.scheduledTime}, status ${config.label}. Medicines: ${medication.medicines.map((m) => m.name).join(', ')}`}
    >
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="pill" size={24} color={Colors.secondary} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.sectionLabel}>
              {t('medicationcard.next_medication') || 'Next Medication'}
            </Text>
            <Text style={styles.periodLabel}>{medication.periodName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.timeBadge}
          activeOpacity={0.7}
          onPress={() => {
            if (medication?.periodName) {
              toggleMute(medication.periodName.toLowerCase());
            }
          }}
        >
          <MaterialCommunityIcons
            name={isMuted ? 'alarm-off' : 'alarm'}
            size={14}
            color={Colors.textPrimary}
          />
          <Text style={styles.timeText}>{medication.scheduledTime}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.medsList}>
        {medication.medicines.map((med, index) => (
          <View
            key={med.id}
            style={[
              styles.body,
              index > 0 && styles.bodyBorder,
              index === medication.medicines.length - 1 && { paddingBottom: 0 },
            ]}
          >
            <View style={styles.details}>
              <View style={styles.medNameRow}>
                <Text style={styles.medicineName}>{med.name}</Text>
                {med.dosage && (
                  <View style={styles.dosageLimitBadge}>
                    <Text style={styles.dosageLimitText}>{med.dosage}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dosage}>{med.instructions}</Text>
            </View>
            <View style={styles.dosageBadge}>
              <Text style={styles.dosageText}>{med.scheduleFormat}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  periodLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  timeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  medsList: {
    // Removed bottom margin as requested
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bodyBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(64, 86, 109, 0.1)',
  },
  details: {
    flex: 1,
  },
  dosageBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    marginLeft: Spacing.sm,
  },
  dosageText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  medicineName: {
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  dosageLimitBadge: {
    paddingTop: 2,
    paddingLeft: 2,
  },
  dosageLimitText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: '#000000',
  },
  dosage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
