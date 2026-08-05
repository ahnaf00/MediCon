import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius, Layout } from '../../../src/theme';
import { reportsService } from '../../../src/services/api/reportsService';
import { Report } from '../../../src/types/medical.types';
import { BiomarkerRow } from '../../../src/components/medical/BiomarkerRow';
import { useTranslation } from 'react-i18next';

export default function ReportDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  type ActiveTab = 'analysis' | 'results';
  const [activeTab, setActiveTab] = useState<ActiveTab>('analysis');

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!id) throw new Error('No report ID provided');
        const data = await reportsService.getReportDetails(id);
        setReport(data);
      } catch {
        setError('Failed to load report details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>{error || 'Report not found.'}</Text>
        <TouchableOpacity style={styles.errorBackButton} onPress={() => router.back()}>
          <Text style={styles.errorBackButtonText}>{t('[id].go_back') || 'Go Back'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(report.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
          <Text style={styles.reportTitle}>{report.title}</Text>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <MaterialCommunityIcons name="flask-outline" size={18} color={Colors.primary} />
              <View style={styles.metaText}>
                <Text style={styles.metaLabel}>Laboratory</Text>
                <Text style={styles.metaValue}>{report.laboratory || 'Unknown Laboratory'}</Text>
              </View>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
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
              Report Analysis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.tabActive]}
            onPress={() => setActiveTab('results')}
            activeOpacity={1}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
              Test Results
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'results' && (
          <View style={styles.section}>
            {report.biomarkers && report.biomarkers.length > 0 ? (
              (() => {
                const groupedData: {
                  category: string;
                  testGroups: {
                    testGroup: string;
                    subGroups: {
                      subGroup: string;
                      biomarkers: typeof report.biomarkers;
                    }[];
                  }[];
                }[] = [];

                report.biomarkers.forEach((b) => {
                  const catName = b.category || 'General';
                  const testName = b.testGroup || 'Tests';
                  const subName = b.subGroup || 'All';

                  let catObj = groupedData.find((c) => c.category === catName);
                  if (!catObj) {
                    catObj = { category: catName, testGroups: [] };
                    groupedData.push(catObj);
                  }

                  let testObj = catObj.testGroups.find((t) => t.testGroup === testName);
                  if (!testObj) {
                    testObj = { testGroup: testName, subGroups: [] };
                    catObj.testGroups.push(testObj);
                  }

                  let subObj = testObj.subGroups.find((s) => s.subGroup === subName);
                  if (!subObj) {
                    subObj = { subGroup: subName, biomarkers: [] };
                    testObj.subGroups.push(subObj);
                  }

                  subObj.biomarkers.push(b);
                });

                return (
                  <View>
                    {groupedData.map((cat, catIdx) => (
                      <View
                        key={`cat-${catIdx}`}
                        style={[styles.categoryBlock, catIdx === 0 && { marginTop: 0 }]}
                      >
                        {cat.category !== 'General' && (
                          <Text style={styles.categoryTitle}>{cat.category}</Text>
                        )}

                        {cat.testGroups.map((tg, tgIdx) => (
                          <View
                            key={`tg-${tgIdx}`}
                            style={[
                              styles.testGroupBlock,
                              tgIdx === cat.testGroups.length - 1 && { marginBottom: 0 },
                            ]}
                          >
                            {tg.testGroup !== 'Tests' && (
                              <Text style={styles.testGroupTitle}>{tg.testGroup}</Text>
                            )}

                            {tg.subGroups.map((sg, sgIdx) => (
                              <View
                                key={`sg-${sgIdx}`}
                                style={[
                                  styles.subGroupBlock,
                                  sgIdx === tg.subGroups.length - 1 && { marginBottom: 0 },
                                ]}
                              >
                                {sg.subGroup !== 'All' && (
                                  <Text style={styles.subGroupTitle}>{sg.subGroup}</Text>
                                )}

                                <View style={styles.biomarkerList}>
                                  {sg.biomarkers.map((b, bIdx) => (
                                    <BiomarkerRow
                                      key={b.id}
                                      biomarker={b}
                                      isLast={bIdx === sg.biomarkers.length - 1}
                                    />
                                  ))}
                                </View>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              })()
            ) : (
              <View style={styles.emptyBiomarkers}>
                <Text style={styles.emptyBiomarkersText}>
                  {t('[id].no_specific_biomarkers_were_ex') ||
                    'No specific biomarkers were extracted from this report.'}
                </Text>
              </View>
            )}
          </View>
        )}
        {activeTab === 'analysis' && report.aiSummary && (
          <View style={styles.section}>
            <View style={styles.aiSummaryContainer}>
              <Text style={styles.aiSummaryText}>{report.aiSummary}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Show Original fixed button at bottom */}
      <View style={[styles.bottomFixedContainer, { paddingBottom: Spacing.base + insets.bottom }]}>
        <TouchableOpacity
          style={styles.showOriginalFullBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View original document"
        >
          <MaterialCommunityIcons name="file-eye-outline" size={18} color={Colors.surface} />
          <Text style={styles.showOriginalFullBtnText}>
            {t('[id].view_original_document') || 'View Original Document'}
          </Text>
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
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  aiSummaryContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  aiSummaryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primary,
    marginBottom: Spacing.md,
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

  testGroupBlock: {
    marginBottom: Spacing.md,
  },
  testGroupTitle: {
    fontFamily: FontFamily.bold,
    fontWeight: 'bold',
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
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
