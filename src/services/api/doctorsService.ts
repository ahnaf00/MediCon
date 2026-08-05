import { axiosClient } from './axiosClient';
import { DoctorProfile } from '../../types/medical.types';
import { doctorPlaceholders } from '../../constants/images';

export interface DoctorExperienceEntry {
  id: string;
  hospitalName: string;
  designation: string;
  department: string;
  status: 'present' | 'past';
  period: string;
}

export interface Doctor extends DoctorProfile {
  experience: string;
  degrees: string[];
  bmdcNumber: string;
  followUpFee: number;
  followUpDays: number;
  workingHospital: string;
  totalPatients: number;
  avgConsultationMinutes: number;
  services: string[];
  experienceList: DoctorExperienceEntry[];
  image?: ReturnType<(typeof doctorPlaceholders)[number]>;
}

export interface ConsultationHistoryItem {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  status: 'completed' | 'cancelled' | 'upcoming';
  image?: ReturnType<(typeof doctorPlaceholders)[number]>;
}

export const doctorsService = {
  /**
   * Retrieves a list of available doctor categories/departments
   * Since there's no endpoint for this in the provided Laravel routes, we can keep the static categories or derive from doctors.
   * For now, returning static as the mock did.
   */
  getCategories: async () => {
    return [
      { id: 'cat-1', name: 'General Medicine', icon: 'stethoscope', keyword: 'Fever, Cold' },
      { id: 'cat-2', name: 'Cardiology', icon: 'heart-pulse', keyword: 'Heart Specialist' },
      { id: 'cat-3', name: 'Pediatrics', icon: 'baby-carriage', keyword: 'Child Specialist' },
      { id: 'cat-4', name: 'Neurology', icon: 'brain', keyword: 'Brain Specialist' },
      { id: 'cat-5', name: 'Dermatology', icon: 'allergy', keyword: 'Skin Specialist' },
      { id: 'cat-6', name: 'Psychiatry', icon: 'head-lightbulb-outline', keyword: 'Mental Health' },
      { id: 'cat-7', name: 'Orthopedics', icon: 'bone', keyword: 'Bone Specialist' },
      { id: 'cat-8', name: 'Ophthalmology', icon: 'eye', keyword: 'Eye Specialist' },
      { id: 'cat-9', name: 'Dentistry', icon: 'tooth', keyword: 'Dental Care' },
      { id: 'cat-10', name: 'ENT', icon: 'ear-hearing', keyword: 'Ear, Nose, Throat' },
      { id: 'cat-11', name: 'Gynecology', icon: 'gender-female', keyword: "Women's Health" },
      { id: 'cat-12', name: 'Urology', icon: 'water', keyword: 'Kidney Specialist' },
    ];
  },

  /**
   * Retrieves a list of doctors, optionally filtered by category
   */
  getDoctors: async (categoryId?: string): Promise<Doctor[]> => {
    // Laravel API: GET /doctors
    const params: any = {};
    if (categoryId) {
      // Find category name by ID
      const categories = await doctorsService.getCategories();
      const cat = categories.find(c => c.id === categoryId);
      if (cat) params.department = cat.name;
    }
    const doctors = await axiosClient.get('/doctors', { params });
    // Add placeholder images if missing
    return doctors.map((doc: any, index: number) => ({
      ...doc,
      image: doc.avatar_url ? { uri: doc.avatar_url } : doctorPlaceholders[index % doctorPlaceholders.length],
    }));
  },

  /**
   * Retrieves a single doctor's details by ID
   */
  getDoctorDetails: async (id: string): Promise<Doctor | null> => {
    // Laravel API: GET /doctors/{id}
    const doc = await axiosClient.get(`/doctors/${id}`);
    if (!doc) return null;
    return {
      ...doc,
      image: doc.avatar_url ? { uri: doc.avatar_url } : doctorPlaceholders[Number(id) % doctorPlaceholders.length || 0],
    };
  },

  /**
   * Retrieves the current user's consultation history.
   * Based on Laravel routes: GET /appointments
   */
  getConsultationHistory: async (): Promise<ConsultationHistoryItem[]> => {
    const appointments = await axiosClient.get('/appointments');
    return appointments.map((appt: any) => ({
      id: appt.id.toString(),
      doctorId: appt.doctor_id.toString(),
      doctorName: appt.doctor?.user?.name || 'Doctor',
      specialty: appt.doctor?.specialty || 'Specialist',
      date: appt.appointment_date,
      status: appt.status,
      image: appt.doctor?.user?.avatar_url ? { uri: appt.doctor.user.avatar_url } : undefined,
    }));
  },
};
