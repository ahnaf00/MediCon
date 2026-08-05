// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Layout, Shadows } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 2. TYPES
interface DoctorPrescriptionView {
  id: string;
  patientName: string;
  patientAge: number;
  issuedAt: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  notes?: string;
  doctorName: string;
  doctorDept: string;
}

const MOCK_PRESCRIPTIONS: Record<string, DoctorPrescriptionView> = {
  'rx-001': {
    id: 'rx-001',
    patientName: 'Rahim Uddin',
    patientAge: 45,
    issuedAt: new Date().toISOString(),
    medicines: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take in the morning',
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Take with meals',
      },
    ],
    notes: 'Monitor blood pressure daily. Return in 4 weeks.',
    doctorName: 'Dr. Smith',
    doctorDept: 'Cardiology',
  },
};

// 3. COMPONENT
export default function PrescriptionPreviewScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Get prescription or create a placeholder
  const prescription: DoctorPrescriptionView = MOCK_PRESCRIPTIONS[id ?? ''] ?? {
    id: id ?? 'unknown',
    patientName: 'Patient',
    patientAge: 0,
    issuedAt: new Date().toISOString(),
    medicines: [
      { name: 'Medicine (placeholder)', dosage: 'N/A', frequency: 'N/A', duration: 'N/A' },
    ],
    doctorName: 'Dr. Smith',
    doctorDept: 'General Medicine',
  };

  const formattedDate = new Date(prescription.issuedAt).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription</Text>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Share prescription"
        >
          <MaterialCommunityIcons name="share-variant" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prescription Header Card */}
        <View style={styles.prescriptionHeader}>
          <View style={styles.prescriptionHeaderTop}>
            <Text style={styles.prescriptionTitle}>Medical Prescription</Text>
            <MaterialCommunityIcons name="pill" size={24} color="rgba(255,255,255,0.7)" />
          </View>
          <View style={styles.prescriptionHeaderDivider} />
          <View style={styles.prescriptionHeaderInfo}>
            <View>
              <Text style={styles.prescriptionHeaderLabel}>Patient</Text>
              <Text style={styles.prescriptionHeaderValue}>{prescription.patientName}</Text>
              {prescription.patientAge > 0 && (
                <Text style={styles.prescriptionHeaderSub}>
                  {prescription.patientAge} years old
                </Text>
              )}
            </View>
            <View style={styles.prescriptionHeaderRight}>
              <Text style={styles.prescriptionHeaderLabel}>Issued By</Text>
              <Text style={styles.prescriptionHeaderValue}>{prescription.doctorName}</Text>
              <Text style={styles.prescriptionHeaderSub}>{prescription.doctorDept}</Text>
            </View>
          </View>
          <Text style={styles.prescriptionDate}>{formattedDate}</Text>
        </View>

        {/* Medicines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
            <Text style={styles.medicineCount}>{prescription.medicines.length} items</Text>
          </View>
          <View style={styles.medicinesContainer}>
            {prescription.medicines.map((med, index) => (
              <View key={index} style={styles.medicineCard}>
                <View style={styles.medicineCardHeader}>
                  <Text style={styles.medicineName}>{med.name}</Text>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{med.duration}</Text>
                  </View>
                </View>
                <Text style={styles.medicineDosage}>
                  {med.dosage} • {med.frequency}
                </Text>
                {med.instructions && (
                  <Text style={styles.medicineInstructions}>{med.instructions}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {prescription.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{prescription.notes}</Text>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color={Colors.textTertiary}
          />
          <Text style={styles.disclaimerText}>
            This prescription was issued through MediCon. Valid only when verified by the issuing
            doctor.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
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
    paddingBottom: Layout.tabBarHeight + Spacing.xl,
  },
  prescriptionHeader: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  prescriptionHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  prescriptionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.surface,
  },
  prescriptionHeaderDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing.md,
  },
  prescriptionHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  prescriptionHeaderRight: {
    alignItems: 'flex-end',
  },
  prescriptionHeaderLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 2,
  },
  prescriptionHeaderValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  prescriptionHeaderSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  prescriptionDate: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.65)',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  medicineCount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  medicinesContainer: {
    gap: Spacing.md,
  },
  medicineCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    ...Shadows.sm,
  },
  medicineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  medicineName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  durationBadge: {
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  durationText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  medicineDosage: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  medicineInstructions: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: FontSize.sm * 1.5,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    ...Shadows.sm,
  },
  notesText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.6,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: FontSize.xs * 1.5,
  },
});
