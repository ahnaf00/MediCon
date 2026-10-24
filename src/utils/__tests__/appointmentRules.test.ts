import { patientMayChange, startOpensAt, startWindow } from '../appointmentRules';

// Audit F10: the same edges as the API's AppointmentLifecycle.
const START = '2026-10-05T03:00:00+00:00';
const at = (iso: string) => new Date(iso);

describe('startWindow', () => {
  it('opens 15 minutes before and closes 2 hours after', () => {
    expect(startWindow(START, at('2026-10-05T02:44:00Z'))).toBe('early');
    expect(startWindow(START, at('2026-10-05T02:45:00Z'))).toBe('open');
    expect(startWindow(START, at('2026-10-05T05:00:00Z'))).toBe('open');
    expect(startWindow(START, at('2026-10-05T05:01:00Z'))).toBe('late');
  });

  it('gives the opening moment', () => {
    expect(startOpensAt(START).toISOString()).toBe('2026-10-05T02:45:00.000Z');
  });
});

describe('patientMayChange', () => {
  it('allows changes until 1 hour before', () => {
    expect(patientMayChange(START, at('2026-10-05T01:59:00Z'))).toBe(true);
    expect(patientMayChange(START, at('2026-10-05T02:00:00Z'))).toBe(false);
    expect(patientMayChange(null)).toBe(false);
  });
});
