import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { useAuthStore } from '../../../src/store/authStore';
import {
  AdminDoctor,
  DoctorReviewStatus,
  useAdminSummary,
  useDoctorDirectory,
} from '../../../src/services/api/adminService';

const REVIEW_LABEL: Record<DoctorReviewStatus, { label: string; color: string }> = {
  pending: { label: 'Waiting', color: '#9a6700' },
  verified: { label: 'Approved', color: Colors.success },
  rejected: { label: 'Rejected', color: Colors.danger },
};

/**
 * Admin Doctors tab (audit L2b step 2): every doctor A-Z, searchable, with
 * online state and visit counts. Registrations waiting for review sit in a
 * row at the top that opens the approvals queue.
 */
export default function AdminDoctorsTab() {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data: summary } = useAdminSummary();
  const {
    data: doctors = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useDoctorDirectory({ q: debounced, online: onlineOnly });

  if (role !== 'admin') return <Redirect href="/(app)/(tabs)" />;

  const pending = summary?.doctors.pending ?? 0;

  const renderDoctor = ({ item }: { item: AdminDoctor }) => {
    const review = REVIEW_LABEL[item.verificationStatus];
    const suspended = item.accountStatus === 'suspended';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(app)/admin/doctors/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.isOnline ? 'online' : 'offline'}, ${suspended ? 'suspended' : review.label}`}
      >
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="doctor" size={24} color={Colors.primary} />
          <View
            style={[
              styles.dot,
              { backgroundColor: item.isOnline ? Colors.success : Colors.textTertiary },
            ]}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.specialty, item.isOnline ? 'Online' : 'Offline'].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.small} numberOfLines={1}>
            <Text style={{ color: suspended ? Colors.danger : review.color, fontWeight: '700' }}>
              {suspended ? 'Suspended' : review.label}
            </Text>
            {`  ·  ${item.visits.completed} completed · ${item.visits.upcoming} upcoming`}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const filters = [
    { on: !onlineOnly, label: 'All', set: () => setOnlineOnly(false) },
    { on: onlineOnly, label: 'Online now', set: () => setOnlineOnly(true) },
  ];

  return (
    <View style={styles.container}>
      <AdminHeader title="Doctors">
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Name, specialty or BMDC number"
            placeholderTextColor={Colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search doctors"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.chips}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.label}
              style={[styles.chip, f.on && styles.chipOn]}
              onPress={f.set}
              accessibilityRole="button"
              accessibilityState={{ selected: f.on }}
            >
              <Text style={[styles.chipText, f.on && styles.chipTextOn]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </AdminHeader>

      <TouchableOpacity
        style={styles.queueRow}
        onPress={() => router.push('/(app)/admin/doctors?status=pending')}
        accessibilityRole="button"
        accessibilityLabel={`Registrations waiting, ${pending}`}
      >
        <MaterialCommunityIcons
          name="account-clock-outline"
          size={22}
          color={pending > 0 ? Colors.warning : Colors.textSecondary}
        />
        <Text style={styles.queueText}>Registrations waiting ({pending})</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load doctors.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(d) => String(d.id)}
          renderItem={renderDoctor}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={doctors.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {onlineOnly ? 'No doctor is online right now.' : 'No doctors match.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: 0 },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  chipOn: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextOn: { color: Colors.surface },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  queueText: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
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
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.base, color: Colors.textSecondary },
  small: { fontSize: FontSize.sm, color: Colors.textTertiary },
});
