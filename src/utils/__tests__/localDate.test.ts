import { fromLocalDateString, toLocalDateString } from '../localDate';

describe('fromLocalDateString', () => {
  it('returns local midnight of the printed date', () => {
    const date = fromLocalDateString('2026-08-13');
    expect(date).not.toBeNull();
    expect([date!.getFullYear(), date!.getMonth(), date!.getDate(), date!.getHours()]).toEqual([
      2026, 7, 13, 0,
    ]);
  });

  it('round-trips with toLocalDateString', () => {
    expect(toLocalDateString(fromLocalDateString('2026-01-05')!)).toBe('2026-01-05');
  });

  it('rejects malformed or impossible dates', () => {
    expect(fromLocalDateString('13/08/2026')).toBeNull();
    expect(fromLocalDateString('2026-02-30')).toBeNull();
    expect(fromLocalDateString('')).toBeNull();
  });
});

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
