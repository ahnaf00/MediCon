import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import {
  AuditEntry,
  AuditTargetType,
  describeAudit,
  useAuditLog,
} from '../../../src/services/api/adminService';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON: Record<string, { name: IconName; color: string }> = {
  'doctor.approved': { name: 'check-decagram-outline', color: Colors.success },
  'doctor.rejected': { name: 'close-octagon-outline', color: Colors.danger },
  'user.suspended': { name: 'account-cancel-outline', color: Colors.danger },
  'user.reactivated': { name: 'account-check-outline', color: Colors.success },
};

const when = (iso: string) =>
  new Date(iso).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Every admin action, newest first (audit L2b). `?target_id=` narrows it to one
 * account, or with `&target_type=hospital` to one hospital.
 */
export default function AuditLogScreen() {
  const {
    target_id: targetId,
    target_type: targetType,
    name,
  } = useLocalSearchParams<{
    target_id?: string;
    target_type?: AuditTargetType;
    name?: string;
  }>();
  const {
    data: entries = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAuditLog(targetId, targetType);

  const renderEntry = ({ item }: { item: AuditEntry }) => {
    const icon = ICON[item.action] ?? {
      name: 'information-outline' as IconName,
      color: Colors.textSecondary,
    };
    const visits = Number(item.meta?.cancelled_visits ?? 0);
    return (
      <View
        style={styles.row}
        accessible
        accessibilityLabel={`${describeAudit(item)}, ${when(item.at)}`}
      >
        <MaterialCommunityIcons name={icon.name} size={22} color={icon.color} />
        <View style={styles.body}>
          <Text style={styles.title}>{describeAudit(item)}</Text>
          <Text style={styles.meta}>
            {when(item.at)}
            {item.admin ? ` · by ${item.admin}` : ''}
          </Text>
          {item.reason && <Text style={styles.reason}>“{item.reason}”</Text>}
          {visits > 0 && (
            <Text style={styles.meta}>
              {visits} upcoming {visits === 1 ? 'visit' : 'visits'} cancelled
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader title={name ? `Log: ${name}` : 'Audit log'} back />
      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Could not load the log.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => String(e.id)}
          renderItem={renderEntry}
          contentContainerStyle={entries.length === 0 ? styles.center : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={
            entries.length > 0 ? (
              <Text style={styles.note}>Entries are permanent and cannot be edited.</Text>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>No admin actions yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.base, gap: Spacing.sm },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  empty: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: Spacing.sm, color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
  note: { fontSize: FontSize.sm, color: Colors.textTertiary, marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  meta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reason: { fontSize: FontSize.base, color: Colors.textPrimary, fontStyle: 'italic', marginTop: 2 },
});
