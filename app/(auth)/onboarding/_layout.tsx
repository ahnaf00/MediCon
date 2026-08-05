// 1. IMPORTS
import React from 'react';
import { Stack } from 'expo-router';

// 2. TYPES
// No local types needed.

// 3. COMPONENT
export default function OnboardingLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
