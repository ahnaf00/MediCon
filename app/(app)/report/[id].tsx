import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Layout } from '../../../src/theme';
import {
  MedicalRecord,
  useAnalyzeRecord,
  useMedicalRecord,
} from '../../../src/services/api/reportsService';
import { BiomarkerRow } from '../../../src/components/medical/BiomarkerRow';
import { AnalysisProgressModal } from '../../../src/components/medical/AnalysisProgressModal';
import { groupLabResults } from '../../../src/utils/labResults';
import { fromLocalDateString } from '../../../src/utils/localDate';
import { useTranslation } from 'react-i18next';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

/** The printed report date when known, otherwise the upload date. */
function displayDate(report: MedicalRecord): string {
  const printed = report.reportDate ? fromLocalDateString(report.reportDate) : null;
  return (printed ?? new Date(report.createdAt)).toLocaleDateString('en-US', DATE_FORMAT);
}

export default function ReportDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  type ActiveTab = 'analysis' | 'results';
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');
  const [progressDismissed, setProgressDismissed] = useState(false);

  const recordId = Number(id);
  const { data: report, isLoading, isError, refetch } = useMedicalRecord(recordId);
  const analyze = useAnalyzeRecord();

  const startAnalysis = () => {
    setProgressDismissed(false);
    analyze.mutate(recordId, {
      onError: (error: any) => {
        Alert.alert(
          t('report_analysis.analyze_failed_title', 'Could not start analysis'),
          error?.message ||
            t('report_analysis.analyze_failed_body', 'Please try again in a moment.'),
        );
      },
    });
  };

  /** Signed URLs expire after 15 minutes, so fetch fresh ones before opening. */
  const openPage = async (index: number) => {
    const { data } = await refetch();
    const url = data?.pages?.[index]?.fileUrl ?? (index === 0 ? data?.fileUrl : undefined);
    if (!url) {
      Alert.alert(t('report_analysis.open_failed', 'The document could not be opened.'));
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert(t('report_analysis.open_failed', 'The document could not be opened.'));
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !report) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>
          {isError
            ? t('report_analysis.load_failed', 'Failed to load report details.')
            : t('report_analysis.not_found', 'Report not found.')}
        </Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
          <Text style={styles.errorBackButtonText}>{t('[id].go_back') || 'Go Back'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const status = report.analysisStatus;
  const pages = report.pages ?? [];
  const labResults = report.labResults ?? [];
  const isStarting = analyze.isPending;

  const renderPagesStrip = () =>
    pages.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.pagesLabel}>
          {t('report_analysis.original_pages', 'Original pages (tap to open)')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pagesRow}
        >
          {pages.map((page, index) => (
            <TouchableOpacity
              key={page.id}
              style={styles.pageThumb}
              onPress={() => openPage(index)}
              accessibilityRole="button"
              accessibilityLabel={`Open page ${index + 1}`}
            >
              {page.isPdf ? (
                <View style={styles.pagePdf}>
                  <MaterialCommunityIcons name="file-pdf-box" size={28} color={Colors.danger} />
                </View>
              ) : (
                <Image source={{ uri: page.fileUrl }} style={styles.pageImage} resizeMode="cover" />
              )}
              <View style={styles.pageNumber}>
                <Text style={styles.pageNumberText}>{index + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ) : null;

  const renderAnalyzeButton = (label: string) => (
    <TouchableOpacity
      style={[styles.inlineButton, isStarting && styles.inlineButtonDisabled]}
      onPress={startAnalysis}
      disabled={isStarting}
      accessibilityRole="button"
    >
      {isStarting ? (
        <ActivityIndicator size="small" color={Colors.surface} />
      ) : (
        <Text style={styles.inlineButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  const renderAnalysisTab = () => {
    if (status === 'completed') {
      return (
        <View style={styles.section}>
          <View style={styles.aiSummaryContainer}>
            <Text style={styles.aiSummaryText}>
              {report.aiSummary ??
                t('report_analysis.no_summary', 'No summary was generated for this report.')}
            </Text>
          </View>
          <View style={styles.disclaimer} testID="ai-disclaimer">
            <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.primary} />
            <Text style={styles.disclaimerText}>
              {t(
                'report_analysis.disclaimer',
                'AI-generated interpretation, consult your doctor before making any decisions about your health.',
              )}
            </Text>
          </View>
        </View>
      );
    }

    if (status === 'processing') {
      return (
        <View style={[styles.section, styles.stateCard]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.stateBody}>
            {t(
              'report_analysis.in_progress_body',
              'Analysis in progress. This page updates automatically when it is ready.',
            )}
          </Text>
          <TouchableOpacity onPress={() => setProgressDismissed(false)} accessibilityRole="button">
            <Text style={styles.linkText}>
              {t('report_analysis.show_progress', 'Show progress')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (status === 'failed') {
      return (
        <View style={[styles.section, styles.stateCard]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={32} color={Colors.warning} />
          <Text style={styles.stateTitle}>
            {t('report_analysis.failed_title', 'Analysis unavailable')}
          </Text>
          {report.analysisError ? (
            <Text style={styles.stateBody}>{report.analysisError}</Text>
          ) : null}
          <Text style={styles.stateBody}>
            {t(
              'report_analysis.failed_saved',
              'Your original document is saved and can still be viewed.',
            )}
          </Text>
          {renderAnalyzeButton(t('report_analysis.try_again', 'Try Again'))}
        </View>
      );
    }

    return (
      <View style={[styles.section, styles.stateCard]}>
        <MaterialCommunityIcons name="file-search-outline" size={32} color={Colors.primary} />
        <Text style={styles.stateTitle}>
          {t('report_analysis.not_analyzed_title', 'Not analyzed yet')}
        </Text>
        <Text style={styles.stateBody}>
          {t(
            'report_analysis.not_analyzed_body',
            'Analyze this report to get a plain-language summary and the extracted test results.',
          )}
        </Text>
        {renderAnalyzeButton(t('report_review.analyze_report', 'Analyze Report'))}
      </View>
    );
  };

  const renderResultsTab = () => {
    if (labResults.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.emptyBiomarkers}>
            <Text style={styles.emptyBiomarkersText}>
              {status === 'completed'
                ? t('[id].no_specific_biomarkers_were_ex') ||
                  'No specific biomarkers were extracted from this report.'
                : t(
                    'report_analysis.results_pending',
                    'Test results will appear here once the report has been analyzed.',
                  )}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.disclaimer}>
          <MaterialCommunityIcons name="robot-outline" size={18} color={Colors.primary} />
          <Text style={styles.disclaimerText}>
            {t(
              'report_analysis.extracted_note',
              'These values were read from your document by AI. Check them against the original pages, and consult your doctor about what they mean.',
            )}
          </Text>
        </View>

        {groupLabResults(labResults).map((panel, panelIdx) => (
          <View key={`panel-${panelIdx}`} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{panel.panel}</Text>

            {panel.subGroups.map((sg, sgIdx) => (
              <View
                key={`sg-${sgIdx}`}
                style={[
                  styles.subGroupBlock,
                  sgIdx === panel.subGroups.length - 1 && { marginBottom: 0 },
                ]}
              >
                {sg.subGroup ? <Text style={styles.subGroupTitle}>{sg.subGroup}</Text> : null}

                <View style={styles.biomarkerList}>
                  {sg.results.map((result, idx) => (
                    <BiomarkerRow
                      key={result.id}
                      result={result}
                      isLast={idx === sg.results.length - 1}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Wrapper for Status Bar */}
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('[id].report_details') || 'Report Details'}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.lg }}>
        {/* Meta card */}
        <View style={styles.metaCard}>
          <Text style={styles.reportTitle}>{report.title ?? `Record #${report.id}`}</Text>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <MaterialCommunityIcons name="flask-outline" size={18} color={Colors.primary} />
              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>
                  {t('report_analysis.laboratory', 'Laboratory')}
                </Text>
                <Text style={styles.metaValue}>{report.laboratoryName ?? '—'}</Text>
              </View>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>{t('report_analysis.date', 'Date')}</Text>
              <Text style={styles.metaValue}>{displayDate(report)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
            onPress={() => setActiveTab('analysis')}
            activeOpacity={1}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
              {t('report_analysis.tab_analysis', 'Report Analysis')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.tabActive]}
            onPress={() => setActiveTab('results')}
            activeOpacity={1}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
              {t('report_analysis.tab_results', 'Test Results')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'results' && renderPagesStrip()}
        {activeTab === 'analysis' ? renderAnalysisTab() : renderResultsTab()}
      </ScrollView>

      {/* Show Original fixed button at bottom */}
      <View style={[styles.bottomFixedContainer, { paddingBottom: Spacing.base + insets.bottom }]}>
        <TouchableOpacity
          style={styles.showOriginalFullBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View original document"
          onPress={() => openPage(0)}
        >
          <MaterialCommunityIcons name="file-eye-outline" size={18} color={Colors.surface} />
          <Text style={styles.showOriginalFullBtnText}>
            {t('[id].view_original_document') || 'View Original Document'}
          </Text>
        </TouchableOpacity>
      </View>

      <AnalysisProgressModal
        visible={status === 'processing' && !progressDismissed}
        status={status}
        onClose={() => setProgressDismissed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.5,
  },
  errorBackButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorBackButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },

  // Header
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

  // Scroll
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Layout.tabBarHeight + 80 + Spacing.xl,
  },

  // Meta card
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  reportTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.tertiary,
    marginVertical: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.md,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaText: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },

  // Fixed Bottom Button
  bottomFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.tertiary,
  },
  showOriginalFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  showOriginalFullBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },

  // Existing sections
  section: {
    marginBottom: Spacing.xl,
  },
  aiSummaryContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  aiSummaryText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'justify',
    lineHeight: 24,
  },
  biomarkerList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg - 2,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  categoryBlock: {
    marginTop: Spacing.lg,
  },
  categoryTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.lg,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  // AI disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.tertiaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.5,
  },

  // Analysis states (pending / processing / failed)
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stateTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
  inlineButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minWidth: 160,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonDisabled: {
    opacity: 0.6,
  },
  inlineButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },
  linkText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    paddingVertical: Spacing.xs,
  },

  // Original pages strip
  pagesLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  pagesRow: {
    gap: Spacing.sm,
  },
  pageThumb: {
    width: 64,
    height: 84,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surface,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  pagePdf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 4,
  },
  pageNumberText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.surface,
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    padding: 0,
    gap: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: Colors.tertiaryLight,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  tabTextActive: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  subGroupBlock: {
    marginBottom: Spacing.md,
  },
  subGroupTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  emptyBiomarkers: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  emptyBiomarkersText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
});
