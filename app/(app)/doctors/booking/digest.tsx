import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../../src/theme';
import {
  appointmentsService,
  ConsultationType,
  TimeSlot,
} from '../../../../src/services/api/appointmentsService';
import { doctorsService, Doctor } from '../../../../src/services/api/doctorsService';
import { useTranslation } from 'react-i18next';

const MOBILE_BANKING = ['bKash', 'Rocket', 'Nagad', 'Upay'];
const MOBILE_BANKING_LOGOS: Record<string, any> = {
  bKash: require('../../../../src/assets/images/logos/bKash.png'),
  Rocket: require('../../../../src/assets/images/logos/Rocket.png'),
  Nagad: require('../../../../src/assets/images/logos/Nagad.png'),
  Upay: require('../../../../src/assets/images/logos/Upay.png'),
};
const PLATFORM_FEE = 25;
const VAT_RATE = 0.05;

export default function BookingDigestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    doctorId,
    date: initialDate,
    timeSlotId: initialTimeSlotId,
  } = useLocalSearchParams<{
    doctorId: string;
    date: string;
    timeSlotId: string;
    type: ConsultationType;
  }>();

  // Auth Store Mock
  const userPhone = '+880 1711-223344';

  // Data State
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Patient Card State
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [patientName, setPatientName] = useState('');

  // Consultation Card State
  const [mode, setMode] = useState<'schedule' | 'instant'>(
    initialDate && initialTimeSlotId ? 'schedule' : 'instant',
  );

  // Bottom Sheet State for Schedule Selection
  const [sheetVisible, setSheetVisible] = useState(false);
  const [panY] = useState(() => new Animated.Value(0));

  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date(),
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialTimeSlotId || null);

  const [tempDate, setTempDate] = useState<Date>(selectedDate);
  const [tempSlot, setTempSlot] = useState<string | null>(selectedSlot);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Payment State
  const [paymentCategory, setPaymentCategory] = useState<'mobile' | 'card'>('mobile');
  const [mobilePaymentMethod, setMobilePaymentMethod] = useState('bKash');

  useEffect(() => {
    const fetchData = async () => {
      if (!doctorId) return;
      try {
        setLoading(true);
        const doctorData = await doctorsService.getDoctorDetails(doctorId);
        setDoctor(doctorData);
      } catch {
        // Ignore for mock
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [doctorId]);

  // Fetch slots when tempDate changes
  useEffect(() => {
    if (!doctorId) return;
    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        const dateString = tempDate.toISOString().split('T')[0];
        const availableSlots = await appointmentsService.getAvailableSlots(doctorId, dateString);
        setSlots(availableSlots);
        if (tempDate.toISOString().split('T')[0] !== selectedDate.toISOString().split('T')[0]) {
          setTempSlot(null);
        }
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [doctorId, tempDate, selectedDate]);

  // Bottom sheet animation handlers
  useEffect(() => {
    if (sheetVisible) {
      panY.setValue(0);
    }
  }, [sheetVisible, panY]);

  const [handlePanResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          setSheetVisible(false);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  );

  const datesList = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleConfirmBooking = async () => {
    if (paymentCategory === 'card') {
      router.push('/(app)/payment/card-details');
      return;
    }

    if (!doctorId) return;
    if (mode === 'schedule' && (!selectedDate || !selectedSlot)) {
      Alert.alert(
        'Selection Required',
        'Please select a date and time for the scheduled appointment.',
      );
      return;
    }

    if (paymentCategory === 'mobile' && !mobilePaymentMethod) {
      Alert.alert('Payment Method', 'Please select a mobile banking option to proceed.');
      return;
    }

    try {
      setBooking(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const result = await appointmentsService.bookAppointment({
        doctorId,
        date: mode === 'schedule' ? dateString : new Date().toISOString().split('T')[0],
        timeSlotId: mode === 'schedule' ? selectedSlot! : 'instant',
        type: 'video',
      });

      if (result.success) {
        router.replace({
          pathname: '/(app)/doctors/booking/confirmation',
          params: {
            appointmentId: result.appointmentId,
            type: 'video',
            doctorId,
          },
        });
      }
    } catch {
      Alert.alert('Booking Failed', 'An error occurred while booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const switchMode = (newMode: 'schedule' | 'instant') => {
    setMode(newMode);
  };

  if (loading || !doctor) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

  const fee = doctor.consultationFee;
  const vat = Math.round((fee + PLATFORM_FEE) * VAT_RATE);
  const totalAmount = fee + PLATFORM_FEE + vat;

  const renderDoctorCard = () => {
    const imageSource =
      doctor?.image || require('../../../../src/assets/images/doctors/doctorPlaceholder1.png');
    const degreesText =
      doctor?.experience && doctor.experience.length > 10
        ? doctor.experience
        : `MBBS, Diploma (Gynae & Obs), FCPS (${doctor?.department})`;

    return (
      <View style={[styles.card, styles.doctorCardContainer]}>
        <View style={styles.doctorAvatarWrapper}>
          <Image source={imageSource} style={styles.doctorAvatar} />
        </View>
        <View style={styles.doctorContent}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {doctor?.fullName}
          </Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {doctor?.department}
            </Text>
          </View>
          <Text style={styles.doctorDegrees}>{degreesText}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        {/* Header matching Consultation History & Profile (no extra bottom margin) */}
        <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('digest.review_confirm') || 'Review & Confirm'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor Card */}
          {renderDoctorCard()}

          {/* Patient Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitleNoMargin}>Who is this consultation for?</Text>
              {isForSomeoneElse ? (
                <TouchableOpacity
                  onPress={() => setIsForSomeoneElse(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setIsForSomeoneElse(true)}>
                  <Text style={styles.linkText}>For Someone Else</Text>
                </TouchableOpacity>
              )}
            </View>

            {isForSomeoneElse ? (
              <View style={styles.patientInputContainer}>
                <TextInput
                  style={styles.patientInput}
                  placeholder="Enter Patient's Name"
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            ) : (
              <View style={styles.patientInfoRow}>
                <View style={styles.patientAvatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={20} color={Colors.primary} />
                </View>
                <View style={styles.patientPhoneContainer}>
                  <Text style={styles.patientPhoneText}>{userPhone}</Text>
                  <View style={styles.meBadge}>
                    <Text style={styles.meBadgeText}>Me</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.instructionText}>
              <Text style={styles.redAsterisk}>* </Text>
              You can submit patient details, previous prescriptions, and reports after the payment.
            </Text>
          </View>

          {/* Consultation Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How would you like to consult?</Text>
            <View style={styles.consultOptions}>
              <TouchableOpacity
                style={[
                  styles.consultOption,
                  mode === 'instant'
                    ? styles.consultOptionSelected
                    : styles.consultOptionUnselected,
                ]}
                onPress={() => switchMode('instant')}
                activeOpacity={0.8}
              >
                <View style={styles.consultOptionLeft}>
                  <MaterialCommunityIcons
                    name="video"
                    size={24}
                    color={mode === 'instant' ? Colors.primary : Colors.textTertiary}
                  />
                  <View>
                    <Text
                      style={[
                        styles.consultOptionText,
                        mode === 'instant'
                          ? styles.consultOptionTextSelected
                          : styles.consultOptionTextUnselected,
                      ]}
                    >
                      Instant Video Call
                    </Text>
                    {mode !== 'instant' && (
                      <Text style={styles.consultOptionSub}>Talk to the doctor immediately</Text>
                    )}
                  </View>
                </View>
                {mode === 'instant' && (
                  <View style={styles.checkCircleBackground}>
                    <MaterialCommunityIcons
                      name="check-bold"
                      size={16}
                      color={Colors.primary + '80'}
                    />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.consultOption,
                  mode === 'schedule'
                    ? styles.consultOptionSelected
                    : styles.consultOptionUnselected,
                ]}
                onPress={() => {
                  setTempDate(selectedDate);
                  setTempSlot(mode === 'schedule' ? selectedSlot : null);
                  setSheetVisible(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.consultOptionLeft}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={24}
                    color={mode === 'schedule' ? Colors.primary : Colors.textTertiary}
                  />
                  <View>
                    <Text
                      style={[
                        styles.consultOptionText,
                        mode === 'schedule'
                          ? styles.consultOptionTextSelected
                          : styles.consultOptionTextUnselected,
                      ]}
                    >
                      Schedule Video Appointment
                    </Text>
                    {mode !== 'schedule' ? (
                      <Text style={styles.consultOptionSub}>Pick a time that works for you</Text>
                    ) : (
                      <Text
                        style={[
                          styles.consultOptionSub,
                          { color: Colors.primary, fontFamily: FontFamily.semiBold },
                        ]}
                      >
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {slots.find((s) => s.id === selectedSlot)?.time || '...'}
                      </Text>
                    )}
                  </View>
                </View>
                {mode === 'schedule' && (
                  <View style={styles.checkCircleBackground}>
                    <MaterialCommunityIcons
                      name="check-bold"
                      size={16}
                      color={Colors.primary + '80'}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Details</Text>
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Consultation Fee</Text>
              <Text style={styles.paymentDetailValue}>৳{fee}</Text>
            </View>
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>VAT ({VAT_RATE * 100}%)</Text>
              <Text style={styles.paymentDetailValue}>৳{vat}</Text>
            </View>
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Platform Fee</Text>
              <Text style={styles.paymentDetailValue}>৳{PLATFORM_FEE}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentTotalLabel}>Total Amount</Text>
              <Text style={styles.paymentTotalValue}>৳{totalAmount}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { marginBottom: Spacing.lg }]}>Payment Method</Text>

            {/* Mobile Banking Option */}
            <TouchableOpacity
              style={styles.paymentCategoryHeader}
              onPress={() => {
                setPaymentCategory('mobile');
                setMobilePaymentMethod('bKash');
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={paymentCategory === 'mobile' ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={paymentCategory === 'mobile' ? Colors.primary : Colors.textTertiary}
              />
              <Text style={styles.paymentOptionTitle}>Mobile Banking</Text>
            </TouchableOpacity>

            <View style={[styles.mobileBankingGrid, { marginBottom: Spacing.lg }]}>
              {MOBILE_BANKING.map((method) => {
                return (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.mobileMethodItem,
                      mobilePaymentMethod === method && styles.mobileMethodItemSelected,
                    ]}
                    onPress={() => {
                      setPaymentCategory('mobile');
                      setMobilePaymentMethod(method);
                    }}
                  >
                    <View style={styles.logoPlaceholder}>
                      <Image
                        source={MOBILE_BANKING_LOGOS[method]}
                        style={{ width: 32, height: 32, resizeMode: 'contain' }}
                      />
                    </View>
                    <Text
                      style={[
                        styles.mobileMethodText,
                        mobilePaymentMethod === method && styles.mobileMethodTextSelected,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Credit/Debit Card Option */}
            <TouchableOpacity
              style={styles.paymentCategoryHeader}
              onPress={() => {
                setPaymentCategory('card');
                setMobilePaymentMethod('');
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={paymentCategory === 'card' ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={paymentCategory === 'card' ? Colors.primary : Colors.textTertiary}
              />
              <Text style={styles.paymentOptionTitle}>Credit/Debit Card</Text>
            </TouchableOpacity>

            <View style={styles.cardPaymentInfo}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={24}
                color={Colors.textSecondary}
              />
              <Text style={styles.cardPaymentText}>
                Pay securely using your Visa, MasterCard, or Amex.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Fixed Button */}
        <View
          style={[styles.bottomFixedContainer, { paddingBottom: Spacing.base + insets.bottom }]}
        >
          <TouchableOpacity
            style={[styles.proceedButton, booking && styles.proceedButtonDisabled]}
            onPress={handleConfirmBooking}
            disabled={booking}
            activeOpacity={0.8}
          >
            {booking ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet Modal for Scheduling */}
        <Modal
          visible={sheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSheetVisible(false);
            if (!selectedSlot && mode === 'schedule') setMode('instant');
          }}
          statusBarTranslucent
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismissArea}
              onPress={() => {
                setSheetVisible(false);
                if (!selectedSlot && mode === 'schedule') setMode('instant');
              }}
            />
            <Animated.View
              style={[
                styles.modalSheet,
                {
                  transform: [
                    {
                      translateY: panY.interpolate({
                        inputRange: [0, 1000],
                        outputRange: [0, 1000],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.dragArea} {...handlePanResponder.panHandlers}>
                <View style={styles.sheetHandle} />
              </View>

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Schedule Appointment</Text>
                <TouchableOpacity
                  onPress={() => setSheetVisible(false)}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                  <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Date Selection exactly like Active Prescription */}
                <View style={[styles.sheetSection, { marginTop: Spacing.md }]}>
                  <Text style={styles.sheetSectionTitle}>Select Date</Text>
                  <View style={styles.dateSelectorContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dateSelectorContent}
                    >
                      {datesList.map((d, index) => {
                        const isSelected =
                          tempDate.toISOString().split('T')[0] === d.toISOString().split('T')[0];
                        const dayName =
                          index === 0
                            ? 'Today'
                            : d.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNumber = d.getDate();
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dateSelectorItem,
                              isSelected && styles.dateSelectorItemActive,
                            ]}
                            onPress={() => setTempDate(d)}
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
                    </ScrollView>
                  </View>
                </View>

                {/* Time Slots */}
                <View style={styles.sheetSection}>
                  <Text style={styles.sheetSectionTitle}>Available Time Slot</Text>
                  {slotsLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ marginTop: 20 }}
                    />
                  ) : slots.length === 0 ? (
                    <Text style={styles.noSlotsText}>No slots available for this date.</Text>
                  ) : (
                    <View style={styles.slotsGrid}>
                      {slots.map((slot) => (
                        <TouchableOpacity
                          key={slot.id}
                          style={[
                            styles.slotBox,
                            !slot.isAvailable && styles.slotDisabled,
                            tempSlot === slot.id && styles.slotBoxActive,
                          ]}
                          disabled={!slot.isAvailable}
                          onPress={() => setTempSlot(slot.id)}
                        >
                          <Text
                            style={[
                              styles.slotText,
                              !slot.isAvailable && styles.slotTextDisabled,
                              tempSlot === slot.id && styles.slotTextActive,
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

              {/* Float action button above scroll view inside modal sheet exactly like Active Prescription */}
              <View style={[styles.sheetFooter, { bottom: Spacing.base + insets.bottom }]}>
                <TouchableOpacity
                  style={[styles.sheetConfirmBtn, !tempSlot && styles.sheetConfirmBtnDisabled]}
                  onPress={() => {
                    setSelectedDate(tempDate);
                    setSelectedSlot(tempSlot);
                    setMode('schedule');
                    setSheetVisible(false);
                  }}
                  disabled={!tempSlot}
                >
                  <Text
                    style={[styles.sheetConfirmText, !tempSlot && styles.sheetConfirmTextDisabled]}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrap: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
    height: 60,
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    // Removed shadows entirely as requested
  },
  cardSelected: {
    borderColor: Colors.primary,
  },
  doctorCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  doctorAvatarWrapper: {
    width: 80,
    height: 80,
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  doctorAvatar: {
    width: '100%',
    height: '100%',
  },
  doctorContent: {
    flex: 1,
    gap: 4,
  },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  doctorDegrees: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: FontSize.xs * 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center', // Vertically aligns the title and buttons
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardTitleNoMargin: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  linkText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  patientAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  patientPhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientPhoneText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  meBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  meBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Colors.primary,
  },
  patientInputContainer: {
    marginBottom: Spacing.sm,
  },
  patientInput: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  instructionText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.danger,
    lineHeight: FontSize.xs * 1.5,
  },
  redAsterisk: {
    color: Colors.danger,
    fontFamily: FontFamily.bold,
  },
  consultOptions: {
    gap: Spacing.sm,
  },
  consultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  consultOptionSelected: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  consultOptionUnselected: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  consultOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  consultOptionText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
  },
  consultOptionTextSelected: {
    color: Colors.primary,
  },
  consultOptionTextUnselected: {
    color: Colors.textSecondary,
  },
  consultOptionSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  checkCircleBackground: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentDetailLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  paymentDetailValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.tertiary,
    marginVertical: Spacing.sm,
  },
  paymentTotalLabel: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  paymentTotalValue: {
    fontFamily: FontFamily.extraBold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: '#000000',
  },
  paymentCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  paymentOptionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  mobileBankingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  mobileMethodItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    gap: Spacing.sm,
  },
  mobileMethodItemSelected: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileMethodText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  mobileMethodTextSelected: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
  },
  cardPaymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  cardPaymentText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  bottomFixedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  proceedButtonDisabled: {
    opacity: 0.5,
  },
  proceedButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },

  /* Bottom Sheet Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '81%', // Match prescriptions.tsx exactly
  },
  dragArea: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  sheetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  sheetContent: {
    paddingBottom: Spacing.xxl + 80, // Clear the absolute button
    paddingHorizontal: Spacing.base,
  },
  sheetSection: {
    marginBottom: Spacing.xl,
  },
  sheetSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Date Selector matching ActivePrescriptionView exactly
  dateSelectorContainer: {
    marginBottom: Spacing.md,
  },
  dateSelectorContent: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dateSelectorItem: {
    width: 64,
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
    gap: Spacing.md,
  },
  slotBox: {
    width: '30%',
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
  noSlotsText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  // Floating action button matching ActivePrescriptionView exactly
  sheetFooter: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
  },
  sheetConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  sheetConfirmBtnDisabled: {
    backgroundColor: Colors.tertiary,
  },
  sheetConfirmText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },
  sheetConfirmTextDisabled: {
    color: Colors.textTertiary,
  },
});
