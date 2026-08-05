// 1. IMPORTS
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Spacing, FontFamily, FontSize, Layout, BorderRadius } from '../../../src/theme';
import { prescriptionsService } from '../../../src/services/api/prescriptionsService';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { reminderService } from '../../../src/services/notifications/reminderService';
import { Prescription, PrescriptionMedicine } from '../../../src/types/medical.types';
import { getMedicineDescription } from '../../../src/utils/prescriptionFormatters';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 2. TYPES

type Params = { id: string };

// 3. COMPONENTS

interface MedicineDetailCardProps {
  med: PrescriptionMedicine;
  issuedAt: string;
  onSetReminder: (medId: string) => void;
  reminderTime?: Date;
}

const MedicineDetailCard = ({
  med,
  issuedAt,
  onSetReminder,
  reminderTime,
}: MedicineDetailCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const explanationText = med.explanation ?? med.aiDemystifierSummary;

  const formattedDescription = getMedicineDescription(
    med.dosagePattern || '1+1+1',
    med.instructions,
  );

  const startDate = new Date(issuedAt);
  const endDate = new Date(issuedAt);
  endDate.setDate(endDate.getDate() + med.durationDays - 1);
  const formatOpt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const durationText = `${med.durationDays} days (${startDate.toLocaleDateString('en-US', formatOpt)} - ${endDate.toLocaleDateString('en-US', formatOpt)})`;

  return (
    <View style={styles.medicineCard}>
      {/* Medicine name & dosage */}
      <View style={styles.medHeader}>
        <View style={styles.medTitles}>
          <View style={styles.medNameRow}>
            <Text style={styles.medName}>{med.name}</Text>
            {med.dosage && (
              <View style={styles.dosageBadge}>
                <Text style={styles.dosageBadgeText}>{med.dosage}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Duration / Dosage pattern */}
      <View style={styles.durationDosageRow}>
        <View style={styles.ddItem}>
          <Text style={styles.ddLabel}>Duration</Text>
          <Text style={styles.ddValue}>{durationText}</Text>
        </View>
        <View style={styles.ddItem}>
          <Text style={styles.ddLabel}>Schedule</Text>
          <Text style={styles.ddValue}>{med.dosagePattern || '1+1+1'}</Text>
        </View>
      </View>

      {/* Instructions */}
      {formattedDescription ? (
        <View style={styles.instructionBox}>
          <MaterialCommunityIcons
            name="information-outline"
            size={15}
            color={Colors.textSecondary}
            style={{ marginTop: 1.5 }}
          />
          <Text style={styles.instructionText}>{formattedDescription}</Text>
        </View>
      ) : null}

      {/* Collapsible Explanation */}
      {explanationText && (
        <>
          <TouchableOpacity
            style={styles.explanationToggle}
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            <Text style={styles.explanationToggleText}>
              {expanded ? 'Hide details' : 'Why take this medicine?'}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{explanationText}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default function PrescriptionDetailsScreen() {
  const { id } = useLocalSearchParams<Params>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  // Time-picker state
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [reminderTimes, setReminderTimes] = useState<Record<string, Date>>({});

  // "Show Original" modal
  const [showOriginalVisible, setShowOriginalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await prescriptionsService.getPrescriptionDetails(id as string);
        if (isMounted) {
          setPrescription(data);
          const defaults: Record<string, Date> = {};
          data.medicines.forEach((med) => {
            const d = new Date();
            if (med.times && med.times.length > 0) {
              const [h, m] = med.times[0].split(':').map(Number);
              d.setHours(h, m, 0, 0);
            } else {
              d.setHours(8, 0, 0, 0);
            }
            defaults[med.id] = d;
          });
          setReminderTimes(defaults);
        }
      } catch (err) {
        if (isMounted) setError(createAppError('NETWORK_ERROR', String(err)));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSetReminder = async (med: PrescriptionMedicine, date: Date): Promise<void> => {
    try {
      const hasPermission = await reminderService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in Settings to set medicine reminders.',
        );
        return;
      }
      await reminderService.scheduleDailyReminder(
        med.id,
        'Medicine Reminder',
        `Time to take ${med.name} (${med.dosage})`,
        date.getHours(),
        date.getMinutes(),
      );
      setReminderTimes((prev) => ({ ...prev, [med.id]: date }));
      Alert.alert(
        'Reminder Set',
        `Daily reminder set for ${med.name} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      );
    } catch (err) {
      const appError = createAppError('UNKNOWN_ERROR', String(err));
      Alert.alert('Error', appError.message);
    }
  };

  const onChangeTime = (_event: unknown, selectedDate?: Date): void => {
    setShowPicker(false);
    if (selectedDate && selectedMedId) {
      const med = prescription?.medicines.find((m) => m.id === selectedMedId);
      if (med) handleSetReminder(med, selectedDate);
    }
  };

  const onOpenTimePicker = (medId: string) => {
    setSelectedMedId(medId);
    setShowPicker(true);
  };

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (loading || !prescription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <ErrorState
          message={error.message}
          onRetry={() => {
            setError(null);
            setLoading(true);
            router.replace(`/(app)/prescriptions/${id}`);
          }}
        />
      </View>
    );
  }

  // ── Derived display values ──────────────────────────────────────────────────

  const isDoctor = prescription.source === 'DOCTOR';
  const sourceLabel = isDoctor
    ? (prescription.doctorName ?? prescription.doctorId ?? 'Doctor')
    : `Uploaded prescription`;

  const issueDate = new Date(prescription.issuedAt);
  const formattedDate =
    issueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) +
    ' • ' +
    issueDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const hasOriginal = Boolean(prescription.imageUrl);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.lg,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Details</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meta card */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <MaterialCommunityIcons
                name={isDoctor ? 'stethoscope' : 'upload'}
                size={18}
                color={Colors.primary}
              />
              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>{isDoctor ? 'Prescribed by' : 'Source'}</Text>
                <Text style={styles.metaValue}>{sourceLabel}</Text>
              </View>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>{isDoctor ? 'Date' : 'Uploaded on'}</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Medicines section */}
        <Text style={styles.sectionTitle}>Medicines ({prescription.medicines.length})</Text>

        {prescription.medicines.map((med) => (
          <MedicineDetailCard
            key={med.id}
            med={med}
            issuedAt={prescription.issuedAt}
            onSetReminder={onOpenTimePicker}
            reminderTime={reminderTimes[med.id]}
          />
        ))}
      </ScrollView>

      {/* Show Original fixed button at bottom */}
      {hasOriginal && (
        <View style={[styles.bottomFixedContainer, { bottom: Spacing.base + insets.bottom }]}>
          <TouchableOpacity
            style={styles.showOriginalFullBtn}
            onPress={() => setShowOriginalVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Show prescription document"
          >
            <MaterialCommunityIcons name="file-eye-outline" size={18} color={Colors.surface} />
            <Text style={styles.showOriginalFullBtnText}>Show Original Prescription</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Time picker */}
      {showPicker && (
        <DateTimePicker
          value={
            selectedMedId && reminderTimes[selectedMedId]
              ? reminderTimes[selectedMedId]
              : new Date()
          }
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onChangeTime}
        />
      )}

      {/* "Show Original" full-screen modal */}
      <Modal
        visible={showOriginalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowOriginalVisible(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.originalModal} edges={['top']}>
          <View style={styles.originalHeader}>
            <TouchableOpacity
              style={styles.backButtonModal}
              onPress={() => setShowOriginalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close original prescription"
            >
              <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Prescription</Text>
            <View style={{ width: 40 }} />
          </View>

          {prescription.imageUrl ? (
            <ScrollView
              contentContainerStyle={styles.originalImageContainer}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: prescription.imageUrl }}
                style={styles.originalImage}
                resizeMode="contain"
                accessibilityLabel="Original prescription document"
              />
            </ScrollView>
          ) : (
            <View style={styles.centeredFlex}>
              <MaterialCommunityIcons
                name="file-remove-outline"
                size={48}
                color={Colors.textTertiary}
              />
              <Text style={styles.noOriginalText}>Document not available.</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  // Header
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
  backButtonModal: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Layout.tabBarHeight + 80 + Spacing.xl, // Space for fixed button
  },

  // Meta card
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.md,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaText: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },

  // Section title
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Medicine card
  medicineCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  medTitles: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  medName: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  dosageBadge: {
    paddingTop: 2,
    paddingLeft: 2,
  },
  dosageBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: '#000000',
  },
  medDosage: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    minHeight: 32,
  },
  reminderButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },

  // Duration & Dosage Pattern
  durationDosageRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  ddItem: {
    flex: 1,
    alignItems: 'center',
  },
  ddLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  ddValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },

  // Instructions
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  instructionText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },

  // Explanation toggle
  explanationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 28,
  },
  explanationToggleText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.primary,
    lineHeight: FontSize.xs * 1.5,
  },
  // Explanation Box
  explanationBox: {
    backgroundColor: 'rgba(238, 242, 246, 0.5)', // 50% lighter than tertiary
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  explanationText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },

  // Fixed Bottom Button
  bottomFixedContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.base,
    right: Spacing.base,
  },
  showOriginalFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  showOriginalFullBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },

  // "Show Original" modal
  originalModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  originalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  originalImageContainer: {
    flex: 1,
    padding: Spacing.base,
  },
  originalImage: {
    width: '100%',
    aspectRatio: 0.8, // Portrait prescription proportions
    borderRadius: BorderRadius.md,
  },
  noOriginalText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: FontSize.base * 1.5,
  },
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
