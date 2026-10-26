import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Layout, Shadows } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { prescriptionsService } from '../../../../src/services/api/prescriptionsService';
import { Prescription } from '../../../../src/types/medical.types';
import {
  patientsService,
  ApiPatient,
  splitProfileList,
} from '../../../../src/services/api/patientsService';
import {
  ApiAppointment,
  useAppointment,
  useAppointments,
} from '../../../../src/services/api/consultationsService';
import { ConsultationPanel } from '../../../../src/components/medical/ConsultationPanel';
import { useOpenChat } from '../../../../src/services/api/directChatService';

/**
 * Which of this doctor's appointments with the patient the screen is about:
 * the one named in the route, else the visit in progress, else the next
 * scheduled one, else the most recently completed (so its summary can be edited).
 */
const pickAppointment = (
  appointments: ApiAppointment[] | undefined,
  patientId: string | undefined,
  appointmentId: string | undefined,
): ApiAppointment | null => {
  if (!appointments || !patientId) return null;
  if (appointmentId) {
    return appointments.find((a) => String(a.id) === appointmentId) ?? null;
  }
  const mine = appointments.filter((a) => String(a.patient?.id) === patientId);
  const time = (a: ApiAppointment) => (a.datetime ? new Date(a.datetime).getTime() : 0);
  const now = Date.now();
  return (
    mine.find((a) => a.status === 'in_progress') ??
    mine
      .filter((a) => a.status === 'scheduled')
      .sort((a, b) => Math.abs(time(a) - now) - Math.abs(time(b) - now))[0] ??
    mine.filter((a) => a.status === 'completed').sort((a, b) => time(b) - time(a))[0] ??
    null
  );
};

