import { axiosClient } from './axiosClient';
import { DoctorProfile } from '../../types/medical.types';
import type { ImageSourcePropType } from 'react-native';
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
  image?: ImageSourcePropType;
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
  image?: ImageSourcePropType;
}

export interface DoctorCategory {
  /** The specialty name; also what the doctor list filters on. */
  id: string;
  name: string;
  icon: string;
  keyword: string;
  doctorCount: number;
}

/** Display-only icon and hint per specialty (names come from the server). */
const CATEGORY_LOOK: Record<string, { icon: string; keyword: string }> = {
  'General Medicine': { icon: 'stethoscope', keyword: 'Fever, Cold' },
  Cardiology: { icon: 'heart-pulse', keyword: 'Heart Specialist' },
  Pediatrics: { icon: 'baby-carriage', keyword: 'Child Specialist' },
  Neurology: { icon: 'brain', keyword: 'Brain Specialist' },
  Dermatology: { icon: 'allergy', keyword: 'Skin Specialist' },
  Psychiatry: { icon: 'head-lightbulb-outline', keyword: 'Mental Health' },
  Orthopedics: { icon: 'bone', keyword: 'Bone Specialist' },
  Ophthalmology: { icon: 'eye', keyword: 'Eye Specialist' },
  Dentistry: { icon: 'tooth', keyword: 'Dental Care' },
  ENT: { icon: 'ear-hearing', keyword: 'Ear, Nose, Throat' },
  Gynecology: { icon: 'gender-female', keyword: "Women's Health" },
  Urology: { icon: 'water', keyword: 'Kidney Specialist' },
};

export const doctorsService = {
  /**
   * The departments patients can browse, from GET /specialties (the same list
   * symptom search recommends from). The id is the specialty name, which is
   * what the doctor list filters on. Icons and keywords are display only.
   */
  getCategories: async (): Promise<DoctorCategory[]> => {
    const rows = (await axiosClient.get('/specialties')) as {
      name: string;
      doctorCount: number;
    }[];
    return rows.map((row) => ({
      id: row.name,
      name: row.name,
      icon: CATEGORY_LOOK[row.name]?.icon ?? 'stethoscope',
      keyword: CATEGORY_LOOK[row.name]?.keyword ?? '',
      doctorCount: row.doctorCount,
    }));
  },

  /**
   * Retrieves a list of doctors, optionally filtered by category
   */
  getDoctors: async (categoryId?: string): Promise<Doctor[]> => {
    // Laravel API: GET /doctors
    const params = categoryId ? { specialty: categoryId } : {};
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
      image: doc.avatarUrl ? { uri: doc.avatarUrl } : undefined,
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
      image: doc.avatarUrl ? { uri: doc.avatarUrl } : undefined,
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
