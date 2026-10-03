import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import {
  UploadRecordPage,
  useAnalyzeRecord,
  useUploadRecord,
} from '../../../src/services/api/reportsService';
import { pickReportImages, pickReportPdfs } from '../../../src/services/files/reportPicker';
import { MAX_REPORT_PAGES, useReportDraftStore } from '../../../src/store/reportDraftStore';

/**
 * Review Document: the staged pages of a report before upload. Tap a page to
 * remove it, add more pages, then upload the document for analysis.
 */
export default function ReviewReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pages = useReportDraftStore((s) => s.pages);
  const addPages = useReportDraftStore((s) => s.addPages);
  const removePage = useReportDraftStore((s) => s.removePage);
  const clearDraft = useReportDraftStore((s) => s.clear);

  const upload = useUploadRecord();
  const analyze = useAnalyzeRecord();
  const isSubmitting = upload.isPending || analyze.isPending;
  const remaining = MAX_REPORT_PAGES - pages.length;

  const appendFrom = async (pick: (limit: number) => Promise<UploadRecordPage[]>) => {
    try {
      const picked = await pick(remaining);
      const skipped = addPages(picked);
      if (skipped > 0) {
        Alert.alert(
          t('report_review.page_limit_title', 'Page limit reached'),
          t('report_review.page_limit_body', 'A report can have at most {{max}} pages.', {
            max: MAX_REPORT_PAGES,
          }),
        );
      }
    } catch (err) {
      Alert.alert('Error', String(err));
    }
  };

  const handleAddPage = () => {
    Alert.alert(t('report_review.add_page', 'Add page'), undefined, [
      {
        text: t('report_review.gallery_image', 'Gallery Image'),
        onPress: () => appendFrom(pickReportImages),
      },
      {
        text: t('report_review.upload_pdf', 'Upload PDF'),
        onPress: () => appendFrom(pickReportPdfs),
      },
      { text: t('report_review.cancel', 'Cancel'), style: 'cancel' },
    ]);
  };

  const handleAnalyze = async () => {
    if (pages.length === 0 || isSubmitting) return;
    try {
      const record = await upload.mutateAsync({ pages });
      clearDraft();
      try {
        await analyze.mutateAsync(record.id);
      } catch {
        // The upload is saved either way; the report screen offers "Analyze" again.
      }
      router.replace(`/(app)/report/${record.id}`);
    } catch (error: any) {
      // The draft is kept so the patient can retry without re-picking pages.
      const message = error?.message || String(error);
      Alert.alert(
        t('report_review.upload_failed', 'Upload Failed'),
        t('report_review.upload_failed_body', 'Your report could not be uploaded. {{message}}', {
          message,
        }),
      );
    }
  };

  const selectedLabel =
    pages.length === 1
      ? t('report_review.one_page_selected', '1 page selected')
      : t('report_review.pages_selected', '{{count}} pages selected', { count: pages.length });

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: Colors.surface, paddingTop: insets.top }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('upload.review_document', 'Review Document')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.selectedCount}>{selectedLabel}</Text>
        <Text style={styles.sectionLabel}>
          {t('report_review.pages_tap_to_remove', 'PAGES (TAP TO REMOVE)')}
        </Text>

        <View style={styles.grid}>
          {pages.map((page, index) => (
            <TouchableOpacity
              key={`${page.fileUri}-${index}`}
              style={styles.tile}
              onPress={() => removePage(index)}
              disabled={isSubmitting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Remove page ${index + 1}`}
            >
              {page.mimeType === 'application/pdf' ? (
                <View style={styles.pdfTile}>
                  <MaterialCommunityIcons name="file-pdf-box" size={36} color={Colors.danger} />
                  <Text style={styles.pdfName} numberOfLines={2}>
                    {page.fileName}
                  </Text>
                </View>
              ) : (
                <Image source={{ uri: page.fileUri }} style={styles.tileImage} resizeMode="cover" />
              )}
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.removeBadge}>
                <MaterialCommunityIcons name="close" size={14} color={Colors.surface} />
              </View>
            </TouchableOpacity>
          ))}

          {remaining > 0 && (
            <TouchableOpacity
              style={[styles.tile, styles.addTile]}
              onPress={handleAddPage}
              disabled={isSubmitting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add page"
            >
              <MaterialCommunityIcons name="plus" size={28} color={Colors.primary} />
              <Text style={styles.addTileText}>{t('report_review.add_page', 'Add page')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Spacing.base + insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (pages.length === 0 || isSubmitting) && styles.buttonDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={pages.length === 0 || isSubmitting}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color={Colors.surface} />
              <Text style={styles.primaryButtonText}>
                {analyze.isPending
                  ? t('report_review.starting_analysis', 'Starting analysis…')
                  : t('report_review.uploading', 'Uploading…')}
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="file-search-outline" size={20} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>
                {t('report_review.analyze_report', 'Analyze Report')}
              </Text>
            </>
          )}
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
  content: {
    padding: Spacing.base,
  },
  selectedCount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tile: {
    width: '30%',
    aspectRatio: 0.75,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  pdfTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    backgroundColor: '#FFF5F5',
  },
  pdfName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  pageBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pageBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.surface,
  },
  removeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.tertiaryLight,
  },
  addTileText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
});
