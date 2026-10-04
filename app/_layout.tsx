import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { registerGlobals } from '@livekit/react-native';
import { queryClient } from '../src/services/queryClient';
import { useOnboardingStore, useAuthStore } from '../src/store';
import '../src/i18n';

// WebRTC globals for livekit-client (video consultations). Must run once, before any Room is created.
registerGlobals();

const storesHydrated = () =>
  useAuthStore.persist.hasHydrated() && useOnboardingStore.persist.hasHydrated();

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(storesHydrated);

  // Persisted stores hydrate asynchronously from SecureStore; routing on the
  // pre-hydration defaults would send a logged-in user to login/onboarding.
  useEffect(() => {
    const check = () => setHydrated(storesHydrated());
    const unsubAuth = useAuthStore.persist.onFinishHydration(check);
    const unsubOnboarding = useOnboardingStore.persist.onFinishHydration(check);
    check();
    return () => {
      unsubAuth();
      unsubOnboarding();
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !segments.length) return;

    const inAuth = segments[0] === '(auth)';
    const inApp = segments[0] === '(app)';
    const onOnboarding =
      inAuth && segments.length > 1 && (segments as string[])[1] === 'onboarding';

    // 1. Onboarding gate (highest priority)
    if (!hasSeenOnboarding) {
      if (!onOnboarding) {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    // 2. Auth gate
    if (!token && inApp) {
      // Unauthenticated user trying to access app — kick to login
      router.replace('/(auth)/login');
      return;
    }

    if (token && inAuth && !onOnboarding) {
      // Authenticated user still in auth screens (not onboarding) — send to app
      router.replace('/(app)/(tabs)');
      return;
    }

    // 3. If they have seen onboarding but are still on onboarding, kick to login
    if (onOnboarding) {
      router.replace('/(auth)/login');
    }
  }, [hydrated, segments, hasSeenOnboarding, token, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
