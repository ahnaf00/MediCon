import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { UploadRecordPage } from '../../../src/services/api/reportsService';
import { pickReportImages, pickReportPdfs } from '../../../src/services/files/reportPicker';
import { MAX_REPORT_PAGES, useReportDraftStore } from '../../../src/store/reportDraftStore';
import { createAppError } from '../../../src/utils/errors';
import { useTranslation } from 'react-i18next';

/**
 * Starts a new report upload: pick one or more pages, then continue to the
 * Review Document screen where pages can be removed or added before analysis.
 */
export default function UploadReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startDraft = async (pick: (limit: number) => Promise<UploadRecordPage[]>) => {
    try {
      const pages = await pick(MAX_REPORT_PAGES);
      if (pages.length === 0) return;

      const draft = useReportDraftStore.getState();
      draft.clear();
      draft.addPages(pages);
      router.replace('/(app)/report/review');
    } catch (err) {
      const appError = createAppError('UNKNOWN_ERROR', String(err));
      Alert.alert('Error', appError.message);
    }
  };

  const handlePickImage = () => startDraft(pickReportImages);
  const handlePickDocument = () => startDraft(pickReportPdfs);

  return (
    <View style={styles.container}>
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.lg,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('upload.upload_report') || 'Upload Report'}</Text>
        </View>
      </View>

      <View style={[styles.selectionContainer, { paddingBottom: Spacing.xl + insets.bottom }]}>
        <Text style={styles.instructions}>
          {t('upload.upload_a_lab_report_or_medical') ||
            'Upload a lab report or medical document. Our AI will automatically extract the biomarkers and provide a plain-language summary.'}
        </Text>

        <TouchableOpacity style={styles.optionCard} onPress={handlePickImage} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="image" size={32} color={Colors.primary} />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>
              {t('upload.choose_from_gallery') || 'Choose from Gallery'}
            </Text>
            <Text style={styles.optionSubtitle}>
              {t('upload.upload_an_image_jpg_png') || 'Upload an image (JPG, PNG)'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handlePickDocument}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FDECEE' }]}>
            <MaterialCommunityIcons name="file-document" size={32} color={Colors.danger} />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>
              {t('upload.upload_pdf_document') || 'Upload PDF Document'}
            </Text>
            <Text style={styles.optionSubtitle}>
              {t('upload.browse_files_on_your_device') || 'Browse files on your device'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  selectionContainer: {
    padding: Spacing.xl,
  },
  instructions: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: FontSize.base * 1.5,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
