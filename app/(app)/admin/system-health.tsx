import React from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { VisitsChart } from '../../../src/components/admin/VisitsChart';
import {
  AI_FEATURE_LABEL,
  FailedJob,
  FailedTranscript,
  formatDuration,
  useAiUsage,
  useDiscardJob,
  useFailedJobs,
  useFailedTranscripts,
  useRetryJob,
  useRetryTranscript,
} from '../../../src/services/api/adminSystemService';
import { dhakaDateLabel, timeAgo } from '../../../src/services/api/adminService';
import { apiErrorMessage } from '../../../src/utils/errors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const Section = ({
  icon,
  title,
  count,
  children,
}: {
  icon: IconName;
  title: string;
  count?: number;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} />
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, count > 0 && styles.countBad]}>{count}</Text>
      )}
    </View>
    {children}
  </View>
);

const AllGood = ({ text }: { text: string }) => (
  <View style={styles.allGood}>
    <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.success} />
    <Text style={styles.muted}>{text}</Text>
  </View>
);

/**
 * System health for admins (audit L2b step 3): AI usage, failed call
 * transcripts and failed background jobs. It says that something failed and
 * lets an admin start it again, never what it was about.
 */
export default function SystemHealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ai = useAiUsage();
  const transcripts = useFailedTranscripts();
  const jobs = useFailedJobs();
  const retryTranscript = useRetryTranscript();
  const retryJob = useRetryJob();
  const discardJob = useDiscardJob();

  const refreshing = ai.isRefetching || transcripts.isRefetching || jobs.isRefetching;
  const refresh = () => {
    ai.refetch();
    transcripts.refetch();
    jobs.refetch();
  };
  const fail = (err: unknown) =>
    Alert.alert('Not done', apiErrorMessage(err, 'Something went wrong. Try again.'));

  const onRetryTranscript = (t: FailedTranscript) =>
    retryTranscript.mutate(t.id, {
      onSuccess: () => Alert.alert('Started again', 'The doctor sees the draft when it is ready.'),
      onError: fail,
    });

  const onRetryJob = (j: FailedJob) =>
    retryJob.mutate(j.id, {
      onSuccess: () => Alert.alert('Started again', `${j.job} is back in the queue.`),
      onError: fail,
    });

  const onDiscardJob = (j: FailedJob) =>
    Alert.alert(
      `Discard ${j.job}?`,
      'It is removed from this list and will not run again. Do this only when it is no longer needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => discardJob.mutate(j.id, { onError: fail }),
        },
      ],
    );

  const busy = retryTranscript.isPending || retryJob.isPending || discardJob.isPending;
  const usage = ai.data;

  return (
    <View style={styles.container}>
      <AdminHeader title="System health" back />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxl + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {/* AI usage */}
        <Section icon="robot-outline" title="AI calls, last 14 days">
          {ai.isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : ai.isError || !usage ? (
            <Text style={styles.muted}>Could not load AI usage. Pull down to try again.</Text>
          ) : usage.countingSince === null ? (
            <Text style={styles.muted}>No AI calls counted yet.</Text>
          ) : (
            <>
              <VisitsChart days={usage.days} unit={{ one: 'AI call', many: 'AI calls' }} />
              <Text style={styles.muted}>
                {`Today: ${usage.today.total} ${usage.today.total === 1 ? 'call' : 'calls'}, ${usage.today.failed} failed. Counting since ${dhakaDateLabel(usage.countingSince)}; kept ${usage.retentionDays} days.`}
              </Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.th, styles.colFeature]}>Feature</Text>
                  <Text style={[styles.th, styles.colNum]}>Calls</Text>
                  <Text style={[styles.th, styles.colNum]}>Failed</Text>
                  <Text style={[styles.th, styles.colTime]}>Avg time</Text>
                </View>
                {usage.features.map((f) => (
                  <View key={f.feature} style={styles.tableRow}>
                    <Text style={[styles.td, styles.colFeature]} numberOfLines={1}>
                      {AI_FEATURE_LABEL[f.feature] ?? f.feature}
                    </Text>
                    <Text style={[styles.td, styles.colNum]}>{f.total}</Text>
                    <Text style={[styles.td, styles.colNum, f.failed > 0 && styles.bad]}>
                      {f.failed}
                    </Text>
                    <Text style={[styles.td, styles.colTime]}>{formatDuration(f.averageMs)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Section>

        {/* Failed call transcripts */}
        <Section
          icon="text-box-remove-outline"
          title="Failed call transcripts"
          count={transcripts.data?.length}
        >
          {transcripts.isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : transcripts.isError ? (
            <Text style={styles.muted}>Could not load transcripts. Pull down to try again.</Text>
          ) : (transcripts.data ?? []).length === 0 ? (
            <AllGood text="No failed transcripts." />
          ) : (
            transcripts.data!.map((t) => (
              <View key={t.id} style={styles.item}>
                <TouchableOpacity
                  style={styles.itemBody}
                  onPress={() => router.push(`/(app)/admin/visits/${t.visitId}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Visit ${t.visitId}, failed ${timeAgo(t.failedAt)}`}
                >
                  <Text style={styles.itemTitle}>
                    {`Visit #${t.visitId}${t.visitAt ? ` · ${dhakaDateLabel(t.visitAt)}` : ''}`}
                  </Text>
                  {t.doctor && <Text style={styles.itemMeta}>{t.doctor}</Text>}
                  {t.error && (
                    <Text style={styles.itemError} numberOfLines={2}>
                      {t.error}
                    </Text>
                  )}
                  <Text style={styles.itemTime}>{`Failed ${timeAgo(t.failedAt)}`}</Text>
                </TouchableOpacity>
                {t.canRetry ? (
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => onRetryTranscript(t)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`Retry transcript for visit ${t.visitId}`}
                  >
                    <Text style={styles.smallBtnText}>Retry</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.itemTime}>No recording</Text>
                )}
              </View>
            ))
          )}
        </Section>

        {/* Failed background jobs */}
        <Section icon="cog-off-outline" title="Failed background jobs" count={jobs.data?.length}>
          {jobs.isLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : jobs.isError ? (
            <Text style={styles.muted}>Could not load jobs. Pull down to try again.</Text>
          ) : (jobs.data ?? []).length === 0 ? (
            <AllGood text="No failed jobs." />
          ) : (
            <>
              {jobs.data!.map((j) => (
                <View key={j.id} style={styles.item}>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{j.job}</Text>
                    <Text style={styles.itemMeta}>{`${j.error} · ${j.queue} queue`}</Text>
                    <Text style={styles.itemTime}>{`Failed ${timeAgo(j.failedAt)}`}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      onPress={() => onRetryJob(j)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={`Retry ${j.job}`}
                    >
                      <Text style={styles.smallBtnText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallBtnDanger}
                      onPress={() => onDiscardJob(j)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={`Discard ${j.job}`}
                    >
                      <Text style={styles.smallBtnDangerText}>Discard</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <Text style={styles.muted}>
                Only the job name and error type are shown here. The full error is in the server
                log.
              </Text>
            </>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

const smallBtn = {
  paddingHorizontal: Spacing.md,
  height: 34,
  borderRadius: BorderRadius.full,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderWidth: 1.5,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  countBad: { color: Colors.danger },
  muted: { flexShrink: 1, fontSize: FontSize.sm, color: Colors.textTertiary, lineHeight: 18 },
  allGood: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  table: { marginTop: Spacing.xs },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.tertiary,
  },
  th: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textTertiary },
  td: { fontSize: FontSize.sm, color: Colors.textPrimary },
  colFeature: { flex: 1 },
  colNum: { width: 52, textAlign: 'right' },
  colTime: { width: 84, textAlign: 'right' },
  bad: { color: Colors.danger, fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.tertiary,
  },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  itemMeta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  itemError: { fontSize: FontSize.sm, color: Colors.danger },
  itemTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
  itemActions: { gap: Spacing.xs },
  smallBtn: { ...smallBtn, borderColor: Colors.primary },
  smallBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  smallBtnDanger: { ...smallBtn, borderColor: Colors.danger },
  smallBtnDangerText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.danger },
});
