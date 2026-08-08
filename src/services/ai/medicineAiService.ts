// src/services/ai/medicineAiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Medicine AI Service — GET /api/v1/medicines/search · POST /api/v1/medicines/interactions
//
// Goal: Replace the hardcoded mock responses with real backend calls.
//
// How it works:
//   - Medicine search: GET /api/v1/medicines/search?q=<query> — returns a list
//     of matching medicine names or stubs from the backend.
//   - Interaction check: POST /api/v1/medicines/interactions — accepts an array
//     of medicine name strings (all peers, min 2 max 5). The backend calls
//     OpenFDA and returns { disclaimer, pairs: [{ pair, warning, severity }] }.
//
// IMPORTANT payload change from the old mock:
//   Old: checkInteractions(newMedicine: string, existingMedicines: {id, name}[])
//   New: checkInteractions(medicines: string[])
//   The backend treats all medicines as peers — there is no concept of "new"
//   vs "existing". The UI must be updated to pass a flat array of all names.
// ─────────────────────────────────────────────────────────────────────────────
import { axiosClient } from '../api/axiosClient';

// ─── Types (matching backend responses exactly) ───────────────────────────────

export interface MedicineSearchResult {
  name: string;
  /** Additional fields the backend may return; kept flexible. */
  [key: string]: any;
}

export interface InteractionPair {
  /** The two medicine names involved in this interaction. */
  pair: string[];
  /** Human-readable warning text from OpenFDA. */
  warning: string;
  /** Severity level from OpenFDA analysis. */
  severity: 'high' | 'none';
}

export interface InteractionResult {
  disclaimer: string;
  pairs: InteractionPair[];
}

// ─── Legacy types kept for backward compat with existing UI components ────────
// These shapes are preserved so screens don't need mass rewrites now.

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

/** Legacy type for InteractionFlag component — maps from InteractionPair. */
export interface InteractionConflict {
  existingMedicineId: string;
  existingMedicineName: string;
  severity: 'SAFE' | 'MINOR' | 'SEVERE';
  explanation: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const medicineAiService = {
  /**
   * Goal: Search for medicines by name fragment to support autocomplete inputs.
   * How: GET /api/v1/medicines/search?q=<query> — query param key is "q".
   */
  searchMedicines: async (query: string): Promise<MedicineSearchResult[]> => {
    const res = (await axiosClient.get('/medicines/search', {
      params: { q: query },
    })) as any;
    return Array.isArray(res) ? res : res?.data ?? [];
  },

  /**
   * Goal: Explain what a medicine does, its forms, side effects and dietary conflicts.
   * How: GET /api/v1/medicines/search?q=<name> — uses the search endpoint as a lookup.
   * The backend result is shaped into a MedicineExplainerResult for UI compatibility.
   */
  getMedicineExplainer: async (medicineName: string): Promise<MedicineExplainerResult> => {
    const results = (await axiosClient.get('/medicines/search', {
      params: { q: medicineName },
    })) as any;
    const hit = (Array.isArray(results) ? results[0] : results?.data?.[0]) ?? {};
    return {
      className: hit.class ?? hit.therapeuticClass ?? 'Unknown',
      forms: hit.forms ?? ['Tablet'],
      sideEffects: hit.sideEffects ?? hit.side_effects ?? [],
      dietaryConflicts: hit.dietaryConflicts ?? hit.dietary_conflicts ?? [],
      summary: hit.summary ?? hit.description ?? `Information about ${medicineName}.`,
    };
  },

  /**
   * Goal: Compare two medicines side-by-side (similarities, differences, AI rationale).
   * How: POST /api/v1/medicines/interactions with both medicines as peers, then
   * shape the result as a ComparisonResult for the MedicineCompareCard UI.
   */
  compareMedicines: async (medA: string, medB: string): Promise<ComparisonResult> => {
    const res = (await axiosClient.post('/medicines/interactions', {
      medicines: [{ name: medA }, { name: medB }],
    })) as any;
    const pairs: InteractionPair[] = res?.pairs ?? [];
    const warnings = pairs.map((p: InteractionPair) => p.warning).filter(Boolean);
    return {
      similarities: warnings.length ? warnings : ['No known interactions detected.'],
      differences: [`${medA} and ${medB} may have different pharmacokinetic profiles.`],
      rationale: res?.disclaimer ?? 'Always consult your doctor before switching medicines.',
    };
  },

  /**
   * Goal: Check for dangerous interactions between a list of medicines.
   * How: POST /api/v1/medicines/interactions
   *      Payload: { medicines: [{ name: "DrugA" }, { name: "DrugB" }] }
   *      All medicines are treated as peers (min 2, max 5).
   * Maps the backend InteractionPair[] to the legacy InteractionConflict[] shape
   * expected by the InteractionFlag UI component.
   *
   * @param medicines - Array of medicine name strings (2–5 items).
   */
  checkInteractions: async (medicines: string[]): Promise<InteractionConflict[]> => {
    const payload = {
      medicines: medicines.map((name) => ({ name })),
    };
    const res = (await axiosClient.post('/medicines/interactions', payload)) as any;
    const pairs: InteractionPair[] = res?.pairs ?? [];
    // Map backend peer-pair model → legacy conflict model for UI compatibility
    return pairs.map((p) => ({
      existingMedicineId: p.pair[1] ?? '',
      existingMedicineName: p.pair[1] ?? '',
      severity: p.severity === 'high' ? 'SEVERE' : 'SAFE',
      explanation: p.warning,
    }));
  },
};
