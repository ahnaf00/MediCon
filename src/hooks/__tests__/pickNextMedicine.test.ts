import { pickNextMedicine } from '../usePatientDashboard';
import type { Prescription } from '../../types/medical.types';

jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../../services/api/prescriptionsService', () => ({ usePrescriptions: jest.fn() }));
jest.mock('../../services/api/consultationsService', () => ({
  useAppointments: jest.fn(),
  LATE_START_GRACE_MS: 0,
}));

const rx = (issuedAt: string, durationDays: number): Prescription => ({
  id: 1,
  issuedAt,
  status: 'active',
  medicines: [
    { id: 1, name: 'Napa', dosage: '500mg', durationDays, dosageSchedule: { night: '21:00' } },
  ],
});

describe('pickNextMedicine', () => {
  const today = new Date(2026, 9, 24, 10, 0);

  it('shows a medicine on the last day of its course', () => {
    // Issued Oct 20 for 5 days: due Oct 20–24.
    expect(pickNextMedicine([rx('2026-10-20T04:00:00Z', 5)], today)?.medicines[0].name).toBe(
      'Napa',
    );
  });

  it('hides a course that ended, even if the server still says active', () => {
    expect(pickNextMedicine([rx('2026-08-08T04:00:00Z', 5)], today)).toBeNull();
  });
});
