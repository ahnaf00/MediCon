import { axiosClient } from './axiosClient';
import { ApiVital } from '../../types/medical.types';

// ─── Payload Types ─────────────────────────────────────────────────────────────

export interface StoreVitalPayload {
  blood_pressure?: string | null; // "120/80" format
  pulse_rate?: number | null; // BPM integer
  glucose_level?: number | null; // mmol/L float
  oxygen_saturation?: number | null; // % integer
  logged_at?: string | null; // ISO 8601
}

// ─── Mapper ────────────────────────────────────────────────────────────────────

const mapApiToVital = (api: any): ApiVital => ({
  id: String(api.id),
  bloodPressure: api.bloodPressure ?? null,
  pulseRate: api.pulseRate ?? null,
  glucoseLevel: api.glucoseLevel ?? null,
  oxygenSaturation: api.oxygenSaturation ?? null,
  loggedAt: api.loggedAt,
  createdAt: api.createdAt,
});

// ─── Service ───────────────────────────────────────────────────────────────────

export const vitalsService = {
  /**
   * Fetch all vitals for the authenticated patient.
   * GET /api/v1/vitals — ordered by logged_at desc on backend.
   */
  getVitals: async (): Promise<ApiVital[]> => {
    const res = (await axiosClient.get('/vitals')) as any;
    const items = Array.isArray(res) ? res : (res?.data ?? []);
    return items.map(mapApiToVital);
  },

  /**
   * Record new vital metrics for the authenticated patient.
   * POST /api/v1/vitals
   */
  storeVital: async (payload: StoreVitalPayload): Promise<ApiVital> => {
    const res = (await axiosClient.post('/vitals', payload)) as any;
    // Backend returns { message, vital: { ... } }
    const vitaData = res?.vital ?? res;
    return mapApiToVital(vitaData);
  },
};
