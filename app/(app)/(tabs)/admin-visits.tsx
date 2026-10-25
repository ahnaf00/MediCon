import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { FORMAT_LABEL, VISIT_STATUS_COLOR } from '../../../src/components/admin/visitStatus';
import { useAuthStore } from '../../../src/store/authStore';
import { fromLocalDateString, toLocalDateString } from '../../../src/utils/localDate';
import {
  AdminVisit,
  VISIT_STATUS_LABEL,
  VisitStatus,
  dhakaDateLabel,
  dhakaDay,
  dhakaTime,
  useAdminVisits,
} from '../../../src/services/api/adminService';

type Range = 'today' | 'tomorrow' | 'yesterday' | 'week' | 'day';

const RANGES: { key: Exclude<Range, 'day'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'Last 7 days' },
];

const STATUSES: { key: VisitStatus | undefined; label: string }[] = [
  { key: undefined, label: 'Any status' },
  ...(
    ['scheduled', 'in_progress', 'completed', 'no_show', 'expired', 'cancelled'] as VisitStatus[]
  ).map((key) => ({ key, label: VISIT_STATUS_LABEL[key] })),
];

/** The Dhaka days a range covers, inclusive. */
const rangeDays = (range: Range, chosenDay: string): { from: string; to: string } => {
  switch (range) {
    case 'tomorrow':
      return { from: dhakaDay(1), to: dhakaDay(1) };
    case 'yesterday':
      return { from: dhakaDay(-1), to: dhakaDay(-1) };
    case 'week':
      return { from: dhakaDay(-6), to: dhakaDay(0) };
    case 'day':
      return { from: chosenDay, to: chosenDay };
    default:
      return { from: dhakaDay(0), to: dhakaDay(0) };
  }
};

/**
 * Admin Visits tab (audit L2b step 2): every visit on the chosen days, in
 * time order. View only, and records only: never the patient's reason for
 * the visit or anything from the consultation. Times are Dhaka time.
 */
export default function AdminVisitsTab() {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const [range, setRange] = useState<Range>('today');
  const [chosenDay, setChosenDay] = useState(() => dhakaDay(0));
  const [picking, setPicking] = useState(false);
  const [status, setStatus] = useState<VisitStatus | undefined>();

  const { from, to } = rangeDays(range, chosenDay);
  const multiDay = from !== to;
  const {
    data: visits = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminVisits({ from, to, status });

  if (role !== 'admin') return <Redirect href="/(app)/(tabs)" />;

  const chip = (key: string, label: string, on: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      style={[styles.chip, on && styles.chipOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderVisit = ({ item }: { item: AdminVisit }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(app)/admin/visits/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${dhakaTime(item.at)}, ${item.patient.name} with ${item.doctor.name}, ${VISIT_STATUS_LABEL[item.status]}`}
    >
      <View style={styles.time}>
        <Text style={styles.timeText}>{dhakaTime(item.at)}</Text>
        {multiDay && <Text style={styles.small}>{dhakaDateLabel(item.at)}</Text>}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {item.patient.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {`with ${item.doctor.name}${item.doctor.specialty ? ` · ${item.doctor.specialty}` : ''}`}
        </Text>
        <Text style={styles.small} numberOfLines={1}>
          <Text style={{ color: VISIT_STATUS_COLOR[item.status], fontWeight: '700' }}>
            {VISIT_STATUS_LABEL[item.status]}
          </Text>
          {`  ·  ${FORMAT_LABEL[item.format] ?? item.format}${item.durationMinutes > 0 ? ` · ${item.durationMinutes} min` : ''}`}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  const pickedDate = fromLocalDateString(chosenDay) ?? new Date();

  return (
    <View style={styles.container}>
      <AdminHeader title="Visits">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {RANGES.map((r) => chip(r.key, r.label, range === r.key, () => setRange(r.key)))}
          {chip(
            'day',
            range === 'day' ? dhakaDateLabel(`${chosenDay}T12:00:00+06:00`) : 'Choose a day',
            range === 'day',
            () => setPicking(true),
          )}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, styles.chipsLast]}
        >
          {STATUSES.map((s) => chip(s.label, s.label, status === s.key, () => setStatus(s.key)))}
        </ScrollView>
      </AdminHeader>

      {picking && (
        <DateTimePicker
          value={pickedDate}
          mode="date"
          onChange={(_event, date) => {
            setPicking(false);
            if (date) {
              setChosenDay(toLocalDateString(date));
              setRange('day');
            }
          }}
        />
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Could not load visits.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => String(v.id)}
          renderItem={renderVisit}
          contentContainerStyle={visits.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={
            visits.length > 0 ? (
              <Text style={styles.count}>
                {`${visits.length} ${visits.length === 1 ? 'visit' : 'visits'} · Dhaka time`}
              </Text>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No visits on these days.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chips: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  chipsLast: { paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
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
  count: { fontSize: FontSize.sm, color: Colors.textTertiary },
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
  time: { width: 72 },
  timeText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.base, color: Colors.textSecondary },
  small: { fontSize: FontSize.sm, color: Colors.textTertiary },
});
