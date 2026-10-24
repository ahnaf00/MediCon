import { courseLastDay } from '../courseDates';

describe('courseLastDay', () => {
  it('counts the issue day as day one', () => {
    // 10:00 Dhaka on Oct 20 (04:00 UTC), 5 days: Oct 20–24.
    expect(courseLastDay('2026-10-20T04:00:00Z', { durationDays: 5 })).toBe('2026-10-24');
  });

  it('treats a missing or zero duration as one day', () => {
    expect(courseLastDay('2026-10-20T04:00:00Z', { durationDays: 0 })).toBe('2026-10-20');
  });

  it('returns an empty string for an unreadable date', () => {
    expect(courseLastDay('not a date', { durationDays: 3 })).toBe('');
  });
});
