import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrescriptionStatusPanel } from '../PrescriptionStatusPanel';
import { prescriptionsService } from '../../../services/api/prescriptionsService';
import type { Prescription } from '../../../types/medical.types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock('../../../services/api/axiosClient', () => ({ axiosClient: {} }));

// Audit G1: cancelled / allergy notices, and the prescriber's cancel + reissue.
const base: Prescription = {
  id: 7,
  source: 'DOCTOR',
  issuedAt: '2026-10-25T05:00:00+00:00',
  status: 'active',
  patient: { id: 3, name: 'Rahat Ahmed', avatarUrl: null },
  medicines: [],
};

const renderPanel = (prescription: Prescription, isPrescriber: boolean, onUpdated = jest.fn()) =>
  render(
    <QueryClientProvider
      // No garbage-collection timers, so jest exits as soon as the tests end.
      client={
        new QueryClient({
          defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } },
        })
      }
    >
      <PrescriptionStatusPanel
        prescription={prescription}
        isPrescriber={isPrescriber}
        onUpdated={onUpdated}
      />
    </QueryClientProvider>,
  );

beforeEach(() => jest.clearAllMocks());

it('tells the patient a cancelled prescription must not be used, with the reason', async () => {
  await renderPanel(
    {
      ...base,
      status: 'cancelled',
      voidedAt: '2026-10-25T06:00:00+00:00',
      voidReason: 'Wrong dose',
    },
    false,
  );

  expect(screen.getByText(/Do not use it/)).toBeTruthy();
  expect(screen.getByText('Reason: Wrong dose')).toBeTruthy();
  expect(screen.queryByLabelText('Cancel this prescription')).toBeNull();
});

it('shows the allergy warning the doctor confirmed, and that it is a name match', async () => {
  await renderPanel(
    { ...base, allergyConflicts: [{ medicine: 'Penicillin V', allergy: 'penicillin' }] },
    false,
  );

  expect(screen.getByText(/Penicillin V matches the recorded allergy/)).toBeTruthy();
  expect(screen.getByText(/compares names only/)).toBeTruthy();
});

it('lets the prescriber cancel with a reason, then offers a corrected prescription', async () => {
  const cancelled = { ...base, status: 'cancelled' as const, voidReason: 'Wrong dose' };
  const spy = jest.spyOn(prescriptionsService, 'voidPrescription').mockResolvedValue(cancelled);
  const onUpdated = jest.fn();
  await renderPanel(base, true, onUpdated);

  await fireEvent.press(screen.getByLabelText('Cancel this prescription'));
  await fireEvent.changeText(screen.getByLabelText('Reason for cancelling'), 'Wrong dose');
  await fireEvent.press(screen.getByText('Cancel prescription'));

  expect(spy).toHaveBeenCalledWith(7, 'Wrong dose');
  await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(cancelled));
});

it('opens the writer to reissue a cancelled prescription', async () => {
  await renderPanel({ ...base, status: 'cancelled' }, true);

  await fireEvent.press(screen.getByText('Issue a corrected prescription'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(app)/doctor/prescription/write',
    params: { patientId: '3', patientName: 'Rahat%20Ahmed', replacesPrescriptionId: '7' },
  });
});
