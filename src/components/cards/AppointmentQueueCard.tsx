// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { DoctorQueueAppointment } from '../../hooks/useDoctorDashboard';
import { useTranslation } from 'react-i18next';

// 2. TYPES
export interface AppointmentQueueCardProps {
  appointment: DoctorQueueAppointment;
  onPress?: () => void;
}

// 3. COMPONENT
export const AppointmentQueueCard = ({
  appointment,
  onPress,
}: AppointmentQueueCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const date = new Date(appointment.dateTime);
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const isCompleted = appointment.status === 'completed';
  const isInProgress = appointment.status === 'in-progress';

  let statusBadgeVariant: 'success' | 'warning' | 'info' | 'error' | 'default' = 'default';
  let statusLabel = 'Pending';

  if (isCompleted) {
    statusBadgeVariant = 'success';
    statusLabel = 'Completed';
  } else if (isInProgress) {
    statusBadgeVariant = 'warning';
    statusLabel = 'In Progress';
  }

  return (
    <Card
      onPress={onPress}
      style={isCompleted ? styles.completedCard : undefined}
      accessibilityLabel={`Appointment at ${formattedTime} with ${appointment.patientName}, ${appointment.age} years old, ${appointment.gender}, for ${appointment.reason}. Status: ${statusLabel}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>
        <View style={styles.badges}>
          <Badge label={statusLabel} variant={statusBadgeVariant} />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName} numberOfLines={1}>
            {appointment.patientName}
          </Text>
          <Text style={styles.patientDetails}>
            {appointment.age} {t('appointmentqueuecard.yrs') || 'yrs •'} {appointment.gender}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.reasonLabel}>{t('appointmentqueuecard.reason') || 'Reason:'}</Text>
        <Text style={styles.reasonText} numberOfLines={1}>
          {appointment.reason}
        </Text>
      </View>
    </Card>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  completedCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  patientInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  patientName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  patientDetails: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  reasonLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  reasonText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
});
