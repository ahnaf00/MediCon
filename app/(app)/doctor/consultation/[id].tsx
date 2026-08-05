import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Colors,
  Spacing,
  FontFamily,
  FontSize,
  BorderRadius,
  Layout,
  Shadows,
} from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { prescriptionsService } from '../../../../src/services/api/prescriptionsService';
import { Prescription } from '../../../../src/types/medical.types';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface ConsultationDetail {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  bloodGroup: string;
  allergies: string[];
  reason: string;
  scheduledTime: string;
  format: 'video' | 'in-person';
  status: 'pending' | 'in-progress' | 'completed';
  activeConditions: string[];
  activeMedicines: string[];
  notes: string;
  attachments?: { id: string; url: string; type: 'image' | 'video' }[];
}

const MOCK_CONSULTATIONS: Record<string, ConsultationDetail> = {
  'appt-101': {
    id: 'appt-101',
    patientName: 'Rahim Uddin',
    patientAge: 45,
    patientGender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    reason: 'Follow-up for hypertension',
    scheduledTime: '9:00 AM',
    format: 'in-person',
    status: 'completed',
    activeConditions: ['Hypertension', 'Type 2 Diabetes'],
    activeMedicines: ['Amlodipine 5mg', 'Metformin 500mg'],
    notes: 'Patient reports good BP control this week. Review blood sugar readings.',
    attachments: [
      { id: 'att-1', url: 'https://placehold.co/400x400/E2E8F0/475569?text=BP+Log', type: 'image' },
    ],
  },
  p1: {
    id: 'p1',
    patientName: 'Rahim Uddin',
    patientAge: 45,
    patientGender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    reason: 'Follow-up for hypertension',
    scheduledTime: 'Today, 9:00 AM',
    format: 'in-person',
    status: 'completed',
    activeConditions: ['Hypertension', 'Type 2 Diabetes'],
    activeMedicines: ['Amlodipine 5mg', 'Metformin 500mg'],
    notes: 'Patient reports good BP control this week.',
    attachments: [],
  },
  'appt-102': {
    id: 'appt-102',
    patientName: 'Ayesha Rahman',
    patientAge: 32,
    patientGender: 'Female',
    bloodGroup: 'O+',
    allergies: [],
    reason: 'Migraine consultation',
    scheduledTime: '11:00 AM',
    format: 'video',
    status: 'in-progress',
    activeConditions: ['Migraine'],
    activeMedicines: ['Sumatriptan 50mg'],
    notes: 'Patient has had 3 episodes this week. Evaluate preventive therapy.',
  },
  p2: {
    id: 'p2',
    patientName: 'Ayesha Rahman',
    patientAge: 32,
    patientGender: 'Female',
    bloodGroup: 'O+',
    allergies: [],
    reason: 'Migraine consultation',
    scheduledTime: 'Today, 11:00 AM',
    format: 'video',
    status: 'in-progress',
    activeConditions: ['Migraine'],
    activeMedicines: ['Sumatriptan 50mg'],
    notes: 'Patient has had 3 episodes this week.',
  },
  'appt-103': {
    id: 'appt-103',
    patientName: 'Kamal Hasan',
    patientAge: 58,
    patientGender: 'Male',
    bloodGroup: 'A+',
    allergies: ['Sulfa drugs', 'Aspirin'],
    reason: 'Routine checkup, blood test review',
    scheduledTime: '2:00 PM',
    format: 'in-person',
    status: 'pending',
    activeConditions: ['Hypertension', 'High Cholesterol'],
    activeMedicines: ['Atorvastatin 20mg', 'Losartan 50mg'],
    notes: 'Annual checkup. Review lipid panel results.',
  },
  p3: {
    id: 'p3',
    patientName: 'Kamal Hasan',
    patientAge: 58,
    patientGender: 'Male',
    bloodGroup: 'A+',
    allergies: ['Sulfa drugs', 'Aspirin'],
    reason: 'Routine checkup, blood test review',
    scheduledTime: '2 days ago',
    format: 'video',
    status: 'completed',
    activeConditions: ['Hypertension', 'High Cholesterol'],
    activeMedicines: ['Atorvastatin 20mg', 'Losartan 50mg'],
    notes: 'Annual checkup.',
  },
  'appt-104': {
    id: 'appt-104',
    patientName: 'Nusrat Jahan',
    patientAge: 27,
    patientGender: 'Female',
    bloodGroup: 'AB-',
    allergies: [],
    reason: 'Fever and throat pain for 3 days',
    scheduledTime: '4:00 PM',
    format: 'video',
    status: 'pending',
    activeConditions: [],
    activeMedicines: ['Paracetamol 500mg'],
    notes: 'New patient. Evaluate for viral/bacterial pharyngitis.',
  },
  p4: {
    id: 'p4',
    patientName: 'Nusrat Jahan',
    patientAge: 27,
    patientGender: 'Female',
    bloodGroup: 'AB-',
    allergies: [],
    reason: 'Fever and throat pain for 3 days',
    scheduledTime: '1 week ago',
    format: 'video',
    status: 'completed',
    activeConditions: [],
    activeMedicines: ['Paracetamol 500mg'],
    notes: 'New patient.',
  },
  p5: {
    id: 'p5',
    patientName: 'Jamal Bhuyan',
    patientAge: 39,
    patientGender: 'Male',
    bloodGroup: 'O-',
    allergies: ['NSAIDs'],
    reason: 'Anxiety Disorder',
    scheduledTime: '2 weeks ago',
    format: 'video',
    status: 'completed',
    activeConditions: ['Anxiety'],
    activeMedicines: [],
    notes: 'Follow-up for anxiety management.',
  },
  p6: {
    id: 'p6',
    patientName: 'Farida Khanam',
    patientAge: 51,
    patientGender: 'Female',
    bloodGroup: 'B+',
    allergies: [],
    reason: 'Osteoarthritis',
    scheduledTime: '3 days ago',
    format: 'in-person',
    status: 'completed',
    activeConditions: ['Osteoarthritis'],
    activeMedicines: ['Paracetamol'],
    notes: 'Joint pain in both knees.',
  },
  p7: {
    id: 'p7',
    patientName: 'Tanvir Ahmed',
    patientAge: 34,
    patientGender: 'Male',
    bloodGroup: 'O+',
    allergies: [],
    reason: 'Migraine',
    scheduledTime: '5 days ago',
    format: 'video',
    status: 'completed',
    activeConditions: ['Migraine'],
    activeMedicines: [],
    notes: '',
  },
  p8: {
    id: 'p8',
    patientName: 'Sabina Yasmin',
    patientAge: 62,
    patientGender: 'Female',
    bloodGroup: 'A-',
    allergies: [],
    reason: 'Coronary Artery Disease',
    scheduledTime: 'Today',
    format: 'in-person',
    status: 'completed',
    activeConditions: ['CAD', 'Hypertension'],
    activeMedicines: ['Aspirin', 'Metoprolol'],
    notes: '',
  },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function ConsultationDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [loadingPrescription, setLoadingPrescription] = useState(true);

  const consultation = MOCK_CONSULTATIONS[id ?? ''];

  useEffect(() => {
    let isMounted = true;
    const fetchPrescription = async () => {
      try {
        const rx = await prescriptionsService.getScheduledPrescription();
        if (isMounted) setActivePrescription(rx);
      } catch (err) {
        // handle error silently for mock
      } finally {
        if (isMounted) setLoadingPrescription(false);
      }
    };
    fetchPrescription();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!consultation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultation</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="calendar-question" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Consultation not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const bottomMargin = Math.max(insets.bottom, Spacing.base);

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
        <Text style={styles.headerTitle}>Consultation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── PATIENT BANNER CARD (White Background) ── */}
        <View style={styles.patientBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerAvatar}>
              <Text style={styles.bannerAvatarText}>{consultation.patientName.charAt(0)}</Text>
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerName}>{consultation.patientName}</Text>
            </View>
          </View>
          
          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStatCol}>
              <Text style={styles.bannerStatLabel}>Age</Text>
              <Text style={styles.bannerStatValue}>{consultation.patientAge}</Text>
            </View>
            <View style={styles.bannerStatCol}>
              <Text style={styles.bannerStatLabel}>Gender</Text>
              <Text style={styles.bannerStatValue}>{consultation.patientGender}</Text>
            </View>
            <View style={styles.bannerStatCol}>
              <Text style={styles.bannerStatLabel}>Blood Group</Text>
              <Text style={styles.bannerStatValue}>{consultation.bloodGroup || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* ── PROBLEM / REASON FOR CONSULTATION ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.cardInnerTitle}>Problem</Text>
            <Text style={styles.infoText}>{consultation.reason}</Text>
          </View>
        </View>

        {/* ── ALLERGIES ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.cardInnerTitle}>Allergies</Text>
            {consultation.allergies && consultation.allergies.length > 0 ? (
              <Text style={styles.infoText}>{consultation.allergies.join(', ')}</Text>
            ) : (
              <Text style={styles.infoText}>No allergies recorded</Text>
            )}
          </View>
        </View>

        {/* ── CURRENT MEDICATIONS ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.cardInnerTitle}>Current Medications</Text>
            
            {loadingPrescription ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginTop: Spacing.sm }}
              />
            ) : activePrescription && activePrescription.medicines.length > 0 ? (
              <View>
                {activePrescription.medicines.map((med, index) => (
                  <View
                    key={med.id}
                    style={[
                      styles.medRow,
                      index < activePrescription.medicines.length - 1 && styles.medRowBorder,
                    ]}
                  >
                    <MaterialCommunityIcons name="pill" size={18} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDosage}>
                        {med.dosage} - {med.dosagePattern || med.frequency}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : consultation.activeMedicines && consultation.activeMedicines.length > 0 ? (
              <View>
                {consultation.activeMedicines.map((med: string, index: number) => (
                  <View
                    key={med}
                    style={[
                      styles.medRow,
                      index < consultation.activeMedicines.length - 1 && styles.medRowBorder,
                    ]}
                  >
                    <MaterialCommunityIcons name="pill" size={18} color={Colors.primary} />
                    <Text style={styles.medName}>{med}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoText}>No active medications</Text>
            )}
          </View>
        </View>

        {/* ── ATTACHMENTS ── */}
        {consultation.attachments && consultation.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentsList}
            >
              {consultation.attachments.map((att) => (
                <TouchableOpacity key={att.id} style={styles.attachmentWrapper} activeOpacity={0.8}>
                  <Image source={{ uri: att.url }} style={styles.attachmentImage} />
                  {att.type === 'video' && (
                    <View style={styles.playIconOverlay}>
                      <MaterialCommunityIcons name="play-circle" size={32} color={Colors.surface} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <View
        style={[styles.bottomActionBar, { paddingBottom: insets.bottom + Spacing.base }]}
      >
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() =>
            router.push(
              `/(app)/doctor/prescription/write?patientId=${id}&patientName=${encodeURIComponent(consultation.patientName)}`,
            )
          }
          accessibilityLabel="Write Prescription"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="prescription" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.push({
            pathname: `/(app)/doctor/consultation/chat/[id]`,
            params: { id, patientName: consultation.patientName }
          })}
          accessibilityLabel="Chat with Patient"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="message-text-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => Alert.alert('Video Call', 'Video consultation feature coming soon.')}
          accessibilityLabel="Start Video Consultation"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="video" size={20} color={Colors.surface} />
          <Text style={styles.primaryButtonText}>Start Video Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
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
    paddingBottom: 140, // Space for fixed action bar
  },
  patientBanner: {
    flexDirection: 'column',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    // Removed shadows per user constraints on cards
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  bannerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAvatarText: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerName: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  bannerStatsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
    paddingTop: Spacing.md,
  },
  bannerStatCol: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '30%',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerStatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  bannerStatValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    flexDirection: 'column',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  cardInnerTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
  attachmentsList: {
    gap: Spacing.sm,
  },
  attachmentWrapper: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.tertiary,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  medRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  medName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  medDosage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    height: 48,
    gap: Spacing.xs,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.surface,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
