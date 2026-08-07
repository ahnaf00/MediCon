import { axiosClient } from './axiosClient';
import { doctorsService } from './doctorsService';

export type ConsultationType = 'in-person' | 'video';

export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

export interface DigestData {
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
  };
  medicines: string[];
  reports: { id: string; name: string; date: string }[];
}

export interface BookingDetails {
  doctorId: string;
  date: string;
  timeSlotId: string;
  type: ConsultationType;
  symptoms?: string;
}

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  message?: string;
}

class AppointmentsService {
  /**
   * Get available slots for a given doctor and date
   */
  async getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    // Laravel API: GET /doctors/{id}/slots
    const response = (await axiosClient.get(`/doctors/${doctorId}/slots`, {
      params: { date }
    })) as any;
    
    // The backend might return an array of strings or objects. We map them.
    return response.map((slot: any) => ({
      id: typeof slot === 'string' ? slot : slot.id || slot.time,
      time: typeof slot === 'string' ? slot : slot.time,
      isAvailable: typeof slot === 'string' ? true : (slot.isAvailable ?? true),
    }));
  }

  /**
   * Mock getting pre-consultation digest (could be a combination of vitals/prescriptions from API).
   */
  async getPreConsultationDigest(patientId: string): Promise<DigestData> {
    // Since we are mocking the digest builder from actual real endpoints later,
    // we can fetch vitals and prescriptions if needed.
    // For now, this is a placeholder returning static structure until a dedicated backend endpoint exists.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          vitals: {
            bloodPressure: '120/80',
            heartRate: 72,
            temperature: 98.6,
            weight: 70,
          },
          medicines: ['Lisinopril 10mg', 'Atorvastatin 20mg'],
          reports: [
            { id: 'r1', name: 'Complete Blood Count', date: '2026-06-15' },
            { id: 'r2', name: 'Lipid Panel', date: '2026-06-15' },
          ],
        });
      }, 500);
    });
  }

  /**
   * Book the appointment.
   */
  async bookAppointment(details: BookingDetails): Promise<BookingResult> {
    // Laravel API: POST /appointments
    const response = (await axiosClient.post('/appointments', {
      doctor_id: details.doctorId,
      appointment_date: details.date,
      appointment_time: details.timeSlotId,
      type: details.type,
      notes: details.symptoms || '',
    })) as any;

    return {
      success: true,
      appointmentId: response.id?.toString(),
    };
  }
}

export const appointmentsService = new AppointmentsService();
