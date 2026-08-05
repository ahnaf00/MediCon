// 1. IMPORTS
import { useMemo } from 'react';

// 2. TYPES
export interface DoctorQueueAppointment {
  id: string;
  patientName: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  reason: string;
  dateTime: string;
  format: 'video' | 'in-person';
  status: 'pending' | 'completed' | 'in-progress';
}

export interface DoctorDashboardData {
  todayQueue: DoctorQueueAppointment[];
  metrics: {
    pending: number;
    completed: number;
    total: number;
  };
}

// 3. HOOK
/**
 * Provides mock data for the Doctor Dashboard.
 * In a future milestone, this will be backed by real API calls / local DB queries.
 */
export const useDoctorDashboard = (): DoctorDashboardData => {
  const data = useMemo<DoctorDashboardData>(() => {
    // Generate dates based on today to keep the UI looking current
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Create some realistic mock appointments
    const queue: DoctorQueueAppointment[] = [
      {
        id: 'appt-101',
        patientName: 'Rahim Uddin',
        age: 45,
        gender: 'M',
        reason: 'Follow-up for hypertension',
        dateTime: new Date(startOfToday.getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9:00 AM
        format: 'in-person',
        status: 'completed',
      },
      {
        id: 'appt-102',
        patientName: 'Ayesha Rahman',
        age: 32,
        gender: 'F',
        reason: 'Migraine consultation',
        dateTime: new Date(startOfToday.getTime() + 11 * 60 * 60 * 1000).toISOString(), // 11:00 AM
        format: 'video',
        status: 'in-progress',
      },
      {
        id: 'appt-103',
        patientName: 'Kamal Hasan',
        age: 58,
        gender: 'M',
        reason: 'Routine checkup, blood test review',
        dateTime: new Date(startOfToday.getTime() + 14 * 60 * 60 * 1000).toISOString(), // 2:00 PM
        format: 'in-person',
        status: 'pending',
      },
      {
        id: 'appt-104',
        patientName: 'Nusrat Jahan',
        age: 27,
        gender: 'F',
        reason: 'Fever and throat pain for 3 days',
        dateTime: new Date(startOfToday.getTime() + 16 * 60 * 60 * 1000).toISOString(), // 4:00 PM
        format: 'video',
        status: 'pending',
      },
    ];

    return {
      todayQueue: queue,
      metrics: {
        total: queue.length,
        completed: queue.filter((a) => a.status === 'completed').length,
        pending: queue.filter((a) => a.status === 'pending').length,
      },
    };
  }, []);

  return data;
};
