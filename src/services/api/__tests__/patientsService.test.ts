import { ageFromDateOfBirth, splitProfileList } from '../patientsService';

jest.mock('../axiosClient', () => ({ axiosClient: { get: jest.fn() } }));

describe('ageFromDateOfBirth', () => {
  const today = new Date(2026, 9, 12); // 12 Oct 2026, local time

  it('counts whole years, before and after the birthday', () => {
    expect(ageFromDateOfBirth('1990-10-12', today)).toBe(36);
    expect(ageFromDateOfBirth('1990-10-13', today)).toBe(35);
    expect(ageFromDateOfBirth('1990-01-01', today)).toBe(36);
  });

  it('returns null instead of inventing an age when none is recorded', () => {
    expect(ageFromDateOfBirth(null, today)).toBeNull();
    expect(ageFromDateOfBirth(undefined, today)).toBeNull();
    expect(ageFromDateOfBirth('', today)).toBeNull();
  });
});

describe('splitProfileList', () => {
  it('splits free text on commas, semicolons and new lines', () => {
    expect(splitProfileList('Penicillin, Aspirin;NSAIDs\nLatex')).toEqual([
      'Penicillin',
      'Aspirin',
      'NSAIDs',
      'Latex',
    ]);
  });

  it('returns an empty list when nothing is recorded', () => {
    expect(splitProfileList(null)).toEqual([]);
    expect(splitProfileList('  ')).toEqual([]);
  });
});
