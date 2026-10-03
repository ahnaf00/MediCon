import { MAX_REPORT_PAGES, useReportDraftStore } from '../reportDraftStore';
import type { UploadRecordPage } from '../../services/api/reportsService';

const page = (n: number): UploadRecordPage => ({
  fileUri: `file:///page-${n}.jpg`,
  mimeType: 'image/jpeg',
  fileName: `page-${n}.jpg`,
});

describe('reportDraftStore', () => {
  beforeEach(() => useReportDraftStore.getState().clear());

  it('adds pages in order and removes by index', () => {
    const store = useReportDraftStore.getState();
    store.addPages([page(1), page(2), page(3)]);
    store.removePage(1);

    expect(useReportDraftStore.getState().pages.map((p) => p.fileName)).toEqual([
      'page-1.jpg',
      'page-3.jpg',
    ]);
  });

  it('caps the draft at the page limit and reports what did not fit', () => {
    const store = useReportDraftStore.getState();
    store.addPages(Array.from({ length: MAX_REPORT_PAGES - 1 }, (_, i) => page(i)));

    const skipped = store.addPages([page(100), page(101), page(102)]);

    expect(skipped).toBe(2);
    expect(useReportDraftStore.getState().pages).toHaveLength(MAX_REPORT_PAGES);
  });

  it('clears the draft', () => {
    useReportDraftStore.getState().addPages([page(1)]);
    useReportDraftStore.getState().clear();

    expect(useReportDraftStore.getState().pages).toEqual([]);
  });
});
