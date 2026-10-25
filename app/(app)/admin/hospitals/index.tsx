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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../../src/components/admin/AdminHeader';
import {
  AdminHospital,
  HospitalFilter,
  useAdminHospitals,
} from '../../../../src/services/api/adminSystemService';

const FILTERS: { key: HospitalFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Shown to patients' },
  { key: 'hidden', label: 'Hidden' },
];

/**
 * Hospitals patients see in the app (audit L2b step 3). Admins add and edit
 * them, and hide a hospital instead of deleting it.
 */
export default function AdminHospitalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<HospitalFilter>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data: hospitals = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminHospitals({ q: debounced, status });

  const renderHospital = ({ item }: { item: AdminHospital }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(app)/admin/hospitals/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.isActive ? '' : ', hidden from patients'}`}
    >
      <View style={[styles.icon, !item.isActive && styles.iconHidden]}>
        <MaterialCommunityIcons
          name={item.isActive ? 'hospital-building' : 'eye-off-outline'}
          size={22}
          color={item.isActive ? Colors.primary : Colors.textTertiary}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.nameLine}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {!item.isActive && <Text style={styles.hiddenBadge}>Hidden</Text>}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {item.address}
        </Text>
        <Text style={styles.small} numberOfLines={1}>
          {[
            item.emergencyPhone,
            item.is247 ? 'Open 24/7' : null,
            item.latitude === null ? 'No map pin' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AdminHeader
        title="Hospitals"
        back
        right={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/admin/hospitals/new')}
            accessibilityRole="button"
            accessibilityLabel="Add a hospital"
          >
            <MaterialCommunityIcons name="plus" size={20} color={Colors.surface} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Name or address"
            placeholderTextColor={Colors.textTertiary}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search hospitals"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const on = status === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setStatus(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AdminHeader>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load hospitals.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(h) => String(h.id)}
          renderItem={renderHospital}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={hospitals.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {status === 'hidden' ? 'No hidden hospitals.' : 'No hospitals match.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  addText: { color: Colors.surface, fontWeight: '700', fontSize: FontSize.base },
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
  icon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHidden: { backgroundColor: Colors.background },
  rowBody: { flex: 1, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flexShrink: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  hiddenBadge: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  meta: { fontSize: FontSize.base, color: Colors.textSecondary },
  small: { fontSize: FontSize.sm, color: Colors.textTertiary },
});
