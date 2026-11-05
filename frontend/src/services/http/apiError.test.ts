import { AxiosError, CanceledError, AxiosHeaders, type AxiosResponse } from 'axios';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { problem } from '@/test/utils';
import { ApiError, normalizeError } from './apiError';
import { httpClient } from './httpClient';

const responseError = (status: number, data: unknown, headers: Record<string, string> = {}) => {
  const response = { status, data, headers, statusText: '', config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
};

describe('normalizeError', () => {
  it('reads an RFC 9457 problem', () => {
    const error = normalizeError(
      responseError(400, {
        status: 400,
        title: 'Bad Request',
        detail: 'Validation failed',
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'description', message: 'Too short' }, { field: 1 }, 'junk'],
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('http');
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.title).toBe('Bad Request');
    expect(error.detail).toBe('Validation failed');
    expect(error.message).toBe('Validation failed');
    expect(error.fieldErrors).toEqual([{ field: 'description', message: 'Too short' }]);
    expect(error.is('VALIDATION_FAILED')).toBe(true);
  });

  it('reads retryAfterSeconds from the body', () => {
    const error = normalizeError(
      responseError(429, { code: 'RATE_LIMITED', retryAfterSeconds: 12 }, { 'retry-after': '30' }),
    );
    expect(error.retryAfterSeconds).toBe(12);
  });

  it('falls back to the Retry-After header', () => {
    const error = normalizeError(responseError(429, { code: 'RATE_LIMITED' }, { 'retry-after': '7' }));
    expect(error.retryAfterSeconds).toBe(7);
  });

  it('reads Retry-After given as an HTTP-date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T10:00:00Z'));
    try {
      const error = normalizeError(responseError(429, {}, { 'retry-after': 'Wed, 01 Jan 2025 10:00:30 GMT' }));
      expect(error.retryAfterSeconds).toBe(30);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clamps a negative or past Retry-After to 0', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T10:00:00Z'));
    try {
      expect(normalizeError(responseError(429, {}, { 'retry-after': '-5' })).retryAfterSeconds).toBe(0);
      expect(
        normalizeError(responseError(429, {}, { 'retry-after': 'Wed, 01 Jan 2025 09:00:00 GMT' })).retryAfterSeconds,
      ).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores an invalid Retry-After header', () => {
    expect(normalizeError(responseError(429, {}, { 'retry-after': 'soon' })).retryAfterSeconds).toBeNull();
  });

  it('uses a generic message for a response without a problem body', () => {
    const error = normalizeError(responseError(502, '<html>bad gateway</html>'));
    expect(error.status).toBe(502);
    expect(error.code).toBeNull();
    expect(error.message).toBe('Something went wrong. Please try again.');
    expect(error.fieldErrors).toEqual([]);
  });

  it('maps a timeout', () => {
    const error = normalizeError(new AxiosError('timeout', 'ECONNABORTED'));
    expect(error.kind).toBe('timeout');
    expect(error.status).toBeNull();
  });

  it('maps a network failure', () => {
    expect(normalizeError(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe('network');
  });

  it('maps a cancellation', () => {
    expect(normalizeError(new CanceledError()).kind).toBe('canceled');
  });

  it('maps anything else to unknown', () => {
    expect(normalizeError('boom').kind).toBe('unknown');
  });

  it('returns an ApiError untouched', () => {
    const original = new ApiError({ kind: 'http', message: 'x' });
    expect(normalizeError(original)).toBe(original);
  });
});

describe('httpClient', () => {
  it('rejects with an ApiError built from the problem body', async () => {
    server.use(http.get('/api/boom', () => problem(404, 'IDEA_NOT_FOUND')));

    const error = await httpClient.get('/api/boom').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('IDEA_NOT_FOUND');
    expect((error as ApiError).status).toBe(404);
  });

  it('rejects with a network ApiError when the connection fails', async () => {
    server.use(http.get('/api/down', () => HttpResponse.error()));

    const error = await httpClient.get('/api/down').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('network');
  });
});
