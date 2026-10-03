import { Hospital } from '../../types/medical.types';
import { Doctor } from './doctorsService';
import { axiosClient } from './axiosClient';
import { doctorPlaceholders } from '../../constants/images';

export const hospitalsService = {
  async getNearbyHospitals(lat?: number, lng?: number, search?: string): Promise<Hospital[]> {
    // Laravel API: GET /hospitals (?search= matches name or address)
    // The backend endpoint might accept lat/lng if we pass them
    const params: any = {};
    if (lat && lng) {
      params.lat = lat;
      params.lng = lng;
    }
    if (search?.trim()) {
      params.search = search.trim();
    }
    const response = (await axiosClient.get('/hospitals', { params })) as any;
    
    // Fallback images if not provided by backend
    return response.map((h: any) => ({
      id: h.id.toString(),
      name: h.name,
      address: h.address,
      latitude: parseFloat(h.latitude) || 0,
      longitude: parseFloat(h.longitude) || 0,
      contactNumber: 'N/A',
      emergencyNumber: h.emergencyPhone,
      hasEmergencyRoom: true,
      distanceKm: 0,
      isOpen24x7: h.is247 ?? true,
      imageUrl: h.image_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
    }));
  },

  async getHospitalDetails(id: string): Promise<{ hospital: Hospital; doctors: Doctor[] }> {
    // Laravel API doesn't have /hospitals/{id} listed in the provided routes.
    // If it doesn't exist, we just simulate by fetching all and finding it.
    const allHospitals = await hospitalsService.getNearbyHospitals();
    const hospital = allHospitals.find(h => h.id === id);
    if (!hospital) {
      throw new Error('Hospital not found');
    }

    // Since we don't have a /hospitals/{id}/doctors route, we fetch all doctors and filter locally (or backend might support `?hospital_id=x`)
    const doctorsResponse = (await axiosClient.get('/doctors')) as any;
    const doctors = doctorsResponse.map((doc: any, index: number) => ({
      ...doc,
      image: doc.avatar_url ? { uri: doc.avatar_url } : doctorPlaceholders[index % doctorPlaceholders.length],
    })).slice(0, 3); // Simulating affiliated doctors

    return { hospital, doctors };
  },
};
