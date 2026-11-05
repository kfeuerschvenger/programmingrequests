import type { ApiError } from '@/services/http/apiError';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
