// src/services/files/downloadService.ts
// Prescription downloads.
//   - PDF: rendered by the API (GET /prescriptions/{id}/download), downloaded with the
//     auth header into the app cache, then handed to the system share sheet so the
//     user can open, print or save it.
//   - Image: captured on the device from the on-screen PrescriptionDocument (the
//     server cannot rasterise), then saved to the photo library.
// Every failure throws a DownloadError with a message that can be shown as-is.
import type { RefObject } from 'react';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';

export class DownloadError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'DownloadError';
  }
}

const prescriptionsDir = (): Directory => {
  const dir = new Directory(Paths.cache, 'prescriptions');
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};

export const downloadService = {
  /** Download the server-rendered PDF and open the share sheet. */
  sharePrescriptionPdf: async (prescriptionId: number | string): Promise<void> => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new DownloadError('You are signed out. Sign in again to download this prescription.');
    }

    let file: File;
    try {
      // The filename comes from the server's Content-Disposition header.
      file = await File.downloadFileAsync(
        `${Config.API.BASE_URL}/prescriptions/${prescriptionId}/download?format=pdf`,
        prescriptionsDir(),
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
          idempotent: true,
        },
      );
    } catch (err) {
      throw new DownloadError(
        'Could not download the prescription PDF. Check your connection and try again.',
        err,
      );
    }

    if (!(await Sharing.isAvailableAsync())) {
      throw new DownloadError('Sharing is not available on this device.');
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Save or share prescription',
    });
  },

  /** Capture the rendered document view as a PNG and save it to the gallery. */
  savePrescriptionImage: async (documentRef: RefObject<unknown>): Promise<void> => {
    const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
    if (!permission.granted) {
      throw new DownloadError(
        'Allow photo access in Settings to save the prescription to your gallery.',
      );
    }

    let uri: string;
    try {
      uri = await captureRef(documentRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch (err) {
      throw new DownloadError('Could not create the prescription image. Please try again.', err);
    }

    try {
      await MediaLibrary.Asset.create(uri);
    } catch (err) {
      throw new DownloadError(
        'Could not save the image to your gallery. Check free space and try again.',
        err,
      );
    }
  },
};
