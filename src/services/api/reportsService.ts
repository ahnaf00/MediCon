// src/services/api/reportsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Medical Records Service — POST/GET /api/v1/medical-records
// Vitals Service          — POST/GET /api/v1/vitals
//
// NOTE on Report type: The API-fetched type (MedicalRecord) matches exactly what
// MedicalRecordResource returns. The legacy `Report` type in medical.types.ts is
// the card's display shape; the reports tab maps MedicalRecord onto it.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';

// ─── Types (matching MedicalRecordResource & VitalResource exactly) ───────────

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type LabResultStatus = 'low' | 'normal' | 'high' | 'unknown';

export interface MedicalRecordPage {
  id: number;
  order: number;
  isPdf: boolean;
  /** Short-lived signed URL (15 min). Refetch the record before opening a stale one. */
  fileUrl: string;
}

export interface LabResult {
  id: number;
  panel: string;
  subGroup: string | null;
  name: string;
  /** Exactly as printed on the report, e.g. "12.7" or "<5". */
  value: string;
  unit: string | null;
  /** Exactly as printed, including sex-specific ranges ("F 11.5–15.5, M 13.8–18.0"). */
  referenceText: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  status: LabResultStatus;
}

export interface MedicalRecord {
  id: number;
  /** Signed URL of the first page. */
  fileUrl: string;
  title: string | null;
  laboratoryName: string | null;
  /** Calendar date as printed on the report: "YYYY-MM-DD", no timezone. */
  reportDate: string | null;
  analysisStatus: AnalysisStatus;
  /** User-facing reason when analysisStatus is "failed". */
  analysisError: string | null;
  aiSummary: string | null;
  analyzedAt: string | null;
  /** Present on list and detail responses. */
  pageCount?: number;
  pages?: MedicalRecordPage[];
  /** Present on the detail response only. */
  labResults?: LabResult[];
  /** bloodPressure/pulseRate/glucoseLevel/oxygenSaturation are legacy vitals
   * columns on the medical_records table. For file-only uploads they are null. */
  bloodPressure: string | null;
  pulseRate: number | null;
  glucoseLevel: number | null;
  oxygenSaturation: number | null;
  notes: string | null;
  recordedBy: {
    id: number;
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

export interface Vital {
  id: string;
  bloodPressure: string | null;   // "SYS/DIA" format, e.g. "120/80"
  pulseRate: number | null;
  glucoseLevel: number | null;
  oxygenSaturation: number | null;
  loggedAt: string;               // ISO 8601
  createdAt: string;
}

export interface StoreVitalPayload {
  /** Format: "SYS/DIA" — e.g. "120/80". Regex-validated server-side. */
  blood_pressure?: string;
  /** Integer, range 30–220 bpm. */
  pulse_rate?: number;
  /** Decimal, range 0–50 mmol/L. */
  glucose_level?: number;
  /** Integer, range 50–100 %. */
  oxygen_saturation?: number;
  /** ISO 8601. Defaults to now() on the server if omitted. */
  logged_at?: string;
}

export interface UploadRecordPage {
  /** Absolute file URI from expo-image-picker or expo-document-picker. */
  fileUri: string;
  /** Exact MIME type for the multipart boundary. */
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  /** File name sent to the server (e.g. "report.pdf"). */
  fileName: string;
}

export interface UploadRecordPayload {
  /** Pages in display order. 1–10 files. */
  pages: UploadRecordPage[];
  /** Optional patient-added notes about the document. */
  notes?: string;
}

// ─── Medical Records Raw Service ──────────────────────────────────────────────

export const reportsService = {
  /**
   * Goal: Retrieve all medical record documents for the authenticated patient.
   * How: GET /api/v1/medical-records — Sanctum-protected, returns paginated list.
   * The axiosClient interceptor unwraps the top-level Laravel `.data` wrapper;
   * a second `.data` is present if pagination is active, so we handle both.
   */
  getRecords: async (): Promise<MedicalRecord[]> => {
    const res = (await axiosClient.get('/medical-records')) as any;
    return Array.isArray(res) ? res : res?.data ?? [];
  },

  /**
   * Goal: Retrieve a single medical record by its database ID.
   * How: GET /api/v1/medical-records/{id} — controller returns { record: {...} }.
   */
  getRecordById: async (id: number): Promise<MedicalRecord> => {
    const res = (await axiosClient.get(`/medical-records/${id}`)) as any;
    return res?.record ?? res;
  },

  /**
   * Goal: Upload a new multi-page medical document (PDF, JPEG, or PNG pages).
   * How: POST /api/v1/medical-records — multipart/form-data.
   *      Each page goes under "files[]", in order. Accepted: pdf, jpg, jpeg, png.
   *      Max 10 pages, 10 MB each.
   *      Content-Type header is overridden so Axios sets the correct multipart boundary.
   * The controller returns { message, record: { id, fileUrl, pages, ... } }.
   */
  uploadRecord: async ({ pages, notes }: UploadRecordPayload): Promise<MedicalRecord> => {
    const formData = new FormData();
    for (const page of pages) {
      // React Native requires this exact object shape for native file appending
      formData.append('files[]', {
        uri: page.fileUri,
        type: page.mimeType,
        name: page.fileName,
      } as any);
    }
    if (notes) {
      formData.append('notes', notes);
    }

    const res = (await axiosClient.post('/medical-records', formData, {
      // CRITICAL: We must delete the default 'application/json' header.
      // Do NOT set 'Content-Type': 'multipart/form-data' explicitly here, because
      // Axios will strip the boundary string required by the server. React Native
      // will auto-attach the correct boundary if we leave Content-Type empty.
      transformRequest: (data, headers) => {
        delete headers['Content-Type'];
        return data;
      },
    })) as any;
    return res?.record ?? res;
  },

  /**
   * Goal: Queue AI extraction of lab results and a summary for an uploaded record.
   * How: POST /api/v1/medical-records/{id}/analyze — returns 202 with
   *      { message, record } where record.analysisStatus is "processing"
   *      (or already "completed"/"failed" when the server runs the job inline).
   * The original upload is never modified, whatever the outcome.
   */
  analyzeRecord: async (id: number): Promise<MedicalRecord> => {
    const res = (await axiosClient.post(`/medical-records/${id}/analyze`)) as any;
    return res?.record ?? res;
  },

  /**
   * Goal: Permanently delete a medical record by ID.
   * How: DELETE /api/v1/medical-records/{id}.
   */
  deleteRecord: async (id: number): Promise<void> => {
    await axiosClient.delete(`/medical-records/${id}`);
  },
};

// ─── Vitals Raw Service ───────────────────────────────────────────────────────

export const vitalsService = {
  /**
   * Goal: Retrieve all vital readings for the authenticated user, descending order.
   * How: GET /api/v1/vitals — Sanctum-protected.
   */
  getVitals: async (): Promise<Vital[]> => {
    const res = (await axiosClient.get('/vitals')) as any;
    return Array.isArray(res) ? res : res?.data ?? [];
  },

  /**
   * Goal: Log a new vital reading (blood pressure, pulse, glucose, or O2).
   * How: POST /api/v1/vitals — at least ONE of the four numeric fields must be present.
   *      blood_pressure must match "SYS/DIA" regex (e.g. "120/80").
   * The controller returns { message, vital: { id, bloodPressure, ... } }.
   */
  storeVital: async (payload: StoreVitalPayload): Promise<Vital> => {
    const res = (await axiosClient.post('/vitals', payload)) as any;
    return res?.vital ?? res;
  },
};

// ─── TanStack Query v5 Hooks — Medical Records ────────────────────────────────

/** Fetch and cache the list of the current patient's medical record documents. */
export const useMedicalRecords = () =>
  useQuery({
    queryKey: ['medical-records'],
    queryFn: reportsService.getRecords,
  });

/** How often the detail screen re-checks a record while its analysis runs. */
export const ANALYSIS_POLL_MS = 2000;

/**
 * Fetch a single medical record by ID. Only runs when id is truthy.
 * Polls while the server reports the analysis as "processing".
 */
export const useMedicalRecord = (id: number) =>
  useQuery({
    queryKey: ['medical-records', id],
    queryFn: () => reportsService.getRecordById(id),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.analysisStatus === 'processing' ? ANALYSIS_POLL_MS : false,
  });

/**
 * Start (or retry) analysis of a record. Seeds the detail cache with the
 * returned record so polling starts immediately, and refreshes the list.
 */
export const useAnalyzeRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsService.analyzeRecord,
    onSuccess: (record) => {
      qc.setQueryData(['medical-records', record.id], (old: MedicalRecord | undefined) => ({
        ...old,
        ...record,
      }));
      qc.invalidateQueries({ queryKey: ['medical-records'], exact: true });
    },
  });
};

/**
 * Upload a new medical record file.
 * Automatically invalidates the records list cache on success so the
 * UI refreshes without a manual reload.
 */
export const useUploadRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsService.uploadRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-records'] });
    },
  });
};

/** Delete a medical record. Invalidates the list cache on success. */
export const useDeleteRecord = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportsService.deleteRecord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-records'] });
    },
  });
};

// ─── TanStack Query v5 Hooks — Vitals ────────────────────────────────────────

/** Fetch and cache all vital readings for the current user. */
export const useVitals = () =>
  useQuery({
    queryKey: ['vitals'],
    queryFn: vitalsService.getVitals,
  });

/**
 * Log a new vital reading.
 * Automatically invalidates the vitals cache on success so the
 * chart/list refreshes with the new data point.
 */
export const useStoreVital = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vitalsService.storeVital,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals'] });
    },
  });
};
