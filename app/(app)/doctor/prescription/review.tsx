import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReviewPrescriptionScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
    patientAge?: string;
    allergies?: string;
    medicines?: string;
    tests?: string;
    notes?: string;
  }>();

  const [submitting, setSubmitting] = useState(false);

  // Parse the data safely
  let parsedMedicines: any[] = [];
  let parsedTests: any[] = [];
  try {
    parsedMedicines = params.medicines ? JSON.parse(params.medicines) : [];
    parsedTests = params.tests ? JSON.parse(params.tests) : [];
  } catch (e) {
    // Ignore parse errors on mock data
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate API call for submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);

    Alert.alert('Prescription Sent', 'The prescription has been successfully saved and sent to the patient.', [
      { text: 'Done', onPress: () => router.dismissAll() },
    ]);
  };

  const getInstructionIcon = (inst: string) => {
    if (inst === 'Before Meals') return 'silverware-variant';
    if (inst === 'After Meals') return 'silverware-fork-knife';
    return 'information-outline';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Prescription</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── PATIENT INFO CARD ── */}
        <View style={styles.patientInfoCard}>
          <View style={styles.patientInfoLeft}>
            <Text style={styles.patientInfoName}>{params.patientName || 'Unknown Patient'}</Text>
            <Text style={styles.patientInfoAge}>{params.patientAge ? `${params.patientAge} years old` : 'Age unknown'}</Text>
          </View>
          {params.allergies ? (
            <View style={styles.allergyBox}>
              <Text style={styles.allergyBoxTitle}>Allergies</Text>
              <Text style={styles.allergyBoxText}>{params.allergies}</Text>
            </View>
          ) : null}
        </View>

        {/* ── MEDICINES ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bottle-tonic-plus" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
          </View>
          
          {parsedMedicines.length === 0 ? (
            <Text style={styles.emptyText}>No medicines added.</Text>
          ) : (
            <View style={styles.cardList}>
              {parsedMedicines.map((med, idx) => (
                <View key={med.id || idx} style={[styles.cardItem, idx < parsedMedicines.length - 1 && styles.cardBorder]}>
                  <View style={styles.medHeaderRow}>
                    <Text style={styles.medName}>
                      {med.name} <Text style={styles.medDosage}>({med.dosage})</Text>
                    </Text>
                  </View>
                  <View style={styles.medDetailsRow}>
                    <View style={styles.medDetailChip}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.medDetailText}>{med.frequencyPattern} ({med.interval})</Text>
                    </View>
                    <View style={styles.medDetailChip}>
                      <MaterialCommunityIcons name="calendar-range" size={14} color={Colors.textSecondary} />
                      <Text style={styles.medDetailText}>{med.duration}</Text>
                    </View>
                    {med.instructions ? (
                      <View style={styles.medDetailChip}>
                        <MaterialCommunityIcons name={getInstructionIcon(med.instructions)} size={14} color={Colors.textSecondary} />
                        <Text style={styles.medDetailText}>{med.instructions}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── TESTS ── */}
        {parsedTests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="test-tube" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Recommended Tests</Text>
            </View>
            <View style={styles.cardList}>
              {parsedTests.map((test, idx) => (
                <View key={test.id || idx} style={[styles.cardItem, idx < parsedTests.length - 1 && styles.cardBorder]}>
                  <Text style={styles.medName}>{test.name}</Text>
                  {test.reason ? (
                    <Text style={styles.testReason}>
                      <Text style={{ fontFamily: FontFamily.bold, fontWeight: 'bold' }}>Reason:</Text> {test.reason}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── NOTES ── */}
        {params.notes ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{params.notes}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <View
        style={[styles.bottomActionBar, { paddingBottom: insets.bottom + Spacing.base }]}
      >
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonLoading]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <>
              <MaterialCommunityIcons name="send-check-outline" size={20} color={Colors.surface} />
              <Text style={styles.submitButtonText}>Confirm & Send to Patient</Text>
            </>
          )}
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
  safeArea: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 120,
    paddingTop: Spacing.md,
  },
  patientInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  patientInfoLeft: {
    flex: 1,
  },
  patientInfoName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  patientInfoAge: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  allergyBox: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
    minHeight: 64,
  },
  allergyBoxTitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  allergyBoxText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  cardList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  cardItem: {
    padding: Spacing.base,
  },
  cardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  medHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  medName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  medDosage: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  medDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  medDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    gap: 4,
  },
  medDetailText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  testReason: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: FontSize.sm * 1.5,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    height: 'auto',
  },
  notesText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    height: 48,
    gap: Spacing.sm,
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
});
