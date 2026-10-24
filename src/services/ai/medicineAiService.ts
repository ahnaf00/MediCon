// src/services/ai/medicineAiService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Medicine Service — GET /api/v1/medicines/search · POST /api/v1/medicines/interactions
//
// How it works:
//   - Medicine search: GET /api/v1/medicines/search?q=<query> — returns
//     { results: MedicineLabel[] }, US FDA drug labels from openFDA. No AI is involved.
//   - Interaction check: POST /api/v1/medicines/interactions — accepts an array
//     of medicine name strings (all peers, min 2 max 20). The backend matches
//     a very small rule list and returns
//     { disclaimer, pairs: [{ pair, warning, severity, checked }] } — one entry
//     per pair. A pair with checked: false was NOT checked; it is never "safe".
//
// IMPORTANT payload change from the old mock:
//   Old: checkInteractions(newMedicine: string, existingMedicines: {id, name}[])
//   New: checkInteractions(medicines: string[])
//   The backend treats all medicines as peers — there is no concept of "new"
//   vs "existing". The UI must be updated to pass a flat array of all names.
// ─────────────────────────────────────────────────────────────────────────────
import { axiosClient } from '../api/axiosClient';

// ─── Types (matching backend responses exactly) ───────────────────────────────

/**
 * One US FDA drug label from openFDA, as GET /medicines/search returns it
 * (`{ results: MedicineLabel[] }`). Any field can be missing.
 */
export interface MedicineLabel {
  brandName: string;
  genericName: string | null;
  manufacturer: string | null;
  /** "Purpose" or "Indications and usage" section of the label. */
  purpose: string | null;
  warnings: string | null;
  /** The US name the server searched, when it differs from what was typed (e.g. acetaminophen). */
  searchedAs?: string | null;
}

export interface InteractionPair {
  /** The two medicine names involved in this interaction. */
  pair: string[];
  /** Human-readable warning text from the backend. */
  warning: string;
  /** 'unknown' means no rule covered the pair — it was not checked. */
  severity: 'high' | 'unknown';
  checked: boolean;
}

export interface InteractionResult {
  disclaimer: string;
  pairs: InteractionPair[];
}

/** Two medicines side by side: their FDA labels and whether the pair was checked. */
export interface ComparisonResult {
  labelA: MedicineLabel | null;
  labelB: MedicineLabel | null;
  interaction: InteractionPair | null;
  disclaimer: string;
}

/** Legacy type for InteractionFlag component — maps from InteractionPair. */
export interface InteractionConflict {
  existingMedicineId: string;
  existingMedicineName: string;
  /** There is deliberately no "safe" value: an unmatched pair is NOT_CHECKED. */
  severity: 'NOT_CHECKED' | 'MINOR' | 'SEVERE';
  explanation: string;
  /** The two medicine names this result is about. */
  pair: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const medicineAiService = {
  /**
   * Goal: Search for medicines by name fragment to support autocomplete inputs.
   * How: GET /api/v1/medicines/search?q=<query> — query param key is "q".
   */
  searchMedicines: async (query: string): Promise<MedicineLabel[]> => {
    const res = (await axiosClient.get('/medicines/search', {
      params: { q: query },
    })) as { results?: MedicineLabel[] };
    return Array.isArray(res?.results) ? res.results : [];
  },

  /** The best-matching FDA label for a medicine name, or null when there is none. */
  getMedicineInfo: async (medicineName: string): Promise<MedicineLabel | null> => {
    const results = await medicineAiService.searchMedicines(medicineName);
    return results[0] ?? null;
  },

  /**
   * Both medicines' FDA labels plus the interaction check for the pair. Nothing is
   * invented: a missing label stays null and an unmatched pair stays "not checked".
   */
  compareMedicines: async (medA: string, medB: string): Promise<ComparisonResult> => {
    const [labelA, labelB, check] = await Promise.all([
      medicineAiService.getMedicineInfo(medA),
      medicineAiService.getMedicineInfo(medB),
      axiosClient.post('/medicines/interactions', {
        medicines: [{ name: medA }, { name: medB }],
      }) as Promise<{ pairs?: InteractionPair[]; disclaimer?: string }>,
    ]);
    return {
      labelA,
      labelB,
      interaction: check?.pairs?.[0] ?? null,
      disclaimer: check?.disclaimer ?? 'Consult a doctor or pharmacist before combining medicines.',
    };
  },

  /**
   * Goal: Check for dangerous interactions between a list of medicines.
   * How: POST /api/v1/medicines/interactions
   *      Payload: { medicines: [{ name: "DrugA" }, { name: "DrugB" }] }
   *      All medicines are treated as peers (min 2, max 20).
   * Maps the backend InteractionPair[] to the legacy InteractionConflict[] shape
   * expected by the InteractionFlag UI component.
   *
   * @param medicines - Array of medicine name strings (2–20 items).
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
      existingMedicineName: p.pair.join(' + '),
      severity: p.severity === 'high' ? 'SEVERE' : 'NOT_CHECKED',
      explanation: p.warning,
      pair: p.pair,
    }));
  },
};
