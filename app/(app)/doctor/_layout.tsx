import { Stack } from 'expo-router';
import React from 'react';

export default function DoctorStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="patient/[id]" />
      <Stack.Screen name="consultation/[id]" />
      <Stack.Screen name="prescription/write" />
      <Stack.Screen name="prescription/[id]" />
    </Stack>
  );
}
