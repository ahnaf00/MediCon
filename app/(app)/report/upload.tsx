import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../../src/theme';
import { reportsService } from '../../../src/services/api/reportsService';
import { createAppError } from '../../../src/utils/errors';
import { useTranslation } from 'react-i18next';

export default function UploadReportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(() => {
    if (params.uri && typeof params.uri === 'string') {
      return {
        uri: params.uri,
        type: typeof params.type === 'string' ? params.type : 'image',
        name: typeof params.name === 'string' ? params.name : 'upload',
      };
    }
    return null;
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickImage = async () => {
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
        setSelectedFile({
          uri: result.assets[0].uri,
          type: 'image',
          name: result.assets[0].fileName || `image-${Date.now()}.jpg`,
        });
      }
    } catch (err) {
      const appError = createAppError('UNKNOWN_ERROR', String(err));
      Alert.alert('Error', appError.message);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Rejection messaging for unsupported files
        if (!file.mimeType?.includes('pdf')) {
          Alert.alert('Unsupported File', 'Please upload a valid PDF document or Image.');
          return;
        }

        setSelectedFile({
          uri: file.uri,
          type: 'pdf',
          name: file.name,
        });
      }
    } catch (err) {
      const appError = createAppError('UNKNOWN_ERROR', String(err));
      Alert.alert('Error', appError.message);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      // Mock upload and AI interpretation delay
      const parsedReport = await reportsService.uploadReport(
        selectedFile.uri,
        selectedFile.type,
        selectedFile.name,
      );

      // Navigate to the newly created report detail screen
      router.replace(`/(app)/report/${parsedReport.id}`);
    } catch {
      Alert.alert('Upload Failed', 'There was an error processing your report. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDiscard = () => {
    setSelectedFile(null);
  };

  // ----------------------------------------------------
  // Render loading state (simulating AI interpretation)
  // ----------------------------------------------------
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.processingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.processingTitle}>
          {t('upload.analyzing_report') || 'Analyzing Report...'}
        </Text>
        <Text style={styles.processingSubtitle}>
          {t('upload.our_ai_is_scanning_the_documen') ||
            'Our AI is scanning the document and extracting the clinical biomarkers. This may take a few seconds.'}
        </Text>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // Render file preview (Non-destructive re-upload flow)
  // ----------------------------------------------------
  if (selectedFile) {
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
            <TouchableOpacity onPress={handleDiscard} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t('upload.review_document') || 'Review Document'}
            </Text>
          </View>
        </View>

        <View style={styles.previewContainer}>
          {selectedFile.type === 'image' ? (
            <Image
              source={{ uri: selectedFile.uri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.pdfPreview}>
              <MaterialCommunityIcons name="file-pdf-box" size={80} color={Colors.danger} />
              <Text style={styles.fileName}>{selectedFile.name}</Text>
            </View>
          )}
        </View>

        <View style={[styles.actionContainer, { paddingBottom: Spacing.xl + insets.bottom }]}>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleDiscard}>
            <Text style={styles.secondaryButtonText}>
              {t('upload.choose_different_report') || 'Choose Different Report'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>{t('upload.continue') || 'Continue'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ----------------------------------------------------
  // Render Selection screen
  // ----------------------------------------------------
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
  processingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  processingTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
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
  previewContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  pdfPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.tertiary,
    borderStyle: 'dashed',
    padding: Spacing.xl,
  },
  fileName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  actionContainer: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  button: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.surface,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.textTertiary,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});
