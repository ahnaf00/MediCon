import { axiosClient } from './axiosClient';
import { DoctorProfile } from '../../types/medical.types';
import { doctorPlaceholders } from '../../constants/images';
import { toLocalDateString } from '../../utils/localDate';

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
  /** ISO-8601 start of the first free slot; only returned by symptom search. null = none in the next 14 days. */
  nextAvailableAt?: string | null;
  /** Only returned by symptom search. */
  completedConsultations?: number;
}

export interface ConsultationHistoryItem {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  /** Raw API status. Only 'scheduled' visits can be cancelled. */
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  /** True once the doctor has written a consultation summary (enables the AI chat). */
  hasSummary: boolean;
  format: 'video' | 'in-person';
  /** UTC ISO-8601 start, for the "doctor may start soon" polling window. */
  startsAt: string | null;
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
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) params.department = cat.name;
    }
    const doctors = (await axiosClient.get('/doctors', { params })) as any;
    // Map backend UserResource with nested doctorProfile to frontend Doctor interface
    return doctors.map((doc: any, index: number) => ({
      id: doc.id.toString(),
      fullName: doc.name,
      department: doc.doctorProfile?.specialty || 'General',
      degree: doc.doctorProfile?.qualification || '',
      degrees: doc.doctorProfile?.qualification ? [doc.doctorProfile.qualification] : [],
      rating: doc.doctorProfile?.rating || 0,
      reviews: 0,
      consultationFee: doc.doctorProfile?.consultationFee || 500,
      experience: doc.doctorProfile?.experience ? `${doc.doctorProfile.experience} Years` : 'N/A',
      bmdcNumber: 'N/A',
      followUpFee: 0,
      followUpDays: 0,
      workingHospital: 'MediCon Hospital',
      totalPatients: 0,
      avgConsultationMinutes: 15,
      services: [],
      experienceList: [],
      // Server-computed: the doctor's toggle is on and their app has checked in recently.
      isOnline: doc.doctorProfile?.isOnline === true,
      image: doc.avatarUrl
        ? { uri: doc.avatarUrl }
        : doctorPlaceholders[index % doctorPlaceholders.length],
    }));
  },

  /**
   * Retrieves a single doctor's details by ID
   */
  getDoctorDetails: async (id: string): Promise<Doctor | null> => {
    // Laravel API: GET /doctors/{id}
    const doc = (await axiosClient.get(`/doctors/${id}`)) as any;
    if (!doc) return null;
    return {
      id: doc.id.toString(),
      userId: doc.id.toString(),
      fullName: doc.name,
      department: doc.doctorProfile?.specialty || 'General',
      degrees: doc.doctorProfile?.qualification ? [doc.doctorProfile.qualification] : [],
      rating: doc.doctorProfile?.rating || 0,
      reviewCount: 0,
      consultationFee: doc.doctorProfile?.consultationFee || 500,
      experience: doc.doctorProfile?.experience ? `${doc.doctorProfile.experience} Years` : 'N/A',
      bmdcNumber: 'N/A',
      followUpFee: 0,
      followUpDays: 0,
      workingHospital: 'MediCon Hospital',
      totalPatients: 0,
      avgConsultationMinutes: 15,
      services: [],
      experienceList: [],
      licenseNumber: 'N/A',
      isOnline: doc.doctorProfile?.isOnline === true,
      about: doc.doctorProfile?.bio || '',
      image: doc.avatarUrl
        ? { uri: doc.avatarUrl }
        : doctorPlaceholders[Number(id) % doctorPlaceholders.length || 0],
    };
  },

  /**
   * Retrieves the current user's consultation history.
   * Based on Laravel routes: GET /appointments
   */
  getConsultationHistory: async (): Promise<ConsultationHistoryItem[]> => {
    const appointments = (await axiosClient.get('/appointments')) as any;
    return appointments.map((appt: any) => ({
      id: appt.id.toString(),
      doctorId: appt.doctor?.id?.toString() || '',
      doctorName: appt.doctor?.name || 'Doctor',
      specialty: appt.doctor?.doctorProfile?.specialty || 'Specialist',
      date: appt.datetime ? toLocalDateString(new Date(appt.datetime)) : 'N/A',
      status: appt.status,
      hasSummary: appt.hasSummary === true,
      format: appt.format,
      startsAt: appt.datetime ?? null,
      image: appt.doctor?.avatarUrl ? { uri: appt.doctor.avatarUrl } : undefined,
    }));
  },
};
