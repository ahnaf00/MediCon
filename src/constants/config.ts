export const Config = {
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    TIMEOUT: 15000,
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
  },
  MOCK: {
    LATENCY_MS: 1000,
    ENABLED: process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
  },
} as const;
