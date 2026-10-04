import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { usePrescriptions } from '../services/api/prescriptionsService';
import {
  ApiAppointment,
  LATE_START_GRACE_MS,
  useAppointments,
} from '../services/api/consultationsService';
import { getMealTiming } from '../utils/prescriptionFormatters';
import type { Prescription, PrescriptionMedicine } from '../types/medical.types';

// 2. TYPES
export interface DashboardAppointment {
  id: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  format: 'video' | 'in-person';
  status: ApiAppointment['status'];
  imageUrl?: string;
}

export interface DashboardDoctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
}

export interface DashboardMedicationItem {
  id: string;
  name: string;
  instructions: string;
  scheduleFormat: string;
  dosage?: string;
}

export interface DashboardMedication {
  periodName: 'Morning' | 'Noon' | 'Night';
  scheduledTime: string;
  status: 'upcoming' | 'taken' | 'missed';
  medicines: DashboardMedicationItem[];
}

export interface PatientDashboardData {
  nextAppointment: DashboardAppointment | null;
  nextMedicine: DashboardMedication | null;
  /** True until both appointments and prescriptions have loaded once. */
  isLoading: boolean;
}

// 3. HELPERS
/**
 * The soonest visit still to happen: one in progress, or the earliest scheduled one
 * (kept for a while after its start time, since the doctor may start late).
 */
const pickNextAppointment = (appointments: ApiAppointment[]): DashboardAppointment | null => {
  const now = Date.now();
  const next = appointments
    .filter(
      (a) =>
        a.datetime &&
        (a.status === 'in_progress' ||
          (a.status === 'scheduled' &&
            new Date(a.datetime).getTime() >= now - LATE_START_GRACE_MS)),
    )
    .sort((a, b) => new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime())[0];

  if (!next) return null;
  return {
    id: String(next.id),
    doctorName: next.doctor?.name ?? 'Doctor',
    specialty: next.doctor?.doctorProfile?.specialty ?? '',
    dateTime: next.datetime!,
    format: next.format,
    status: next.status,
    imageUrl: next.doctor?.avatarUrl ?? undefined,
  };
};

type PeriodName = DashboardMedication['periodName'];
const PERIODS: { name: PeriodName; key: 'morning' | 'noon' | 'night' }[] = [
  { name: 'Morning', key: 'morning' },
  { name: 'Noon', key: 'noon' },
  { name: 'Night', key: 'night' },
];

const mapMed = (m: PrescriptionMedicine): DashboardMedicationItem => {
  const mealTiming = getMealTiming(m.instructions ?? undefined);
  return {
    id: String(m.id),
    name: m.name,
    instructions: mealTiming ? `Take ${mealTiming.toLowerCase()}` : m.instructions || '',
    scheduleFormat: m.scheduleFormat || m.dosagePattern || '',
    dosage: m.dosage,
  };
};

const format12Hour = (timeStr: string) => {
  const [hStr, mStr] = timeStr.split(':');
  let hour = parseInt(hStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${mStr} ${ampm}`;
};

/**
 * The next dose period across all active prescriptions. Expired or cancelled
 * prescriptions never feed the widget; with none active it shows its empty state.
 */
const pickNextMedicine = (prescriptions: Prescription[]): DashboardMedication | null => {
  const medicines = prescriptions.filter((p) => p.status === 'active').flatMap((p) => p.medicines);

  const periods = PERIODS.map(({ name, key }) => {
    const meds = medicines.filter(
      (m) => (m.dosageSchedule as Record<string, string> | undefined)?.[key],
    );
    return {
      name,
      time: meds.length ? (meds[0].dosageSchedule as Record<string, string>)[key] : '',
      medicines: meds.map(mapMed),
    };
  }).filter((p) => p.medicines.length > 0);

  if (periods.length === 0) return null;

  const now = new Date();
  const hasPassed = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const periodDate = new Date();
    periodDate.setHours(h, m, 0, 0);
    return now >= periodDate;
  };

  // After the last period of the day, the next one is tomorrow's first.
  const selected = periods.find((p) => !hasPassed(p.time)) ?? periods[0];

  return {
    periodName: selected.name,
    scheduledTime: format12Hour(selected.time),
    status: 'upcoming',
    medicines: selected.medicines,
  };
};

// 4. HOOK
/**
 * Data for the Patient Dashboard: the next appointment from GET /appointments and the
 * next medication period from the patient's active prescriptions.
 */
export const usePatientDashboard = (): PatientDashboardData => {
  const appointments = useAppointments();
  const prescriptions = usePrescriptions();

  // The home tab stays mounted, so refresh when it regains focus.
  const refetchAppointments = appointments.refetch;
  const refetchPrescriptions = prescriptions.refetch;
  useFocusEffect(
    useCallback(() => {
      refetchAppointments();
      refetchPrescriptions();
    }, [refetchAppointments, refetchPrescriptions]),
  );

  return {
    nextAppointment: pickNextAppointment(appointments.data ?? []),
    nextMedicine: pickNextMedicine(prescriptions.data ?? []),
    isLoading: appointments.isLoading || prescriptions.isLoading,
  };
};
