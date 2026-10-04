import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, Layout, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { patientsService, ApiPatient } from '../../../src/services/api/patientsService';
import { useDoctorPresence } from '../../../src/services/api/presenceService';

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

export default function PatientsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  // Same server-backed presence as the dashboard and Q&A inbox (was local-only state).
  const presence = useDoctorPresence();
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await patientsService.getPatients();
        if (isMounted) setPatients(data);
      } catch (err) {
        console.error('Failed to load patients', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPatients();
    return () => { isMounted = false; };
  }, []);

  // For this list, we'll just display all patients returned by the API
  const activePatients = patients;
  
  // Since the backend doesn't return visitType, we'll just say 0 for now or hide the count.
  const totalNew = 0; 
  const totalFollowUp = activePatients.length;

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            <Text style={styles.titleBold}>My </Text>
            <Text style={styles.titleBold}>Patients</Text>
          </Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.toggleWrapper}>
            <Text style={styles.onlineLabel}>{t('doctordashboard.online', 'Online')}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={presence.toggle}
              disabled={!presence.canToggle}
              style={styles.toggleContainer}
              accessibilityRole="switch"
              accessibilityState={{ checked: presence.isOnline, disabled: !presence.canToggle }}
              accessibilityLabel="Online Status Toggle"
            >
              <View
                style={[
                  styles.toggleCircle,
                  presence.isOnline ? styles.toggleOn : styles.toggleOff,
                ]}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/')}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={styles.profileIcon}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="account-outline" size={27.6} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Patients Overview Card */}
        <View style={styles.overviewCard}>
          {/* Row 1 */}
          <View style={styles.overviewRow1}>
            <View>
              <Text style={styles.overviewTitle}>
                {t('patients.patients_overview', 'Patients Overview')}
              </Text>
              <Text style={styles.overviewDate}>{currentDate}</Text>
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>All Time</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.overviewRow2}>
            {/* Column 1: Total Patients */}
            <View style={styles.overviewColumn}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="account-group" size={22} color={Colors.primary} />
              </View>
              <View style={styles.overviewColText}>
                <Text style={styles.overviewLabel}>
                  Total Patients
                </Text>
                <Text style={styles.overviewValue}>{activePatients.length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('patients.all_patients', 'All Patients')}</Text>
          <Text style={styles.patientCount}>{activePatients.length} patients</Text>
        </View>

        {/* Patient List */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activePatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={48}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              {t('patients.no_patients_found', 'No patients found.')}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {activePatients.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.patientCard}
                activeOpacity={0.7}
                onPress={() => router.push('/(app)/doctor/consultation/' + item.id)}
              >
                {/* Top Section */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardPatientInfo}>
                    <Text style={styles.cardPatientName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardPatientDetails}>
                      {calculateAge(item.patientProfile?.dateOfBirth)} yrs • {item.patientProfile?.gender || 'Unknown'}
                    </Text>
                  </View>
                  
                  <View style={[styles.visitBadge, styles.followUpBadge]}>
                    <Text style={[styles.visitBadgeText, styles.followUpBadgeText]}>
                      Patient
                    </Text>
                  </View>
                </View>

                {/* Footer: Phone */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardReasonLabel}>
                    Phone:
                  </Text>
                  <Text style={styles.cardReasonText} numberOfLines={1}>
                    {item.phone || 'N/A'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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

  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  titleBold: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    gap: Spacing.sm,
  },
  onlineLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  toggleContainer: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  toggleCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  toggleOn: {
    backgroundColor: Colors.success,
    alignSelf: 'flex-end',
  },
  toggleOff: {
    backgroundColor: Colors.textTertiary,
    alignSelf: 'flex-start',
  },
  profileIcon: {
    marginLeft: Spacing.xs,
  },

  // --- Scroll ---
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Layout.tabBarHeight + Spacing.xl,
    paddingTop: Spacing.md,
  },

  // --- Patients Overview Card ---
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  overviewRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  overviewTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  overviewDate: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  todayBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  todayBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  overviewRow2: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  overviewColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    gap: Spacing.sm,
  },
  iconSquare: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewColText: {
    flex: 1,
  },
  overviewLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  overviewValue: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },

  // --- Section Header ---
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
  patientCount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // --- List Container ---
  listContainer: {
    gap: Spacing.base,
  },

  // --- Patient Card Styles ---
  patientCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardPatientInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  cardPatientName: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardPatientDetails: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  visitBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  newBadge: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '40',
  },
  newBadgeText: {
    color: Colors.primary,
  },
  followUpBadge: {
    backgroundColor: '#f59e0b18', // Amber tint
    borderColor: '#f59e0b50',
  },
  followUpBadgeText: {
    color: '#b45309', // Amber-700 for readable contrast
  },
  visitBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  cardReasonLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  cardReasonText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },

  // --- Empty State ---
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
});
