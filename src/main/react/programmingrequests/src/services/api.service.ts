import { Request, NewRequest, UseApiCall } from '@/models';
import { loadAbort } from '@/utils';
import axios from 'axios';

const BASE_URL = 'http://localhost:8080/requests';

export const getIdeasList = (): UseApiCall<Request[]> => {
  const controller = loadAbort();

  return {
    call: axios.get<Request[]>(BASE_URL, { signal: controller.signal }),
    controller,
  };
};

export const newIdea = (newRequest: NewRequest): UseApiCall<null> => {
  const controller = loadAbort();

  return {
    call: axios.post<null>(`${BASE_URL}`, newRequest, { signal: controller.signal }),
    controller,
  };
};
