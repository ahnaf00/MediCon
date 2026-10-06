// 1. IMPORTS
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { TranscriptSegment, useConsultationTranscript } from '../../services/api/callsService';

// 2. TYPES
export interface TranscriptViewProps {
  appointmentId: number | string;
  /** Shown instead of "Doctor" / "Patient" when known. */
  doctorName?: string | null;
  patientName?: string | null;
}

/** "m:ss" (or "h:mm:ss") from milliseconds. */
export const formatOffset = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

// 3. COMPONENT
/**
 * A video consultation's call transcript: speaker-labelled lines in time order.
 * Read-only. Used by the doctor's review screen and, once the doctor has saved a
 * transcript-based summary, the patient's (the API enforces who may read it).
 */
export const TranscriptView = ({
  appointmentId,
  doctorName,
  patientName,
}: TranscriptViewProps): React.JSX.Element => {
  const { t } = useTranslation();
  const transcript = useConsultationTranscript(appointmentId);

  if (transcript.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (transcript.isError || !transcript.data) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="text-box-remove-outline"
          size={48}
          color={Colors.textTertiary}
        />
        <Text style={styles.muted}>
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

  const { segments, status } = transcript.data;

  if (segments.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="text-box-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.muted}>
          {status === 'ready'
            ? t('transcript.no_speech', 'The recording had no speech that could be transcribed.')
            : t('transcript.not_available', 'No transcript is available for this call.')}
        </Text>
      </View>
    );
  }

  const speakerLabel = (segment: TranscriptSegment) =>
    segment.speakerRole === 'doctor'
      ? doctorName || t('transcript.doctor', 'Doctor')
      : patientName || t('transcript.patient', 'Patient');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.notice}>
        <MaterialCommunityIcons name="information-outline" size={18} color={Colors.primary} />
        <Text style={styles.noticeText}>
          {t(
            'transcript.notice',
            'Transcribed automatically from the call recording. It may contain mistakes, and times are approximate.',
          )}
        </Text>
      </View>

      {segments.map((segment, index) => {
        const isDoctor = segment.speakerRole === 'doctor';
        return (
          <View key={`${segment.startMs}-${index}`} style={styles.segment}>
            <View style={styles.segmentHeader}>
              <Text
                style={[styles.speaker, isDoctor ? styles.speakerDoctor : styles.speakerPatient]}
              >
                {speakerLabel(segment)}
              </Text>
              <Text style={styles.time}>{formatOffset(segment.startMs)}</Text>
            </View>
            <Text style={styles.text} selectable>
              {segment.text}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

// 4. STYLES
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  muted: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  link: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noticeText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.5,
  },
  segment: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  speaker: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
  },
  speakerDoctor: {
    color: Colors.primary,
  },
  speakerPatient: {
    color: Colors.textPrimary,
  },
  time: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  text: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.5,
  },
});
