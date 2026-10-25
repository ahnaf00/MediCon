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
import { HospitalForm } from '../../../../src/components/admin/HospitalForm';
import {
  HospitalForm as HospitalFormValue,
  HospitalInput,
  hospitalFieldErrors,
  hospitalToForm,
  parseHospitalForm,
  useAdminHospital,
  useHideHospital,
  useShowHospital,
  useUpdateHospital,
} from '../../../../src/services/api/adminSystemService';
import { timeAgo } from '../../../../src/services/api/adminService';
import { apiErrorMessage } from '../../../../src/utils/errors';

const sameInput = (a: HospitalFormValue, b: HospitalFormValue) =>
  JSON.stringify(parseHospitalForm(a).input) === JSON.stringify(parseHospitalForm(b).input);

/**
 * One hospital for an admin (audit L2b step 3): edit its details, or hide it
 * from patients. Hiding keeps the hospital and can be undone; it is never deleted.
 */
export default function AdminHospitalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: hospital, isLoading, isError, refetch } = useAdminHospital(id);
  const update = useUpdateHospital();
  const hide = useHideHospital();
  const show = useShowHospital();

  const [form, setForm] = useState<HospitalFormValue | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof HospitalInput, string>>>({});
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState('');
  const busy = update.isPending || hide.isPending || show.isPending;

  // Fill the form once per hospital; refetches must not wipe unsaved edits.
  if (hospital && hospital.id !== loadedId) {
    setLoadedId(hospital.id);
    setForm(hospitalToForm(hospital));
  }

  const changed = !!hospital && !!form && !sameInput(form, hospitalToForm(hospital));
  const fail = (err: unknown) =>
    Alert.alert('Not saved', apiErrorMessage(err, 'Something went wrong. Try again.'));

  const onSave = () => {
    if (!hospital || !form) return;
    const { input, errors: found } = parseHospitalForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    update.mutate(
      { id: hospital.id, input },
      {
        onSuccess: (saved) => {
          setForm(hospitalToForm(saved));
          Alert.alert('Saved', 'Patients see the new details now.');
        },
        onError: (err) => {
          const fromServer = hospitalFieldErrors(err);
          setErrors(fromServer);
          if (Object.keys(fromServer).length === 0) fail(err);
        },
      },
    );
  };

  const onHide = () => {
    if (!hospital || reason.trim().length < 5) return;
    Alert.alert(
      `Hide ${hospital.name}?`,
      'Patients will no longer see it in the Hospitals list or in search. Nothing is deleted, and you can show it again at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: () =>
            hide.mutate(
              { id: hospital.id, reason: reason.trim() },
              {
                onSuccess: () => {
                  setHiding(false);
                  setReason('');
                },
                onError: fail,
              },
            ),
        },
      ],
    );
  };

  const onShow = () => {
    if (!hospital) return;
    Alert.alert(`Show ${hospital.name} again?`, 'Patients will see it in the Hospitals list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Show', onPress: () => show.mutate(hospital.id, { onError: fail }) },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AdminHeader title="Hospital" back />

      {isLoading ? (
        <ActivityIndicator style={styles.center} color={Colors.primary} />
      ) : isError || !hospital || !form ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Could not load this hospital.</Text>
          <TouchableOpacity onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              // The Save bar sits below only when something changed; otherwise clear the system bar.
              !changed && { paddingBottom: Spacing.xxl + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.status, !hospital.isActive && styles.statusHidden]}>
              <MaterialCommunityIcons
                name={hospital.isActive ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={hospital.isActive ? Colors.success : Colors.textSecondary}
              />
              <Text style={styles.statusText}>
                {hospital.isActive
                  ? 'Shown to patients'
                  : `Hidden from patients ${timeAgo(hospital.deactivatedAt)}`}
              </Text>
            </View>

            <HospitalForm
              value={form}
              onChange={setForm}
              errors={errors}
              onErrorsChange={setErrors}
              disabled={busy}
            />

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Visibility</Text>
              {hospital.isActive ? (
                hiding ? (
                  <>
                    <Text style={styles.label}>Reason (only admins see this)</Text>
                    <TextInput
                      style={styles.input}
                      value={reason}
                      onChangeText={setReason}
                      placeholder="e.g. Closed permanently, or listed twice"
                      placeholderTextColor={Colors.textTertiary}
                      multiline
                      maxLength={500}
                      autoFocus
                      accessibilityLabel="Reason for hiding"
                    />
                    <Text style={styles.muted}>At least 5 characters.</Text>
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={styles.btnOutline}
                        onPress={() => setHiding(false)}
                        disabled={busy}
                        accessibilityRole="button"
                      >
                        <Text style={styles.btnOutlineText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnDanger, reason.trim().length < 5 && styles.disabled]}
                        onPress={onHide}
                        disabled={busy || reason.trim().length < 5}
                        accessibilityRole="button"
                        accessibilityLabel="Hide from patients"
                      >
                        {hide.isPending ? (
                          <ActivityIndicator color={Colors.surface} />
                        ) : (
                          <Text style={styles.btnText}>Hide</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.muted}>
                      Hide a hospital that has closed or was added by mistake. It is kept, not
                      deleted.
                    </Text>
                    <TouchableOpacity
                      style={styles.btnOutlineDanger}
                      onPress={() => setHiding(true)}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={styles.btnOutlineDangerText}>Hide from patients</Text>
                    </TouchableOpacity>
                  </>
                )
              ) : (
                <TouchableOpacity
                  style={styles.btnOutlinePrimary}
                  onPress={onShow}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {show.isPending ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <Text style={styles.btnOutlinePrimaryText}>Show to patients again</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.linkRow}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/admin/audit-log',
                    params: {
                      target_id: String(hospital.id),
                      target_type: 'hospital',
                      name: hospital.name,
                    },
                  })
                }
                accessibilityRole="button"
              >
                <Text style={styles.linkText}>History of changes</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {changed && (
            <View style={[styles.actions, { paddingBottom: Spacing.base + insets.bottom }]}>
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => {
                  setForm(hospitalToForm(hospital));
                  setErrors({});
                }}
                disabled={busy}
                accessibilityRole="button"
              >
                <Text style={styles.btnOutlineText}>Undo changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={onSave}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Save changes"
              >
                {update.isPending ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.btnText}>Save</Text>
                )}
              </TouchableOpacity>
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
  content: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xxl },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.tertiaryLight,
  },
  statusHidden: { backgroundColor: Colors.surface },
  statusText: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  label: { fontSize: FontSize.sm, color: Colors.textTertiary },
  input: {
    minHeight: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  muted: { fontSize: FontSize.sm, color: Colors.textTertiary, lineHeight: 18 },
  retry: { marginTop: Spacing.sm, color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  linkText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary },
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
  btnOutlineDanger: { ...button, flex: 0, borderWidth: 1.5, borderColor: Colors.danger },
  btnOutlineDangerText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.danger },
  btnOutlinePrimary: { ...button, flex: 0, borderWidth: 1.5, borderColor: Colors.primary },
  btnOutlinePrimaryText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  btnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.surface },
  disabled: { opacity: 0.5 },
});
