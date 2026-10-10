import { axiosClient } from './axiosClient';
import { doctorsService } from './doctorsService';

export type ConsultationType = 'in-person' | 'video';

export interface TimeSlot {
  /** The slot's start instant (UTC ISO-8601 from the API); also what gets booked. */
  id: string;
  /** Clinic-time (Asia/Dhaka) label, e.g. "09:00". */
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
  /** The chosen slot's `id` — an ISO-8601 instant with offset, sent to the API as-is. */
  slotDatetime: string;
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
      params: { date },
    })) as any;
    const slotsArray = response.slots || [];

    // The backend returns an array of slot objects inside the `slots` key.
    return slotsArray.map((slot: any) => ({
      id: typeof slot === 'string' ? slot : slot.datetime || slot.id || slot.time,
      time: typeof slot === 'string' ? slot : slot.time,
      isAvailable: typeof slot === 'string' ? true : (slot.available ?? slot.isAvailable ?? true),
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
    // The slot's ISO instant carries its own offset, so no local-time conversion happens here.
    const response = (await axiosClient.post('/appointments', {
      doctor_user_id: details.doctorId,
      appointment_datetime: details.slotDatetime,
      format: details.type === 'video' ? 'video' : 'in_person',
      notes: details.symptoms || '',
    })) as any;

    return {
      success: true,
      appointmentId: response.appointment?.id?.toString(),
    };
  }
  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<void> {
    await axiosClient.patch(`/appointments/${appointmentId}/cancel`);
  }

  /**
   * Doctor moves a visit through its lifecycle:
   * scheduled → in_progress → completed, or scheduled → no_show.
   */
  async updateStatus(
    appointmentId: number | string,
    status: 'in_progress' | 'completed' | 'no_show',
  ): Promise<void> {
    await axiosClient.patch(`/appointments/${appointmentId}/status`, { status });
  }
}

export const appointmentsService = new AppointmentsService();
