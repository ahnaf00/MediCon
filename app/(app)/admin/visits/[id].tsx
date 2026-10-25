import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../../src/components/admin/AdminHeader';
import { FORMAT_LABEL, VISIT_STATUS_COLOR } from '../../../../src/components/admin/visitStatus';
import {
  VISIT_STATUS_LABEL,
  dhakaDateLabel,
  dhakaTime,
  useAdminVisit,
} from '../../../../src/services/api/adminService';

const TRANSCRIPT_LABEL: Record<string, string> = {
  awaiting_call: 'Waiting for the call',
  recording: 'Recording',
  transcribing: 'Transcribing',
  summarizing: 'Writing the draft summary',
  ready: 'Done',
  failed: 'Failed',
  skipped: 'Not recorded',
};

/** "Sun 25 Oct, 9:30 AM" in Dhaka time, or null. */
const when = (iso: string | null | undefined) =>
  iso ? `${dhakaDateLabel(iso)}, ${dhakaTime(iso)}` : null;

const Row = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'Not yet'}</Text>
  </View>
);

const PersonLink = ({
  label,
  name,
  onPress,
}: {
  label: string;
  name: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    style={styles.person}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : 'text'}
    accessibilityLabel={`${label}: ${name}`}
  >
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{name}</Text>
    </View>
    {onPress && (
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
    )}
  </TouchableOpacity>
);

/**
 * One visit for an admin (audit L2b step 2). View only, records only: who,
 * when and what happened, and whether a prescription or transcript exists.
 * Never the reason for the visit, the prescription, transcript or summary.
 */
export default function AdminVisitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visit, isLoading, isError, refetch } = useAdminVisit(id);

  return (
    <View style={styles.container}>
      <AdminHeader title={visit ? `Visit #${visit.id}` : 'Visit'} back />

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError || !visit ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Could not load this visit.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Spacing.xl + insets.bottom }]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{when(visit.at)}</Text>
            <Text style={[styles.status, { color: VISIT_STATUS_COLOR[visit.status] }]}>
              {VISIT_STATUS_LABEL[visit.status]}
            </Text>
            <Row
              label="Format"
              value={`${FORMAT_LABEL[visit.format] ?? visit.format}${visit.durationMinutes > 0 ? ` · ${visit.durationMinutes} min` : ''}`}
            />
          </View>

          <View style={styles.card}>
            <PersonLink
              label="Patient"
              name={visit.patient.name}
              onPress={
                visit.patient.id
                  ? () => router.push(`/(app)/admin/users/${visit.patient.id}`)
                  : undefined
              }
            />
            <PersonLink
              label={visit.doctor.specialty ? `Doctor · ${visit.doctor.specialty}` : 'Doctor'}
              name={visit.doctor.name}
              onPress={
                visit.doctor.id
                  ? () => router.push(`/(app)/admin/doctors/${visit.doctor.id}`)
                  : undefined
              }
            />
          </View>

          <View style={styles.card}>
            <Row label="Booked" value={when(visit.bookedAt)} />
            <Row label="Started" value={when(visit.startedAt)} />
            <Row label="Ended" value={when(visit.endedAt)} />
            <Row label="Prescription written" value={visit.hasPrescription ? 'Yes' : 'No'} />
            {visit.format === 'video' && (
              <Row
                label="Call transcript"
                value={
                  visit.transcriptStatus
                    ? (TRANSCRIPT_LABEL[visit.transcriptStatus] ?? visit.transcriptStatus)
                    : 'None'
                }
              />
            )}
          </View>

          <View style={styles.notice}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.primary} />
            <Text style={styles.noticeText}>
              Admins see the record of a visit only. The reason for the visit, the prescription and
              the call transcript stay between the patient and the doctor.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

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
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  status: { fontSize: FontSize.md, fontWeight: '700' },
  person: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoRow: { gap: 2 },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textTertiary },
  infoValue: { fontSize: FontSize.md, color: Colors.textPrimary },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.tertiaryLight,
  },
  noticeText: { flex: 1, fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 20 },
  muted: { fontSize: FontSize.sm, color: Colors.textTertiary },
  retry: { marginTop: Spacing.sm, color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
});
