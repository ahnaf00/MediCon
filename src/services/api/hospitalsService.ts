import { Hospital } from '../../types/medical.types';
import { axiosClient } from './axiosClient';

interface ApiHospital {
  id: string | number;
  name: string;
  address: string;
  latitude: number | string | null;
  longitude: number | string | null;
  emergencyPhone: string | null;
  is247: boolean;
}

/** Only what the server knows. Distance, photo and doctor links are not stored, so not shown. */
const toHospital = (h: ApiHospital): Hospital => ({
  id: String(h.id),
  name: h.name,
  address: h.address,
  latitude: Number(h.latitude) || 0,
  longitude: Number(h.longitude) || 0,
  emergencyNumber: h.emergencyPhone ?? undefined,
  isOpen24x7: Boolean(h.is247),
});

export const hospitalsService = {
  /** GET /hospitals (?search= matches name or address). */
  async getNearbyHospitals(search?: string): Promise<Hospital[]> {
    const params = search?.trim() ? { search: search.trim() } : {};
    const response = (await axiosClient.get('/hospitals', { params })) as ApiHospital[];
    return response.map(toHospital);
  },

  /** There is no GET /hospitals/{id}; find it in the list. */
  async getHospitalDetails(id: string): Promise<Hospital> {
    const hospital = (await hospitalsService.getNearbyHospitals()).find((h) => h.id === id);
    if (!hospital) throw new Error('Hospital not found');
    return hospital;
  },
};
