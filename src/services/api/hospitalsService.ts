import { Hospital } from '../../types/medical.types';
import { axiosClient } from './axiosClient';
import { getPage, mapPage, type Page } from './pagination';

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
  /** One page of GET /hospitals, A-Z, 20 per page (?search= matches name or address; task H3). */
  async getHospitalsPage(search?: string, page = 1): Promise<Page<Hospital>> {
    const params = search?.trim() ? { search: search.trim() } : {};
    return mapPage(await getPage<ApiHospital>('/hospitals', params, page), toHospital);
  },

  /** GET /hospitals/{id}: one visible hospital (404 if hidden or unknown). */
  async getHospitalDetails(id: string): Promise<Hospital> {
    return toHospital((await axiosClient.get(`/hospitals/${id}`)) as unknown as ApiHospital);
  },
};