// Calculate age from date of birth
const calculateAge = (dob: string | null | undefined): string => {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

export default function DoctorConsultationScreen(): React.JSX.Element {
  const { id, appointmentId } = useLocalSearchParams<{ id: string; appointmentId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openChat = useOpenChat();
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  // Every prescription this doctor wrote for the patient, so they can open one and
  // review the medicine explanations the patient reads (audit G4).
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [loadingPrescription, setLoadingPrescription] = useState(true);
  // With a visit id: that visit. Without: this patient's visits only, newest 50 (task H3).
  const visitById = useAppointment(appointmentId);
  const patientVisits = useAppointments({ patientUserId: id }, !appointmentId && !!id);
  const appointments = appointmentId ? visitById : patientVisits;
  const appointment = appointmentId
    ? (visitById.data ?? null)
    : pickAppointment(patientVisits.data, id, undefined);

  useEffect(() => {
    let isMounted = true;
    const fetchPatient = async () => {
      try {
        setLoading(true);
        if (id) {
          const data = await patientsService.getPatientById(id);
          if (isMounted) setPatient(data);
        }
      } catch (err) {
        console.error('Failed to fetch patient details', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPatient();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Reload on every return to this screen, so a prescription written for this
  // visit shows up and the button opens it (one per visit, audit G1).
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchPrescriptions = async () => {
        try {
          // Only this patient's prescriptions from this doctor (task H3).
          const data = await prescriptionsService.getAllPrescriptions({ patientUserId: id });
          // Since we don't have a specific endpoint for patient's active meds,
          // we'll try to find the latest prescription for this patient (optional feature)
          if (isMounted) {
            const forPatient = data.filter((p) => p.patient?.id.toString() === id);
            setPatientPrescriptions(forPatient);
            setActivePrescription(forPatient[0] ?? null);
          }
        } catch (err) {
          // ignore
        } finally {
          if (isMounted) setLoadingPrescription(false);
        }
      };
      fetchPrescriptions();
      return () => {
        isMounted = false;
      };
    }, [id]),
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!patient) {
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
          <Text style={styles.headerTitle}>Patient Detail</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="account-question" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Patient profile not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const patientName = patient.name || 'Unknown Patient';
  const patientAge = calculateAge(patient.patientProfile?.dateOfBirth);
  const patientGender = patient.patientProfile?.gender || 'N/A';
  const bloodGroup = patient.patientProfile?.bloodGroup || 'N/A';
  const allergies = splitProfileList(patient.patientProfile?.allergies);
  // What the patient wrote when booking (appointment notes).
  const reason = appointment?.notes?.trim() || 'No reason given when booking.';
  // One prescription per visit (audit G1): if this visit has one, open it instead.
  const visitPrescription = appointment
    ? patientPrescriptions.find((p) => String(p.appointmentId) === String(appointment.id))
    : undefined;

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
        <Text style={styles.headerTitle}>Patient Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── PATIENT BANNER CARD (White Background) ── */}
        <View style={styles.patientBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerAvatar}>
              <Text style={styles.bannerAvatarText}>{patientName.charAt(0)}</Text>
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerName}>{patientName}</Text>
            </View>
          </View>

          <View style={styles.bannerStatsRow}>
            <View style={styles.bannerStatCol}>
              <Text style={styles.bannerStatLabel}>Age</Text>
              <Text style={styles.bannerStatValue}>{patientAge}</Text>
            </View>
            <View style={styles.bannerStatCol}>
              <Text style={styles.bannerStatLabel}>Gender</Text>
              <Text style={styles.bannerStatValue}>{patientGender}</Text>
            </View>
            <View style={styles.bannerStatCol}>
              <Text style={styles.bannerStatLabel}>Blood Group</Text>
              <Text style={styles.bannerStatValue}>{bloodGroup}</Text>
            </View>
          </View>
        </View>

        {/* ── PROBLEM / REASON FOR CONSULTATION ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.cardInnerTitle}>Problem</Text>
            <Text style={styles.infoText}>{reason}</Text>
          </View>
        </View>

        {/* ── CONSULTATION: start / no-show / end-of-consultation summary ── */}
        <View style={styles.section}>
          {appointments.isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ConsultationPanel appointment={appointment} />
          )}
        </View>

        {/* ── ALLERGIES ── */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.cardInnerTitle}>Allergies</Text>
            {allergies && allergies.length > 0 ? (
              <Text style={styles.infoText}>{allergies.join(', ')}</Text>
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
            ) : (
              <Text style={styles.infoText}>No active medications</Text>
            )}
          </View>
        </View>

        {/* ── YOUR PRESCRIPTIONS: open one to review its medicine explanations ── */}
        {!loadingPrescription && patientPrescriptions.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.cardInnerTitle}>Your Prescriptions</Text>
              {patientPrescriptions.map((p, index) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.medRow,
                    index < patientPrescriptions.length - 1 && styles.medRowBorder,
                  ]}
                  onPress={() => router.push(`/(app)/prescriptions/${p.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open prescription ${p.diagnosisSummary || ''}`.trim()}
                >
                  <MaterialCommunityIcons name="prescription" size={18} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName} numberOfLines={1}>
                      {p.diagnosisSummary || 'Prescription'}
                    </Text>
                    <Text style={styles.medDosage}>
                      {new Date(p.issuedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      {p.medicines.length} {p.medicines.length === 1 ? 'medicine' : 'medicines'}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ── FIXED BOTTOM ACTION BAR ── */}
      <View style={[styles.bottomActionBar, { paddingBottom: insets.bottom + Spacing.base }]}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() =>
            router.push(
              visitPrescription
                ? `/(app)/prescriptions/${visitPrescription.id}`
                : // The visit links the prescription to this consultation (and its AI chat).
                  `/(app)/doctor/prescription/write?patientId=${id}&patientName=${encodeURIComponent(patientName)}` +
                    (appointment ? `&appointmentId=${appointment.id}` : ''),
            )
          }
          accessibilityLabel={
            visitPrescription ? "Open this visit's prescription" : 'Write Prescription'
          }
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="prescription" size={24} color={Colors.primary} />
        </TouchableOpacity>
        {/* Chat with this patient; the server allows it only with a visit together. */}
        <TouchableOpacity
          style={styles.circleBtn}
          disabled={openChat.isPending || !id}
          onPress={() =>
            openChat.mutate(String(id), {
              onSuccess: (chat) => router.push(`/(app)/chat/${chat.id}`),
              onError: (err: any) =>
                Alert.alert('Messages', err?.message || 'Could not open the chat. Try again.'),
            })
          }
          accessibilityLabel="Message patient"
          accessibilityRole="button"
        >
          {openChat.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialCommunityIcons name="message-text-outline" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
        {/* Only for a video visit that can still be joined; the call screen's Join starts it. */}
        {appointment?.format === 'video' &&
          (appointment.status === 'scheduled' || appointment.status === 'in_progress') && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push(`/(app)/call/${appointment.id}`)}
              accessibilityLabel="Start Video Consultation"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="video" size={20} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>
                {appointment.status === 'in_progress' ? 'Rejoin Call' : 'Start Video Call'}
              </Text>
            </TouchableOpacity>
          )}
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
