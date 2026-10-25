// src/services/api/adminSystemService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin dashboard step 3 (audit L2b), admin accounts only:
//   GET  /admin/hospitals?q=&status=active|hidden|all · GET /admin/hospitals/{id}
//   POST /admin/hospitals · PUT /admin/hospitals/{id}
//   POST /admin/hospitals/{id}/deactivate { reason } · POST /admin/hospitals/{id}/reactivate
//   GET  /admin/system/ai-usage          → AI calls per Dhaka day and per feature
//   GET  /admin/system/transcripts/failed · POST /admin/system/transcripts/{id}/retry
//   GET  /admin/system/failed-jobs · POST …/failed-jobs/{id}/retry · DELETE …/failed-jobs/{id}
// Hospitals are hidden, never deleted. System health shows that something
// failed, never what it was about.
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { getAllPages } from './pagination';
import { ADMIN_KEY, useAdminMutation } from './adminService';

export interface AdminHospital {
  id: number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  emergencyPhone: string;
  is247: boolean;
  /** False when hidden from patients. */
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** What the server validates, in its field names. */
export interface HospitalInput {
  name: string;
  address: string;
  emergency_phone: string;
  is_24_7: boolean;
  latitude: number | null;
  longitude: number | null;
}

export type HospitalFilter = 'active' | 'hidden' | 'all';

export type AiFeature =
  | 'chat'
  | 'symptom_check'
  | 'report_analysis'
  | 'medicine_explainer'
  | 'call_transcription'
  | 'call_summary'
  | 'consultation_chat'
  | 'other';

export const AI_FEATURE_LABEL: Record<AiFeature, string> = {
  chat: 'AI chat',
  symptom_check: 'Symptom search',
  report_analysis: 'Report analysis',
  medicine_explainer: 'Medicine explanations',
  call_transcription: 'Call transcription',
  call_summary: 'Call summaries',
  consultation_chat: 'Questions about a visit',
  other: 'Other',
};

export interface AiUsage {
  /** Oldest first; `date` is a Dhaka calendar day. */
  days: { date: string; total: number; failed: number }[];
  features: { feature: AiFeature; total: number; failed: number; averageMs: number | null }[];
  today: { date: string; total: number; failed: number };
  /** When counting started; null before the first AI call. */
  countingSince: string | null;
  retentionDays: number;
}

export interface FailedTranscript {
  id: number;
  visitId: number;
  visitAt: string | null;
  doctor: string | null;
  /** A short plain reason, never transcript text. */
  error: string | null;
  failedAt: string | null;
  canRetry: boolean;
}

export interface FailedJob {
  id: string;
  /** Class name only, e.g. "AnalyzeReportJob". */
  job: string;
  queue: string;
  /** Exception class only; the full error stays in the server log. */
  error: string;
  failedAt: string | null;
}

export const adminSystemService = {
  hospitals: async ({
    q,
    status,
  }: {
    q?: string;
    status: HospitalFilter;
  }): Promise<AdminHospital[]> =>
    getAllPages<AdminHospital>('/admin/hospitals', { q: q?.trim() || undefined, status }),

  hospital: async (id: string): Promise<AdminHospital> =>
    (await axiosClient.get(`/admin/hospitals/${id}`)) as unknown as AdminHospital,

  createHospital: async (input: HospitalInput): Promise<AdminHospital> =>
    (await axiosClient.post('/admin/hospitals', input)) as unknown as AdminHospital,

  updateHospital: async ({
    id,
    input,
  }: {
    id: number;
    input: HospitalInput;
  }): Promise<AdminHospital> =>
    (await axiosClient.put(`/admin/hospitals/${id}`, input)) as unknown as AdminHospital,

  hideHospital: async ({ id, reason }: { id: number; reason: string }): Promise<void> => {
    await axiosClient.post(`/admin/hospitals/${id}/deactivate`, { reason });
  },

  showHospital: async (id: number): Promise<void> => {
    await axiosClient.post(`/admin/hospitals/${id}/reactivate`);
  },

  aiUsage: async (): Promise<AiUsage> =>
    (await axiosClient.get('/admin/system/ai-usage')) as unknown as AiUsage,

  failedTranscripts: async (): Promise<FailedTranscript[]> =>
    getAllPages<FailedTranscript>('/admin/system/transcripts/failed'),

  retryTranscript: async (id: number): Promise<void> => {
    await axiosClient.post(`/admin/system/transcripts/${id}/retry`);
  },

  failedJobs: async (): Promise<FailedJob[]> => getAllPages<FailedJob>('/admin/system/failed-jobs'),

  retryJob: async (id: string): Promise<void> => {
    await axiosClient.post(`/admin/system/failed-jobs/${id}/retry`);
  },

  discardJob: async (id: string): Promise<void> => {
    await axiosClient.delete(`/admin/system/failed-jobs/${id}`);
  },
};

export const useAdminHospitals = (filters: { q?: string; status: HospitalFilter }) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'hospitals', filters],
    queryFn: () => adminSystemService.hospitals(filters),
  });

