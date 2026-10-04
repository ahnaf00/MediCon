// src/services/api/callsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// In-app video consultation (Phase 6).
//   POST /appointments/{id}/call/consent   → either participant: { consent }
//   POST /appointments/{id}/call/token     → LiveKit join token. The doctor's first
//                                            call starts the visit; the patient can
//                                            only join once it is in progress.
//   POST /appointments/{id}/call/end       → doctor: close the room, complete the visit
//   GET  /consultations/{id}/transcript    → transcript status, segments, AI draft
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import type { ApiAppointment } from './consultationsService';

export interface CallConsentResult {
  role: 'doctor' | 'patient';
  consent: boolean;
  /** True when the change reached the live call (false before joining). */
  live: boolean;
}

export interface CallSession {
  token: string;
  /** LiveKit WebSocket URL, e.g. ws://192.168.0.104:7880 */
  url: string;
  room: string;
}

export type TranscriptStatus =
  'awaiting_call' | 'recording' | 'transcribing' | 'summarizing' | 'ready' | 'failed' | 'skipped';

export interface TranscriptSegment {
  speakerRole: 'doctor' | 'patient';
  /** Approximate offset from the start of the recording. */
  startMs: number;
  text: string;
}

export interface TranscriptDraftSummary {
  chiefComplaint: string;
  findings: string;
  advice: string;
  redFlags: string[];
}

export interface ConsultationTranscript {
  status: TranscriptStatus;
  error: string | null;
  language: string | null;
  draftSummary: TranscriptDraftSummary | null;
  segments: TranscriptSegment[];
  transcribedAt: string | null;
}

const TERMINAL_TRANSCRIPT_STATUSES: TranscriptStatus[] = ['ready', 'failed', 'skipped'];

export const callsService = {
  setConsent: async (
    appointmentId: number | string,
    consent: boolean,
  ): Promise<CallConsentResult> => {
    return (await axiosClient.post(`/appointments/${appointmentId}/call/consent`, {
      consent,
    })) as unknown as CallConsentResult;
  },

  getToken: async (appointmentId: number | string): Promise<CallSession> => {
    return (await axiosClient.post(
      `/appointments/${appointmentId}/call/token`,
    )) as unknown as CallSession;
  },

  endCall: async (
    appointmentId: number | string,
  ): Promise<{ message: string; appointment: ApiAppointment }> => {
    return (await axiosClient.post(`/appointments/${appointmentId}/call/end`)) as unknown as {
      message: string;
      appointment: ApiAppointment;
    };
  },

  getTranscript: async (appointmentId: number | string): Promise<ConsultationTranscript> => {
    return (await axiosClient.get(
      `/consultations/${appointmentId}/transcript`,
    )) as unknown as ConsultationTranscript;
  },
};

// ─── TanStack Query hooks ───────────────────────────────────────────────────

const invalidateAppointment = (
  qc: ReturnType<typeof useQueryClient>,
  appointmentId: number | string,
) => {
  qc.invalidateQueries({ queryKey: ['appointments'] });
  qc.invalidateQueries({ queryKey: ['consultation-summary', String(appointmentId)] });
};

export const useCallConsent = () =>
  useMutation({
    mutationFn: ({
      appointmentId,
      consent,
    }: {
      appointmentId: number | string;
      consent: boolean;
    }) => callsService.setConsent(appointmentId, consent),
  });

/** Fetching the doctor's first token moves the appointment to in_progress, so refresh it. */
export const useCallToken = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId }: { appointmentId: number | string }) =>
      callsService.getToken(appointmentId),
    onSuccess: (_data, { appointmentId }) => invalidateAppointment(qc, appointmentId),
  });
};

export const useEndCall = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId }: { appointmentId: number | string }) =>
      callsService.endCall(appointmentId),
    onSuccess: (_data, { appointmentId }) => {
      invalidateAppointment(qc, appointmentId);
      qc.invalidateQueries({ queryKey: ['consultation-transcript', String(appointmentId)] });
    },
  });
};

/** Polls while the transcript pipeline is still working; stops at ready / failed / skipped. */
export const useConsultationTranscript = (
  appointmentId: number | string | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: ['consultation-transcript', String(appointmentId)],
    queryFn: () => callsService.getTranscript(appointmentId!),
    enabled: !!appointmentId && enabled,
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      const status = query.state.data?.status;
      return status && TERMINAL_TRANSCRIPT_STATUSES.includes(status) ? false : 5000;
    },
  });
