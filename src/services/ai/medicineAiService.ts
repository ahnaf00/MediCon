export interface MedicineExplainerResult {
  className: string;
  forms: string[];
  sideEffects: string[];
  dietaryConflicts: string[];
  summary: string;
}

export interface ComparisonResult {
  similarities: string[];
  differences: string[];
  rationale: string;
}

export interface InteractionConflict {
  existingMedicineId: string;
  existingMedicineName: string;
  severity: 'SAFE' | 'MINOR' | 'SEVERE';
  explanation: string;
}

export const medicineAiService = {
  getMedicineExplainer: async (medicineName: string): Promise<MedicineExplainerResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          className: 'Mock Medicine Class',
          forms: ['Tablet', 'Capsule', 'Liquid'],
          sideEffects: ['Nausea', 'Dizziness', 'Headache'],
          dietaryConflicts: ['Avoid grapefruit juice', 'Take with food'],
          summary: `This is a mock AI summary for ${medicineName}. It is typically used to manage symptoms related to this mock condition. Always consult your doctor before changing your dosage.`,
        });
      }, 600);
    });
  },

  compareMedicines: async (medA: string, medB: string): Promise<ComparisonResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          similarities: [
            'Both are used to treat similar conditions.',
            'Both are available in oral tablet forms.',
          ],
          differences: [
            `${medA} acts faster but has a shorter duration.`,
            `${medB} is extended-release and taken once daily.`,
          ],
          rationale: `AI Rationale: While ${medA} and ${medB} belong to the same general family, they have different pharmacokinetic profiles. ${medA} is preferred for acute relief, whereas ${medB} is better for long-term maintenance. Do not substitute one for the other without medical advice.`,
        });
      }, 700);
    });
  },

  checkInteractions: async (
    newMedicine: string,
    existingMedicines: { id: string; name: string }[],
  ): Promise<InteractionConflict[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate mock conflicts for existing medicines
        const conflicts = existingMedicines.map((med, index) => {
          let severity: 'SAFE' | 'MINOR' | 'SEVERE' = 'SAFE';
          let explanation = 'No known significant interactions.';

          // Deterministic mock logic based on index
          if (index % 3 === 1) {
            severity = 'MINOR';
            explanation = `Taking ${newMedicine} with ${med.name} may slightly decrease absorption. Consider taking them 2 hours apart.`;
          } else if (index % 3 === 2) {
            severity = 'SEVERE';
            explanation = `DANGER: Combining ${newMedicine} with ${med.name} can lead to severe cardiovascular risks. Consult your doctor immediately!`;
          }

          return {
            existingMedicineId: med.id,
            existingMedicineName: med.name,
            severity,
            explanation,
          };
        });
        resolve(conflicts);
      }, 800);
    });
  },
};
