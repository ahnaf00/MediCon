import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

import { downloadService, DownloadError } from '../downloadService';
import { useAuthStore } from '../../../store/authStore';

jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache/' },
  Directory: jest.fn().mockImplementation(() => ({ create: jest.fn() })),
  File: { downloadFileAsync: jest.fn() },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  Asset: { create: jest.fn() },
}));
jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn() }));
jest.mock('../../../constants/config', () => ({
  Config: { API: { BASE_URL: 'https://api.example.test/api/v1' } },
}));
jest.mock('../../../store/authStore', () => ({
  useAuthStore: { getState: jest.fn() },
}));

const mockToken = (token: string | null) =>
  (useAuthStore.getState as jest.Mock).mockReturnValue({ token });

beforeEach(() => {
  jest.clearAllMocks();
  mockToken('secret-token');
});

describe('sharePrescriptionPdf', () => {
  it('downloads with the bearer token and opens the share sheet', async () => {
    (File.downloadFileAsync as jest.Mock).mockResolvedValue({
      uri: 'file:///cache/prescriptions/rx.pdf',
    });
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    await downloadService.sharePrescriptionPdf(42);

    expect(File.downloadFileAsync).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/prescriptions/42/download?format=pdf',
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer secret-token' }),
        idempotent: true,
      }),
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///cache/prescriptions/rx.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' }),
    );
  });

  it('surfaces a readable error when the download fails', async () => {
    (File.downloadFileAsync as jest.Mock).mockRejectedValue(new Error('UnableToDownload: 403'));

    await expect(downloadService.sharePrescriptionPdf(42)).rejects.toBeInstanceOf(DownloadError);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('refuses to download without a session', async () => {
    mockToken(null);

    await expect(downloadService.sharePrescriptionPdf(42)).rejects.toThrow(/signed out/);
    expect(File.downloadFileAsync).not.toHaveBeenCalled();
  });
});

describe('savePrescriptionImage', () => {
  const ref = { current: {} };

  it('captures the document as PNG and saves it to the gallery', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (captureRef as jest.Mock).mockResolvedValue('file:///tmp/rx.png');

    await downloadService.savePrescriptionImage(ref);

    expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalledWith(true, ['photo']);
    expect(captureRef).toHaveBeenCalledWith(ref, expect.objectContaining({ format: 'png' }));
    expect(MediaLibrary.Asset.create).toHaveBeenCalledWith('file:///tmp/rx.png');
  });

  it('stops before capturing when photo permission is denied', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: false });

    await expect(downloadService.savePrescriptionImage(ref)).rejects.toThrow(/photo access/);
    expect(captureRef).not.toHaveBeenCalled();
  });

  it('surfaces a readable error when saving fails', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (captureRef as jest.Mock).mockResolvedValue('file:///tmp/rx.png');
    (MediaLibrary.Asset.create as jest.Mock).mockRejectedValue(new Error('disk full'));

    await expect(downloadService.savePrescriptionImage(ref)).rejects.toThrow(/gallery/);
  });
});
