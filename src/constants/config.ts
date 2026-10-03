// API base URL is set per build profile via EXPO_PUBLIC_API_URL in eas.json
// (or .env for `expo start`). The preview/production profiles currently hold a
// placeholder host — replace it with the deployed production domain.
const DEV_FALLBACK_API_URL = 'http://localhost:8000/api/v1';

const resolveApiUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    if (!__DEV__) {
      // eslint-disable-next-line no-console -- surface a misconfigured build
      console.error('EXPO_PUBLIC_API_URL is not set for this build; API requests will fail.');
    }
    return __DEV__ ? DEV_FALLBACK_API_URL : '';
  }

  if (!__DEV__ && !url.startsWith('https://')) {
    // eslint-disable-next-line no-console -- surface a misconfigured build
    console.error(`EXPO_PUBLIC_API_URL must use HTTPS outside development (got ${url}).`);
  }

  return url;
};

export const Config = {
  API: {
    BASE_URL: resolveApiUrl(),
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
