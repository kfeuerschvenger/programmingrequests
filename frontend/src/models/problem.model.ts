export interface FieldIssue {
  field: string;
  message: string;
}

/** RFC 9457 problem returned by the API for every error. */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  code: string;
  errors?: FieldIssue[];
  retryAfterSeconds?: number;
}
