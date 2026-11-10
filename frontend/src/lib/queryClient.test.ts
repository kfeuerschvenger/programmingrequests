import { ApiError } from '@/services/http/apiError';
import { createQueryClient, shouldRetryRead } from './queryClient';

describe('shouldRetryRead', () => {
  it('retries network, timeout and server errors a limited number of times', () => {
    expect(shouldRetryRead(0, new ApiError({ kind: 'network', message: 'x' }))).toBe(true);
    expect(shouldRetryRead(1, new ApiError({ kind: 'timeout', message: 'x' }))).toBe(true);
    expect(shouldRetryRead(0, new ApiError({ kind: 'http', message: 'x', status: 503 }))).toBe(true);
    expect(shouldRetryRead(2, new ApiError({ kind: 'network', message: 'x' }))).toBe(false);
  });

  it('does not retry client errors or foreign errors', () => {
    expect(shouldRetryRead(0, new ApiError({ kind: 'http', message: 'x', status: 404 }))).toBe(false);
    expect(shouldRetryRead(0, new Error('x'))).toBe(false);
  });

  it('is the default for queries, and mutations never retry', () => {
    const defaults = createQueryClient().getDefaultOptions();
    expect(defaults.queries?.retry).toBe(shouldRetryRead);
    expect(defaults.mutations?.retry).toBe(false);
  });
});
