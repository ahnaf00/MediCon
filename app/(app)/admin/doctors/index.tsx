import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@theme';
import {
  AdminDoctor,
  DoctorReviewStatus,
  useAdminDoctors,
} from '../../../../src/services/api/adminService';

const TABS: { key: DoctorReviewStatus; label: string }[] = [
  { key: 'pending', label: 'Waiting' },
  { key: 'verified', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

/** Doctor registrations for an admin to review (audit L2). */
export default function AdminDoctorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ status?: string }>();
  const initial = TABS.some((t) => t.key === params.status)
    ? (params.status as DoctorReviewStatus)
    : 'pending';
  const [status, setStatus] = useState<DoctorReviewStatus>(initial);
  const { data: doctors = [], isLoading, isError, refetch, isRefetching } = useAdminDoctors(status);

  const renderDoctor = ({ item }: { item: AdminDoctor }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(app)/admin/doctors/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Review ${item.name}`}
    >
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="doctor" size={24} color={Colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[
            item.specialty,
            item.bmdcRegistrationNo ? `BMDC ${item.bmdcRegistrationNo}` : 'No BMDC number',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        <Text style={styles.date}>
          {status === 'pending'
            ? `Registered ${shortDate(item.registeredAt)}`
            : `Reviewed ${shortDate(item.reviewedAt)}${item.reviewedBy ? ` by ${item.reviewedBy}` : ''}`}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={{ backgroundColor: Colors.surface, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor approvals</Text>
        </View>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, status === t.key && styles.tabActive]}
              onPress={() => setStatus(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: status === t.key }}
            >
              <Text style={[styles.tabText, status === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load registrations.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(d) => String(d.id)}
          renderItem={renderDoctor}
          contentContainerStyle={doctors.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {status === 'pending' ? 'No registrations are waiting.' : 'Nothing here yet.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    gap: Spacing.xs,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.surface },
  list: { padding: Spacing.base, gap: Spacing.sm },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: Spacing.sm, color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.base, color: Colors.textSecondary },
  date: { fontSize: FontSize.sm, color: Colors.textTertiary },
});
