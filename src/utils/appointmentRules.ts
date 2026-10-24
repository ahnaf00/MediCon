/**
 * Appointment time rules, mirroring the API's AppointmentLifecycle (audit F10).
 * The API enforces them; the app uses them only to show the right buttons and hints.
 */

/** The doctor may start a visit this many minutes before its time... */
export const START_EARLY_MINUTES = 15;
/** ...and until this many minutes after it; an unstarted visit then expires. */
export const START_LATE_MINUTES = 120;
/** The patient may cancel or move a visit until this many minutes before it. */
export const PATIENT_CHANGE_CUTOFF_MINUTES = 60;

const MINUTE = 60_000;

export type StartWindow = 'early' | 'open' | 'late';

/** Where `now` falls against the visit's start window. */
export function startWindow(startsAt: string, now: Date = new Date()): StartWindow {
  const start = new Date(startsAt).getTime();
  if (now.getTime() < start - START_EARLY_MINUTES * MINUTE) return 'early';
  if (now.getTime() > start + START_LATE_MINUTES * MINUTE) return 'late';
  return 'open';
}

/** The earliest moment the doctor can start the visit. */
export function startOpensAt(startsAt: string): Date {
  return new Date(new Date(startsAt).getTime() - START_EARLY_MINUTES * MINUTE);
}

/** Whether the patient can still cancel or move the visit. */
export function patientMayChange(startsAt: string | null, now: Date = new Date()): boolean {
  if (!startsAt) return false;
  return now.getTime() < new Date(startsAt).getTime() - PATIENT_CHANGE_CUTOFF_MINUTES * MINUTE;
}
