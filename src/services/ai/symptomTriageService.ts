import { Doctor, doctorsService } from '../api/doctorsService';

class SymptomTriageService {
  /**
   * Mocks an AI recommendation engine that parses a symptom query
   * and returns a dynamically ranked list of relevant doctors.
   */
  async searchDoctorsBySymptom(query: string): Promise<Doctor[]> {
    // In a real app this would call the AI backend endpoint.
    // For now, we fetch all real doctors and filter them locally.
    const allDoctors = await doctorsService.getDoctors();
    
    const lowerQuery = query.toLowerCase();
    let recommended: Doctor[] = [];

    // Simple keyword matching mock logic
    if (lowerQuery.includes('heart') || lowerQuery.includes('chest')) {
      recommended = allDoctors.filter((d: any) => d.department === 'Cardiology');
    } else if (lowerQuery.includes('skin') || lowerQuery.includes('rash')) {
      recommended = allDoctors.filter((d: any) => d.department === 'Dermatology');
    } else if (lowerQuery.includes('headache') || lowerQuery.includes('dizzy')) {
      recommended = allDoctors.filter((d: any) => d.department === 'Neurology');
    } else {
      // Default to general practice for unmatched or generic symptoms (fever, cold, etc.)
      recommended = allDoctors.filter((d: any) => d.department === 'General Medicine' || d.department === 'General Practice');
    }

    // Always append general practice as a fallback if not already included
    if (!recommended.some((d: any) => d.department === 'General Medicine' || d.department === 'General Practice')) {
      const gp = allDoctors.find((d: any) => d.department === 'General Medicine' || d.department === 'General Practice');
      if (gp) {
        recommended.push(gp);
      }
    }

    return recommended;
  }
}

export const symptomTriageService = new SymptomTriageService();
