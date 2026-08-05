import { mockFetch } from '../mockClient';

describe('mockClient', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should resolve data after specified delay', async () => {
    const data = { id: 1, name: 'Test' };
    const promise = mockFetch(data, { delayMs: 1000 });

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    const result = await promise;
    expect(result).toEqual(data);
  });

  it('should reject with an error when shouldFail is true', async () => {
    expect.assertions(1);
    const promise = mockFetch({ id: 1 }, { shouldFail: true, delayMs: 500 });

    jest.advanceTimersByTime(500);

    try {
      await promise;
    } catch (e) {
      expect((e as Error).message).toBe('Simulated network error from mockClient');
    }
  });
});
