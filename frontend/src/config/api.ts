/** Same-origin API root: nginx in production and the Vite dev proxy both forward /api to the backend. */
export const API_BASE_URL = '/api';

/** Milliseconds before a request is abandoned. */
export const API_TIMEOUT_MS = 15_000;

export const endpoints = {
  ideas: () => `${API_BASE_URL}/ideas`,
  vote: (id: number) => `${API_BASE_URL}/ideas/${id}/vote`,
} as const;
