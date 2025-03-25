import { useEffect, useState } from 'react';

import { UseApiCall } from '@/models';

type UseApiOptions<P> = {
  autoFetch?: boolean;
  params: P;
};

type Data<T> = T | null;
type CustomError = Error | null;

interface UseApiResult<T, P> {
  loading: boolean;
  data: Data<T>;
  error: CustomError;
  fetch: (param: P) => Promise<void>;
}

export const useApi = <T, P>(apiCall: (param: P) => UseApiCall<T>, options?: UseApiOptions<P>): UseApiResult<T, P> => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Data<T>>(null);
  const [error, setError] = useState<CustomError>(null);

  const fetch = async (param: P): Promise<void> => {
    const { call } = apiCall(param);
    setLoading(true);

    try {
      const response = await call;
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options?.autoFetch) {
      fetch(options.params);
    }
  }, [options?.autoFetch, options?.params]);

  return { loading, data, error, fetch };
};
