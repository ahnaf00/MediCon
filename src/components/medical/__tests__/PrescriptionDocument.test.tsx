import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { PrescriptionDocument } from '../PrescriptionDocument';
import type { PrescriptionDocumentData } from '../../../services/api/prescriptionsService';

const doc: PrescriptionDocumentData = {
  id: 7,
  issuedAt: '2026-09-02T20:00:00+00:00',
  issuedDate: 'Sep 3, 2026',
  diagnosisSummary: 'Viral fever',
  doctor: {
    name: 'Dr. Ahmed Hasan',
    qualification: 'MBBS, FCPS',
    specialty: 'Cardiology',
    hospitalName: 'Dhaka Medical College Hospital',
    bmdcRegistrationNo: 'A-28451',
  },
  patient: { name: 'Nusrat Jahan', gender: 'female', age: '35y 4m 12d', weightKg: 58.5 },
  tests: [{ name: 'CBC', instructions: null }],
  medicines: [
    {
      id: 1,
      name: 'Napa',
      dosage: '500mg',
      pattern: '1+0+1',
      durationDays: 7,
      instructions: 'After Meals',
    },
  ],
  followUpDate: '2026-09-17',
  advice: 'Rest and hydrate.',
};

describe('PrescriptionDocument', () => {
  it('renders the letterhead fields from the server payload', async () => {
    await render(<PrescriptionDocument doc={doc} />);

    expect(screen.getByText('BMDC Reg. No - A-28451')).toBeTruthy();
    expect(screen.getByText('Date: Sep 3, 2026')).toBeTruthy();
    expect(screen.getByText('35y 4m 12d')).toBeTruthy();
    expect(screen.getByText('58.5 kg')).toBeTruthy();
    expect(screen.getByText('Female')).toBeTruthy();
    expect(screen.getByText('1+0+1  ·  7 days  ·  After Meals')).toBeTruthy();
    // Follow-up is a calendar date: it must not shift a day through UTC.
    expect(screen.getByText(/Sep 17, 2026/)).toBeTruthy();
  });

  it('shows a dash for missing fields instead of inventing them', async () => {
    await render(
      <PrescriptionDocument
        doc={{
          ...doc,
          doctor: { ...doc.doctor, bmdcRegistrationNo: null },
          patient: { ...doc.patient, age: null, weightKg: null },
          tests: [],
          followUpDate: null,
          advice: null,
        }}
      />,
    );

    expect(screen.getByText('BMDC Reg. No - —')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.queryByText(/Follow-up/)).toBeNull();
    expect(screen.queryByText(/Advice/)).toBeNull();
  });
});
