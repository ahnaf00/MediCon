// src/services/files/reportPicker.ts
// Picks report pages from the gallery or the file system, shaped for the upload draft.
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { UploadRecordPage } from '../api/reportsService';

/**
 * Multi-select images from the photo library. Resolves to [] when cancelled
 * or when permission is refused (the user is told why).
 */
export async function pickReportImages(limit: number): Promise<UploadRecordPage[]> {
  if (limit <= 0) return [];

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission Denied', 'You need to allow access to your photos to upload a report.');
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: limit,
    orderedSelection: true,
    quality: 0.8,
  });
  if (result.canceled || !result.assets) return [];

  return result.assets.slice(0, limit).map((asset, i) => {
    const isPng = asset.mimeType === 'image/png';
    return {
      fileUri: asset.uri,
      mimeType: isPng ? 'image/png' : 'image/jpeg',
      fileName: asset.fileName || `page-${Date.now()}-${i + 1}.${isPng ? 'png' : 'jpg'}`,
    };
  });
}

/** Multi-select PDF documents. Resolves to [] when cancelled. */
export async function pickReportPdfs(limit: number): Promise<UploadRecordPage[]> {
  if (limit <= 0) return [];

  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets) return [];

  const pdfs = result.assets.filter((file) => file.mimeType?.includes('pdf'));
  if (pdfs.length < result.assets.length) {
    Alert.alert('Unsupported File', 'Only PDF documents and images can be uploaded.');
  }

  return pdfs.slice(0, limit).map((file) => ({
    fileUri: file.uri,
    mimeType: 'application/pdf',
    fileName: file.name,
  }));
}
