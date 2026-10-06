import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TranscriptCard } from '../TranscriptCard';
import { formatOffset } from '../TranscriptView';
import type { ConsultationTranscript } from '../../../services/api/callsService';

const mockRetry = jest.fn();
let mockTranscript: { isLoading: boolean; isError: boolean; data?: ConsultationTranscript };

jest.mock('../../../services/api/callsService', () => ({
  useConsultationTranscript: () => ({ ...mockTranscript, refetch: jest.fn() }),
  useRetryTranscript: () => ({ mutate: mockRetry, isPending: false }),
}));

const transcript = (overrides: Partial<ConsultationTranscript>): ConsultationTranscript => ({
  appointmentId: 7,
  status: 'ready',
  skipReason: null,
  error: null,
  language: 'mixed',
  draftSummary: null,
  segments: [],
  transcribedAt: null,
  ...overrides,
});

const renderCard = async (data: ConsultationTranscript) => {
  mockTranscript = { isLoading: false, isError: false, data };
  const props = { appointmentId: 7, onUseDraft: jest.fn(), onViewTranscript: jest.fn() };
  await render(<TranscriptCard {...props} />);
  return props;
};

describe('TranscriptCard', () => {
  beforeEach(() => mockRetry.mockReset());

  it.each([
    ['recording', 'Finishing the call recording'],
    ['transcribing', 'Transcribing the call'],
    ['summarizing', 'Writing the AI draft summary'],
  ] as const)('shows the server status %s as progress', async (status, text) => {
    await renderCard(transcript({ status }));

    expect(screen.getByText(new RegExp(text))).toBeTruthy();
    expect(screen.queryByText('Use AI draft')).toBeNull();
  });

  it('explains why a call was not recorded', async () => {
    await renderCard(transcript({ status: 'skipped', skipReason: 'no_consent' }));

    expect(screen.getByText(/needs both you and the patient to agree/)).toBeTruthy();
  });

  it('shows the server error and retries on request', async () => {
    await renderCard(
      transcript({
        status: 'failed',
        error: 'The call could not be transcribed. The recording is kept.',
      }),
    );

    expect(
      screen.getByText('The call could not be transcribed. The recording is kept.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText('Retry'));

    expect(mockRetry).toHaveBeenCalledWith({ appointmentId: 7 }, expect.anything());
  });

  it('offers the transcript and the AI draft once ready', async () => {
    const draftSummary = {
      chiefComplaint: 'Cough for three days.',
      findings: 'Not discussed',
      advice: 'Rest.',
      redFlags: ['Shortness of breath'],
    };
    const props = await renderCard(
      transcript({
        status: 'ready',
        draftSummary,
        segments: [{ speakerRole: 'doctor', startMs: 400, text: 'Hello' }],
      }),
    );

    await fireEvent.press(screen.getByText('Use AI draft'));
    await fireEvent.press(screen.getByText('View transcript'));

    expect(props.onUseDraft).toHaveBeenCalledWith(draftSummary);
    expect(props.onViewTranscript).toHaveBeenCalled();
  });

  it('says so when nothing was said', async () => {
    await renderCard(transcript({ status: 'ready', draftSummary: null, segments: [] }));

    expect(screen.getByText(/no speech that could be transcribed/)).toBeTruthy();
    expect(screen.queryByText('Use AI draft')).toBeNull();
    expect(screen.queryByText('View transcript')).toBeNull();
  });
});

describe('formatOffset', () => {
  it.each([
    [0, '0:00'],
    [3_500, '0:03'],
    [75_000, '1:15'],
    [3_725_000, '1:02:05'],
  ])('formats %i ms as %s', (ms, text) => {
    expect(formatOffset(ms)).toBe(text);
  });
});
