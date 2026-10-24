import type { PrescriptionMedicine } from '../types/medical.types';
import { toLocalDateString } from './localDate';

/**
 * Last day a medicine is due, as local YYYY-MM-DD: issue day + duration - 1.
 * Returns '' for an unreadable issue date.
 */
export const courseLastDay = (
  issuedAt: string,
  m: Pick<PrescriptionMedicine, 'durationDays'>,
): string => {
  const end = new Date(issuedAt);
  if (Number.isNaN(end.getTime())) return '';
  end.setDate(end.getDate() + Math.max(1, m.durationDays || 1) - 1);
  return toLocalDateString(end);
};
