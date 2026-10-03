import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AnalysisProgressModal, SLOW_ANALYSIS_MS } from '../AnalysisProgressModal';

describe('AnalysisProgressModal', () => {
  afterEach(() => jest.useRealTimers());

  it('marks only the reading stage done while the server is processing', async () => {
    await render(<AnalysisProgressModal visible status="processing" onClose={jest.fn()} />);

    expect(screen.getByTestId('stage-reading-done')).toBeTruthy();
    expect(screen.getByTestId('stage-extracting-active')).toBeTruthy();
    expect(screen.getByTestId('stage-summary-active')).toBeTruthy();
  });

  it('marks every stage done once the server reports completion', async () => {
    await render(<AnalysisProgressModal visible status="completed" onClose={jest.fn()} />);

    expect(screen.getByTestId('stage-extracting-done')).toBeTruthy();
    expect(screen.getByTestId('stage-summary-done')).toBeTruthy();
  });

  it('does not advance stages on its own over time', async () => {
    jest.useFakeTimers();
    await render(<AnalysisProgressModal visible status="processing" onClose={jest.fn()} />);

    await act(async () => {
      jest.advanceTimersByTime(SLOW_ANALYSIS_MS + 1000);
    });

    expect(screen.getByTestId('stage-extracting-active')).toBeTruthy();
    expect(screen.getByText(/taking longer than usual/)).toBeTruthy();
  });

  it('can always be closed', async () => {
    const onClose = jest.fn();
    await render(<AnalysisProgressModal visible status="processing" onClose={onClose} />);

    fireEvent.press(screen.getByText('Continue in background'));

    expect(onClose).toHaveBeenCalled();
  });
});
