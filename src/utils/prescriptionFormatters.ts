export type DoseSlot = 'morning' | 'noon' | 'night';
export const DOSE_SLOTS: readonly DoseSlot[] = ['morning', 'noon', 'night'];

/** How the medicine is taken; values match the API's StorePrescriptionRequest::ROUTES. */
export const ROUTE_OPTIONS = [
  { value: 'oral', label: 'By mouth' },
  { value: 'sublingual', label: 'Under the tongue' },
  { value: 'topical', label: 'On the skin' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'nasal', label: 'In the nose' },
  { value: 'eye', label: 'In the eye' },
  { value: 'ear', label: 'In the ear' },
  { value: 'injection', label: 'Injection' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'vaginal', label: 'Vaginal' },
  { value: 'other', label: 'Other route' },
] as const;
export type RouteValue = (typeof ROUTE_OPTIONS)[number]['value'];

export const routeLabel = (route?: string | null): string | undefined =>
  route ? (ROUTE_OPTIONS.find((r) => r.value === route)?.label ?? route) : undefined;

/** 1 → "1", 0.5 → "½", 1.5 → "1½" (same as the API's formatAmount). */
export const formatAmount = (amount: number): string => {
  const whole = Math.floor(amount);
  const fraction = { 25: '¼', 50: '½', 75: '¾' }[Math.round((amount - whole) * 100)] ?? '';
  if (!fraction) return String(Number(amount.toFixed(2)));
  return `${whole > 0 ? whole : ''}${fraction}`;
};

/**
 * `{ morning: '08:00', night: '20:00' }` → `'1+0+1'`, or with amounts `2+0+1`;
 * undefined when no schedule was given. A scheduled slot without an amount
 * counts as 1. Same rule as the API's PrescriptionDocumentResource::dosePattern().
 */
export const toDosePattern = (
  schedule?: Record<string, string | null | undefined> | null,
  quantities?: Partial<Record<DoseSlot, number | null>> | null,
): string | undefined => {
  if (!schedule || Object.keys(schedule).length === 0) return undefined;
  return DOSE_SLOTS.map((slot) =>
    schedule[slot] ? formatAmount(Number(quantities?.[slot] ?? 1)) : '0',
  ).join('+');
};

export const getMedicineDescription = (pattern?: string, instructions?: string) => {
  let timeString = '';
  if (pattern) {
    const parts = pattern.split(/[+-]/).map((p) => p.trim());
    if (parts.length === 3) {
      const [morning, noon, night] = parts;
      const times: string[] = [];
      if (morning !== '0') times.push('morning');
      if (noon !== '0') times.push('noon');
      if (night !== '0') times.push('night');

      if (times.length === 1) {
        timeString = times[0];
      } else if (times.length === 2) {
        timeString = `${times[0]} and ${times[1]}`;
      } else if (times.length === 3) {
        timeString = `${times[0]}, ${times[1]} and ${times[2]}`;
      }
    }
  }

  // Extract meal timing and ignore extra descriptions (e.g. "for pain or fever")
  let mealTiming = '';
  if (instructions) {
    const lowerInstr = instructions.toLowerCase();
    const match = lowerInstr.match(
      /(with or without food|after meals|before meals|after meal|before meal|with food|without food)/i,
    );
    if (match) {
      mealTiming = match[1];
    }
  }

  let desc = timeString ? `Take in the ${timeString}` : '';
  if (mealTiming) {
    desc = desc ? `${desc} ${mealTiming}` : `Take ${mealTiming}`;
  }

  return desc || 'Take as directed';
};

export const getMealTiming = (instructions?: string) => {
  if (!instructions) return '';
  const lowerInstr = instructions.toLowerCase();
  const match = lowerInstr.match(
    /(with or without food|after meals|before meals|after meal|before meal|with food|without food)/i,
  );
  return match ? match[1] : '';
};
