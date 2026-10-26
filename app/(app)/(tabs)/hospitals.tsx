import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hospitalsService } from '../../../src/services/api/hospitalsService';
import { nextPageParam } from '../../../src/services/api/pagination';
import { Hospital } from '../../../src/types/medical.types';
import { HospitalCard } from '../../../src/components/cards/HospitalCard';
import { SymptomSearchBar } from '../../../src/components/forms/SymptomSearchBar';
import { useTranslation } from 'react-i18next';

export default function HospitalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [search, setSearch] = useState('');

  // 20 hospitals per page; the next page loads as the list nears the end (task H3).
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
    queryKey: ['hospitals', search],
    queryFn: ({ pageParam }) => hospitalsService.getHospitalsPage(search, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
  });

  const hospitals = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const handleHospitalPress = (hospital: Hospital) => {
    router.push(`/(app)/hospitals/${hospital.id}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        <Text style={styles.headerTitle}>{t('hospitals.title', 'Hospitals')}</Text>
      </View>

      <View style={styles.searchBarWrapper}>
        <SymptomSearchBar
          interactive
          placeholder={t('hospitals.search_placeholder') || 'Search hospitals'}
          onSubmit={setSearch}
          onClear={() => setSearch('')}
        />
      </View>

      <View style={styles.notice}>
        <MaterialCommunityIcons name="information-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.noticeText}>
          {t(
            'hospitals.unverified',
            'Hospital details are not verified by MediCon. If a life is in danger, call 999.',
          )}
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
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
                  {t('hospitals.load_more_failed', "Couldn't load more. Tap to try again.")}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            isError ? (
              <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
                <Text style={styles.emptyText}>
                  {t('hospitals.load_failed', "Couldn't load hospitals. Tap to try again.")}
                </Text>
              </TouchableOpacity>
            ) : search ? (
              <Text style={styles.emptyText}>
                {t('hospitals.no_results', { query: search }) || `No hospitals match "${search}".`}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <HospitalCard hospital={item} onPress={() => handleHospitalPress(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
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
  searchBarWrapper: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  noticeText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingTop: Spacing.xl,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
