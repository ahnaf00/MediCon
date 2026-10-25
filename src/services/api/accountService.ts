// src/services/api/accountService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Account deletion, restore and data export (audit L3).
//   POST   /user/me/deletion-code        → sends a code to the account's phone
//   DELETE /user/me { otp }              → soft-deletes; 30 days to restore
//   POST   /auth/restore-account { restore_token } → signs back in
//   GET    /user/me/export               → JSON file of the person's data
// ─────────────────────────────────────────────────────────────────────────────
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { axiosClient } from './axiosClient';
import { Config } from '../../constants/config';
import { useAuthStore } from '../../store/authStore';
import { DownloadError } from '../files/downloadService';

export interface SignedIn {
  token: string;
  user: { id: number | string; role: any; status: any };
}

export const accountService = {
  sendDeletionCode: async (): Promise<void> => {
    await axiosClient.post('/user/me/deletion-code');
  },

  /** Returns when the account will be removed for good (ISO date). */
  deleteAccount: async (otp: string): Promise<string | null> => {
    const res: any = await axiosClient.delete('/user/me', { data: { otp } });
    return res?.purgeAt ?? null;
  },

  restore: async (restoreToken: string): Promise<SignedIn> => {
    const res: any = await axiosClient.post('/auth/restore-account', {
      restore_token: restoreToken,
    });
    return { token: res.access_token, user: res.user };
  },

  /** Downloads the data export and opens the share sheet to save it. */
  shareMyData: async (): Promise<void> => {
    const token = useAuthStore.getState().token;
    if (!token) throw new DownloadError('You are signed out. Sign in again.');

    const dir = new Directory(Paths.cache, 'exports');
    dir.create({ idempotent: true, intermediates: true });

    let file: File;
    try {
      file = await File.downloadFileAsync(`${Config.API.BASE_URL}/user/me/export`, dir, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        idempotent: true,
      });
    } catch (err) {
      throw new DownloadError(
        'Could not download your data. Check your connection and try again.',
        err,
      );
    }

    if (!(await Sharing.isAvailableAsync())) {
      throw new DownloadError('Sharing is not available on this device.');
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your MediCon data',
    });
  },
};

/** A date like "24 Nov 2026" for the restore deadline. */
export const formatPurgeDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    : 'in 30 days';
