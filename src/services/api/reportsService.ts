// src/services/api/reportsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Medical Records Service — POST/GET /api/v1/medical-records
// Vitals Service          — POST/GET /api/v1/vitals
//
// NOTE on Report type: The backend MedicalRecordResource does NOT return
// biomarkers[], aiSummary, thumbnails[], or laboratory. Those fields were
// frontend-only mock fields. The API-fetched type (MedicalRecord) matches
// exactly what the backend returns. The legacy `Report` type in medical.types.ts
// is preserved separately for any screens that still render local mock data.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';

// ─── Types (matching MedicalRecordResource & VitalResource exactly) ───────────

export interface MedicalRecord {
  id: number;
  fileUrl: string;
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

export interface UploadRecordPayload {
  /** Absolute file URI from expo-image-picker or expo-document-picker. */
  fileUri: string;
  /** Exact MIME type for the multipart boundary. */
  mimeType: 'image/jpeg' | 'image/png' | 'application/pdf';
  /** File name sent to the server (e.g. "report.pdf"). */
  fileName: string;
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
   * Goal: Upload a new medical document (PDF, JPEG, or PNG) for the patient.
   * How: POST /api/v1/medical-records — multipart/form-data.
   *      File field key MUST be "file". Accepted: pdf, jpg, jpeg, png. Max: 10 MB.
   *      Content-Type header is overridden so Axios sets the correct multipart boundary.
   * The controller returns { message, record: { id, fileUrl, ... } }.
   */
  uploadRecord: async ({ fileUri, mimeType, fileName, notes }: UploadRecordPayload): Promise<MedicalRecord> => {
    const formData = new FormData();
    // React Native requires this exact object shape for native file appending
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as any);
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

/** Fetch a single medical record by ID. Only runs when id is truthy. */
export const useMedicalRecord = (id: number) =>
  useQuery({
    queryKey: ['medical-records', id],
    queryFn: () => reportsService.getRecordById(id),
    enabled: !!id,
  });

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
