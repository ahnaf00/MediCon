import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { ROLE_LABEL, statusBadge } from '../../../src/components/admin/accountStatus';
import { useAuthStore } from '../../../src/store/authStore';
import {
  AccountFilter,
  AccountRole,
  AdminUser,
  timeAgo,
  useAdminUsers,
} from '../../../src/services/api/adminService';

const ROLES: { key: AccountRole | undefined; label: string }[] = [
  { key: undefined, label: 'Everyone' },
  { key: 'patient', label: 'Patients' },
  { key: 'doctor', label: 'Doctors' },
  { key: 'admin', label: 'Admins' },
];

const STATUSES: { key: AccountFilter | undefined; label: string }[] = [
  { key: undefined, label: 'Any status' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'pending', label: 'Pending' },
  { key: 'deleted', label: 'Deleted' },
];

/** Admin Users tab (audit L2b): find an account by name or phone. Records only. */
export default function AdminUsersTab() {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string; role?: string }>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState<AccountRole | undefined>();
  const [statusFilter, setStatusFilter] = useState<AccountFilter | undefined>();

  // The Overview links here with ?status=… or ?role=…; follow a new link.
  const linkKey = `${params.status ?? ''}|${params.role ?? ''}`;
  const [lastLink, setLastLink] = useState('');
  if (linkKey !== lastLink) {
    setLastLink(linkKey);
    if (params.status || params.role) {
      setStatusFilter(
        STATUSES.some((s) => s.key && s.key === params.status)
          ? (params.status as AccountFilter)
          : undefined,
      );
      setRoleFilter(
        ROLES.some((r) => r.key && r.key === params.role)
          ? (params.role as AccountRole)
          : undefined,
      );
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminUsers({
    q: debounced,
    role: roleFilter,
    status: statusFilter,
  });

  if (role !== 'admin') return <Redirect href="/(app)/(tabs)" />;

  const chip = <K,>(
    items: { key: K | undefined; label: string }[],
    value: K | undefined,
    set: (k: K | undefined) => void,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {items.map((it) => {
        const on = it.key === value;
        return (
          <TouchableOpacity
            key={it.label}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => set(it.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderUser = ({ item }: { item: AdminUser }) => {
    const badge = statusBadge(item);
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/(app)/admin/users/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.role ? ROLE_LABEL[item.role] : 'no role'}${badge ? `, ${badge.label}` : ''}`}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.trim().charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {badge && <Text style={[styles.badge, { color: badge.color }]}>{badge.label}</Text>}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {[item.role ? ROLE_LABEL[item.role] : null, item.phone].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.date} numberOfLines={1}>
            {item.lastActiveAt ? `Last active ${timeAgo(item.lastActiveAt)}` : 'Not signed in'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Users">
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Name, phone or email"
            placeholderTextColor={Colors.textTertiary}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search users"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {chip(ROLES, roleFilter, setRoleFilter)}
        {chip(STATUSES, statusFilter, setStatusFilter)}
      </AdminHeader>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load accounts.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          renderItem={renderUser}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={users.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No accounts match.</Text>}
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
  chips: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  chipOn: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextOn: { color: Colors.surface },
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
  avatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  rowBody: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flexShrink: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  badge: { fontSize: FontSize.xs, fontWeight: '700' },
  meta: { fontSize: FontSize.base, color: Colors.textSecondary },
  date: { fontSize: FontSize.sm, color: Colors.textTertiary },
});
