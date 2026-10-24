import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DoctorRegistrationForm } from '../DoctorRegistrationForm';
import { doctorsService } from '../../../services/api/doctorsService';

jest.mock('../../../services/api/doctorsService', () => ({
  doctorsService: { getCategories: jest.fn() },
}));

const renderForm = (onSubmit = jest.fn()) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DoctorRegistrationForm onSubmit={onSubmit} isLoading={false} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  (doctorsService.getCategories as jest.Mock).mockResolvedValue([
    { id: 'cardiology', name: 'Cardiology', doctorCount: 1 },
  ]);
});

// Audit D2: the licence is the BMDC number, separate from the qualification.
it('sends qualification, BMDC number and hospital as separate fields', async () => {
  const onSubmit = jest.fn();
  await renderForm(onSubmit);

  await fireEvent.changeText(screen.getByLabelText('Full Name input'), 'Dr. New');
  await fireEvent.press(await screen.findByLabelText('Cardiology'));
  await fireEvent.changeText(screen.getByLabelText('Qualifications input'), 'MBBS, FCPS');
  await fireEvent.changeText(screen.getByLabelText('BMDC Registration No. input'), 'A-12345');
  await fireEvent.changeText(
    screen.getByLabelText('Hospital / Chamber (optional) input'),
    'Square Hospital',
  );
  await fireEvent.press(screen.getByLabelText('Complete registration button'));

  expect(onSubmit).toHaveBeenCalledWith({
    fullName: 'Dr. New',
    department: 'Cardiology',
    qualification: 'MBBS, FCPS',
    licenseNumber: 'A-12345',
    hospitalName: 'Square Hospital',
  });
});

it('asks for a BMDC number with digits and a qualification', async () => {
  const onSubmit = jest.fn();
  await renderForm(onSubmit);

  await fireEvent.changeText(screen.getByLabelText('BMDC Registration No. input'), 'BMDC');
  await fireEvent.press(screen.getByLabelText('Complete registration button'));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('Enter your BMDC registration number, e.g. A-12345')).toBeTruthy();
  expect(screen.getByText('Enter your qualifications, e.g. MBBS')).toBeTruthy();
});
