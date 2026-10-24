import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import { prescriptionsService } from '../../services/api/prescriptionsService';
import { apiErrorMessage } from '../../utils/errors';
import type { Prescription, PrescriptionMedicine } from '../../types/medical.types';

export interface ExplanationReviewProps {
  prescriptionId: string | number;
  med: PrescriptionMedicine;
  onUpdated: (prescription: Prescription) => void;
}

const MAX_LENGTH = 1000;

/**
 * The prescribing doctor's view of a medicine's "Why take this medicine?" text:
 * who wrote it, whether the patient sees it, and Edit / Hide (audit CLIN-006).
 */
export const ExplanationReview = ({ prescriptionId, med, onUpdated }: ExplanationReviewProps) => {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const text = med.explanation;
  const hidden = med.explanationHidden === true;

  const save = async (change: { explanation?: string; hidden?: boolean }): Promise<boolean> => {
    setBusy(true);
    try {
      const updated = await prescriptionsService.updateExplanation(prescriptionId, med.id, change);
      onUpdated(updated);
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      return true;
    } catch (err) {
      Alert.alert('Could not save', apiErrorMessage(err, 'Check your connection and try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openEditor = () => {
    setDraft(text ?? '');
    setEditing(true);
  };

  const submitDraft = async () => {
    if (await save({ explanation: draft.trim() })) setEditing(false);
  };

  return (
    <View style={styles.box}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>What the patient reads</Text>
        {hidden ? (
          <View style={styles.hiddenBadge}>
            <Text style={styles.hiddenBadgeText}>Hidden from patient</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.body}>
        {text ??
          'No explanation yet. The AI writes one shortly after the prescription is issued; if none appears, it could not explain this medicine. You can write your own.'}
      </Text>
      {text ? (
        <Text style={styles.caption}>
          {med.explanationSource === 'doctor'
            ? 'Written by you. The patient sees it as from their doctor.'
            : 'AI-generated. The patient sees it labelled as AI.'}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={openEditor}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Edit the explanation for ${med.name}`}
        >
          <Text style={styles.actionText}>{text ? 'Edit' : 'Write one'}</Text>
        </TouchableOpacity>
        {text ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => save({ hidden: !hidden })}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>
              {hidden ? 'Show to patient' : 'Hide from patient'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {busy && !editing ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
      </View>

      <Modal
        visible={editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Why take {med.name}?</Text>
            <Text style={styles.sheetHint}>
              In plain words for the patient. Saving replaces the AI text and shows it as yours.
            </Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={MAX_LENGTH}
              autoFocus
              accessibilityLabel="Explanation text"
            />
            <Text style={styles.counter}>
              {draft.length}/{MAX_LENGTH}
            </Text>
            <View style={styles.sheetActions}>
              <TouchableOpacity
                onPress={() => setEditing(false)}
                disabled={busy}
                style={styles.sheetButton}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitDraft}
                disabled={busy || draft.trim().length < 3}
                style={[
                  styles.sheetButton,
                  styles.saveButton,
                  (busy || draft.trim().length < 3) && styles.saveButtonDisabled,
                ]}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(238, 242, 246, 0.5)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  hiddenBadge: {
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  hiddenBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.surface,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  actionButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.base,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  sheetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  sheetHint: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  input: {
    minHeight: 120,
    maxHeight: 260,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    textAlignVertical: 'top',
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  sheetButton: {
    minHeight: 40,
    minWidth: 88,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.surface,
  },
});
