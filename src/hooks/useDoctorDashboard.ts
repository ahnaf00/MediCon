// 1. IMPORTS
import { useQuery } from '@tanstack/react-query';
import { dashboardService, DoctorDashboardStats } from '../services/api/dashboardService';
import { ApiAppointment, useAppointments } from '../services/api/consultationsService';
import { fromLocalDateString, toLocalDateString } from '../utils/localDate';

// 2. TYPES
export interface DoctorQueueAppointment {
  id: string;
  patientName: string;
  /** Null when the patient hasn't recorded a date of birth. */
  age: number | null;
  gender: 'M' | 'F' | 'O' | null;
  reason: string;
  dateTime: string;
  format: 'video' | 'in-person';
  status: 'pending' | 'completed' | 'in-progress';
}

export interface DoctorDashboardData {
  stats: DoctorDashboardStats | null;
  todayQueue: DoctorQueueAppointment[];
  metrics: {
    pending: number;
    completed: number;
    total: number;
  };
  isLoading: boolean;
  isError: boolean;
}

// 3. HELPERS
const ageFrom = (dateOfBirth?: string | null): number | null => {
  const dob = dateOfBirth ? fromLocalDateString(dateOfBirth) : null;
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
  ) {
    age -= 1;
  }
  return age;
};

const genderCode = (gender?: string | null): DoctorQueueAppointment['gender'] => {
  const g = gender?.toLowerCase();
  if (g === 'male' || g === 'm') return 'M';
  if (g === 'female' || g === 'f') return 'F';
  return g ? 'O' : null;
};

const queueStatus = (status: ApiAppointment['status']): DoctorQueueAppointment['status'] =>
  status === 'completed' ? 'completed' : status === 'in_progress' ? 'in-progress' : 'pending';

const toQueueItem = (a: ApiAppointment): DoctorQueueAppointment => ({
  id: String(a.id),
  patientName: a.patient?.name ?? 'Patient',
  age: ageFrom(a.patient?.patientProfile?.dateOfBirth),
  gender: genderCode(a.patient?.patientProfile?.gender),
  reason: a.notes ?? '',
  dateTime: a.datetime ?? '',
  format: a.format,
  status: queueStatus(a.status),
});

// 4. HOOK
/**
 * Data for the Doctor Dashboard: stats from GET /doctor/dashboard and today's queue
 * from GET /appointments (the server scopes both to the signed-in doctor).
 */
export const useDoctorDashboard = (): DoctorDashboardData => {
  const statsQuery = useQuery({
    queryKey: ['doctor-dashboard'],
    queryFn: dashboardService.getDoctorStats,
  });
  const appointmentsQuery = useAppointments();

  // "Today" is the device's calendar day, never the UTC day from toISOString().
  const today = toLocalDateString(new Date());
  const todayQueue = (appointmentsQuery.data ?? [])
    .filter(
      (a) =>
        a.datetime &&
        a.status !== 'cancelled' &&
        a.status !== 'no_show' &&
        toLocalDateString(new Date(a.datetime)) === today,
    )
    .map(toQueueItem)
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  return {
    stats: statsQuery.data ?? null,
    todayQueue,
    metrics: {
      total: todayQueue.length,
      completed: todayQueue.filter((a) => a.status === 'completed').length,
      pending: todayQueue.filter((a) => a.status === 'pending').length,
    },
    isLoading: statsQuery.isLoading || appointmentsQuery.isLoading,
    isError: statsQuery.isError || appointmentsQuery.isError,
  };
};
