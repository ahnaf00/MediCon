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
import { useAdminSummary } from '../../services/api/adminService';

/**
 * Admin home (audit L2). Today it covers doctor approvals; the full admin
 * dashboard planned later adds its sections below.
 */
export const AdminDashboard = (): React.JSX.Element => {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useAdminSummary();
  const counts = data?.doctors;

  const stats = [
    { key: 'pending', label: 'Waiting', icon: 'clock-outline', color: Colors.warning },
    { key: 'verified', label: 'Approved', icon: 'check-decagram', color: Colors.success },
    { key: 'rejected', label: 'Rejected', icon: 'close-octagon-outline', color: Colors.danger },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>MediCon</Text>
          <Text style={styles.role}>Admin</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell />
          <TouchableOpacity
            onPress={() => router.push('/(app)/settings/')}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <MaterialCommunityIcons
              name="account-outline"
              size={27.6}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={styles.sectionTitle}>Doctor registrations</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : isError || !counts ? (
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.error}>Could not load the numbers. Tap to try again.</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statsRow}>
            {stats.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.statCard}
                onPress={() => router.push(`/(app)/admin/doctors?status=${s.key}`)}
                accessibilityRole="button"
                accessibilityLabel={`${counts[s.key]} ${s.label} doctors`}
              >
                <MaterialCommunityIcons name={s.icon} size={22} color={s.color} />
                <Text style={styles.statValue}>{counts[s.key]}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(app)/admin/doctors?status=pending')}
          accessibilityRole="button"
          accessibilityLabel="Review doctor approvals"
        >
          <View style={styles.actionIcon}>
            <MaterialCommunityIcons name="account-check-outline" size={26} color={Colors.primary} />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Doctor approvals</Text>
            <Text style={styles.actionText}>
              {counts?.pending
                ? `${counts.pending} waiting for review`
                : 'No registrations waiting'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
        </TouchableOpacity>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  content: { padding: Spacing.base, gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  loader: { marginVertical: Spacing.lg },
  error: { color: Colors.danger, fontSize: FontSize.base },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: { flex: 1, gap: 2 },
  actionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  actionText: { fontSize: FontSize.base, color: Colors.textSecondary },
});
