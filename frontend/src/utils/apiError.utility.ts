import axios from 'axios';

import { ApiError, ProblemDetail } from '@/models';

const isProblem = (data: unknown): data is ProblemDetail =>
  typeof data === 'object' && data !== null && 'status' in data && 'code' in data;

const describeProblem = (problem: ProblemDetail): string => {
  const parts = [problem.detail ?? problem.title ?? 'The request failed.'];
  if (problem.errors?.length) {
    parts.push(problem.errors.map(issue => `${issue.field}: ${issue.message}`).join(' '));
  }
  if (problem.code === 'RATE_LIMITED' && problem.retryAfterSeconds) {
    parts.push(`Try again in ${problem.retryAfterSeconds} seconds.`);
  }
  return parts.join(' ');
};

/** Turns anything thrown by an API call into a message that is safe to show, reading RFC 9457 problems when present. */
export const toApiError = (err: unknown): ApiError => {
  if (axios.isAxiosError(err) && err.response) {
    const { status, statusText, data } = err.response;
    if (isProblem(data)) {
      return { message: describeProblem(data), statusCode: status, code: data.code, fieldErrors: data.errors };
    }
    return { message: statusText || 'The request failed.', statusCode: status };
  }
  if (err instanceof Error) {
    return { message: err.message, statusCode: null };
  }
  return { message: 'An unknown error occurred', statusCode: null };
};
