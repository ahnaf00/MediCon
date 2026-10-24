import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { Button } from '../ui/Button';
import type { Prescription } from '../../types/medical.types';
import { useVoidPrescription } from '../../services/api/prescriptionsService';
import { apiErrorMessage } from '../../utils/errors';

interface Props {
  prescription: Prescription;
  /** The signed-in doctor wrote this prescription: they may cancel and reissue it. */
  isPrescriber: boolean;
  onUpdated: (prescription: Prescription) => void;
}

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Cancelled / replaced / allergy-confirmed notices on a prescription, and the
 * prescriber's "Cancel" and "Issue a corrected prescription" actions (audit G1).
 */
export function PrescriptionStatusPanel({
  prescription,
  isPrescriber,
  onUpdated,
}: Props): React.JSX.Element | null {
  const router = useRouter();
  const voidRx = useVoidPrescription();
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState('');

  if (prescription.source !== 'DOCTOR') return null;

  const cancelled = prescription.status === 'cancelled';
  const conflicts = prescription.allergyConflicts ?? [];

  const confirmCancel = () => {
    voidRx.mutate(
      { id: prescription.id, reason: reason.trim() },
      {
        onSuccess: (updated) => {
          setAskReason(false);
          setReason('');
          onUpdated(updated);
        },
        onError: (err) => Alert.alert('Not cancelled', apiErrorMessage(err, 'Please try again.')),
      },
    );
  };

  const reissue = () =>
    router.push({
      pathname: '/(app)/doctor/prescription/write',
      params: {
        patientId: String(prescription.patient?.id ?? ''),
        patientName: encodeURIComponent(prescription.patient?.name ?? ''),
        replacesPrescriptionId: String(prescription.id),
      },
    });

  return (
    <View style={styles.container}>
      {cancelled && (
        <View style={[styles.box, styles.cancelledBox]} accessibilityRole="alert">
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="cancel" size={18} color={Colors.danger} />
            <Text style={[styles.title, { color: Colors.danger }]}>
              Cancelled{prescription.voidedAt ? ` on ${formatDay(prescription.voidedAt)}` : ''}
            </Text>
          </View>
          <Text style={styles.body}>
            The doctor cancelled this prescription. Do not use it to buy or take these medicines.
          </Text>
          {prescription.voidReason ? (
            <Text style={styles.body}>Reason: {prescription.voidReason}</Text>
          ) : null}
          {prescription.replacedByPrescriptionId ? (
            <TouchableOpacity
              onPress={() =>
                router.replace(`/(app)/prescriptions/${prescription.replacedByPrescriptionId}`)
              }
              accessibilityRole="link"
            >
              <Text style={styles.link}>Open the corrected prescription</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {prescription.replacesPrescriptionId ? (
        <TouchableOpacity
          style={[styles.box, styles.infoBox]}
          onPress={() => router.push(`/(app)/prescriptions/${prescription.replacesPrescriptionId}`)}
          accessibilityRole="link"
        >
          <Text style={styles.body}>This corrects a cancelled prescription.</Text>
          <Text style={styles.link}>See the cancelled one</Text>
        </TouchableOpacity>
      ) : null}

      {conflicts.length > 0 && (
        <View style={[styles.box, styles.warnBox]}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="alert-outline" size={18} color="#92400e" />
            <Text style={[styles.title, { color: '#92400e' }]}>
              Allergy warning seen by the doctor
            </Text>
          </View>
          {conflicts.map((c) => (
            <Text key={`${c.medicine}-${c.allergy}`} style={styles.body}>
              • {c.medicine} matches the recorded allergy “{c.allergy}”.
            </Text>
          ))}
          <Text style={styles.note}>
            The doctor confirmed it before prescribing. This compares names only; ask your doctor or
            pharmacist if you are unsure.
          </Text>
        </View>
      )}

      {isPrescriber && !cancelled && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setAskReason(true)}
          accessibilityRole="button"
          accessibilityLabel="Cancel this prescription"
        >
          <MaterialCommunityIcons name="file-cancel-outline" size={18} color={Colors.danger} />
          <Text style={styles.cancelText}>Cancel this prescription</Text>
        </TouchableOpacity>
      )}

      {isPrescriber && cancelled && !prescription.replacedByPrescriptionId && (
        <Button label="Issue a corrected prescription" onPress={reissue} />
      )}

      <Modal
        visible={askReason}
        transparent
        animationType="fade"
        onRequestClose={() => setAskReason(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Cancel this prescription?</Text>
            <Text style={styles.body}>
              The patient will see it as cancelled, with your reason. You can then issue a corrected
              one for the same visit.
            </Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason, e.g. wrong strength written"
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={500}
              accessibilityLabel="Reason for cancelling"
            />
            <Button
              label="Cancel prescription"
              variant="danger"
              onPress={confirmCancel}
              loading={voidRx.isPending}
              disabled={reason.trim().length < 3}
            />
            <TouchableOpacity
              onPress={() => setAskReason(false)}
              style={styles.keep}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Keep it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm, marginBottom: Spacing.md },
  box: { borderRadius: BorderRadius.md, padding: Spacing.md, gap: 6, borderWidth: 1 },
  cancelledBox: { backgroundColor: '#fde8e8', borderColor: Colors.danger },
  infoBox: { backgroundColor: Colors.surface, borderColor: Colors.tertiary },
  warnBox: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: FontFamily.semiBold, fontSize: FontSize.md },
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.textPrimary },
  note: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.textSecondary },
  link: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.primary },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  cancelText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.danger },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sheetTitle: { fontFamily: FontFamily.semiBold, fontSize: FontSize.lg, color: Colors.textPrimary },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  keep: { alignItems: 'center' },
});
