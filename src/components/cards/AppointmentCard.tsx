// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DashboardAppointment } from '../../hooks/usePatientDashboard';
import { Card } from '../ui/Card';
import { useTranslation } from 'react-i18next';

// 2. TYPES
export interface AppointmentCardProps {
  appointment: DashboardAppointment | null;
  onPress?: () => void;
}

// 3. COMPONENT
export const AppointmentCard = ({
  appointment,
  onPress,
}: AppointmentCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  if (!appointment) {
    return (
      <Card accessibilityLabel="No upcoming appointments">
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={32}
            color={Colors.textTertiary}
          />
          <Text style={styles.emptyTitle}>
            {t('appointmentcard.no_upcoming_appointments') || 'No upcoming appointments'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('appointmentcard.book_a_consultation_to_get_sta') ||
              'Book a consultation to get started.'}
          </Text>
        </View>
      </Card>
    );
  }

  const date = new Date(appointment.dateTime);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const isVideo = appointment.format === 'video';

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Next appointment with ${appointment.doctorName}, ${appointment.specialty}, ${formattedDate} at ${formattedTime}, ${appointment.format}`}
    >
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>
          {t('appointmentcard.next_appointment') || 'Next Appointment'}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconContainer}>
          {appointment.imageUrl ? (
            <Image source={{ uri: appointment.imageUrl }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons name="account-outline" size={24} color={Colors.primary} />
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.doctorName}>{appointment.doctorName}</Text>
          <Text style={styles.specialty}>{appointment.specialty}</Text>
        </View>
        {isVideo && (
          <View style={styles.actionIconContainer}>
            <MaterialCommunityIcons name="video-outline" size={24} color={Colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.dateTime}>
          {formattedDate} · {formattedTime}
        </Text>
      </View>
    </Card>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  details: {
    flex: 1,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  dateTime: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
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
