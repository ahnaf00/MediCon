// 1. IMPORTS
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { doctorsService } from '../../../src/services/api/doctorsService';
import { isAwaitingVideoStart } from '../../../src/services/api/consultationsService';
import { SymptomSearchBar } from '../../../src/components/forms/SymptomSearchBar';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { useTranslation } from 'react-i18next';

// 3. COMPONENT
export default function DoctorsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  // React Query Hooks
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['doctorCategories'],
    queryFn: doctorsService.getCategories,
  });

  const {
    data: history = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['consultationHistory'],
    queryFn: doctorsService.getConsultationHistory,
    // While a video visit may be about to start, re-check so "Join video call" appears.
    refetchInterval: (query) =>
      query.state.data?.some((h) =>
        isAwaitingVideoStart({ format: h.format, status: h.status, datetime: h.startsAt }),
      )
        ? 15_000
        : false,
  });

  const {
    data: doctors = [],
    isLoading: doctorsLoading,
    refetch: refetchDoctors,
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorsService.getDoctors(),
  });

  // Statuses and who is online change while the app is open; refresh on returning here.
  useFocusEffect(
    useCallback(() => {
      refetchHistory();
      refetchDoctors();
    }, [refetchHistory, refetchDoctors]),
  );

  // Since we only want online doctors here:
  const onlineDoctors = doctors.filter(doc => doc.isOnline);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titleBold}>Video </Text>
          <Text style={styles.titleBold}>Consultation</Text>
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/settings/')}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityLabel={t('dashboard.settings', 'Settings')}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-outline" size={27.6} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SymptomSearchBar />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Consultation History Section */}
        <View style={[styles.section, { marginTop: 0 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('doctors.consultation_history', 'Consultation History')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/doctors/history')}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('doctors.view_all_history', 'View all consultation history')}
            >
              <Text style={styles.viewAllText}>{t('doctors.view_all', 'view all')}</Text>
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.sectionLoader} />
          ) : history.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="history" size={28} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>
                {t('doctors.no_consultations_yet', 'No consultations yet')}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {history.map((item) => (
                <DoctorCard
                  key={item.id}
                  doctor={item as any}
                  variant="history"
                  onPress={() => router.push(`/(app)/doctors/${item.doctorId}`)}
                  onBookPress={() =>
                    router.push(
                      `/(app)/doctors/booking/digest?doctorId=${item.doctorId}&type=video`,
                    )
                  }
                  onJoinPress={() => router.push(`/(app)/call/${item.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Department Cards — 3-column grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('doctors.departments', 'Departments')}</Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/doctors/departments')}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('doctors.view_all_departments', 'View all departments')}
            >
              <Text style={styles.viewAllText}>{t('doctors.view_all', 'view all')}</Text>
            </TouchableOpacity>
          </View>

          {categoriesLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.grid}>
              {categories.slice(0, 6).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.gridItem}
                  onPress={() => router.push(`/(app)/doctors/?category=${category.id}`)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                >
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={26}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {category.name}
                  </Text>
                  {category.keyword && (
                    <Text style={styles.categoryKeyword} numberOfLines={1}>
                      {category.keyword}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Online Doctors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('doctors.online_doctors', 'Online Doctors')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/doctors/')}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('doctors.view_all_doctors', 'View all doctors')}
            >
              <Text style={styles.viewAllText}>{t('doctors.view_all', 'view all')}</Text>
            </TouchableOpacity>
          </View>

          {doctorsLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.sectionLoader} />
          ) : onlineDoctors.length === 0 ? (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="doctor" size={28} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>
                {t('doctors.no_doctors_online', 'No doctors online right now')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={onlineDoctors}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.onlineGridRow}
              contentContainerStyle={styles.onlineGridContainer}
              renderItem={({ item: doctor }) => (
                <DoctorCard
                  doctor={doctor}
                  variant="online"
                  onPress={() => router.push(`/(app)/doctors/${doctor.id}`)}
                  onBookPress={() =>
                    router.push(`/(app)/doctors/booking/digest?doctorId=${doctor.id}&type=video`)
                  }
                />
              )}
            />
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  titleNormal: {
    fontFamily: FontFamily.regular,
  },
  titleBold: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
  },
  searchContainer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  loader: {
    marginVertical: Spacing.xl,
  },

  // --- Department Grid (3 columns) ---
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  gridItem: {
    width: '31.5%',
    height: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  categoryKeyword: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },

  // --- Section (shared) ---
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
  viewAllText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19.5,
  },
  sectionLoader: {
    marginVertical: Spacing.lg,
  },
  emptySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * 1.5,
  },
  horizontalScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.xs,
  },
  onlineGridRow: {
    gap: Spacing.md,
  },
  onlineGridContainer: {
    gap: Spacing.md,
  },
});
