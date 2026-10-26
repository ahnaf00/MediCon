// src/services/api/consultationsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Appointment lifecycle + consultation summaries.
//   GET   /appointments                              → the caller's appointments (paged, H3)
//   GET   /appointments/{id}                         → one appointment, either participant
//   PATCH /appointments/{id}/status                  → doctor: in_progress | completed | no_show
//   GET   /consultations/{appointmentId}/summary     → either participant
//   PUT   /consultations/{appointmentId}/summary     → the appointment's doctor
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { appointmentsService } from './appointmentsService';
import { getPage, type Page } from './pagination';

export type AppointmentStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  // Nobody started it within its window (audit F10).
  | 'expired';

/** Filters for GET /appointments (task H3). `from`/`to` are ISO-8601 instants. */
export interface AppointmentFilters {
  when?: 'upcoming' | 'past';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired';
  patientUserId?: number | string;
  from?: string;
  to?: string;
  perPage?: number;
}

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
  /** When the doctor shared it with the patient; null while it is a draft (audit G7). */
  publishedAt: string | null;
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
  /** Share with the patient now; only once the visit is completed. */
  publish?: boolean;
}

// Kept here for existing importers; the helper lives in src/utils/errors.ts.
export { apiErrorMessage } from '../../utils/errors';

export const consultationsService = {
  /**
   * One page of the caller's visits (GET /appointments, task H3). Without `when` the list is
   * newest first; `when: 'upcoming'` and a from/to window are soonest first.
   */
  getAppointmentsPage: async (
    filters: AppointmentFilters = {},
    page = 1,
  ): Promise<Page<ApiAppointment>> => {
    const { patientUserId, perPage, ...rest } = filters;
    const params: Record<string, unknown> = { ...rest };
    if (patientUserId) params.patient_user_id = patientUserId;
    if (perPage) params.per_page = perPage;
    return getPage<ApiAppointment>('/appointments', params, page);
  },

  /** GET /appointments/{id}: one visit, for either person in it. */
  getAppointment: async (id: number | string): Promise<ApiAppointment> => {
    return (await axiosClient.get(`/appointments/${id}`)) as unknown as ApiAppointment;
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

/**
 * The first page (up to 50) of the caller's visits matching `filters`. Each screen asks only
 * for what it shows: upcoming visits, one day, one patient (task H3).
 */
export const useAppointments = (filters: AppointmentFilters = {}, enabled = true) =>
  useQuery({
    queryKey: ['appointments', 'list', filters],
    queryFn: async () =>
      (await consultationsService.getAppointmentsPage({ perPage: 50, ...filters })).items,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.some((a) => isAwaitingVideoStart(a)) ? LIVE_POLL_MS : false,
  });

/** One visit by id (the call screen). */
export const useAppointment = (id: number | string | undefined) =>
  useQuery({
    queryKey: ['appointments', 'one', String(id)],
    queryFn: () => consultationsService.getAppointment(id!),
    enabled: !!id,
  });

/**
 * The caller's most recent completed consultation that has a doctor's summary, or null.
 * Looks at the 20 most recent completed visits.
 */
export const useRecentConsultation = () =>
  useQuery({
    queryKey: ['appointments', 'list', { status: 'completed' }],
    queryFn: async () =>
      (await consultationsService.getAppointmentsPage({ status: 'completed' })).items,
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
