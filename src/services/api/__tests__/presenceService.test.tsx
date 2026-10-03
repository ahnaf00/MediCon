import React from 'react';
import { AppState } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDoctorPresence } from '../presenceService';

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../axiosClient', () => ({
  axiosClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

const heartbeats = () =>
  mockPost.mock.calls.filter(([url]) => url === '/doctor/presence/heartbeat').length;

const renderPresence = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useDoctorPresence(), { wrapper });
};

let appStateListener: ((state: string) => void) | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  mockGet.mockReset();
  mockPost.mockReset();
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (state: string) => void;
    return { remove: jest.fn() } as never;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('sends heartbeats every 2 minutes while online and in the foreground', async () => {
  mockGet.mockResolvedValue({ isOnline: true, lastSeenAt: null });
  mockPost.mockResolvedValue({ isOnline: true, lastSeenAt: null });

  const { result } = await renderPresence();
  await waitFor(() => expect(result.current.isOnline).toBe(true));
  await waitFor(() => expect(heartbeats()).toBe(1));

  await act(async () => {
    jest.advanceTimersByTime(2 * 60 * 1000);
  });
  await waitFor(() => expect(heartbeats()).toBe(2));

  // Backgrounded: beats stop, so the server lets presence lapse.
  await act(async () => {
    appStateListener?.('background');
  });
  await act(async () => {
    jest.advanceTimersByTime(10 * 60 * 1000);
  });
  expect(heartbeats()).toBe(2);
});

it('sends no heartbeats while offline', async () => {
  mockGet.mockResolvedValue({ isOnline: false, lastSeenAt: null });

  const { result } = await renderPresence();
  await waitFor(() => expect(result.current.canToggle).toBe(true));
  await act(async () => {
    jest.advanceTimersByTime(10 * 60 * 1000);
  });

  expect(heartbeats()).toBe(0);
});

it('turns the switch off when a heartbeat reports presence has lapsed', async () => {
  mockGet.mockResolvedValue({ isOnline: true, lastSeenAt: null });
  mockPost.mockResolvedValue({ isOnline: false, lastSeenAt: null });

  const { result } = await renderPresence();
  await waitFor(() => expect(heartbeats()).toBe(1));
  await waitFor(() => expect(result.current.isOnline).toBe(false));
});

it('rolls the switch back when saving fails', async () => {
  mockGet.mockResolvedValue({ isOnline: false, lastSeenAt: null });
  mockPost.mockRejectedValue(new Error('network'));

  const { result } = await renderPresence();
  await waitFor(() => expect(result.current.canToggle).toBe(true));

  await act(async () => {
    result.current.toggle();
  });

  await waitFor(() => expect(result.current.canToggle).toBe(true));
  expect(result.current.isOnline).toBe(false);
});
