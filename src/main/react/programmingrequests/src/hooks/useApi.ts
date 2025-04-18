import { useEffect, useState, useCallback } from 'react';
import { UseApiCall } from '@/models';
import axios from 'axios';

type UseApiOptions<P> = {
  autoFetch?: boolean;
  params?: P;
  retry?: number;
  retryDelayMs?: number;
  debug?: boolean;
};

type Data<T> = T | null;
type CustomError = {
  message: string;
  statusCode: number | null;
} | null;

interface UseApiResult<T, P> {
  loading: boolean;
  data: Data<T>;
  error: CustomError;
  fetch: (param: P) => Promise<{ data: T | null; error: CustomError }>;
}

export const useApi = <T, P>(apiCall: (param: P) => UseApiCall<T>, options?: UseApiOptions<P>): UseApiResult<T, P> => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Data<T>>(null);
  const [error, setError] = useState<CustomError>(null);

  const fetch = useCallback(
    async (param: P): Promise<{ data: T | null; error: CustomError }> => {
      const retries = options?.retry ?? 0;
      const retryDelayMs = options?.retryDelayMs ?? 1000;
      const debug = options?.debug ?? false;
      let attempts = 0;

      const attemptFetch = async (): Promise<{ data: T | null; error: CustomError }> => {
        const { call } = apiCall(param);
        setLoading(true);
        if (debug) {
          console.log('Requesting with parameters:', param);
        }
        try {
          const response = await call;
          setData(response.data);
          setError(null);
          if (debug) {
            console.log('Response received:', response.data);
          }
          return { data: response.data, error: null };
        } catch (err) {
          let apiError: CustomError = {
            message: 'An unknown error occurred',
            statusCode: null,
          };
          if (axios.isAxiosError(err) && err.response) {
            apiError = {
              message: err.response.statusText,
              statusCode: err.response.status,
            };
          } else if (err instanceof Error) {
            apiError.message = err.message;
          }
          setError(apiError);
          if (attempts < retries) {
            attempts++;
            if (debug) {
              console.log(`Retrying... Attempt #${attempts}`);
            }
            await new Promise(res => setTimeout(res, retryDelayMs));
            return attemptFetch();
          }
          return { data: null, error: apiError };
        } finally {
          setLoading(false);
        }
      };

      return attemptFetch();
    },
    [apiCall, options?.retry, options?.retryDelayMs, options?.debug],
  );

  useEffect(() => {
    if (options?.autoFetch) {
      fetch(options?.params as P);
    }
  }, [fetch, options?.autoFetch, options?.params]);

  return { loading, data, error, fetch };
};
