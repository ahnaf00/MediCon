import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { prescriptionsService } from '../services/api/prescriptionsService';
import { getMealTiming } from '../utils/prescriptionFormatters';

// 2. TYPES
export interface DashboardAppointment {
  id: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  format: 'video' | 'in-person';
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
  recentDoctor: DashboardDoctor | null;
  nextMedicine: DashboardMedication | null;
}

// 3. HOOK
/**
 * Provides data for the Patient Dashboard.
 * Dynamically fetches the scheduled active prescription and calculates the next upcoming medication period based on the current time.
 */
export const usePatientDashboard = (): PatientDashboardData => {
  const [nextMedicine, setNextMedicine] = useState<DashboardMedication | null>(null);

  const nextAppointment: DashboardAppointment = {
    id: 'appt-001',
    doctorName: 'Dr. Sarah Khan',
    specialty: 'General Medicine',
    dateTime: '2026-07-05T10:30:00',
    format: 'video',
    imageUrl: 'https://i.pravatar.cc/150?img=32',
  };

  const recentDoctor: DashboardDoctor = {
    id: 'doc-001',
    name: 'Dr. Ahmed Rahman',
    specialty: 'Cardiology',
    rating: 4.8,
    experience: '12 years',
  };

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchActivePrescription = async () => {
        try {
          const rx = await prescriptionsService.getScheduledPrescription();
          if (!isMounted) return;

          if (!rx) {
            setNextMedicine(null);
            return;
          }

          type PeriodName = 'Morning' | 'Noon' | 'Night';
          const periods: {
            name: PeriodName;
            time: string;
            medicines: DashboardMedicationItem[];
          }[] = [];

          const mapMed = (m: any) => {
            const mealTiming = getMealTiming(m.instructions);
            const formattedInstructions = mealTiming
              ? `Take ${mealTiming.toLowerCase()}`
              : m.instructions || '';

            return {
              id: m.id,
              name: m.name,
              instructions: formattedInstructions,
              scheduleFormat: m.dosagePattern || '',
              dosage: m.dosage,
            };
          };

          const morningMeds = rx.medicines.filter((m) => m.dosageSchedule?.morning);
          if (morningMeds.length > 0) {
            periods.push({
              name: 'Morning',
              time: morningMeds[0].dosageSchedule!.morning!,
              medicines: morningMeds.map(mapMed),
            });
          }

          const noonMeds = rx.medicines.filter((m) => m.dosageSchedule?.noon);
          if (noonMeds.length > 0) {
            periods.push({
              name: 'Noon',
              time: noonMeds[0].dosageSchedule!.noon!,
              medicines: noonMeds.map(mapMed),
            });
          }

          const nightMeds = rx.medicines.filter((m) => m.dosageSchedule?.night);
          if (nightMeds.length > 0) {
            periods.push({
              name: 'Night',
              time: nightMeds[0].dosageSchedule!.night!,
              medicines: nightMeds.map(mapMed),
            });
          }

          if (periods.length === 0) {
            setNextMedicine(null);
            return;
          }

          const now = new Date();
          const hasPassed = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            const periodDate = new Date();
            periodDate.setHours(h, m, 0, 0);
            return now >= periodDate;
          };

          let selectedPeriod = periods.find((p) => !hasPassed(p.time));

          if (!selectedPeriod) {
            selectedPeriod = periods[0];
          }

          const format12Hour = (timeStr: string) => {
            const [hStr, mStr] = timeStr.split(':');
            let hour = parseInt(hStr, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            return `${hour.toString().padStart(2, '0')}:${mStr} ${ampm}`;
          };

          setNextMedicine({
            periodName: selectedPeriod.name,
            scheduledTime: format12Hour(selectedPeriod.time),
            status: 'upcoming',
            medicines: selectedPeriod.medicines,
          });
        } catch {
          // Non-critical: dashboard medication data unavailable
        }
      };

      fetchActivePrescription();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  return { nextAppointment, recentDoctor, nextMedicine };
};
