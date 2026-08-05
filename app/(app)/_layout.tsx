import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuthStore } from '../../src/store';

export default function AppLayout() {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
