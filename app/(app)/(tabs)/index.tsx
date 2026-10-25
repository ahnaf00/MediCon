import React from 'react';
import { useAuthStore } from '../../../src/store/authStore';
import { PatientDashboard } from '../../../src/components/dashboard/PatientDashboard';
import { DoctorDashboard } from '../../../src/components/dashboard/DoctorDashboard';
import { AdminDashboard } from '../../../src/components/dashboard/AdminDashboard';

export default function HomeScreen() {
  const role = useAuthStore((s) => s.role);

  if (role === 'doctor') {
    return <DoctorDashboard />;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // Default to patient dashboard (also covers null role gracefully)
  return <PatientDashboard />;
}
