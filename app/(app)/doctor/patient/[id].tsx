// ─── IMPORTS ────────────────────────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '@theme';
import {
  usePatient,
  ageFromDateOfBirth,
  splitProfileList,
} from '../../../../src/services/api/patientsService';
import { usePrescriptions } from '../../../../src/services/api/prescriptionsService';

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // GET /patients/{id}: the server only answers for a patient who has booked with this doctor.
  const { data: patient, isLoading } = usePatient(id);
  // The server returns only prescriptions this doctor wrote; keep this patient's.
  const prescriptionsQuery = usePrescriptions();
  const prescriptions = (prescriptionsQuery.data ?? []).filter(
    (p) => String(p.patient?.id) === String(id),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.notFoundContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.notFoundContainer}>
          <MaterialCommunityIcons name="account-question" size={48} color={Colors.textTertiary} />
          <Text style={styles.notFoundText}>Patient not found</Text>
          <TouchableOpacity
            style={styles.backButtonAlt}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarLetter = patient.name.charAt(0).toUpperCase();
  const profile = patient.patientProfile;
  const age = ageFromDateOfBirth(profile?.dateOfBirth);
  const gender = profile?.gender
    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
    : null;
  const meta = [age !== null ? `${age} yrs` : null, gender, profile?.bloodGroup]
    .filter(Boolean)
    .join(' · ');
  const chronicConditions = splitProfileList(profile?.chronicConditions);
  const allergies = splitProfileList(profile?.allergies);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Patient Profile</Text>

        {/* Spacer to balance header */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>

          {/* Name */}
          <Text style={styles.patientName}>{patient.name}</Text>

          {/* Age · Gender · Blood Group */}
          {meta ? <Text style={styles.patientMeta}>{meta}</Text> : null}

          {/* Phone */}
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.phoneText}>{patient.phone}</Text>
          </View>
        </View>

        {/* ── Chronic Conditions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chronic Conditions</Text>
          {chronicConditions.length === 0 ? (
            <View style={styles.emptyRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>None reported</Text>
            </View>
          ) : (
            <View style={styles.chipsRow}>
              {chronicConditions.map((condition) => (
                <View key={condition} style={styles.conditionChip}>
                  <Text style={styles.conditionChipText}>{condition}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Known Allergies ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Known Allergies</Text>
          {allergies.length === 0 ? (
            <View style={styles.emptyRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>No allergies recorded</Text>
            </View>
          ) : (
            <View style={styles.chipsRow}>
              {allergies.map((allergy) => (
                <View key={allergy} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{allergy}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Prescriptions this doctor wrote (review what the patient reads) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Prescriptions</Text>
          {prescriptionsQuery.isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : prescriptions.length === 0 ? (
            <View style={styles.emptyRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {prescriptionsQuery.isError
                  ? 'Could not load prescriptions.'
                  : 'You have not written a prescription for this patient yet.'}
              </Text>
            </View>
          ) : (
            prescriptions.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.rxRow}
                onPress={() => router.push(`/(app)/prescriptions/${p.id}`)}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="prescription" size={20} color={Colors.primary} />
                <View style={styles.rxText}>
                  <Text style={styles.rxTitle} numberOfLines={1}>
                    {p.diagnosisSummary || 'Prescription'}
                  </Text>
                  <Text style={styles.rxMeta}>
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
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Fixed bottom action ── */}
      <TouchableOpacity
        style={[styles.prescriptionBtn, { bottom: insets.bottom + Spacing.base }]}
        onPress={() =>
          router.push(
            `/(app)/doctor/prescription/write?patientId=${id}&patientName=${encodeURIComponent(
              patient.name,
            )}`,
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Write prescription for this patient"
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="prescription" size={20} color={Colors.surface} />
        <Text style={styles.prescriptionBtnText}>Write Prescription</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 120,
  },

  // ── Profile card ──
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    alignItems: 'center',
    ...Shadows.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.primary,
  },
  patientName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  patientMeta: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  phoneText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // ── Section ──
  rxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  rxText: {
    flex: 1,
  },
  rxTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  rxMeta: {
    marginTop: 2,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ── Empty state row ──
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },

  // ── Chips ──
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionChip: {
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  conditionChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  allergyChip: {
    backgroundColor: `${Colors.danger}15`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  allergyChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.danger,
  },

  // ── Fixed prescription button ──
  prescriptionBtn: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    minHeight: 52,
    ...Shadows.md,
  },
  prescriptionBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },

  // ── Not found state ──
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  notFoundText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  backButtonAlt: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonAltText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
});
