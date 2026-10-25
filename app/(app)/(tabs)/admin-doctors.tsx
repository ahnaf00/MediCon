import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import AdminDoctorsScreen from '../admin/doctors/index';

/** Admin Doctors tab (audit L2b): the approvals list without a back arrow. */
export default function AdminDoctorsTab() {
  const role = useAuthStore((s) => s.role);
  if (role !== 'admin') return <Redirect href="/(app)/(tabs)" />;

  return <AdminDoctorsScreen embedded />;
}
