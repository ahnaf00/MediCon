// 1. IMPORTS
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius, FontFamily, FontSize, Layout } from '../../../src/theme';
import { prescriptionsService } from '../../../src/services/api/prescriptionsService';
import { Prescription } from '../../../src/types/medical.types';
import { PrescriptionCard } from '../../../src/components/medical/PrescriptionCard';
import { ActivePrescriptionView } from '../../../src/components/medical/ActivePrescriptionView';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { DraggableBottomSheet } from '../../../src/components/ui/DraggableBottomSheet';

// 2. TYPES

type ActiveTab = 'doctors' | 'uploads';

// 3. COMPONENT

export default function PrescriptionsScreen(): React.JSX.Element {
  const router = useRouter();
  const { openActivePrescription } = useLocalSearchParams<{ openActivePrescription?: string }>();
  const insets = useSafeAreaInsets();

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('doctors');

  // ── List data ───────────────────────────────────────────────────────────────
  const [doctorRxs, setDoctorRxs] = useState<Prescription[]>([]);
  const [uploadedRxs, setUploadedRxs] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // ── Scheduling state ────────────────────────────────────────────────────────
  const [scheduledId, setScheduledId] = useState<string | null>(
    prescriptionsService.getScheduledPrescriptionId(),
  );
  const [schedulingId, setSchedulingId] = useState<string | null>(null); // which card is loading

  // ── Active prescription quick-view ──────────────────────────────────────────
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const [doctors, uploads] = await Promise.all([
        prescriptionsService.getDoctorPrescriptions(),
        prescriptionsService.getUploadedPrescriptions(),
      ]);
      if (isMountedRef.current) {
        setDoctorRxs(doctors);
        setUploadedRxs(uploads);
      }
    } catch {
      if (isMountedRef.current) {
        setError(
          createAppError('NETWORK_ERROR', 'Unable to load prescriptions. Please try again.'),
        );
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      setLoading(true);
      await loadData();
      if (isMountedRef.current) setLoading(false);
    })();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setScheduledId(prescriptionsService.getScheduledPrescriptionId());
    setRefreshing(false);
  };

  // ── Schedule / unschedule ───────────────────────────────────────────────────

  const handleSchedule = async (rx: Prescription): Promise<void> => {
    if (scheduledId === rx.id) {
      // Explicit unschedule via button — handled by handleUnschedule
      return;
    }
    const previousId = scheduledId;
    setSchedulingId(rx.id);
    try {
      await prescriptionsService.schedulePrescription(rx.id);
      if (isMountedRef.current) {
        setScheduledId(rx.id);
      }
    } catch {
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to schedule prescription. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setSchedulingId(null);
    }
  };

  const handleUnschedule = async (): Promise<void> => {
    setSchedulingId(scheduledId);
    try {
      await prescriptionsService.unschedulePrescription();
      if (isMountedRef.current) {
        setScheduledId(null);
        setActivePrescription(null);
      }
    } catch {
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to unschedule prescription. Please try again.');
      }
    } finally {
      if (isMountedRef.current) setSchedulingId(null);
    }
  };

  // ── Quick-view ──────────────────────────────────────────────────────────────

  const handleOpenQuickView = async (): Promise<void> => {
    if (!scheduledId) {
      setQuickViewVisible(true);
      setActivePrescription(null);
      return;
    }
    setQuickViewLoading(true);
    setQuickViewVisible(true);
    try {
      const rx = await prescriptionsService.getScheduledPrescription();
      if (isMountedRef.current) setActivePrescription(rx);
    } catch {
      if (isMountedRef.current) setActivePrescription(null);
    } finally {
      if (isMountedRef.current) setQuickViewLoading(false);
    }
  };

  useEffect(() => {
    if (openActivePrescription === 'true') {
      handleOpenQuickView();
      router.setParams({ openActivePrescription: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openActivePrescription]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const currentList = activeTab === 'doctors' ? doctorRxs : uploadedRxs;
  const scheduledRx = useMemo(() => {
    if (!scheduledId) return null;
    return (
      doctorRxs.find((rx) => rx.id === scheduledId) ||
      uploadedRxs.find((rx) => rx.id === scheduledId) ||
      null
    );
  }, [scheduledId, doctorRxs, uploadedRxs]);

  const renderItem = useCallback(
    ({ item }: { item: Prescription }): React.JSX.Element => (
      <View style={styles.cardWrapper}>
        <PrescriptionCard
          prescription={item}
          isScheduled={scheduledId === item.id}
          isScheduling={schedulingId === item.id}
          onPress={() => router.push(`/(app)/prescriptions/${item.id}`)}
          onToggleSchedule={() => {
            if (scheduledId === item.id) {
              handleUnschedule();
            } else {
              handleSchedule(item);
            }
          }}
        />
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scheduledId, schedulingId, router],
  );

  const renderEmptyDoctor = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="stethoscope" size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>No prescriptions from doctors yet</Text>
      <Text style={styles.emptySubtitle}>
        Prescriptions issued by doctors after consultations will appear here.
      </Text>
    </View>
  );

  const renderEmptyUploads = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="file-upload-outline" size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>No uploaded prescriptions</Text>
      <Text style={styles.emptySubtitle}>
        Upload prescriptions from a paper copy or photo to manage them here.
      </Text>
      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={() => Alert.alert('Upload', 'Upload flow coming soon.')}
        accessibilityRole="button"
        accessibilityLabel="Upload a prescription"
      >
        <MaterialCommunityIcons name="upload" size={16} color={Colors.surface} />
        <Text style={styles.uploadBtnText}>Upload Prescription</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Loading / Error ─────────────────────────────────────────────────────────

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        {renderTabs()}
        <View style={styles.centeredFlex}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        {renderTabs()}
        <View style={styles.centeredFlex}>
          <ErrorState
            message={error.message}
            onRetry={() => {
              setLoading(true);
              loadData().finally(() => setLoading(false));
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Helper sub-renderers ────────────────────────────────────────────────────

  function renderHeader(): React.JSX.Element {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Text style={styles.headerTitleBold}>My </Text>
          <Text style={styles.headerTitleBold}>Prescriptions</Text>
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/settings/')}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityLabel="Settings"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-outline" size={27.6} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderTabs(): React.JSX.Element {
    return (
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'doctors' && styles.tabActive]}
          onPress={() => setActiveTab('doctors')}
          activeOpacity={1}
          accessibilityRole="tab"
          accessibilityLabel="From Doctors tab"
          accessibilityState={{ selected: activeTab === 'doctors' }}
        >
          <Text style={[styles.tabText, activeTab === 'doctors' && styles.tabTextActive]}>
            From Doctors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'uploads' && styles.tabActive]}
          onPress={() => setActiveTab('uploads')}
          activeOpacity={1}
          accessibilityRole="tab"
          accessibilityLabel="My Uploads tab"
          accessibilityState={{ selected: activeTab === 'uploads' }}
        >
          <Text style={[styles.tabText, activeTab === 'uploads' && styles.tabTextActive]}>
            My Uploads
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Upload button (floating in "My Uploads" tab when non-empty) ─────────────
  const showUploadFab = activeTab === 'uploads' && uploadedRxs.length > 0;

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      {renderHeader()}

      {/* Two-tab switcher */}
      {renderTabs()}

      {/* Active prescription quick-view button */}
      <View style={styles.quickViewBtnContainer}>
        <TouchableOpacity
          style={[
            styles.quickViewBtn,
            scheduledId ? styles.quickViewBtnActive : styles.quickViewBtnEmpty,
          ]}
          onPress={handleOpenQuickView}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={
            scheduledId
              ? 'View active prescription medicines and schedule'
              : 'No prescription scheduled. Tap to learn more.'
          }
        >
          <View style={styles.quickViewBtnLeft}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={20}
              color={scheduledId ? Colors.surface : Colors.textTertiary}
            />
            <View>
              <Text
                style={[styles.quickViewBtnTitle, !scheduledId && styles.quickViewBtnTitleEmpty]}
              >
                {scheduledId ? 'View scheduled medicines' : 'Active Schedule'}
              </Text>
              <Text
                style={[
                  styles.quickViewBtnSubtitle,
                  !scheduledId && styles.quickViewBtnSubtitleEmpty,
                ]}
              >
                {scheduledId
                  ? scheduledRx?.doctorName || 'Prescription Schedule'
                  : 'Select a prescription from below'}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={scheduledId ? Colors.surface : Colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.listWrapper}>
        <FlashList
          key={activeTab} // Force remount when tab changes to reset scroll position
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={activeTab === 'doctors' ? renderEmptyDoctor() : renderEmptyUploads()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      </View>

      {/* Upload FAB for "My Uploads" tab (when list is non-empty) */}
      {showUploadFab && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => Alert.alert('Upload', 'Upload flow coming soon.')}
          accessibilityRole="button"
          accessibilityLabel="Upload a new prescription"
        >
          <MaterialCommunityIcons name="plus" size={24} color={Colors.primary} />
          <Text style={styles.fabText}>Upload</Text>
        </TouchableOpacity>
      )}

      {/* Quick-view modal */}
      <DraggableBottomSheet
        visible={quickViewVisible}
        onClose={() => setQuickViewVisible(false)}
        title="Active Prescription"
        height="75%"
      >
        <View style={{ flex: 1, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md }}>
          {/* One-prescription-at-a-time notice */}
          <View style={styles.singleRxNotice}>
            <MaterialCommunityIcons
              name="information-outline"
              size={13}
              color={Colors.textTertiary}
            />
            <Text style={styles.singleRxNoticeText}>
              Only one prescription can be active at a time.
            </Text>
          </View>

          {/* Content */}
          {quickViewLoading ? (
            <View style={styles.centeredFlex}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : !activePrescription ? (
            <View style={[styles.quickViewEmpty, { paddingBottom: insets.bottom || Spacing.xl }]}>
              <MaterialCommunityIcons name="clipboard-outline" size={64} color="#CBD5E1" />
              <Text style={styles.quickViewEmptyTitle}>No prescription scheduled</Text>
              <Text style={styles.quickViewEmptySubtitle}>
                Set one to view your medicine schedule.
              </Text>
            </View>
          ) : (
            <ActivePrescriptionView prescription={activePrescription} />
          )}
        </View>
      </DraggableBottomSheet>
    </SafeAreaView>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  headerTitleBold: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: 0,
    gap: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: Colors.tertiaryLight,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  tabTextActive: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Layout.tabBarHeight + Spacing.xl,
  },
  cardWrapper: {
    marginBottom: Spacing.sm,
  },

  // ── Empty states ─────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    minHeight: 44,
  },
  uploadBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },

  // ── Upload FAB ────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    right: Spacing.base,
    bottom: Spacing.base,
    height: 56,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  fabText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.primary,
    lineHeight: FontSize.base * 1.5,
  },

  // ── Quick-view button (under tab bar) ───────────────────────────────
  quickViewBtnContainer: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  quickViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: 64,
  },
  quickViewBtnActive: {
    backgroundColor: Colors.primary,
  },
  quickViewBtnEmpty: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  quickViewBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  quickViewBtnTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  quickViewBtnTitleEmpty: {
    color: Colors.textPrimary,
  },
  quickViewBtnSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
  },
  quickViewBtnSubtitleEmpty: {
    color: Colors.textTertiary,
  },

  // ── Quick-view modal ──────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    height: '81%',
  },
  dragArea: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  singleRxNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    marginTop: 3,
    paddingLeft: Spacing.sm,
  },
  singleRxNoticeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: FontSize.xs * 1.5,
  },
  quickViewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
  },
  quickViewEmptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  quickViewEmptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },

  // ── Shared utilities ──────────────────────────────────────────────────────────
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
