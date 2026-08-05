import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../../src/theme';
import { ConsultationType } from '../../../../src/services/api/appointmentsService';
import { useTranslation } from 'react-i18next';

export default function BookingConfirmationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { appointmentId, type, doctorId } = useLocalSearchParams<{
    appointmentId: string;
    type: ConsultationType;
    doctorId: string;
  }>();

  const handleAction = () => {
    if (type === 'video') {
      router.push(`/(app)/doctors/booking/video-call?id=${appointmentId}&doctorId=${doctorId}`);
    } else {
      // Return to home or show directions
      router.dismissAll();
      router.replace('/(app)/(tabs)/');
    }
  };

  const handleBackToHome = () => {
    router.dismissAll();
    router.replace('/(app)/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-circle" size={80} color={Colors.success} />
        </View>

        <Text style={styles.title}>
          {t('confirmation.booking_confirmed') || 'Booking Confirmed!'}
        </Text>
        <Text style={styles.subtitle}>
          {t('confirmation.your_appointment') || 'Your appointment'}{' '}
          {appointmentId ? `#${appointmentId}` : ''}{' '}
          {t('confirmation.has_been_successfully_schedule') ||
            `has been successfully
                            scheduled.`}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={type === 'video' ? 'video' : 'map-marker'}
            size={20}
            color={Colors.surface}
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryButtonText}>
            {type === 'video' ? 'Join Video Call' : 'View Directions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleBackToHome}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>
            {t('confirmation.back_to_home') || 'Back to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  footer: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
});
