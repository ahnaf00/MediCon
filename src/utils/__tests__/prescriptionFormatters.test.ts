import { getMedicineDescription, toDosePattern } from '../prescriptionFormatters';

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
