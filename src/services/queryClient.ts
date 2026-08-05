import { QueryClient } from '@tanstack/react-query';

// Architecture state table defines specific staleTime conventions:
// 1. AI results (symptom triage, lab) -> long staleTime
// 2. Server data (doctors, medicines) -> standard staleTime

export const STANDARD_STALE_TIME = 1000 * 60 * 5; // 5 minutes
export const AI_RESULT_STALE_TIME = 1000 * 60 * 60 * 24; // 24 hours

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STANDARD_STALE_TIME,
      retry: 2,
    },
  },
});
