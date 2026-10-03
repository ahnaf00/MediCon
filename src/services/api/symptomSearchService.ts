// src/services/api/symptomSearchService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Symptom search — POST /api/v1/symptom-search
//
// The server triages the free-text query (red-flag rules first, then a fixed
// specialty list) and returns verified doctors of that specialty, ranked.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { Doctor } from './doctorsService';
import { doctorPlaceholders } from '../../constants/images';

export type SymptomUrgency = 'low' | 'medium' | 'high' | 'emergency';

/** Which path produced the specialty. Only `ai` may be presented as an AI suggestion. */
export type TriageSource = 'rules' | 'ai' | 'fallback';

export interface RedFlag {
  code: string;
  message: string;
}

export interface SymptomSearchResult {
  specialty: string;
  /** false when nobody practises `specialty` and General Medicine doctors are shown instead. */
  matchedSpecialty: boolean;
  urgency: SymptomUrgency | null;
  redFlag: RedFlag | null;
  source: TriageSource;
  doctors: Doctor[];
}

const toDoctor = (doc: any, index: number): Doctor => {
  const profile = doc.doctorProfile ?? {};
  const id = String(doc.id);
  return {
    id,
    userId: id,
    fullName: doc.name,
    department: profile.specialty || 'General',
    degrees: [profile.qualification || 'MBBS'],
    rating: Number(profile.rating) || 0,
    reviewCount: 0,
    consultationFee: profile.consultationFee || 500,
    experience: profile.experienceYears ? `${profile.experienceYears} Years` : 'N/A',
    bmdcNumber: profile.bmdcRegistrationNo || 'N/A',
    followUpFee: profile.followUpFee || 0,
    followUpDays: 0,
    workingHospital: profile.hospitalName || '',
    totalPatients: 0,
    avgConsultationMinutes: 15,
    services: [],
    experienceList: [],
    licenseNumber: profile.bmdcRegistrationNo || 'N/A',
    isOnline: false,
    about: profile.bio || '',
    image: doc.avatarUrl
      ? { uri: doc.avatarUrl }
      : doctorPlaceholders[index % doctorPlaceholders.length],
    nextAvailableAt: profile.nextAvailableAt ?? null,
    completedConsultations: profile.completedConsultations ?? 0,
  };
};

export const symptomSearchService = {
  search: async (query: string): Promise<SymptomSearchResult> => {
    const res = (await axiosClient.post('/symptom-search', { query })) as any;
    return {
      specialty: res.specialty,
      matchedSpecialty: !!res.matchedSpecialty,
      urgency: res.urgency ?? null,
      redFlag: res.redFlag ?? null,
      source: res.source,
      doctors: (res.doctors ?? []).map(toDoctor),
    };
  },
};

/** Ranked doctors for a symptom query. Only runs for a non-empty query. */
export const useSymptomSearch = (query: string) =>
  useQuery({
    queryKey: ['symptom-search', query],
    queryFn: () => symptomSearchService.search(query),
    enabled: query.trim().length > 0,
    // Doctors' next free slot changes as people book; don't serve a stale ranking for long.
    staleTime: 60 * 1000,
    // A triage call costs a model request and is rate-limited; don't hammer it on failure.
    retry: 1,
  });
