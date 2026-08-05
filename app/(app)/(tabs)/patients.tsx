// 1. IMPORTS
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, Layout, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// 2. TYPES
interface PatientMockData {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  condition: string;
  lastVisit: string;
  status: 'active' | 'inactive';
  visitType: 'new' | 'follow-up';
}

const MOCK_PATIENTS: PatientMockData[] = [
  {
    id: 'p1',
    name: 'Rahim Uddin',
    age: 45,
    gender: 'M',
    condition: 'Hypertension',
    lastVisit: 'Today',
    status: 'active',
    visitType: 'new',
  },
  {
    id: 'p2',
    name: 'Ayesha Rahman',
    age: 32,
    gender: 'F',
    condition: 'Type 2 Diabetes',
    lastVisit: 'Today',
    status: 'active',
    visitType: 'follow-up',
  },
  {
    id: 'p3',
    name: 'Kamal Hasan',
    age: 58,
    gender: 'M',
    condition: 'Chronic Back Pain',
    lastVisit: '2 days ago', // Note: Will be filtered out since it's not today
    status: 'active',
    visitType: 'follow-up',
  },
  {
    id: 'p4',
    name: 'Nusrat Jahan',
    age: 27,
    gender: 'F',
    condition: 'Asthma',
    lastVisit: 'Today',
    status: 'active',
    visitType: 'new',
  },
  {
    id: 'p5',
    name: 'Jamal Bhuyan',
    age: 39,
    gender: 'M',
    condition: 'Anxiety Disorder',
    lastVisit: 'Today',
    status: 'inactive', // Note: Will be filtered out since consultation is completed
    visitType: 'follow-up',
  },
  {
    id: 'p6',
    name: 'Farida Khanam',
    age: 51,
    gender: 'F',
    condition: 'Osteoarthritis',
    lastVisit: 'Today',
    status: 'active',
    visitType: 'new',
  },
  {
    id: 'p7',
    name: 'Tanvir Ahmed',
    age: 34,
    gender: 'M',
    condition: 'Migraine',
    lastVisit: 'Today',
    status: 'inactive', // Note: Will be filtered out
    visitType: 'follow-up',
  },
  {
    id: 'p8',
    name: 'Sabina Yasmin',
    age: 62,
    gender: 'F',
    condition: 'Coronary Artery Disease',
    lastVisit: 'Today',
    status: 'active',
    visitType: 'follow-up',
  },
];

// 3. COMPONENT
export default function PatientsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  // Logic Update: Filter for active patients only, and only those scheduled for "Today"
  // When a consultation is completed, the backend status becomes 'inactive', removing them from this list.
  const activePatients = useMemo(() => {
    return MOCK_PATIENTS.filter((p) => p.status === 'active' && p.lastVisit === 'Today');
  }, []);

  const totalNew = activePatients.filter((p) => p.visitType === 'new').length;
  const totalFollowUp = activePatients.filter((p) => p.visitType === 'follow-up').length;

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
              onPress={() => setIsOnline(!isOnline)}
              style={styles.toggleContainer}
              accessibilityRole="switch"
              accessibilityState={{ checked: isOnline }}
              accessibilityLabel="Online Status Toggle"
            >
              <View style={[styles.toggleCircle, isOnline ? styles.toggleOn : styles.toggleOff]} />
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
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.overviewRow2}>
            {/* Column 1: New Patients */}
            <View style={styles.overviewColumn}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="account-plus" size={22} color={Colors.primary} />
              </View>
              <View style={styles.overviewColText}>
                <Text style={styles.overviewLabel}>
                  {t('patients.new_patients', 'New Patients')}
                </Text>
                <Text style={styles.overviewValue}>{totalNew}</Text>
              </View>
            </View>

            {/* Column 2: Follow-up */}
            <View style={styles.overviewColumn}>
              <View style={styles.iconSquare}>
                <MaterialCommunityIcons name="account-arrow-right" size={22} color={Colors.primary} />
              </View>
              <View style={styles.overviewColText}>
                <Text style={styles.overviewLabel}>
                  {t('patients.follow_up', 'Follow-up')}
                </Text>
                <Text style={styles.overviewValue}>{totalFollowUp}</Text>
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
        {activePatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={48}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              {t('patients.no_patients_found', 'No active patients for today.')}
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
                accessibilityLabel={`Patient ${item.name}, ${item.age} years old, ${item.condition}`}
              >
                {/* Top Section: Info (Col 1) and Badge (Col 2) */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardPatientInfo}>
                    <Text style={styles.cardPatientName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardPatientDetails}>
                      {item.age} yrs • {item.gender === 'M' ? 'Male' : item.gender === 'F' ? 'Female' : 'Other'}
                    </Text>
                  </View>
                  
                  <View
                    style={[
                      styles.visitBadge,
                      item.visitType === 'new' ? styles.newBadge : styles.followUpBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.visitBadgeText,
                        item.visitType === 'new' ? styles.newBadgeText : styles.followUpBadgeText,
                      ]}
                    >
                      {item.visitType === 'new' ? 'New' : 'Follow-up'}
                    </Text>
                  </View>
                </View>

                {/* Footer: Condition/Reason */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardReasonLabel}>
                    {t('patients.condition_label', 'Condition:')}
                  </Text>
                  <Text style={styles.cardReasonText} numberOfLines={1}>
                    {item.condition}
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
