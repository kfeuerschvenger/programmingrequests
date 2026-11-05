import axios from 'axios';

export interface FieldIssue {
  field: string;
  message: string;
}

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'canceled' | 'invalid_response' | 'unknown';

interface ApiErrorInit {
  kind: ApiErrorKind;
  message: string;
  status?: number | null;
  code?: string | null;
  title?: string | null;
  detail?: string | null;
  fieldErrors?: FieldIssue[];
  retryAfterSeconds?: number | null;
}

/** Every failure of an API call, whatever its origin, as one typed error. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;
  readonly title: string | null;
  readonly detail: string | null;
  readonly fieldErrors: FieldIssue[];
  readonly retryAfterSeconds: number | null;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status ?? null;
    this.code = init.code ?? null;
    this.title = init.title ?? null;
    this.detail = init.detail ?? null;
    this.fieldErrors = init.fieldErrors ?? [];
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }

  is(code: string): boolean {
    return this.code === code;
  }
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_MESSAGE = 'Could not reach the server. Check your connection and try again.';
const TIMEOUT_MESSAGE = 'The server took too long to respond. Please try again.';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const asString = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);

const asPositiveNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

const toFieldIssues = (value: unknown): FieldIssue[] => {
  if (!Array.isArray(value)) return [];
  const issues: FieldIssue[] = [];
  for (const entry of value as unknown[]) {
    if (isRecord(entry)) {
      const field = asString(entry.field);
      const message = asString(entry.message);
      if (field && message) issues.push({ field, message });
    }
  }
  return issues;
};

/** Reads Retry-After as delta-seconds or as an HTTP-date, clamping a date in the past to 0. */
const parseRetryAfterHeader = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (text === '') return null;
  const seconds = Number(text);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(text);
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - Date.now()) / 1000));
};

/** Reads an RFC 9457 problem body, falling back to the Retry-After header for the wait. */
const fromResponse = (status: number, data: unknown, retryAfterHeader: unknown): ApiError => {
  const problem = isRecord(data) ? data : {};
  const title = asString(problem.title);
  const detail = asString(problem.detail);
  const code = asString(problem.code);
  return new ApiError({
    kind: 'http',
    message: detail ?? title ?? FALLBACK_MESSAGE,
    status,
    code,
    title,
    detail,
    fieldErrors: toFieldIssues(problem.errors),
    retryAfterSeconds: asPositiveNumber(problem.retryAfterSeconds) ?? parseRetryAfterHeader(retryAfterHeader),
  });
};

/** Turns anything thrown by a request into an {@link ApiError}. */
export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError({ kind: 'canceled', message: 'The request was canceled.' });
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return fromResponse(error.response.status, error.response.data, error.response.headers?.['retry-after']);
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ kind: 'timeout', message: TIMEOUT_MESSAGE });
    }
    return new ApiError({ kind: 'network', message: NETWORK_MESSAGE });
  }
  return new ApiError({ kind: 'unknown', message: FALLBACK_MESSAGE });
};
