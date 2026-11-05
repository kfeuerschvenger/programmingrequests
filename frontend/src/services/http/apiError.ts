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

/** The longest wait the UI will ever announce, so a hostile or mistaken value cannot promise hours. */
const MAX_RETRY_AFTER_SECONDS = 3600;

const DELTA_SECONDS = /^\d+$/;
const IMF_FIXDATE =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;

const clampSeconds = (seconds: number): number => Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(0, Math.ceil(seconds)));

/** Reads Retry-After as delta-seconds or as an IMF-fixdate, the only two forms HTTP defines, clamped to 0..3600. Anything looser (hex, exponent, fraction, free-form dates) is ignored. */
const parseRetryAfterHeader = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (DELTA_SECONDS.test(text)) return clampSeconds(Number(text));
  if (!IMF_FIXDATE.test(text)) return null;
  const date = Date.parse(text);
  return Number.isNaN(date) ? null : clampSeconds((date - Date.now()) / 1000);
};

/** The wait stated in the problem body, rounded up and clamped like the header. */
const parseRetryAfterBody = (value: unknown): number | null => {
  const seconds = asPositiveNumber(value);
  return seconds === null ? null : clampSeconds(seconds);
};

/** The failure the server reports when a client sends too many requests: its code decides, and a 429 with no code is the fallback. */
export const isRateLimited = (error: ApiError): boolean =>
  error.is('RATE_LIMITED') || (error.code === null && error.status === 429);

/** The failure the server reports when two requests collide: its code decides, and a 409 with no code is the fallback. */
export const isConflict = (error: ApiError): boolean =>
  error.is('CONFLICT') || (error.code === null && error.status === 409);

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
    retryAfterSeconds: parseRetryAfterBody(problem.retryAfterSeconds) ?? parseRetryAfterHeader(retryAfterHeader),
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
