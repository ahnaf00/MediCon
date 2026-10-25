import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamily, FontSize, Shadows, Spacing } from '@theme';
import { NotificationBell } from '../ui/NotificationBell';
import { VisitsChart } from '../admin/VisitsChart';
import { AdminOverview, useAdminOverview } from '../../services/api/adminService';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Attention {
  key: string;
  icon: IconName;
  color: string;
  text: string;
  href?: string;
}

/** What an admin should look at first; empty when all is well. */
const attentionItems = (o: AdminOverview): Attention[] => {
  const items: Attention[] = [];
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  if (o.doctors.pending > 0) {
    items.push({
      key: 'doctors',
      icon: 'account-clock-outline',
      color: Colors.warning,
      text: `${plural(o.doctors.pending, 'doctor is', 'doctors are')} waiting for approval`,
      href: '/(app)/admin/doctors?status=pending',
    });
  }
  if (o.transcripts.failed > 0) {
    items.push({
      key: 'transcripts',
      icon: 'text-box-remove-outline',
      color: Colors.danger,
      text: `${plural(o.transcripts.failed, 'call transcript', 'call transcripts')} failed`,
    });
  }
  if (o.users.suspended > 0) {
    items.push({
      key: 'suspended',
      icon: 'account-cancel-outline',
      color: Colors.danger,
      text: `${plural(o.users.suspended, 'account is', 'accounts are')} suspended`,
      href: '/(app)/(tabs)/admin-users?status=suspended',
    });
  }
  if (o.users.pendingDeletion > 0) {
    items.push({
      key: 'deletion',
      icon: 'account-remove-outline',
      color: Colors.textSecondary,
      text: `${plural(o.users.pendingDeletion, 'account is', 'accounts are')} waiting to be deleted`,
      href: '/(app)/(tabs)/admin-users?status=deleted',
    });
  }
  return items;
};

const VISIT_STATUS: { key: keyof AdminOverview['visitsToday']; label: string }[] = [
  { key: 'scheduled', label: 'Booked' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'no_show', label: 'No-show' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
];

/** Admin Overview tab (audit L2b): counts only, never names or medical content. */
export const AdminDashboard = (): React.JSX.Element => {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useAdminOverview();

  const tiles = data
    ? [
        {
          key: 'patients',
          icon: 'account-group-outline' as IconName,
          value: data.users.patients,
          label: 'Patients',
          sub: `+${data.users.newThisWeek} joined this week`,
          href: '/(app)/(tabs)/admin-users?role=patient',
        },
        {
          key: 'doctors',
          icon: 'stethoscope' as IconName,
          value: data.doctors.verified,
          label: 'Approved doctors',
          sub: `${data.doctors.onlineNow} online now`,
          href: '/(app)/(tabs)/admin-doctors',
        },
        {
          key: 'visits',
          icon: 'calendar-check-outline' as IconName,
          value: data.visitsToday.total,
          label: 'Visits today',
          sub: `${data.visitsToday.completed} completed`,
          href: '/(app)/(tabs)/admin-visits',
        },
        {
          key: 'ai',
          icon: 'robot-outline' as IconName,
          value: data.ai.requestsToday,
          label: 'AI requests today',
          sub: 'Chats and symptom checks',
        },
      ]
    : [];

  const attention = data ? attentionItems(data) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>MediCon</Text>
          <Text style={styles.role}>Admin</Text>
        </View>
        <NotificationBell />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : isError || !data ? (
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.error}>Could not load the numbers. Tap to try again.</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Needs attention</Text>
            <View style={styles.card}>
              {attention.length === 0 ? (
                <View style={styles.attentionRow}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={22}
                    color={Colors.success}
                  />
                  <Text style={styles.attentionText}>All clear. Nothing is waiting for you.</Text>
                </View>
              ) : (
                attention.map((a, i) => (
                  <TouchableOpacity
                    key={a.key}
                    style={[styles.attentionRow, i > 0 && styles.divider]}
                    onPress={a.href ? () => router.navigate(a.href as never) : undefined}
                    disabled={!a.href}
                    accessibilityRole={a.href ? 'button' : 'text'}
                    accessibilityLabel={a.text}
                  >
                    <MaterialCommunityIcons name={a.icon} size={22} color={a.color} />
                    <Text style={styles.attentionText}>{a.text}</Text>
                    {a.href && (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={22}
                        color={Colors.textTertiary}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>

            <View style={styles.tileGrid}>
              {tiles.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tile}
                  onPress={t.href ? () => router.navigate(t.href as never) : undefined}
                  disabled={!t.href}
                  accessibilityRole={t.href ? 'button' : 'text'}
                  accessibilityLabel={`${t.value} ${t.label}. ${t.sub}`}
                >
                  <MaterialCommunityIcons name={t.icon} size={20} color={Colors.primary} />
                  <Text style={styles.tileValue}>{t.value}</Text>
                  <Text style={styles.tileLabel}>{t.label}</Text>
                  <Text style={styles.tileSub} numberOfLines={2}>
                    {t.sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Visits, last 14 days</Text>
              <VisitsChart days={data.visitsByDay} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today&apos;s visits</Text>
              <View style={styles.statusGrid}>
                {VISIT_STATUS.map((s) => (
                  <View key={s.key} style={styles.statusCell}>
                    <Text style={styles.statusValue}>{data.visitsToday[s.key]}</Text>
                    <Text style={styles.statusLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.updated}>
              Updated{' '}
              {new Date(data.generatedAt).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
              . Pull down to refresh.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  brand: {
    fontFamily: FontFamily.extraBold,
    fontWeight: '900',
    fontSize: FontSize.xxl,
    color: Colors.primary,
  },
  role: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  content: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  loader: { marginVertical: Spacing.lg },
  error: { color: Colors.danger, fontSize: FontSize.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
  },
  divider: { borderTopWidth: 1, borderTopColor: Colors.tertiary, paddingTop: Spacing.sm },
  attentionText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 2,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  tileValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  tileLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  tileSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.sm },
  statusCell: { width: '33.33%', gap: 2 },
  statusValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  statusLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  updated: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
});
