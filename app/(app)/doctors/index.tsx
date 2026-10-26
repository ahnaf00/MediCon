// 1. IMPORTS
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { doctorsService, Doctor } from '../../../src/services/api/doctorsService';
import { nextPageParam } from '../../../src/services/api/pagination';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { useTranslation } from 'react-i18next';

// 2. TYPES
/* No external props */

// 3. COMPONENT
export default function DoctorsListScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();

  // 20 doctors per page; the next page loads as the list nears the end (task H3).
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: ['doctors', 'list', category ?? 'all'],
    queryFn: ({ pageParam }) =>
      doctorsService.getDoctorsPage({ specialty: category, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });

  const doctors = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

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
      </View>
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      {/* Header Wrapper */}
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
          <Text style={styles.headerTitle}>
            {category ? category : t('doctors.all_doctors', 'All Doctors')}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError && doctors.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {t('doctors.load_failed', "Couldn't load doctors. Check your connection.")}
          </Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retryText}>{t('common.retry', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="doctor" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {t('doctors.no_doctors_found') || 'No doctors found'}
          </Text>
        </View>
      ) : (
        <FlashList
          data={doctors}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={Colors.primary} />
            ) : isFetchNextPageError ? (
              <TouchableOpacity
                style={styles.footer}
                onPress={() => fetchNextPage()}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>
                  {t('doctors.load_more_failed', "Couldn't load more. Tap to try again.")}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrapper: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
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
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
  },
  gridItemContainer: {
    flex: 1,
    paddingHorizontal: Spacing.sm / 2, // Horizontal spacing for 2 columns
    paddingBottom: Spacing.md, // Vertical spacing
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primary,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
