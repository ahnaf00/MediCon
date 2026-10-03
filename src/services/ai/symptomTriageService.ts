import { symptomSearchService, SymptomSearchResult } from '../api/symptomSearchService';

class SymptomTriageService {
  /**
   * Triage a free-text symptom query on the server and return the suggested
   * specialty, urgency/red flag and the ranked doctors.
   * Screens should prefer the `useSymptomSearch` hook; this is for imperative callers.
   */
  async searchDoctorsBySymptom(query: string): Promise<SymptomSearchResult> {
    return symptomSearchService.search(query);
  }
}

export const symptomTriageService = new SymptomTriageService();
