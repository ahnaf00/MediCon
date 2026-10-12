import { useQuery } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';

export interface ApiPatient {
  id: number;
  name: string;
  phone: string;
  avatarUrl: string | null;
  patientProfile: {
    dateOfBirth: string | null;
    gender: string | null;
    bloodGroup: string | null;
    emergencyContact: string | null;
    address: string | null;
    /** Free text as the patient entered it. null = not recorded, which is not "none". */
    allergies: string | null;
    chronicConditions: string | null;
  } | null;
}

/** Age in whole years from a `YYYY-MM-DD` date of birth, or null when none is recorded. */
export const ageFromDateOfBirth = (dob?: string | null, today = new Date()): number | null => {
  const [year, month, day] = (dob ?? '').split('-').map(Number);
  if (!year || !month || !day) return null;
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
};

/** Splits a profile's free-text list ("Penicillin, Aspirin") into its items. */
export const splitProfileList = (text?: string | null): string[] =>
  (text ?? '')
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const patientsService = {
  /**
   * Goal: Retrieve all distinct patients this doctor has seen.
   * How: GET /api/v1/patients — backend restricts to role:doctor.
   */
  getPatients: async (): Promise<ApiPatient[]> => {
    const res = (await axiosClient.get('/patients')) as any;
    // Handle paginated or direct array response based on backend structure
    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    } else if (Array.isArray(res)) {
      return res;
    }
    return [];
  },

  /**
   * Goal: Retrieve details for a single patient profile.
   */
  getPatientById: async (id: string | number): Promise<ApiPatient> => {
    const res = (await axiosClient.get(`/patients/${id}`)) as any;
    return res;
  },
};

/** One patient's profile, for the doctor screens. Disabled until an id is known. */
export const usePatient = (id?: string | number) =>
  useQuery({
    queryKey: ['patient', String(id)],
    queryFn: () => patientsService.getPatientById(id as string | number),
    enabled: id !== undefined && id !== '',
  });
