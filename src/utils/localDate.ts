/**
 * Calendar date (YYYY-MM-DD) of a Date in the device's local timezone.
 * Use this instead of `toISOString().split('T')[0]`, which returns the UTC date
 * and is a day off for part of every day in Dhaka (UTC+6).
 */
export const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Local-midnight Date for a calendar date string (YYYY-MM-DD).
 * `new Date('2026-08-13')` parses as UTC midnight, which is the wrong day
 * west of UTC; this keeps the printed date whatever the device timezone.
 * Returns null for anything that is not a real calendar date.
 */
export const fromLocalDateString = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date
    : null;
};
