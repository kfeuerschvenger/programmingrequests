import axios from 'axios';
import { API_TIMEOUT_MS } from '@/config/api';
import { normalizeError } from './apiError';

export const httpClient = axios.create({
  timeout: API_TIMEOUT_MS,
  headers: { Accept: 'application/json, application/problem+json' },
});

// Every rejection leaves the client as an ApiError, so callers never inspect axios errors.
httpClient.interceptors.response.use(
  response => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
);
