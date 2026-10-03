import { create } from 'zustand';
import type { UploadRecordPage } from '../services/api/reportsService';

/** Matches the backend limit on `files[]`. */
export const MAX_REPORT_PAGES = 10;

/**
 * Pages staged for a report upload, before they are sent to the server.
 * Ephemeral UI state only: not persisted, cleared once the upload succeeds.
 */
interface ReportDraftStore {
  pages: UploadRecordPage[];
  /** Appends pages up to the limit; returns how many did not fit. */
  addPages: (pages: UploadRecordPage[]) => number;
  removePage: (index: number) => void;
  clear: () => void;
}

export const useReportDraftStore = create<ReportDraftStore>((set, get) => ({
  pages: [],
  addPages: (pages) => {
    const room = MAX_REPORT_PAGES - get().pages.length;
    const accepted = pages.slice(0, Math.max(0, room));
    set((state) => ({ pages: [...state.pages, ...accepted] }));
    return pages.length - accepted.length;
  },
  removePage: (index) => set((state) => ({ pages: state.pages.filter((_, i) => i !== index) })),
  clear: () => set({ pages: [] }),
}));
