import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DoctorCard } from '../DoctorCard';
import { Doctor } from '../../../services/api/doctorsService';

const baseDoctor: Doctor = {
  id: '1',
  userId: '1',
  fullName: 'Dr. Test Doctor',
  department: 'Cardiology',
  licenseNumber: 'N/A',
  consultationFee: 800,
  isOnline: false,
  rating: 4.5,
  reviewCount: 0,
  about: '',
  experience: '10 Years',
  degrees: ['MBBS, FCPS (Medicine)'],
  bmdcNumber: 'N/A',
  followUpFee: 0,
  followUpDays: 0,
  workingHospital: '',
  totalPatients: 0,
  avgConsultationMinutes: 15,
  services: [],
  experienceList: [],
};

describe('DoctorCard (online variant)', () => {
  it("shows the doctor's own qualifications", async () => {
    await render(<DoctorCard doctor={baseDoctor} variant="online" />);

    expect(screen.getByText('MBBS, FCPS (Medicine)')).toBeTruthy();
  });

  it('never invents qualifications when they are missing', async () => {
    await render(<DoctorCard doctor={{ ...baseDoctor, degrees: [''] }} variant="online" />);

    expect(screen.getByText('Specialist')).toBeTruthy();
    expect(screen.queryByText(/FCPS|Diploma|Gynae/)).toBeNull();
  });
});
