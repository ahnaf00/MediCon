import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BiomarkerRow } from '../BiomarkerRow';
import type { LabResult } from '../../../services/api/reportsService';

const base: LabResult = {
  id: 1,
  panel: 'Complete Blood Count',
  subGroup: 'Red Blood Cells',
  name: 'Haemoglobin',
  value: '12.1',
  unit: 'g/dL',
  referenceText: 'F 11.5–15.5, M 13.8–18.0',
  referenceLow: null,
  referenceHigh: null,
  status: 'normal',
};

describe('BiomarkerRow', () => {
  it('shows value, unit and the sex-specific reference text exactly as printed', async () => {
    await render(<BiomarkerRow result={base} />);

    expect(screen.getByText('Haemoglobin')).toBeTruthy();
    expect(screen.getByText('12.1')).toBeTruthy();
    expect(screen.getByText('g/dL')).toBeTruthy();
    expect(screen.getByText('F 11.5–15.5, M 13.8–18.0')).toBeTruthy();
    expect(screen.getByTestId('status-dot-normal')).toBeTruthy();
    expect(screen.queryByText('High')).toBeNull();
  });

  it('labels out-of-range values in words, not only by colour', async () => {
    await render(<BiomarkerRow result={{ ...base, name: 'MPV', value: '12.7', status: 'high' }} />);

    expect(screen.getByTestId('status-dot-high')).toBeTruthy();
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('shows an unknown status without a flag', async () => {
    await render(<BiomarkerRow result={{ ...base, status: 'unknown', referenceText: null }} />);

    expect(screen.getByTestId('status-dot-unknown')).toBeTruthy();
    expect(screen.queryByText('Reference Intervals:')).toBeNull();
  });
});
