import { AxiosResponse } from 'axios';
import { FieldIssue } from './problem.model';

export interface UseApiCall<T> {
  call: Promise<AxiosResponse<T>>;
  controller: AbortController;
}

export interface ApiError {
  message: string;
  statusCode: number | null;
  code?: string;
  fieldErrors?: FieldIssue[];
}
