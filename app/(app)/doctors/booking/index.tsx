import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../../src/theme';
import { appointmentsService, TimeSlot } from '../../../../src/services/api/appointmentsService';
import { doctorsService, Doctor } from '../../../../src/services/api/doctorsService';
import { useTranslation } from 'react-i18next';

export default function BookingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await doctorsService.getDoctorDetails(id);
        setDoctor(data);
      } finally {
        setLoading(false);
      }
    };
    void fetchDoctor();
  }, [id]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!id) return;
      try {
        setSlotsLoading(true);
        const dateString = selectedDate.toISOString().split('T')[0];
        const availableSlots = await appointmentsService.getAvailableSlots(id, dateString);
        setSlots(availableSlots);
        setSelectedSlot(null); // Reset selection on date change
      } finally {
        setSlotsLoading(false);
      }
    };
    void fetchSlots();
  }, [id, selectedDate]);

  const handleContinue = () => {
    if (!id || !selectedSlot) return;
    const dateString = selectedDate.toISOString().split('T')[0];
    router.push({
      pathname: '/(app)/doctors/booking/digest',
      params: {
        doctorId: id,
        date: dateString,
        timeSlotId: selectedSlot,
        type: 'video',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {t('booking.doctor_not_found') || 'Doctor not found'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Wrapper */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('booking.book_appointment') || 'Book Appointment'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
      >
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.select_date') || 'Select Date'}</Text>
          <View style={styles.dateSelectorContent}>
            {dates.map((date, index) => {
              const isSelected =
                selectedDate.toISOString().split('T')[0] === date.toISOString().split('T')[0];
              const isToday = index === 0;
              const dayName = isToday
                ? 'Today'
                : date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNumber = date.getDate();

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateSelectorItem, isSelected && styles.dateSelectorItemActive]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={1}
                >
                  <Text
                    style={[
                      styles.dateSelectorDayName,
                      isSelected && styles.dateSelectorTextActive,
                    ]}
                  >
                    {dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dateSelectorDayNumber,
                      isSelected && styles.dateSelectorTextActive,
                    ]}
                  >
                    {dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('booking.available_time') || 'Available Time Slot'}
          </Text>
          {slotsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotBox,
                    !slot.isAvailable && styles.slotDisabled,
                    selectedSlot === slot.id && styles.slotBoxActive,
                  ]}
                  disabled={!slot.isAvailable}
                  onPress={() => setSelectedSlot(slot.id)}
                >
                  <Text
                    style={[
                      styles.slotText,
                      !slot.isAvailable && styles.slotTextDisabled,
                      selectedSlot === slot.id && styles.slotTextActive,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.bottomFixedContainer, { bottom: Spacing.base + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.confirmFullBtn, !selectedSlot && styles.confirmFullBtnDisabled]}
          disabled={!selectedSlot}
          onPress={handleContinue}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Confirm Appointment"
        >
          <Text
            style={[styles.confirmFullBtnText, !selectedSlot && styles.confirmFullBtnTextDisabled]}
          >
            {t('booking.continue') || 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrapper: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    height: 60,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dateSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dateSelectorItem: {
    flex: 1,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  dateSelectorItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateSelectorDayName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateSelectorDayNumber: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  dateSelectorTextActive: {
    color: Colors.surface,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: '3%',
    rowGap: Spacing.md,
  },
  slotBox: {
    width: '31.33%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  slotBoxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotDisabled: {
    backgroundColor: Colors.background,
    borderColor: Colors.tertiary,
  },
  slotText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
  slotTextActive: {
    color: Colors.surface,
  },
  slotTextDisabled: {
    color: Colors.textTertiary,
  },
  bottomFixedContainer: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
  },
  confirmFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  confirmFullBtnDisabled: {
    backgroundColor: Colors.tertiary,
  },
  confirmFullBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },
  confirmFullBtnTextDisabled: {
    color: Colors.textTertiary,
  },
});
