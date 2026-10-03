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