export const useAdminHospital = (id: string | undefined) =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'hospital', id],
    queryFn: () => adminSystemService.hospital(id as string),
    enabled: !!id,
  });

/** A hospital change also refreshes the patients' Hospitals tab (query key `hospitals`). */
const useHospitalMutation = <T, R>(fn: (arg: T) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: ['hospitals'] });
    },
  });
};

export const useCreateHospital = () => useHospitalMutation(adminSystemService.createHospital);
export const useUpdateHospital = () => useHospitalMutation(adminSystemService.updateHospital);
export const useHideHospital = () => useHospitalMutation(adminSystemService.hideHospital);
export const useShowHospital = () => useHospitalMutation(adminSystemService.showHospital);

export const useAiUsage = () =>
  useQuery({ queryKey: [...ADMIN_KEY, 'ai-usage'], queryFn: adminSystemService.aiUsage });

export const useFailedTranscripts = () =>
  useQuery({
    queryKey: [...ADMIN_KEY, 'failed-transcripts'],
    queryFn: adminSystemService.failedTranscripts,
  });

export const useFailedJobs = () =>
  useQuery({ queryKey: [...ADMIN_KEY, 'failed-jobs'], queryFn: adminSystemService.failedJobs });

export const useRetryTranscript = () => useAdminMutation(adminSystemService.retryTranscript);
export const useRetryJob = () => useAdminMutation(adminSystemService.retryJob);
export const useDiscardJob = () => useAdminMutation(adminSystemService.discardJob);

export interface HospitalForm {
  name: string;
  address: string;
  emergencyPhone: string;
  is247: boolean;
  latitude: string;
  longitude: string;
}

export const emptyHospitalForm: HospitalForm = {
  name: '',
  address: '',
  emergencyPhone: '',
  is247: true,
  latitude: '',
  longitude: '',
};

export const hospitalToForm = (h: AdminHospital): HospitalForm => ({
  name: h.name,
  address: h.address,
  emergencyPhone: h.emergencyPhone,
  is247: h.is247,
  latitude: h.latitude === null ? '' : String(h.latitude),
  longitude: h.longitude === null ? '' : String(h.longitude),
});

// Same rule as the server: hotlines (999) and full numbers (+880 2-55165088).
const PHONE = /^\+?\d[\d\s\-()]{1,28}$/;

/**
 * Form text → what the server accepts, plus field errors to show before
 * sending. The server checks the same rules again.
 */
export const parseHospitalForm = (
  form: HospitalForm,
): { input: HospitalInput; errors: Partial<Record<keyof HospitalInput, string>> } => {
  const errors: Partial<Record<keyof HospitalInput, string>> = {};
  const name = form.name.trim();
  const address = form.address.trim();
  const phone = form.emergencyPhone.trim();
  const latText = form.latitude.trim();
  const lngText = form.longitude.trim();
  const latitude = latText === '' ? null : Number(latText);
  const longitude = lngText === '' ? null : Number(lngText);

  if (name.length < 3) errors.name = 'Enter the hospital name.';
  if (address.length < 5) errors.address = 'Enter the full address.';
  if (!PHONE.test(phone)) {
    errors.emergency_phone = 'Enter a phone number, e.g. 999 or +880 2-55165088.';
  }
  if (latitude !== null && !(Number.isFinite(latitude) && Math.abs(latitude) <= 90)) {
    errors.latitude = 'Latitude is a number between -90 and 90.';
  }
  if (longitude !== null && !(Number.isFinite(longitude) && Math.abs(longitude) <= 180)) {
    errors.longitude = 'Longitude is a number between -180 and 180.';
  }
  if (latitude === null && longitude !== null) {
    errors.latitude = 'Enter both latitude and longitude, or leave both empty.';
  } else if (longitude === null && latitude !== null) {
    errors.longitude = 'Enter both latitude and longitude, or leave both empty.';
  }

  return {
    input: { name, address, emergency_phone: phone, is_24_7: form.is247, latitude, longitude },
    errors,
  };
};

/** The first server message per field from a 422 response, or {} for any other failure. */
export const hospitalFieldErrors = (err: unknown): Partial<Record<keyof HospitalInput, string>> => {
  const errors = (err as { status?: number; errors?: Record<string, unknown> } | null)?.errors;
  if (!errors || typeof errors !== 'object') return {};

  const out: Partial<Record<keyof HospitalInput, string>> = {};
  for (const field of Object.keys(emptyInput) as (keyof HospitalInput)[]) {
    const first = (errors[field] as unknown[] | undefined)?.[0];
    if (typeof first === 'string') out[field] = first;
  }
  return out;
};

const emptyInput: HospitalInput = {
  name: '',
  address: '',
  emergency_phone: '',
  is_24_7: true,
  latitude: null,
  longitude: null,
};

/** "1.2 s" or "850 ms" for an average AI response time. */
export const formatDuration = (ms: number | null): string =>
  ms === null ? 'not measured' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
