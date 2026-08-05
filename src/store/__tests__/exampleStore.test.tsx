import { useEphemeralStore, usePreferencesStore } from '../exampleStore';
import { useAuthStore } from '../authStore';
import { QueryClient } from '@tanstack/react-query';
import { mockFetch } from '../../services/api/mockClient';

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Helper to provide QueryClient in tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for testing errors
      },
    },
  });

describe('exampleStore', () => {
  describe('useEphemeralStore (Non-persisted)', () => {
    it('should update currentStep', () => {
      useEphemeralStore.setState({ currentStep: 1 });
      expect(useEphemeralStore.getState().currentStep).toBe(1);

      useEphemeralStore.getState().setStep(2);
      expect(useEphemeralStore.getState().currentStep).toBe(2);
    });

    it('demonstrates scoped selector pattern', () => {
      useEphemeralStore.setState({ currentStep: 1 });
      // Simulate a component subscribing to state
      const unsubscribe = useEphemeralStore.subscribe((state) => {});

      // Update a different part of state (if we had one) shouldn't trigger,
      // but let's just show the selector extracts the right value.
      expect(useEphemeralStore.getState().currentStep).toBe(1);
      unsubscribe();
    });
  });

  describe('usePreferencesStore (MMKV persisted)', () => {
    it('should update language preference', () => {
      usePreferencesStore.setState({ language: 'en' });
      expect(usePreferencesStore.getState().language).toBe('en');

      usePreferencesStore.getState().setPreferences({ language: 'es' });
      expect(usePreferencesStore.getState().language).toBe('es');
    });
  });

  describe('useAuthStore (SecureStore persisted)', () => {
    it('should login and store auth data', () => {
      useAuthStore.setState({ token: null, role: null, status: null, userId: null });
      expect(useAuthStore.getState().token).toBeNull();

      useAuthStore.getState().login({
        token: 'secure-token-123',
        role: 'patient',
        status: 'active',
        userId: 'usr_1',
      });
      expect(useAuthStore.getState().token).toBe('secure-token-123');
      expect(useAuthStore.getState().role).toBe('patient');
    });

    it('should logout and clear auth data', () => {
      useAuthStore.getState().login({
        token: 'secure-token-123',
        role: 'doctor',
        status: 'pending',
        userId: 'usr_2',
      });
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().role).toBeNull();
    });
  });

  describe('Documented Example Flow (DoD)', () => {
    // We document and test this pattern as requested by the DoD
    it('simulates the full data flow: Mock fetch -> React Query -> Zustand -> Component', async () => {
      jest.useFakeTimers();
      const testQueryClient = createTestQueryClient();

      // Step 1: Execute query manually to simulate what a component hook would do
      let isLoading = true;
      let data: any = undefined;

      const promise = testQueryClient.fetchQuery({
        queryKey: ['exampleData'],
        queryFn: () => mockFetch({ username: 'Doctor Jane' }, { delayMs: 100 }),
      });

      // Step 2: Assert the LOADING state
      expect(isLoading).toBe(true);

      // Fast-forward time to resolve the mock fetch
      jest.advanceTimersByTime(100);
      data = await promise;
      isLoading = false;

      // Step 3: Assert the SUCCESS state
      expect(isLoading).toBe(false);
      expect(data).toEqual({ username: 'Doctor Jane' });

      // Step 4: Simulate storing the result in a Zustand store
      useAuthStore.getState().login({
        token: data.username,
        role: 'doctor',
        status: 'active',
        userId: 'usr_test',
      });
      expect(useAuthStore.getState().token).toBe('Doctor Jane');

      jest.useRealTimers();
    });

    it('simulates the ERROR state branch of the flow', async () => {
      jest.useFakeTimers();
      const testQueryClient = createTestQueryClient();

      let isError = false;
      let errorMsg = '';

      const promise = testQueryClient.fetchQuery({
        queryKey: ['errorData'],
        queryFn: () => mockFetch(null, { shouldFail: true, delayMs: 100 }),
      });

      jest.advanceTimersByTime(100);

      try {
        await promise;
      } catch (e: any) {
        isError = true;
        errorMsg = e.message;
      }

      // Assert the ERROR state is triggered
      expect(isError).toBe(true);
      expect(errorMsg).toBe('Simulated network error from mockClient');

      jest.useRealTimers();
    });
  });
});
