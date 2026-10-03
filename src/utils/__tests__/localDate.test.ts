import { toLocalDateString } from '../localDate';

describe('toLocalDateString', () => {
  it('formats the local calendar date with zero padding', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses the local date late in the evening, not the UTC date', () => {
    expect(toLocalDateString(new Date(2026, 9, 3, 23, 59))).toBe('2026-10-03');
  });

  it('uses the local date just after midnight, not the UTC date', () => {
    expect(toLocalDateString(new Date(2026, 9, 4, 0, 30))).toBe('2026-10-04');
  });
});
