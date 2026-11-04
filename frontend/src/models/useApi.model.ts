import { AxiosResponse } from 'axios';

export interface UseApiCall<T> {
  call: Promise<AxiosResponse<T>>;
  controller: AbortController;
}

export interface UseApiStatusResponse {
  status: 'OK' | 'ERROR';
  title?: string;
  message?: string;
}
