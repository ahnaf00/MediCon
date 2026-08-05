import { Doctor, MOCK_DOCTORS } from '../api/doctorsService';

class SymptomTriageService {
  /**
   * Mocks an AI recommendation engine that parses a symptom query
   * and returns a dynamically ranked list of relevant doctors.
   */
  async searchDoctorsBySymptom(query: string): Promise<Doctor[]> {
    // Simulate network delay for AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerQuery = query.toLowerCase();
    let recommended: Doctor[] = [];

    // Simple keyword matching mock logic
    if (lowerQuery.includes('heart') || lowerQuery.includes('chest')) {
      recommended = MOCK_DOCTORS.filter((d) => d.department === 'Cardiology');
    } else if (lowerQuery.includes('skin') || lowerQuery.includes('rash')) {
      recommended = MOCK_DOCTORS.filter((d) => d.department === 'Dermatology');
    } else if (lowerQuery.includes('headache') || lowerQuery.includes('dizzy')) {
      recommended = MOCK_DOCTORS.filter((d) => d.department === 'Neurology');
    } else {
      // Default to general practice for unmatched or generic symptoms (fever, cold, etc.)
      recommended = MOCK_DOCTORS.filter((d) => d.department === 'General Practice');
    }

    // Always append general practice as a fallback if not already included
    if (!recommended.some((d) => d.department === 'General Practice')) {
      const gp = MOCK_DOCTORS.find((d) => d.department === 'General Practice');
      if (gp) {
        recommended.push(gp);
      }
    }

    return recommended;
  }
}

export const symptomTriageService = new SymptomTriageService();
