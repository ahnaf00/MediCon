import { dhakaDateLabel, dhakaDay, dhakaTime } from '../../../services/api/adminService';

// Audit L2b step 2: the Visits tab works in Dhaka days whatever the phone's timezone.

describe('dhakaDay', () => {
  it('rolls over at Dhaka midnight, not UTC midnight', () => {
    // 17:59 UTC is 23:59 in Dhaka; 18:00 UTC is already the next day there.
    expect(dhakaDay(0, new Date('2026-10-25T17:59:00Z'))).toBe('2026-10-25');
    expect(dhakaDay(0, new Date('2026-10-25T18:00:00Z'))).toBe('2026-10-26');
  });

  it('counts days forward and back across a month end', () => {
    const now = new Date('2026-10-31T10:00:00Z');
    expect(dhakaDay(1, now)).toBe('2026-11-01');
    expect(dhakaDay(-1, now)).toBe('2026-10-30');
    expect(dhakaDay(-6, now)).toBe('2026-10-25');
  });
});

describe('dhakaTime and dhakaDateLabel', () => {
  it('shows the clinic clock time', () => {
    expect(dhakaTime('2026-10-25T03:30:00Z')).toBe('9:30 AM');
    expect(dhakaTime('2026-10-25T06:05:00Z')).toBe('12:05 PM');
    expect(dhakaTime('2026-10-25T18:00:00Z')).toBe('12:00 AM');
    expect(dhakaTime('2026-10-25T09:30:00+06:00')).toBe('9:30 AM');
  });

  it('labels the Dhaka date, which can differ from the UTC one', () => {
    expect(dhakaDateLabel('2026-10-25T03:30:00Z')).toBe('Sun 25 Oct');
    expect(dhakaDateLabel('2026-10-25T19:00:00Z')).toBe('Mon 26 Oct');
  });
});
