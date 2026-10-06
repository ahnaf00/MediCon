// 1. IMPORTS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import {
  TranscriptDraftSummary,
  useConsultationTranscript,
  useRetryTranscript,
} from '../../services/api/callsService';
import { apiErrorMessage } from '../../services/api/consultationsService';

// 2. TYPES
export interface TranscriptCardProps {
  appointmentId: number;
  /** Pre-fill the summary form with the AI draft. */
  onUseDraft: (draft: TranscriptDraftSummary) => void;
  onViewTranscript: () => void;
}

// 3. COMPONENT
/**
 * The doctor's view of a completed video consultation's transcript pipeline.
 * Every state shown here is the server's real status (polled while it works),
 * never a simulated one.
 */
export const TranscriptCard = ({
  appointmentId,
  onUseDraft,
  onViewTranscript,
}: TranscriptCardProps): React.JSX.Element => {
  const { t } = useTranslation();
  const transcript = useConsultationTranscript(appointmentId);
  const retry = useRetryTranscript();

  const handleRetry = () =>
    retry.mutate(
      { appointmentId },
      {
        onError: (err) =>
          Alert.alert(
            t('consultation.error', 'Something went wrong'),
            apiErrorMessage(err, t('transcript.retry_failed', 'Could not restart the transcript.')),
          ),
      },
    );

  const renderBody = () => {
    if (transcript.isLoading) {
      return <ActivityIndicator size="small" color={Colors.primary} style={styles.spaced} />;
    }

    if (transcript.isError || !transcript.data) {
      return (
        <View style={styles.row}>
          <Text style={[styles.muted, styles.flex]}>
            {t('transcript.load_failed', 'Could not load the call transcript.')}
          </Text>
          <TouchableOpacity
            onPress={() => transcript.refetch()}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.link}>{t('transcript.try_again', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const { status, draftSummary, skipReason, error, segments } = transcript.data;

    switch (status) {
      case 'awaiting_call':
      case 'recording':
        return (
          <Progress
            text={t(
              'transcript.finishing',
              'Finishing the call recording… This can take a few minutes.',
            )}
          />
        );
      case 'transcribing':
        return <Progress text={t('transcript.transcribing', 'Transcribing the call…')} />;
      case 'summarizing':
        return <Progress text={t('transcript.summarizing', 'Writing the AI draft summary…')} />;
      case 'skipped':
        return (
          <Text style={styles.muted}>
            {skipReason === 'no_consent'
              ? t(
                  'transcript.skipped_no_consent',
                  'Not recorded: recording needs both you and the patient to agree.',
                )
              : t(
                  'transcript.skipped_no_audio',
                  'Not recorded: no audio was captured during the call.',
                )}
          </Text>
        );
      case 'failed':
        return (
          <View>
            <Text style={styles.error}>
              {error ?? t('transcript.failed', 'The call could not be transcribed.')}
            </Text>
            <TouchableOpacity
              style={[styles.outlineBtn, styles.spaced, retry.isPending && styles.disabled]}
              onPress={handleRetry}
              disabled={retry.isPending}
              accessibilityRole="button"
            >
              {retry.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.outlineBtnText}>{t('transcript.retry', 'Retry')}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      case 'ready':
        return (
          <View>
            <Text style={styles.muted}>
              {draftSummary
                ? t(
                    'transcript.ready',
                    'The transcript and an AI draft of the summary are ready to review.',
                  )
                : t(
                    'transcript.no_speech',
                    'The recording had no speech that could be transcribed.',
                  )}
            </Text>
            <View style={styles.actionsRow}>
              {segments.length > 0 && (
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={onViewTranscript}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineBtnText}>
                    {t('transcript.view', 'View transcript')}
                  </Text>
                </TouchableOpacity>
              )}
              {draftSummary && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => onUseDraft(draftSummary)}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>
                    {t('transcript.use_draft', 'Use AI draft')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="text-box-outline" size={20} color={Colors.primary} />
        <Text style={styles.title}>{t('transcript.title', 'Call transcript')}</Text>
      </View>
      {renderBody()}
    </View>
  );
};

const Progress = ({ text }: { text: string }) => (
  <View style={styles.row}>
    <ActivityIndicator size="small" color={Colors.primary} />
    <Text style={[styles.muted, styles.flex]}>{text}</Text>
  </View>
);

// 4. STYLES
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  flex: {
    flex: 1,
  },
  spaced: {
    marginTop: Spacing.sm,
  },
  muted: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.danger,
    lineHeight: FontSize.sm * 1.5,
  },
  link: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  primaryBtnText: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
    color: Colors.surface,
  },
  outlineBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  outlineBtnText: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});
