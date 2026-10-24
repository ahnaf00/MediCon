import {
  formatAmount,
  getMedicineDescription,
  routeLabel,
  toDosePattern,
} from '../prescriptionFormatters';

describe('toDosePattern', () => {
  it('maps morning/noon/night to 1+1+1 style patterns', () => {
    expect(toDosePattern({ morning: '08:00', noon: '14:00', night: '20:00' })).toBe('1+1+1');
    expect(toDosePattern({ morning: '08:00', night: '20:00' })).toBe('1+0+1');
    expect(toDosePattern({ noon: '14:00' })).toBe('0+1+0');
  });

  it('returns undefined instead of inventing a schedule', () => {
    expect(toDosePattern(null)).toBeUndefined();
    expect(toDosePattern(undefined)).toBeUndefined();
    expect(toDosePattern({})).toBeUndefined();
  });

  it('produces a pattern the description parser understands', () => {
    expect(
      getMedicineDescription(toDosePattern({ morning: '08:00', night: '20:00' }), 'After Meals'),
    ).toBe('Take in the morning and night after meals');
  });
});

// Audit G1: amounts per time of day, printed the same way as the API letterhead.
describe('dose amounts and route', () => {
  it('prints amounts, with fractions, and counts a slot without one as 1', () => {
    expect(toDosePattern({ morning: '08:00', night: '20:00' }, { morning: 2, night: 1 })).toBe(
      '2+0+1',
    );
    expect(toDosePattern({ morning: '08:00', night: '20:00' }, { morning: 0.5, night: 0.5 })).toBe(
      '½+0+½',
    );
    expect(toDosePattern({ morning: '08:00', noon: '14:00' }, { morning: 1.5 })).toBe('1½+1+0');
    expect(toDosePattern({ morning: '08:00' }, null)).toBe('1+0+0');
  });

  it('formats amounts like the API', () => {
    expect([1, 0.5, 1.5, 0.25, 2.75, 3].map(formatAmount)).toEqual([
      '1',
      '½',
      '1½',
      '¼',
      '2¾',
      '3',
    ]);
  });

  it('names routes in plain words', () => {
    expect(routeLabel('oral')).toBe('By mouth');
    expect(routeLabel('eye')).toBe('In the eye');
    expect(routeLabel(null)).toBeUndefined();
  });
});
