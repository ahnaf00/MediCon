import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { InteractionFlag } from '../InteractionFlag';
import { InteractionConflict } from '../../../services/ai/medicineAiService';
import '../../../i18n';

describe('InteractionFlag Component', () => {
  it('renders an unmatched pair as not checked, never as safe', async () => {
    const conflict: InteractionConflict = {
      existingMedicineId: '1',
      existingMedicineName: 'Lisinopril',
      severity: 'NOT_CHECKED',
      explanation: 'server text is not shown for unchecked pairs',
      pair: ['DrugX', 'Lisinopril'],
    };

    await render(<InteractionFlag conflict={conflict} />);

    expect(screen.getByText('Not checked')).toBeTruthy();
    expect(screen.getByText('Lisinopril')).toBeTruthy();
    expect(screen.getByText('Not checked — ask your doctor or pharmacist.')).toBeTruthy();
    expect(screen.queryByText(/safe/i)).toBeNull();

    const container = screen.getByTestId('interaction-flag-NOT_CHECKED');
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#F3F4F6' })]),
    );
  });

  it('renders correctly for a MINOR conflict', async () => {
    const conflict: InteractionConflict = {
      existingMedicineId: '2',
      existingMedicineName: 'Aspirin',
      severity: 'MINOR',
      explanation: 'May increase bleeding risk slightly.',
      pair: ['DrugX', 'Aspirin'],
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
      pair: ['Aspirin', 'Warfarin'],
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
