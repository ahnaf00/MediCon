import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../theme';
import type { AnalysisStatus } from '../../services/api/reportsService';

/** After this long, tell the patient it is slower than usual. */
export const SLOW_ANALYSIS_MS = 2 * 60 * 1000;

interface AnalysisProgressModalProps {
  visible: boolean;
  status: AnalysisStatus;
  /** Hides the modal; the analysis keeps running on the server. */
  onClose: () => void;
}

type StageState = 'done' | 'active';

/**
 * Progress for a report analysis, driven only by the status the server reports.
 *
 * The server says "processing" once it holds the uploaded pages, so the first
 * stage is genuinely complete. Extraction and the summary come out of a single
 * model call, so those two stages stay active together until the server reports
 * a result; nothing here advances on a timer.
 */
export function AnalysisProgressModal({ visible, status, onClose }: AnalysisProgressModalProps) {
  const { t } = useTranslation();
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setIsSlow(true), SLOW_ANALYSIS_MS);
    return () => {
      clearTimeout(timer);
      setIsSlow(false);
    };
  }, [visible]);

  const finished = status === 'completed';
  const stages: { key: string; label: string; state: StageState }[] = [
    {
      key: 'reading',
      label: t('report_analysis.stage_reading', 'Reading document'),
      state: 'done',
    },
    {
      key: 'extracting',
      label: t('report_analysis.stage_extracting', 'Extracting biomarkers'),
      state: finished ? 'done' : 'active',
    },
    {
      key: 'summary',
      label: t('report_analysis.stage_summary', 'Generating summary'),
      state: finished ? 'done' : 'active',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card} testID="analysis-progress-modal">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.title}>
            {t('report_analysis.analyzing_title', 'Analyzing Report…')}
          </Text>
          <Text style={styles.body}>
            {t(
              'report_analysis.analyzing_body',
              'Our AI is scanning the document and extracting clinical biomarkers. This may take 10–20 seconds.',
            )}
          </Text>

          <View style={styles.stages}>
            {stages.map((stage) => (
              <View
                key={stage.key}
                style={styles.stageRow}
                testID={`stage-${stage.key}-${stage.state}`}
              >
                {stage.state === 'done' ? (
                  <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                ) : (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
                <Text style={[styles.stageText, stage.state === 'done' && styles.stageTextDone]}>
                  {stage.label}
                </Text>
              </View>
            ))}
          </View>

          {isSlow && (
            <Text style={styles.slowNote}>
              {t(
                'report_analysis.slow_note',
                'This is taking longer than usual. You can close this; the analysis will continue and this report will update when it is ready.',
              )}
            </Text>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeButtonText}>
              {t('report_analysis.continue_in_background', 'Continue in background')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
  stages: {
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stageText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  stageTextDone: {
    color: Colors.textSecondary,
  },
  slowNote: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: FontSize.xs * 1.5,
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  closeButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
});
