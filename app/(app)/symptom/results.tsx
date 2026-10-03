import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { useSymptomSearch } from '../../../src/services/api/symptomSearchService';
import { Doctor } from '../../../src/services/api/doctorsService';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { DraggableBottomSheet } from '../../../src/components/ui/DraggableBottomSheet';

type FilterType = 'all' | 'today' | 'week';

const FILTERS: FilterType[] = ['all', 'today', 'week'];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Same calendar day in the device's local time (no toISOString — that's UTC). */
const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const matchesFilter = (doctor: Doctor, filter: FilterType, now: Date) => {
  if (filter === 'all') return true;
  if (!doctor.nextAvailableAt) return false;
  const next = new Date(doctor.nextAvailableAt);
  if (filter === 'today') return isSameLocalDay(next, now);
  return next.getTime() - now.getTime() <= WEEK_MS;
};

const formatNextAvailable = (iso: string, t: TFunction, locale: string) => {
  const next = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const time = next.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

  if (isSameLocalDay(next, now)) return `${t('results.today') || 'Today'}, ${time}`;
  if (isSameLocalDay(next, tomorrow)) return `${t('results.tomorrow') || 'Tomorrow'}, ${time}`;
  const day = next.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day}, ${time}`;
};

export default function SymptomResultsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q } = useLocalSearchParams();
  const query = typeof q === 'string' ? q : '';
  const locale = i18n.language === 'bn' ? 'bn-BD' : 'en-US';

  const { data, isLoading, isError, refetch, isRefetching } = useSymptomSearch(query);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const doctors = useMemo(() => {
    const now = new Date();
    return (data?.doctors ?? []).filter((doc) => matchesFilter(doc, filter, now));
  }, [data, filter]);

  const filterLabel = (type: FilterType) =>
    type === 'all'
      ? t('results.filter_all') || 'All doctors'
      : type === 'today'
        ? t('results.filter_today') || 'Available today'
        : t('results.filter_week') || 'Available this week';

  const renderItem = useCallback(
    ({ item }: { item: Doctor }) => (
      <View style={styles.gridItemContainer}>
        <DoctorCard
          doctor={item}
          variant="online"
          fullWidth
          onPress={() => router.push(`/(app)/doctors/${item.id}`)}
          onBookPress={() =>
            router.push(`/(app)/doctors/booking/digest?doctorId=${item.id}&type=video`)
          }
          hideSectionLabel
        />
        <View style={styles.nextAvailableRow}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={14}
            color={item.nextAvailableAt ? Colors.primary : Colors.textTertiary}
          />
          <Text style={styles.nextAvailableText} numberOfLines={2}>
            {item.nextAvailableAt
              ? t('results.next_available', {
                  time: formatNextAvailable(item.nextAvailableAt, t, locale),
                }) || `Next available: ${formatNextAvailable(item.nextAvailableAt, t, locale)}`
              : t('results.no_slots_soon') || 'No free slots in the next 2 weeks'}
          </Text>
        </View>
      </View>
    ),
    [router, t, locale],
  );

  const count = doctors.length;
  const resultsCountText =
    count === 1
      ? t('results.one_doctor_available') || '1 doctor available'
      : t('results.n_doctors_available', { count }) || `${count} doctors available`;

  const isEmergency = data?.urgency === 'emergency';
  const redFlagMessage = data?.redFlag
    ? t(`results.red_flag.${data.redFlag.code}`, { defaultValue: data.redFlag.message })
    : null;

  const listHeader = data ? (
    <View>
      {isEmergency && (
        <View style={styles.emergencyCard} accessibilityRole="alert">
          <View style={styles.emergencyTitleRow}>
            <MaterialCommunityIcons name="alert-octagon" size={22} color={Colors.danger} />
            <Text style={styles.emergencyTitle}>
              {t('results.emergency_title') || 'This could be an emergency'}
            </Text>
          </View>
          {redFlagMessage ? <Text style={styles.emergencyBody}>{redFlagMessage}</Text> : null}
          <Text style={styles.emergencyBody}>
            {t('results.emergency_body') ||
              'If these symptoms are happening now, call 999 or go to the nearest emergency department. Do not wait for an online consultation.'}
          </Text>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Linking.openURL('tel:999')}
            accessibilityRole="button"
            accessibilityLabel={t('emergency.call_emergency') || 'Call 999'}
          >
            <MaterialCommunityIcons name="phone" size={20} color={Colors.surface} />
            <Text style={styles.callButtonText}>{t('emergency.call_emergency') || 'Call 999'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.guideButton}
            onPress={() => router.push('/(app)/emergency')}
            accessibilityRole="button"
          >
            <Text style={styles.guideButtonText}>
              {t('results.open_emergency_guide') || 'Open emergency guide'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.specialtyText}>
        {data.matchedSpecialty
          ? t('results.suggested_specialty', { specialty: data.specialty }) ||
            `Suggested specialty: ${data.specialty}`
          : t('results.specialty_fallback', { specialty: data.specialty }) ||
            `No ${data.specialty} doctors are available yet. Showing General Medicine doctors instead.`}
      </Text>

      {isEmergency && count > 0 && (
        <Text style={styles.consultWhenSafe}>
          {t('results.consult_when_safe') || 'When you are safe, these doctors can help:'}
        </Text>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.resultsCount}>{resultsCountText}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFilterOpen(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color={Colors.textPrimary} />
          <Text style={styles.filterButtonText}>
            {filter === 'all'
              ? t('results.filter_doctors') || 'Filter doctors'
              : filterLabel(filter)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      {/* Header — matching My Reports / Departments */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {query || 'Results'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError || !data ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {t('results.error') ||
              "We couldn't search right now. Please check your connection and try again."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            disabled={isRefetching}
            accessibilityRole="button"
          >
            {isRefetching ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.retryButtonText}>{t('results.retry') || 'Try again'}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={doctors}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? t('results.no_matching_doctors_found_for_') ||
                    'No matching doctors found for these symptoms.'
                  : t('results.no_doctors_for_filter') || 'No doctors match this filter.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Bottom Sheet */}
      <DraggableBottomSheet visible={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <View style={styles.filterContent}>
          {FILTERS.map((type, index, array) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterOption, index === array.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => {
                setFilter(type);
                setIsFilterOpen(false);
              }}
            >
              <Text
                style={[styles.filterOptionText, filter === type && styles.filterOptionTextActive]}
              >
                {filterLabel(type)}
              </Text>
              {filter === type && (
                <MaterialCommunityIcons name="check" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrapper: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    height: 60,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
  },
  emergencyCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FDECEF',
    borderWidth: 1,
    borderColor: Colors.danger,
    gap: Spacing.sm,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emergencyTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.danger,
  },
  emergencyBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  callButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  guideButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  guideButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
  specialtyText: {
    marginTop: Spacing.md,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  consultWhenSafe: {
    marginTop: Spacing.sm,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  resultsCount: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  filterButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  gridItemContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm / 2, // Horizontal spacing for 2 columns
    paddingBottom: Spacing.md, // Vertical spacing
  },
  nextAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  nextAvailableText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  filterContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  filterOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bold,
  },
});
