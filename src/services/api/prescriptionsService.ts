// src/services/api/prescriptionsService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Prescriptions Service — GET/POST /api/v1/prescriptions
//
// Goal: Replace the in-memory MOCK_DOCTOR_PRESCRIPTIONS and MOCK_UPLOADED_PRESCRIPTIONS
// arrays with real HTTP calls to the Laravel backend PrescriptionController.
//
// How it works:
//   - GET /api/v1/prescriptions: Backend filters automatically by the authenticated
//     user's role. Patients see prescriptions issued to them; doctors see prescriptions
//     they issued. No client-side filtering needed.
//   - POST /api/v1/prescriptions: Doctor-only (enforced server-side by role:doctor
//     middleware). Creates a new prescription with one or more medicine items.
//
// Note on type mapping:
//   The backend PrescriptionResource uses camelCase field names that differ from
//   the old frontend mock Prescription type. The ApiPrescription type below matches
//   the backend shape exactly. Adherence tracking (TAKEN/PENDING/MISSED) is not
//   yet in the backend, so those methods are kept as local state for now.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { AdherenceRecord, Prescription } from '../../types/medical.types';

// ─── Types (matching PrescriptionResource & StorePrescriptionRequest exactly) ──

export interface ApiPrescriptionMedicine {
  id: number;
  /** Medicine name (mapped from medicine_name column). */
  name: string;
  dosage: string;
  /** Free-form schedule object, e.g. { morning: "08:00", night: "20:00" }. */
  dosageSchedule: Record<string, string> | null;
  /** Human-readable schedule format string from backend, e.g. "1+0+1". */
  scheduleFormat: string | null;
  instructions: string | null;
  durationDays: number;
}

export interface ApiPrescription {
  id: number;
  appointmentId: number | null;
  diagnosisSummary: string;
  status: 'active' | 'expired' | 'cancelled';
  doctor: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  patient: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  medicines: ApiPrescriptionMedicine[];
  createdAt: string; // ISO 8601 — maps to frontend's "issuedAt"
}

export interface StorePrescriptionPayload {
  patient_user_id: number;
  diagnosis_summary: string;
  appointment_id?: number;
  medicines: Array<{
    medicine_name: string;
    dosage: string;
    duration_days: number;
    dosage_schedule?: Record<string, string>;
    instructions?: string;
  }>;
}

// ─── Adherence records (local state only — no backend endpoint yet) ────────────

const MOCK_ADHERENCE: AdherenceRecord[] = [
  {
    id: 'adh-1',
    prescriptionId: '1',
    medicineId: '1',
    date: new Date().toISOString().split('T')[0],
    status: 'TAKEN',
    scheduledTime: '08:00',
    takenTime: new Date(new Date().setHours(8, 15)).toISOString(),
  },
  {
    id: 'adh-2',
    prescriptionId: '1',
    medicineId: '1',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    scheduledTime: '14:00',
  },
];

// ─── Mapper Function ────────────────────────────────────────────────────────────

const mapApiToPrescription = (api: ApiPrescription): Prescription => {
  return {
    id: api.id.toString(),
    issuedAt: api.createdAt,
    diagnosisSummary: api.diagnosisSummary,
    status: api.status,
    doctor: api.doctor,
    patient: api.patient,
    source: api.doctor ? 'DOCTOR' : 'UPLOADED',
    doctorName: api.doctor?.name,
    doctorId: api.doctor?.id?.toString(),
    appointmentId: api.appointmentId ?? undefined,
    medicines: api.medicines.map((m) => ({
      id: m.id.toString(),
      name: m.name,
      dosage: m.dosage,
      durationDays: m.durationDays,
      dosageSchedule: m.dosageSchedule || undefined,
      scheduleFormat: m.scheduleFormat,
      instructions: m.instructions,
      dosagePattern: m.scheduleFormat || undefined,
    })),
  };
};

// ─── Raw Service ──────────────────────────────────────────────────────────────

export const prescriptionsService = {
  /**
   * Goal: Retrieve all prescriptions visible to the authenticated user.
   * How: GET /api/v1/prescriptions — backend role-filters automatically:
   *      patients receive prescriptions issued to them,
   *      doctors receive prescriptions they have issued.
   */
  getPrescriptions: async (): Promise<Prescription[]> => {
    const res = (await axiosClient.get('/prescriptions')) as any;
    const items = Array.isArray(res) ? res : res?.data ?? [];
    return items.map(mapApiToPrescription);
  },

  /**
   * Goal: Retrieve details for a single prescription.
   * How: GET /api/v1/prescriptions/{id}.
   */
  getPrescriptionById: async (id: number): Promise<Prescription> => {
    const res = (await axiosClient.get(`/prescriptions/${id}`)) as any;
    const api = res?.prescription ?? res;
    return mapApiToPrescription(api);
  },

  /**
   * Goal: Issue a new prescription for a patient (doctor-only action).
   * How: POST /api/v1/prescriptions — protected by role:doctor middleware.
   *      Requires patient_user_id, diagnosis_summary, and at least one medicine.
   * The backend returns { message, prescription: { id, ... } }.
   */
  createPrescription: async (payload: StorePrescriptionPayload): Promise<ApiPrescription> => {
    const res = (await axiosClient.post('/prescriptions', payload)) as any;
    return res?.prescription ?? res;
  },

  /**
   * Goal: Retrieve today's adherence records (local state — no backend yet).
   * How: Filters in-memory MOCK_ADHERENCE by date string.
   */
  getDailyAdherence: async (date: string): Promise<AdherenceRecord[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const records = MOCK_ADHERENCE.filter((a) => a.date === date);
        resolve(records);
      }, 100);
    });
  },

  /** Adherence threshold classifier (pure utility, no API call). */
  calculateAdherenceThreshold: (taken: number, total: number): 'GOOD' | 'FAIR' | 'POOR' => {
    if (total === 0) return 'GOOD';
    const percentage = (taken / total) * 100;
    if (percentage >= 80) return 'GOOD';
    if (percentage >= 50) return 'FAIR';
    return 'POOR';
  },
};

// ─── TanStack Query v5 Hooks ──────────────────────────────────────────────────

/** Fetch and cache all prescriptions for the current user. */
export const usePrescriptions = () =>
  useQuery({
    queryKey: ['prescriptions'],
    queryFn: prescriptionsService.getPrescriptions,
  });

/** Fetch a single prescription by ID. Only runs when id is truthy. */
export const usePrescription = (id: number) =>
  useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => prescriptionsService.getPrescriptionById(id),
    enabled: !!id,
  });

/**
 * Create a new prescription (doctor-only).
 * Invalidates the prescriptions cache on success so both the doctor's and
 * the patient's list screens refresh automatically.
 */
export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: prescriptionsService.createPrescription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
};
