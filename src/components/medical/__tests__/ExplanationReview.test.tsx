import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExplanationReview } from '../ExplanationReview';
import { prescriptionsService } from '../../../services/api/prescriptionsService';
import type { PrescriptionMedicine } from '../../../types/medical.types';

jest.mock('../../../services/api/prescriptionsService', () => ({
  prescriptionsService: { updateExplanation: jest.fn() },
}));
const update = prescriptionsService.updateExplanation as jest.Mock;

const med: PrescriptionMedicine = {
  id: '7',
  name: 'Napa',
  dosage: '500mg',
  durationDays: 5,
  explanation: 'AI text about Napa.',
  explanationSource: 'ai',
  explanationHidden: false,
};

const renderReview = (m: PrescriptionMedicine, onUpdated = jest.fn()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ExplanationReview prescriptionId="3" med={m} onUpdated={onUpdated} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  update.mockReset();
  jest.restoreAllMocks();
});

it('shows the AI text and says the patient sees it labelled as AI', async () => {
  await renderReview(med);
  expect(screen.getByText('AI text about Napa.')).toBeTruthy();
  expect(screen.getByText(/AI-generated\. The patient sees it labelled as AI/)).toBeTruthy();
  expect(screen.queryByText('Hidden from patient')).toBeNull();
});

it('hides it from the patient', async () => {
  const onUpdated = jest.fn();
  update.mockResolvedValue({ id: '3' });
  await renderReview(med, onUpdated);

  await fireEvent.press(screen.getByText('Hide from patient'));

  expect(update).toHaveBeenCalledWith('3', '7', { hidden: true });
  expect(onUpdated).toHaveBeenCalledWith({ id: '3' });
});

it('marks a hidden explanation and offers to show it again', async () => {
  await renderReview({ ...med, explanationHidden: true });
  expect(screen.getByText('Hidden from patient')).toBeTruthy();
  expect(screen.getByText('Show to patient')).toBeTruthy();
});

it("saves the doctor's own text", async () => {
  update.mockResolvedValue({ id: '3' });
  await renderReview(med);

  await fireEvent.press(screen.getByText('Edit'));
  await fireEvent.changeText(screen.getByLabelText('Explanation text'), '  Take after food.  ');
  await fireEvent.press(screen.getByText('Save'));

  expect(update).toHaveBeenCalledWith('3', '7', { explanation: 'Take after food.' });
});

it('offers to write one when there is no explanation, and cannot hide nothing', async () => {
  await renderReview({ ...med, explanation: undefined, explanationSource: undefined });
  expect(screen.getByText('Write one')).toBeTruthy();
  expect(screen.queryByText('Hide from patient')).toBeNull();
});

it('says so when saving fails', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  update.mockRejectedValue(new Error('Only the prescribing doctor can change this.'));
  await renderReview(med);

  await fireEvent.press(screen.getByText('Hide from patient'));

  expect(alert).toHaveBeenCalledWith(
    'Could not save',
    'Only the prescribing doctor can change this.',
  );
});
