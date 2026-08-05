import { useDevStore } from '../../store/devStore';

export interface MockRequestOptions {
  shouldFail?: boolean;
  delayMs?: number;
}

/**
 * A mock service layer that simulates network latency and potential failures.
 * This is meant to fulfill the Phase 1 milestone requirements and will be replaced
 * by a real API client in Phase 2.
 */
export async function mockFetch<T>(data: T, options?: MockRequestOptions): Promise<T> {
  const { shouldFail = false, delayMs = 800 } = options || {};
  const { forceMockError, forceMockEmpty } = useDevStore.getState();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail || forceMockError) {
        // We simulate a 20% random failure rate if shouldFail is not explicitly passed,
        // but if shouldFail is explicitly true, we fail 100% of the time.
        // For deterministic testing, we just use the explicit flag.
        reject(new Error('Simulated network error from mockClient'));
      } else {
        // Even if shouldFail is false, we can simulate an occasional network blip
        // to test ErrorStates during manual testing, but we keep it deterministic
        // for now unless requested. Let's make it deterministic.

        // Force empty array if requested and data is an array
        if (forceMockEmpty && Array.isArray(data)) {
          resolve([] as unknown as T);
        } else {
          resolve(data);
        }
      }
    }, delayMs);
  });
}
