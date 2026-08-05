import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter, Tabs, useFocusEffect } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { Report } from '../../../src/types/medical.types';
import { reportsService } from '../../../src/services/api/reportsService';
import { ReportCard } from '../../../src/components/medical/ReportCard';
import { createAppError, AppError } from '../../../src/utils/errors';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { useTranslation } from 'react-i18next';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Unified Options & Rename modal states

  // Speed Dial FAB state
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [fabAnimation] = useState(() => new Animated.Value(0));

  const toggleFab = () => {
    const toValue = isFabOpen ? 0 : 1;
    setIsFabOpen(!isFabOpen);
    Animated.spring(fabAnimation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePickImage = async () => {
    toggleFab();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'You need to allow access to your photos to upload a report.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        router.push({
          pathname: '/(app)/report/upload',
          params: {
            uri: result.assets[0].uri,
            type: 'image',
            name: result.assets[0].fileName || `image-${Date.now()}.jpg`,
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', String(err));
    }
  };

  const handlePickDocument = async () => {
    toggleFab();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (!file.mimeType?.includes('pdf')) {
          Alert.alert('Unsupported File', 'Please upload a valid PDF document or Image.');
          return;
        }

        router.push({
          pathname: '/(app)/report/upload',
          params: {
            uri: file.uri,
            type: 'pdf',
            name: file.name,
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', String(err));
    }
  };

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [renameMode, setRenameMode] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [panY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (optionsVisible) {
      panY.setValue(0);
    }
  }, [optionsVisible, panY]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const [handlePanResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          setOptionsVisible(false);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  );

  const loadReports = useCallback(async () => {
    try {
      const data = await reportsService.getReports();
      setReports(data);
    } catch (err) {
      setError(createAppError('NETWORK_ERROR', String(err)));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        setLoading(true);
        await loadReports();
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }, [loadReports]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleOptionsPress = (report: Report) => {
    setSelectedReport(report);
    setNewTitle(report.title);
    setRenameMode(false);
    setOptionsVisible(true);
  };

  const confirmDelete = () => {
    if (!selectedReport) return;
    setOptionsVisible(false);
    // Standard OS alert is retained for the final destructive confirmation
    Alert.alert(
      'Delete Report',
      `Are you sure you want to delete "${selectedReport.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await reportsService.deleteReport(selectedReport.id);
              await loadReports();
            } catch {
              Alert.alert('Error', 'Failed to delete report.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRename = async () => {
    if (!selectedReport || !newTitle.trim()) return;
    try {
      setIsUpdating(true);
      await reportsService.updateReport(selectedReport.id, { title: newTitle.trim() });
      await loadReports();
      setOptionsVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to rename report.');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderEmptyComponent = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={48}
          color={Colors.textTertiary}
        />
        <Text style={styles.emptyTitle}>{t('reports.no_reports_yet', 'No Reports Yet')}</Text>
        <Text style={styles.emptySubtitle}>
          {t('reports.upload_or_scan_your_lab_report', 'Upload or scan your lab reports and medical documents to get AI-powered interpretations and track your health metrics.')}
        </Text>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={toggleFab}
          accessibilityRole="button"
          accessibilityLabel="Upload a report"
        >
          <MaterialCommunityIcons name="upload" size={16} color={Colors.surface} />
          <Text style={styles.uploadBtnText}>Upload Report</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />

      {/* Header Wrapper for Status Bar */}
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.lg,
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
          <Text style={styles.headerTitle}>{t('reports.my_reports', 'My Reports')}</Text>
        </View>
      </View>

      {/* List */}
      <View style={styles.listWrapper}>
        {loading && !refreshing && !error ? (
          <View style={styles.centeredFlex}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centeredFlex}>
            <ErrorState message={error.message} onRetry={loadReports} />
          </View>
        ) : (
          <FlashList
            data={reports}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.cardWrapper,
                  // Add right margin to left-column cards, left margin to right-column cards
                  index % 2 === 0 ? { marginRight: Spacing.xs } : { marginLeft: Spacing.xs },
                ]}
              >
                <ReportCard
                  report={item}
                  onPress={() => router.push(`/(app)/report/${item.id}`)}
                  onOptionsPress={handleOptionsPress}
                />
              </View>
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Spacing.xl + 80 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Upload FAB / Speed Dial */}
      {reports.length > 0 && (
        <>
          {isFabOpen && (
            <TouchableOpacity
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 9 },
              ]}
              activeOpacity={1}
              onPress={toggleFab}
            />
          )}
          <View style={[styles.speedDialContainer, { bottom: Spacing.base + insets.bottom }]}>
            {isFabOpen && (
              <View style={styles.miniFabContainer}>
                <TouchableOpacity style={styles.miniFab} onPress={handlePickDocument}>
                  <Text style={styles.miniFabLabel}>Upload PDF</Text>
                  <View style={[styles.miniFabIcon, { backgroundColor: '#FDECEE' }]}>
                    <MaterialCommunityIcons name="file-document" size={24} color={Colors.danger} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.miniFab} onPress={handlePickImage}>
                  <Text style={styles.miniFabLabel}>Gallery Image</Text>
                  <View style={[styles.miniFabIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MaterialCommunityIcons name="image" size={24} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.fab}
              onPress={toggleFab}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isFabOpen ? 'Close menu' : 'Upload a new report'}
            >
              <MaterialCommunityIcons
                name={isFabOpen ? 'close' : 'plus'}
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.fabText}>{isFabOpen ? 'Close' : 'Upload'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Options Modal */}
      <Modal
        visible={optionsVisible && !renameMode}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            onPress={() => setOptionsVisible(false)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
          />
          <Animated.View
            style={[
              styles.modalContent,
              { paddingBottom: insets.bottom + Spacing.lg },
              {
                transform: [
                  {
                    translateY: panY.interpolate({
                      inputRange: [0, 1000],
                      outputRange: [0, 1000],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.dragArea} {...handlePanResponder.panHandlers}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={styles.sheetHeader}>
              <Text style={styles.modalTitle}>Options</Text>
              <TouchableOpacity
                onPress={() => setOptionsVisible(false)}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setRenameMode(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconBg}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.optionText}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, styles.optionRowLast]}
              onPress={confirmDelete}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconBg, styles.optionIconBgDestructive]}>
                <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.emergency} />
              </View>
              <Text style={[styles.optionText, styles.optionTextDestructive]}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rename Popup Modal */}
      <Modal
        visible={optionsVisible && renameMode}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={[
            styles.popupModalOverlay,
            { justifyContent: isKeyboardVisible ? 'flex-end' : 'center' },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.popupModalContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.modalTitle}>Rename Report</Text>
            </View>

            <TextInput
              style={styles.textInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new report name"
              autoFocus
              editable={!isUpdating}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setOptionsVisible(false)}
                disabled={isUpdating}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={handleRename}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
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

  // ── List ─────────────────────────────────────────────────────────────────────
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl + 80, // Space for FAB
  },
  cardWrapper: {
    flex: 1,
    marginBottom: Spacing.sm,
  },

  // ── Empty states ─────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.5,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    minHeight: 44,
  },
  uploadBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
    lineHeight: FontSize.base * 1.5,
  },

  // ── Speed Dial FAB ──────────────────────────────────────────────────────
  speedDialContainer: {
    position: 'absolute',
    right: Spacing.base,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  miniFabContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  miniFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  miniFabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  miniFabIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    height: 56,
    justifyContent: 'center',
  },
  fabText: {
    marginLeft: Spacing.xs,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },

  // ── Shared utilities ──────────────────────────────────────────────────────────
  centeredFlex: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Modal / Bottom Sheet ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  popupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
  },
  popupModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
  },
  dragArea: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  modalBtnCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  modalBtnSave: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  modalBtnSaveText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.surface,
  },

  // ── Options List inside Bottom Sheet ────────────────────────────────────────
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiaryLight,
  },
  optionRowLast: {
    borderBottomWidth: 0,
    marginBottom: Spacing.sm,
  },
  optionIconBg: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconBgDestructive: {
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  optionTextDestructive: {
    color: Colors.emergency,
  },
});
