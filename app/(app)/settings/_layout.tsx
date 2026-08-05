import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../../src/theme';

export default function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerShadowVisible: false,
        headerBackVisible: true,
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: t('settings.title') || 'Settings' }}
      />
      <Stack.Screen name="profile" options={{ title: t('settings.profile') || 'Profile' }} />
      <Stack.Screen name="language" options={{ title: t('settings.language') || 'Language' }} />
      <Stack.Screen
        name="dependents/index"
        options={{ title: t('settings.dependents') || 'Dependents' }}
      />
      <Stack.Screen
        name="dependents/[id]"
        options={{ title: t('settings.editDependent') || 'Dependent' }}
      />
    </Stack>
  );
}
