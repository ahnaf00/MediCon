// ─── IMPORTS ────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Shadows } from '@theme';

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface PatientDetail {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  phone: string;
  lastVisit: string;
  chronicConditions: string[];
  allergies: string[];
  activeCondition: string;
}

const MOCK_PATIENT_DETAILS: Record<string, PatientDetail> = {
  'appt-101': {
    id: 'appt-101',
    name: 'Rahim Uddin',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+880 1711-234567',
    lastVisit: 'Today',
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    activeCondition: 'Follow-up for hypertension',
  },
  'appt-102': {
    id: 'appt-102',
    name: 'Ayesha Rahman',
    age: 32,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+880 1811-345678',
    lastVisit: 'Yesterday',
    chronicConditions: ['Migraine'],
    allergies: [],
    activeCondition: 'Migraine consultation',
  },
  'appt-103': {
    id: 'appt-103',
    name: 'Kamal Hasan',
    age: 58,
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '+880 1911-456789',
    lastVisit: '2 days ago',
    chronicConditions: ['Hypertension', 'High Cholesterol', 'Arthritis'],
    allergies: ['Sulfa drugs', 'Aspirin'],
    activeCondition: 'Routine checkup, blood test review',
  },
  'appt-104': {
    id: 'appt-104',
    name: 'Nusrat Jahan',
    age: 27,
    gender: 'Female',
    bloodGroup: 'AB-',
    phone: '+880 1611-567890',
    lastVisit: '1 week ago',
    chronicConditions: [],
    allergies: [],
    activeCondition: 'Fever and throat pain for 3 days',
  },
  p1: {
    id: 'p1',
    name: 'Rahim Uddin',
    age: 45,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+880 1711-234567',
    lastVisit: 'Today',
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    activeCondition: 'Follow-up for hypertension',
  },
  p2: {
    id: 'p2',
    name: 'Ayesha Rahman',
    age: 32,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+880 1811-345678',
    lastVisit: 'Yesterday',
    chronicConditions: ['Migraine'],
    allergies: [],
    activeCondition: 'Migraine consultation',
  },
  p3: {
    id: 'p3',
    name: 'Kamal Hasan',
    age: 58,
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '+880 1911-456789',
    lastVisit: '2 days ago',
    chronicConditions: ['Hypertension', 'High Cholesterol', 'Arthritis'],
    allergies: ['Sulfa drugs', 'Aspirin'],
    activeCondition: 'Routine checkup',
  },
  p4: {
    id: 'p4',
    name: 'Nusrat Jahan',
    age: 27,
    gender: 'Female',
    bloodGroup: 'AB-',
    phone: '+880 1611-567890',
    lastVisit: '1 week ago',
    chronicConditions: [],
    allergies: [],
    activeCondition: 'Fever and throat pain',
  },
  p5: {
    id: 'p5',
    name: 'Jamal Bhuyan',
    age: 39,
    gender: 'Male',
    bloodGroup: 'O-',
    phone: '+880 1511-678901',
    lastVisit: '2 weeks ago',
    chronicConditions: ['Asthma'],
    allergies: ['NSAIDs'],
    activeCondition: 'Asthma follow-up',
  },
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const patient = id ? MOCK_PATIENT_DETAILS[id] : undefined;

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
          <Text style={styles.patientMeta}>
            {patient.age} yrs · {patient.gender} · {patient.bloodGroup}
          </Text>

          {/* Phone */}
          <View style={styles.phoneRow}>
            <MaterialCommunityIcons name="phone-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.phoneText}>{patient.phone}</Text>
          </View>
        </View>

        {/* ── Current Concern ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Concern</Text>
          <View style={styles.concernCard}>
            <Text style={styles.concernText}>{patient.activeCondition}</Text>
          </View>
        </View>

        {/* ── Chronic Conditions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chronic Conditions</Text>
          {patient.chronicConditions.length === 0 ? (
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
              {patient.chronicConditions.map((condition) => (
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
          {patient.allergies.length === 0 ? (
            <View style={styles.emptyRow}>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={[styles.emptyText, { color: Colors.success }]}>No known allergies</Text>
            </View>
          ) : (
            <View style={styles.chipsRow}>
              {patient.allergies.map((allergy) => (
                <View key={allergy} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{allergy}</Text>
                </View>
              ))}
            </View>
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
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ── Current concern card ──
  concernCard: {
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  concernText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.primary,
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
