import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/services/http/apiError';

const MAX_READ_RETRIES = 2;

/** Reads are retried only when the failure can pass by itself: the network, a timeout or a server error. */
export const shouldRetryRead = (failureCount: number, error: Error): boolean => {
  if (failureCount >= MAX_READ_RETRIES) return false;
  if (!(error instanceof ApiError)) return false;
  return error.kind === 'network' || error.kind === 'timeout' || (error.status !== null && error.status >= 500);
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetryRead, refetchOnWindowFocus: false, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
