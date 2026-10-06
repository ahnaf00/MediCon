// src/services/api/consultationsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Appointment lifecycle + consultation summaries.
//   GET   /appointments                              → the caller's appointments
//   PATCH /appointments/{id}/status                  → doctor: in_progress | completed | no_show
//   GET   /consultations/{appointmentId}/summary     → either participant
//   PUT   /consultations/{appointmentId}/summary     → the appointment's doctor
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { appointmentsService } from './appointmentsService';

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface ApiAppointment {
  id: number;
  /** UTC ISO-8601 with offset. */
  datetime: string | null;
  format: 'video' | 'in-person';
  status: AppointmentStatus;
  notes: string | null;
  durationMinutes: number | null;
  startedAt: string | null;
  endedAt: string | null;
  hasSummary?: boolean;
  doctor?: {
    id: number;
    name: string;
    avatarUrl?: string | null;
    doctorProfile?: { specialty?: string | null } | null;
  } | null;
  patient?: {
    id: number;
    name: string;
    patientProfile?: { dateOfBirth?: string | null; gender?: string | null } | null;
  } | null;
}

export interface ConsultationSummary {
  id: number;
  appointmentId: number;
  chiefComplaint: string;
  findings: string | null;
  advice: string | null;
  redFlags: string[];
  source: 'doctor_note' | 'transcript';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ConsultationDetails {
  appointment: {
    id: number;
    datetime: string | null;
    status: AppointmentStatus;
    durationMinutes: number | null;
  };
  doctor: {
    id: number | null;
    name: string | null;
    specialty: string | null;
    avatarUrl: string | null;
  };
  /** Null until the doctor writes it. */
  summary: ConsultationSummary | null;
  /** The caller's existing consultation chat session, if any. */
  chatSessionId?: number | null;
}

export interface ConsultationSummaryInput {
  chief_complaint: string;
  findings?: string | null;
  advice?: string | null;
  red_flags?: string[];
  /**
   * `transcript` when the doctor started from the call transcript's AI draft
   * (needs a ready transcript). Omitted on later edits to keep the saved source.
   */
  source?: 'doctor_note' | 'transcript';
}

/** The server's message from an API error (422 bodies arrive unwrapped, others as AxiosError). */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { message?: unknown; response?: { data?: { message?: unknown } } } | null;
  const message = e?.response?.data?.message ?? (e && !('response' in e) ? e.message : undefined);
  return typeof message === 'string' && message.trim() !== '' ? message : fallback;
};

export const consultationsService = {
  getAppointments: async (): Promise<ApiAppointment[]> => {
    const res = (await axiosClient.get('/appointments')) as unknown;
    return Array.isArray(res) ? (res as ApiAppointment[]) : [];
  },

  getConsultation: async (appointmentId: number | string): Promise<ConsultationDetails> => {
    return (await axiosClient.get(
      `/consultations/${appointmentId}/summary`,
    )) as unknown as ConsultationDetails;
  },

  saveSummary: async (
    appointmentId: number | string,
    input: ConsultationSummaryInput,
  ): Promise<ConsultationDetails> => {
    return (await axiosClient.put(
      `/consultations/${appointmentId}/summary`,
      input,
    )) as unknown as ConsultationDetails;
  },
};

// ─── TanStack Query hooks ────────────────────────────────────────────────────

const LIVE_POLL_MS = 15_000;
const LIVE_WINDOW_BEFORE_MS = 15 * 60 * 1000;
/** A doctor may start late; keep watching a scheduled visit this long after its start. */
export const LATE_START_GRACE_MS = 60 * 60 * 1000;

/**
 * A video visit the patient may be waiting to join: scheduled and from 15 minutes
 * before its start until an hour after. There are no push notifications yet, so
 * the appointment list is re-polled while one exists.
 */
export const isAwaitingVideoStart = (
  a: Pick<ApiAppointment, 'format' | 'status' | 'datetime'>,
  now = Date.now(),
): boolean => {
  if (a.format !== 'video' || a.status !== 'scheduled' || !a.datetime) return false;
  const start = new Date(a.datetime).getTime();
  return now >= start - LIVE_WINDOW_BEFORE_MS && now <= start + LATE_START_GRACE_MS;
};

export const useAppointments = () =>
  useQuery({
    queryKey: ['appointments'],
    queryFn: () => consultationsService.getAppointments(),
    refetchInterval: (query) =>
      query.state.data?.some((a) => isAwaitingVideoStart(a)) ? LIVE_POLL_MS : false,
  });

/** The caller's most recent completed consultation that has a doctor's summary, or null. */
export const useRecentConsultation = () =>
  useQuery({
    queryKey: ['appointments'],
    queryFn: () => consultationsService.getAppointments(),
    select: (appointments): ApiAppointment | null =>
      appointments
        .filter((a) => a.status === 'completed' && a.hasSummary)
        .sort((a, b) => (b.datetime ?? '').localeCompare(a.datetime ?? ''))[0] ?? null,
  });

export const useConsultation = (appointmentId: number | string | undefined, enabled = true) =>
  useQuery({
    queryKey: ['consultation-summary', String(appointmentId)],
    queryFn: () => consultationsService.getConsultation(appointmentId!),
    enabled: !!appointmentId && enabled,
  });

export const useUpdateAppointmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: number;
      status: 'in_progress' | 'completed' | 'no_show';
    }) => appointmentsService.updateStatus(appointmentId, status),
    onSuccess: (_data, { appointmentId }) => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['consultation-summary', String(appointmentId)] });
    },
  });
};

export const useSaveConsultationSummary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      input,
    }: {
      appointmentId: number;
      input: ConsultationSummaryInput;
    }) => consultationsService.saveSummary(appointmentId, input),
    onSuccess: (data, { appointmentId }) => {
      qc.setQueryData(
        ['consultation-summary', String(appointmentId)],
        (old: ConsultationDetails | undefined) =>
          old ? { ...data, chatSessionId: old.chatSessionId } : data,
      );
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};
