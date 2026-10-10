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
  } | null;
}

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
