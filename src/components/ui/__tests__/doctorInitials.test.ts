import { doctorInitials } from '../DoctorPhoto';

jest.mock('@theme', () => ({ Colors: { primary: '#000' }, FontFamily: { bold: 'x' } }));

describe('doctorInitials', () => {
  it('skips the Dr. title', () => {
    expect(doctorInitials('Dr. Sarah Khan')).toBe('SK');
    expect(doctorInitials('dr Ahmed Rahman')).toBe('AR');
  });

  it('uses the first two names', () => {
    expect(doctorInitials('Md Abdul Karim')).toBe('MA');
  });

  it('falls back to ? without a name', () => {
    expect(doctorInitials(undefined)).toBe('?');
    expect(doctorInitials('  ')).toBe('?');
  });
});
