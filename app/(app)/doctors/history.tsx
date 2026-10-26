// 1. IMPORTS
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily, FontSize } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { doctorsService, ConsultationHistoryItem } from '../../../src/services/api/doctorsService';
import { nextPageParam } from '../../../src/services/api/pagination';
import { DoctorCard } from '../../../src/components/cards/DoctorCard';
import { apiErrorMessage } from '../../../src/utils/errors';
import { appointmentsService } from '../../../src/services/api/appointmentsService';
import { isAwaitingVideoStart } from '../../../src/services/api/consultationsService';
import { useTranslation } from 'react-i18next';

// 2. TYPES
/* No external props */

// 3. COMPONENT
export default function ConsultationHistoryScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 20 visits per page, newest first; the next page loads near the end (task H3).
  // A failed background refresh keeps the list already shown.
  const {
    data,
    isLoading: loading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: ['appointments', 'history'],
    queryFn: ({ pageParam }) => doctorsService.getConsultationHistoryPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextPageParam,
    // No push notifications yet: while a video visit may be about to start, re-check every
    // 15 s so "Join video call" appears without a manual refresh.
    refetchInterval: (query) =>
      query.state.data?.pages.some((p) =>
        p.items.some((h) =>
          isAwaitingVideoStart({ format: h.format, status: h.status, datetime: h.startsAt }),
        ),
      )
        ? 15_000
        : false,
  });

  const history = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const fetchHistory = useCallback(() => {
    refetch();
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  // Coming back to this screen: statuses may have changed (e.g. the doctor started a call).
  useFocusEffect(fetchHistory);

  const handleCancel = useCallback(
    (id: string) => {
      Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentsService.cancelAppointment(id);
              fetchHistory();
            } catch (error) {
              // e.g. too close to the visit (audit F10): show the API's reason.
              Alert.alert(
                'Not cancelled',
                apiErrorMessage(error, 'Failed to cancel appointment. Please try again.'),
              );
              fetchHistory();
            }
          },
        },
      ]);
    },
    [fetchHistory],
  );

  const renderItem = useCallback(
    ({ item }: { item: ConsultationHistoryItem }) => {
      return (
        <View style={styles.cardWrapper}>
          <DoctorCard
            doctor={item}
            variant="history"
            fullWidth
            onPress={() => router.push(`/(app)/doctors/${item.doctorId}`)}
            onBookPress={() =>
              router.push(`/(app)/doctors/booking/digest?doctorId=${item.doctorId}&type=video`)
            }
            onCancelPress={() => handleCancel(item.id)}
            onReschedulePress={() =>
              router.push(`/(app)/doctors/booking?id=${item.doctorId}&rescheduleId=${item.id}`)
            }
            onAskAiPress={() => router.push(`/(app)/ai-chat/consultation/${item.id}`)}
            onJoinPress={() => router.push(`/(app)/call/${item.id}`)}
          />
        </View>
      );
    },
    [router, handleCancel],
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
          <Text style={styles.headerTitle}>Consultation History</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError && history.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {t('history.load_failed', "Couldn't load your visits. Check your connection.")}
          </Text>
          <TouchableOpacity style={styles.exploreButton} onPress={fetchHistory}>
            <Text style={styles.exploreButtonText}>{t('common.retry', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="history" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>
            {t('history.no_history_found') || 'No history found'}
          </Text>
          <Text style={styles.emptyText}>
            {t('history.you_havent_had_any_consultatio') ||
              "You haven't had any consultations yet."}
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(app)/(tabs)/doctors')}
          >
            <Text style={styles.exploreButtonText}>
              {t('history.find_a_doctor') || 'Find a Doctor'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={history}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.md) },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={fetchHistory}
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
                  {t('history.load_more_failed', "Couldn't load more. Tap to try again.")}
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
  cardWrapper: {
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.sm / 2, // Squeezes the card slightly to match the Departments screen grid width
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dateText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#28a74520', // 20% opacity of #28a745
  },
  statusOther: {
    backgroundColor: Colors.tertiary,
  },
  statusText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.textPrimary,
    lineHeight: 15,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  details: {
    flex: 1,
  },
  doctorName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  specialty: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: FontSize.md * 1.5,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  retryText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    color: Colors.primary,
    textAlign: 'center',
  },
});
