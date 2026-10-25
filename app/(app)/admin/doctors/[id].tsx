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
import { BorderRadius, Colors, FontFamily, FontSize, Layout, Spacing } from '@theme';
import {
  useAdminDoctor,
  useApproveDoctor,
  useRejectDoctor,
} from '../../../../src/services/api/adminService';

const STATUS_LABEL = { pending: 'Waiting for review', verified: 'Approved', rejected: 'Rejected' };

const Row = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'Not given'}</Text>
  </View>
);

/** One doctor registration: the details to check, then Approve or Reject (audit L2). */
export default function AdminDoctorReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doctor, isLoading, isError, refetch } = useAdminDoctor(id);
  const approve = useApproveDoctor();
  const reject = useRejectDoctor();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const busy = approve.isPending || reject.isPending;

  const fail = (err: any) =>
    Alert.alert('Not saved', err?.message || 'Something went wrong. Try again.');

  const onApprove = () => {
    if (!doctor) return;
    Alert.alert(
      'Approve this doctor?',
      `${doctor.name} will be able to go online, take appointments and write prescriptions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => approve.mutate(doctor.id, { onSuccess: () => refetch(), onError: fail }),
        },
      ],
    );
  };

  const onReject = () => {
    if (!doctor || reason.trim().length < 5) return;
    reject.mutate(
      { id: doctor.id, reason: reason.trim() },
      {
        onSuccess: () => {
          setRejecting(false);
          setReason('');
          refetch();
        },
        onError: fail,
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ backgroundColor: Colors.surface, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review registration</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError || !doctor ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Could not load this registration.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Text style={styles.name}>{doctor.name}</Text>
              <View
                style={[
                  styles.statusPill,
                  doctor.verificationStatus === 'verified' && styles.pillOk,
                  doctor.verificationStatus === 'rejected' && styles.pillBad,
                ]}
              >
                <Text style={styles.statusText}>{STATUS_LABEL[doctor.verificationStatus]}</Text>
              </View>
              <Row label="Specialty" value={doctor.specialty} />
              <Row label="Qualification" value={doctor.qualification} />
              <Row label="BMDC registration no." value={doctor.bmdcRegistrationNo} />
              <Row label="Hospital" value={doctor.hospitalName} />
              <Row label="Experience" value={`${doctor.experienceYears} years`} />
              <Row label="Phone" value={doctor.phone} />
              <Row label="Email" value={doctor.email} />
              <Row
                label="Registered"
                value={doctor.registeredAt ? new Date(doctor.registeredAt).toLocaleString() : null}
              />
              {doctor.reviewedAt && (
                <Row
                  label="Reviewed"
                  value={`${new Date(doctor.reviewedAt).toLocaleString()}${doctor.reviewedBy ? ` by ${doctor.reviewedBy}` : ''}`}
                />
              )}
              {doctor.rejectionReason && <Row label="Reason" value={doctor.rejectionReason} />}
            </View>

            <View style={styles.notice}>
              <MaterialCommunityIcons name="information-outline" size={20} color={Colors.primary} />
              <Text style={styles.noticeText}>
                MediCon does not check BMDC numbers automatically. Before approving, look up this
                number in the official BMDC register (bmdc.org.bd) and confirm the name matches.
              </Text>
            </View>

            {rejecting && (
              <View style={styles.card}>
                <Text style={styles.infoLabel}>Reason (the doctor will see this)</Text>
                <TextInput
                  style={styles.input}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. BMDC number does not match the name"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  maxLength={500}
                  autoFocus
                  accessibilityLabel="Rejection reason"
                />
                <Text style={styles.muted}>At least 5 characters.</Text>
              </View>
            )}
          </ScrollView>

          {doctor.verificationStatus !== 'verified' && (
            <View style={[styles.actions, { paddingBottom: Spacing.base + insets.bottom }]}>
              {rejecting ? (
                <>
                  <TouchableOpacity
                    style={styles.btnOutline}
                    onPress={() => setRejecting(false)}
                    disabled={busy}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnOutlineText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnDanger, reason.trim().length < 5 && styles.disabled]}
                    onPress={onReject}
                    disabled={busy || reason.trim().length < 5}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm rejection"
                  >
                    {reject.isPending ? (
                      <ActivityIndicator color={Colors.surface} />
                    ) : (
                      <Text style={styles.btnText}>Reject</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {doctor.verificationStatus === 'pending' && (
                    <TouchableOpacity
                      style={styles.btnOutlineDanger}
                      onPress={() => setRejecting(true)}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel="Reject"
                    >
                      <Text style={styles.btnOutlineDangerText}>Reject</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={onApprove}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Approve"
                  >
                    {approve.isPending ? (
                      <ActivityIndicator color={Colors.surface} />
                    ) : (
                      <Text style={styles.btnText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                </>
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
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    gap: Spacing.xs,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  content: { padding: Spacing.base, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.warning,
  },
  pillOk: { backgroundColor: Colors.success },
  pillBad: { backgroundColor: Colors.danger },
  statusText: { color: Colors.surface, fontSize: FontSize.sm, fontWeight: '700' },
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
  input: {
    minHeight: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  muted: { fontSize: FontSize.sm, color: Colors.textTertiary },
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
