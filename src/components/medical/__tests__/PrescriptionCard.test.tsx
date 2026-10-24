import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PrescriptionCard } from '../PrescriptionCard';
import { uploadToPrescription } from '../../../services/api/prescriptionUploadsService';

jest.mock('../../../services/api/axiosClient', () => ({ axiosClient: {} }));

// Task 1.7: an uploaded paper prescription is shown as pages, never as medicines or a status.
const upload = {
  id: 4,
  title: 'Fever prescription',
  doctorName: 'Dr. Outside Clinic',
  issuedOn: '2026-10-20',
  notes: null,
  createdAt: '2026-10-25T10:00:00+00:00',
  pageCount: 2,
  pages: [],
};

it('maps an upload to an UPLOADED list item dated by the date on the paper', () => {
  const rx = uploadToPrescription(upload);
  expect(rx.source).toBe('UPLOADED');
  expect(rx.diagnosisSummary).toBe('Fever prescription');
  expect(rx.medicines).toEqual([]);
  const issued = new Date(rx.issuedAt);
  expect([issued.getFullYear(), issued.getMonth() + 1, issued.getDate()]).toEqual([2026, 10, 20]);

  expect(uploadToPrescription({ ...upload, title: null, issuedOn: null }).issuedAt).toBe(
    upload.createdAt,
  );
  expect(uploadToPrescription({ ...upload, title: null }).diagnosisSummary).toBe(
    'Paper prescription',
  );
});

it('shows the page count and no status for an upload', async () => {
  await render(
    <PrescriptionCard prescription={uploadToPrescription(upload)} onPress={jest.fn()} />,
  );

  expect(screen.getByText('2 Pages')).toBeTruthy();
  expect(screen.getByText('Uploaded · Dr. Outside Clinic')).toBeTruthy();
  expect(screen.queryByText(/Medicine/)).toBeNull();
  expect(screen.queryByText('Active')).toBeNull();
});
