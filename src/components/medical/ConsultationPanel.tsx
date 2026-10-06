// 1. IMPORTS
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import {
  ApiAppointment,
  apiErrorMessage,
  useConsultation,
  useSaveConsultationSummary,
  useUpdateAppointmentStatus,
} from '../../services/api/consultationsService';
import type { TranscriptDraftSummary } from '../../services/api/callsService';
import { TranscriptCard } from './TranscriptCard';

// 2. TYPES
export interface ConsultationPanelProps {
  /** The appointment being run; null when the doctor has none with this patient. */
  appointment: ApiAppointment | null;
}

const MAX_RED_FLAGS = 10;

/** What the AI draft writes for a field the call did not cover (TranscriptSummaryService). */
const NOT_DISCUSSED = 'Not discussed';
const fromDraft = (value: string | null): string =>
  value && value.trim() !== NOT_DISCUSSED ? value.trim() : '';

const formatWhen = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

// 3. COMPONENT
/**
 * The doctor's end-of-consultation workflow: start the visit (or mark a
 * no-show), then write the structured summary (chief complaint, findings,
 * advice, red flags) and complete it. The summary is what the patient's
 * consultation AI chat answers from.
 */
export const ConsultationPanel = ({ appointment }: ConsultationPanelProps): React.JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();
  const status = appointment?.status;
  const canWrite = status === 'in_progress' || status === 'completed';

  const consultation = useConsultation(appointment?.id, canWrite);
  const updateStatus = useUpdateAppointmentStatus();
  const saveSummary = useSaveConsultationSummary();

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [findings, setFindings] = useState('');
  const [advice, setAdvice] = useState('');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [redFlagDraft, setRedFlagDraft] = useState('');
  const [loadedSummaryId, setLoadedSummaryId] = useState<number | null>(null);
  // True once the doctor pre-filled the form from the call transcript's AI draft.
  const [usedDraft, setUsedDraft] = useState(false);

  // Prefill once from a saved summary (adjusting state during render, not in an
  // effect), without clobbering the doctor's edits on later refetches.
  const savedSummary = consultation.data?.summary ?? null;
  if (savedSummary && savedSummary.id !== loadedSummaryId) {
    setLoadedSummaryId(savedSummary.id);
    setChiefComplaint(savedSummary.chiefComplaint);
    setFindings(savedSummary.findings ?? '');
    setAdvice(savedSummary.advice ?? '');
    setRedFlags(savedSummary.redFlags);
  }

  const busy = updateStatus.isPending || saveSummary.isPending;
  const isVideo = appointment?.format === 'video';
  const openCall = () => appointment && router.push(`/(app)/call/${appointment.id}`);
  const openTranscript = () =>
    appointment && router.push(`/(app)/doctor/consultation/transcript/${appointment.id}`);

  if (!appointment) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{t('consultation.title', 'Consultation')}</Text>
        <Text style={styles.muted}>
          {t('consultation.no_appointment', 'You have no appointment with this patient.')}
        </Text>
      </View>
    );
  }

  const changeStatus = (next: 'in_progress' | 'no_show') => {
    updateStatus.mutate(
      { appointmentId: appointment.id, status: next },
      {
        onError: (err) =>
          Alert.alert(
            t('consultation.error', 'Something went wrong'),
            apiErrorMessage(
              err,
              t('consultation.status_failed', 'Could not update the appointment.'),
            ),
          ),
      },
    );
  };

  const confirmNoShow = () => {
    Alert.alert(
      t('consultation.no_show_title', 'Mark as no-show?'),
      t('consultation.no_show_body', 'The patient did not attend this appointment.'),
      [
        { text: t('consultation.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('consultation.mark_no_show', 'Mark no-show'),
          style: 'destructive',
          onPress: () => changeStatus('no_show'),
        },
      ],
    );
  };

  const applyDraft = (draft: TranscriptDraftSummary) => {
    const fill = () => {
      setChiefComplaint(fromDraft(draft.chiefComplaint));
      setFindings(fromDraft(draft.findings));
      setAdvice(fromDraft(draft.advice));
      setRedFlags(draft.redFlags.slice(0, MAX_RED_FLAGS));
      setRedFlagDraft('');
      setUsedDraft(true);
    };

    const hasInput =
      [chiefComplaint, findings, advice, redFlagDraft].some((v) => v.trim() !== '') ||
      redFlags.length > 0;
    if (!hasInput) {
      fill();
      return;
    }

    Alert.alert(
      t('transcript.replace_title', 'Replace the summary?'),
      t('transcript.replace_body', 'The AI draft will replace what is in the form now.'),
      [
        { text: t('consultation.cancel', 'Cancel'), style: 'cancel' },
        { text: t('transcript.replace', 'Replace'), style: 'destructive', onPress: fill },
      ],
    );
  };

  const addRedFlag = () => {
    const value = redFlagDraft.trim();
    if (!value || redFlags.length >= MAX_RED_FLAGS) return;
    setRedFlags([...redFlags, value]);
    setRedFlagDraft('');
  };

  const handleSave = async () => {
    if (!chiefComplaint.trim()) {
      Alert.alert(
        t('consultation.required_title', 'Chief complaint required'),
        t('consultation.required_body', 'Add the chief complaint before saving.'),
      );
      return;
    }

    // Include a red flag typed but not yet added.
    const flags = redFlagDraft.trim() ? [...redFlags, redFlagDraft.trim()] : redFlags;

    try {
      await saveSummary.mutateAsync({
        appointmentId: appointment.id,
        input: {
          chief_complaint: chiefComplaint.trim(),
          findings: findings.trim() || null,
          advice: advice.trim() || null,
          red_flags: flags.slice(0, MAX_RED_FLAGS),
          // Otherwise omitted, so an edit keeps the saved source.
          ...(usedDraft ? { source: 'transcript' as const } : {}),
        },
      });
      setRedFlags(flags.slice(0, MAX_RED_FLAGS));
      setRedFlagDraft('');
      setUsedDraft(false);

      if (status === 'in_progress') {
        await updateStatus.mutateAsync({ appointmentId: appointment.id, status: 'completed' });
        Alert.alert(
          t('consultation.completed_title', 'Consultation completed'),
          t('consultation.completed_body', 'The summary is saved and shared with the patient.'),
        );
      } else {
        Alert.alert(t('consultation.saved_title', 'Summary saved'));
      }
    } catch (err) {
      Alert.alert(
        t('consultation.error', 'Something went wrong'),
        apiErrorMessage(err, t('consultation.save_failed', 'Could not save the summary.')),
      );
    }
  };

  const statusLabel: Record<string, string> = {
    scheduled: t('consultation.status_scheduled', 'Scheduled'),
    in_progress: t('consultation.status_in_progress', 'In progress'),
    completed: t('consultation.status_completed', 'Completed'),
    cancelled: t('consultation.status_cancelled', 'Cancelled'),
    no_show: t('consultation.status_no_show', 'No-show'),
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('consultation.title', 'Consultation')}</Text>
        <View style={[styles.chip, status === 'completed' && styles.chipDone]}>
          <Text style={styles.chipText}>
            {statusLabel[appointment.status] ?? appointment.status}
          </Text>
        </View>
      </View>
      <Text style={styles.muted}>{formatWhen(appointment.datetime)}</Text>

      {status === 'scheduled' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, busy && styles.disabled]}
            onPress={confirmNoShow}
            disabled={busy}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>
              {t('consultation.mark_no_show', 'Mark no-show')}
            </Text>
          </TouchableOpacity>
          {isVideo ? (
            // Joining the call fetches the first token, which starts the visit server-side.
            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.disabled]}
              onPress={openCall}
              disabled={busy}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {t('consultation.start_video_call', 'Start video call')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, busy && styles.disabled]}
              onPress={() => changeStatus('in_progress')}
              disabled={busy}
              accessibilityRole="button"
            >
              {updateStatus.isPending ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {t('consultation.start', 'Start consultation')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {status === 'in_progress' && isVideo && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={openCall} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>
              {t('consultation.rejoin_call', 'Rejoin call')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {(status === 'cancelled' || status === 'no_show') && (
        <Text style={[styles.muted, styles.spaced]}>
          {t('consultation.closed', 'This appointment is closed; no summary can be written.')}
        </Text>
      )}

      {/* Transcription starts once the visit is completed. */}
      {isVideo && status === 'completed' && (
        <TranscriptCard
          appointmentId={appointment.id}
          onUseDraft={applyDraft}
          onViewTranscript={openTranscript}
        />
      )}

      {canWrite && consultation.isLoading && (
        <ActivityIndicator size="small" color={Colors.primary} style={styles.spaced} />
      )}

      {canWrite && !consultation.isLoading && (
        <View style={styles.form}>
          {usedDraft && (
            <View style={styles.draftBanner}>
              <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.primary} />
              <Text style={styles.draftBannerText}>
                {t(
                  'transcript.draft_banner',
                  'AI-generated draft from the call transcript — review and edit before saving. Fields the call did not cover are left blank.',
                )}
              </Text>
            </View>
          )}
          {!usedDraft && savedSummary?.source === 'transcript' && (
            <Text style={styles.muted}>
              {t('transcript.based_on', 'This summary was started from the call transcript.')}
            </Text>
          )}
          <Text style={styles.label}>{t('consultation.chief_complaint', 'Chief complaint *')}</Text>
          <TextInput
            style={styles.input}
            value={chiefComplaint}
            onChangeText={setChiefComplaint}
            placeholder={t('consultation.chief_complaint_ph', 'e.g. Chest pain after running')}
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={2000}
          />

          <Text style={styles.label}>{t('consultation.findings', 'Findings')}</Text>
          <TextInput
            style={[styles.input, styles.inputTall]}
            value={findings}
            onChangeText={setFindings}
            placeholder={t('consultation.findings_ph', 'Examination, tests reviewed, assessment')}
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={5000}
          />

          <Text style={styles.label}>{t('consultation.advice', 'Advice')}</Text>
          <TextInput
            style={[styles.input, styles.inputTall]}
            value={advice}
            onChangeText={setAdvice}
            placeholder={t('consultation.advice_ph', 'What the patient should do next')}
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={5000}
          />

          <Text style={styles.label}>
            {t('consultation.red_flags', 'Red flags (seek urgent care if…)')}
          </Text>
          {redFlags.map((flag, index) => (
            <View key={`${flag}-${index}`} style={styles.flagRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.flagText}>{flag}</Text>
              <TouchableOpacity
                onPress={() => setRedFlags(redFlags.filter((_, i) => i !== index))}
                accessibilityRole="button"
                accessibilityLabel={t('consultation.remove_flag', 'Remove red flag')}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
          {redFlags.length < MAX_RED_FLAGS && (
            <View style={styles.flagInputRow}>
              <TextInput
                style={[styles.input, styles.flagInput]}
                value={redFlagDraft}
                onChangeText={setRedFlagDraft}
                onSubmitEditing={addRedFlag}
                placeholder={t('consultation.red_flag_ph', 'e.g. Chest pain at rest')}
                placeholderTextColor={Colors.textTertiary}
                maxLength={300}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={addRedFlag}
                accessibilityRole="button"
                accessibilityLabel={t('consultation.add_flag', 'Add red flag')}
              >
                <MaterialCommunityIcons name="plus" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, styles.saveBtn, busy && styles.disabled]}
            onPress={handleSave}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {status === 'in_progress'
                  ? t('consultation.save_and_complete', 'Save summary & complete')
                  : t('consultation.save', 'Save summary')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  chip: {
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  chipDone: {
    backgroundColor: Colors.tertiary,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  muted: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  spaced: {
    marginTop: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  primaryBtnText: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  form: {
    marginTop: Spacing.sm,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontWeight: '600',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: 46,
    textAlignVertical: 'top',
  },
  inputTall: {
    minHeight: 88,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  flagText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  flagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flagInput: {
    flex: 1,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBanner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  draftBannerText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: FontSize.sm * 1.5,
  },
  saveBtn: {
    marginTop: Spacing.lg,
    flex: 0,
  },
});
