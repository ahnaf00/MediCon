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
  patient?: { id: number; name: string } | null;
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

export const useAppointments = () =>
  useQuery({
    queryKey: ['appointments'],
    queryFn: () => consultationsService.getAppointments(),
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
