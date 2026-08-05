import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { InteractionFlag } from '../InteractionFlag';
import { InteractionConflict } from '../../../services/ai/medicineAiService';

describe('InteractionFlag Component', () => {
  it('renders correctly for a SAFE conflict', async () => {
    const conflict: InteractionConflict = {
      existingMedicineId: '1',
      existingMedicineName: 'Lisinopril',
      severity: 'SAFE',
      explanation: 'No known significant interactions.',
    };

    await render(<InteractionFlag conflict={conflict} />);

    expect(screen.getByText('Safe')).toBeTruthy();
    expect(screen.getByText('Lisinopril')).toBeTruthy();
    expect(screen.getByText('No known significant interactions.')).toBeTruthy();

    const container = screen.getByTestId('interaction-flag-SAFE');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#F0FDF4' })]),
    );
  });

  it('renders correctly for a MINOR conflict', async () => {
    const conflict: InteractionConflict = {
      existingMedicineId: '2',
      existingMedicineName: 'Aspirin',
      severity: 'MINOR',
      explanation: 'May increase bleeding risk slightly.',
    };

    await render(<InteractionFlag conflict={conflict} />);

    expect(screen.getByText('Minor Interaction')).toBeTruthy();
    expect(screen.getByText('Aspirin')).toBeTruthy();
    expect(screen.getByText('May increase bleeding risk slightly.')).toBeTruthy();

    const container = screen.getByTestId('interaction-flag-MINOR');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#FFFBEB' })]),
    );
  });

  it('renders correctly for a SEVERE conflict', async () => {
    const conflict: InteractionConflict = {
      existingMedicineId: '3',
      existingMedicineName: 'Warfarin',
      severity: 'SEVERE',
      explanation: 'Severe risk of major bleeding. Do not mix.',
    };

    await render(<InteractionFlag conflict={conflict} />);

    expect(screen.getByText('Severe Interaction')).toBeTruthy();
    expect(screen.getByText('Warfarin')).toBeTruthy();
    expect(screen.getByText('Severe risk of major bleeding. Do not mix.')).toBeTruthy();

    const container = screen.getByTestId('interaction-flag-SEVERE');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#FEF2F2' })]),
    );
  });
});
