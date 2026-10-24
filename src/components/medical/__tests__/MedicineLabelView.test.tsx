import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MedicineLabelView } from '../MedicineLabelView';
import type { MedicineLabel } from '../../../services/ai/medicineAiService';

const label: MedicineLabel = {
  brandName: 'Tylenol',
  genericName: 'ACETAMINOPHEN',
  manufacturer: null,
  purpose: 'Purpose Pain reliever',
  warnings: null,
};

describe('MedicineLabelView', () => {
  it('says which US name was searched', async () => {
    await render(<MedicineLabelView label={{ ...label, searchedAs: 'acetaminophen' }} />);
    expect(screen.getByText('US label found under its US name: acetaminophen.')).toBeTruthy();
  });

  it('shows no note when the typed name was searched', async () => {
    await render(<MedicineLabelView label={{ ...label, searchedAs: null }} />);
    expect(screen.queryByText(/US label found under/)).toBeNull();
  });

  it('says a missing field is not listed instead of guessing', async () => {
    await render(<MedicineLabelView label={label} />);
    expect(screen.getAllByText('Not listed on the label.').length).toBe(2);
  });
});
