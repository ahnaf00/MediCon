import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Layout, Spacing } from '@theme';
import { AdminHeader } from '../../../../src/components/admin/AdminHeader';
import { ROLE_LABEL, statusBadge } from '../../../../src/components/admin/accountStatus';
import {
  timeAgo,
  useAdminUser,
  useReactivateUser,
  useSuspendUser,
} from '../../../../src/services/api/adminService';

const REVIEW_LABEL = { pending: 'Waiting for review', verified: 'Approved', rejected: 'Rejected' };

const fullDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>
      {value === null || value === undefined || value === '' ? 'Not given' : value}
    </Text>
  </View>
);

/**
 * One account for an admin (audit L2b): who they are, account state and visit
 * counts. Owner decision: no medical content here. Suspend needs a reason.
 */
export default function AdminUserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading, isError, refetch } = useAdminUser(id);
  const suspend = useSuspendUser();
  const reactivate = useReactivateUser();
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState('');
  const busy = suspend.isPending || reactivate.isPending;

  const fail = (err: any) =>
    Alert.alert('Not saved', err?.message || 'Something went wrong. Try again.');

  const onSuspend = () => {
    if (!user || reason.trim().length < 5) return;
    const upcoming = user.visits.upcoming;
    Alert.alert(
      `Suspend ${user.name}?`,
      `They are signed out on every device and cannot sign in.${
        upcoming > 0
          ? ` ${upcoming} upcoming ${upcoming === 1 ? 'visit is' : 'visits are'} cancelled and the other person is told.`
          : ''
      } You can reactivate the account later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () =>
            suspend.mutate(
              { id: user.id, reason: reason.trim() },
              {
                onSuccess: () => {
                  setSuspending(false);
                  setReason('');
                  refetch();
                },
                onError: fail,
              },
            ),
        },
      ],
    );
  };

  const onReactivate = () => {
    if (!user) return;
    Alert.alert(`Reactivate ${user.name}?`, 'They can sign in again and are told in the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reactivate',
        onPress: () => reactivate.mutate(user.id, { onSuccess: () => refetch(), onError: fail }),
      },
    ]);
  };

  const badge = user ? statusBadge(user) : null;
  const canAct = !!user && user.role !== 'admin' && !user.deletedAt;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AdminHeader title="Account" back />

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError || !user ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Could not load this account.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.name}>{user.name}</Text>
              <View style={styles.pills}>
                <Text style={styles.rolePill}>{user.role ? ROLE_LABEL[user.role] : 'No role'}</Text>
                <Text style={[styles.statusPill, { color: badge?.color ?? Colors.success }]}>
                  {badge?.label ?? 'Active'}
                </Text>
              </View>
              <Row label="Phone" value={user.phone} />
              <Row label="Email" value={user.email} />
              <Row label="Joined" value={fullDate(user.joinedAt)} />
              {/* From signed-in devices, so it is empty after a sign-out or suspension. */}
              <Row
                label="Last active"
                value={
                  user.lastActiveAt ? timeAgo(user.lastActiveAt) : 'Not signed in on any device'
                }
              />
            </View>

            {user.suspension && (
              <View style={[styles.card, styles.alertCard]}>
                <Text style={styles.cardTitle}>Suspended</Text>
                <Row label="Reason" value={user.suspension.reason} />
                <Row
                  label="When"
                  value={`${fullDate(user.suspension.at) ?? ''}${user.suspension.by ? ` by ${user.suspension.by}` : ''}`}
                />
              </View>
            )}

            {user.deletedAt && (
              <View style={[styles.card, styles.alertCard]}>
                <Text style={styles.cardTitle}>Account deleted by its owner</Text>
                <Row label="Deleted" value={fullDate(user.deletedAt)} />
                <Row
                  label="Removed for good"
                  value={user.purgeAt ? fullDate(user.purgeAt) : 'Already removed'}
                />
                <Text style={styles.muted}>
                  Only the owner can restore it, by signing in before that date.
                </Text>
              </View>
            )}

            {user.doctor && (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(app)/admin/doctors/${user.id}`)}
                accessibilityRole="button"
                accessibilityLabel="Open doctor registration"
              >
                <Text style={styles.cardTitle}>Doctor registration</Text>
                <Row label="Specialty" value={user.doctor.specialty} />
                <Row label="Review" value={REVIEW_LABEL[user.doctor.verificationStatus]} />
                <Text style={styles.link}>Open registration ›</Text>
              </TouchableOpacity>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Visits</Text>
              <View style={styles.counts}>
                {[
                  { label: 'Total', value: user.visits.total },
                  { label: 'Upcoming', value: user.visits.upcoming },
                  { label: 'Completed', value: user.visits.completed },
                ].map((c) => (
                  <View key={c.label} style={styles.countCell}>
                    <Text style={styles.countValue}>{c.value}</Text>
                    <Text style={styles.infoLabel}>{c.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.muted}>
                Admins see counts only. Medical records stay between the patient and their doctors.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.logLink}
              onPress={() =>
                router.push({
                  pathname: '/(app)/admin/audit-log',
                  params: { target_id: String(user.id), name: user.name },
                })
              }
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="clipboard-text-clock-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.link}>Admin actions on this account</Text>
            </TouchableOpacity>

            {suspending && (
              <View style={styles.card}>
                <Text style={styles.infoLabel}>Reason (kept in the audit log)</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Reported for abusive messages"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  maxLength={500}
                  autoFocus
                  accessibilityLabel="Suspension reason"
                />
                <Text style={styles.muted}>At least 5 characters.</Text>
              </View>
            )}
          </ScrollView>

          {canAct && (
            <View style={[styles.actions, { paddingBottom: Spacing.base + insets.bottom }]}>
              {user.status === 'suspended' ? (
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={onReactivate}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Reactivate account"
                >
                  {reactivate.isPending ? (
                    <ActivityIndicator color={Colors.surface} />
                  ) : (
                    <Text style={styles.btnText}>Reactivate</Text>
                  )}
                </TouchableOpacity>
              ) : suspending ? (
                <>
                  <TouchableOpacity
                    style={styles.btnOutline}
                    onPress={() => setSuspending(false)}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnDanger, reason.trim().length < 5 && styles.disabled]}
                    onPress={onSuspend}
                    disabled={busy || reason.trim().length < 5}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm suspension"
                  >
                    {suspend.isPending ? (
                      <ActivityIndicator color={Colors.surface} />
                    ) : (
                      <Text style={styles.btnText}>Suspend</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.btnOutlineDanger}
                  onPress={() => setSuspending(true)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="Suspend account"
                >
                  <Text style={styles.btnOutlineDangerText}>Suspend account</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const button = {
  flex: 1,
  height: Layout.buttonHeight,
  borderRadius: BorderRadius.lg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  content: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  alertCard: { borderLeftWidth: 4, borderLeftColor: Colors.danger },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  pills: { flexDirection: 'row', gap: Spacing.sm },
  rolePill: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.tertiaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  statusPill: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  infoRow: { gap: 2 },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textTertiary },
  infoValue: { fontSize: FontSize.md, color: Colors.textPrimary },
  counts: { flexDirection: 'row' },
  countCell: { flex: 1, gap: 2 },
  countValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  muted: { fontSize: FontSize.sm, color: Colors.textTertiary },
  link: { fontSize: FontSize.base, fontWeight: '600', color: Colors.primary },
  logLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  input: {
    minHeight: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  btnPrimary: { ...button, backgroundColor: Colors.primary },
  btnDanger: { ...button, backgroundColor: Colors.danger },
  btnOutline: { ...button, borderWidth: 1.5, borderColor: Colors.textTertiary },
  btnOutlineText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  btnOutlineDanger: { ...button, borderWidth: 1.5, borderColor: Colors.danger },
  btnOutlineDangerText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.danger },
  btnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.surface },
  disabled: { opacity: 0.5 },
});
