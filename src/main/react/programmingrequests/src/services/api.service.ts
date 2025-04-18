import { IP, NewRequest, Request, UseApiCall, UseApiStatusResponse, Vote } from '@/models';
import { loadAbort } from '@/utils';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getIdeasList = (): UseApiCall<Request[]> => {
  const controller = loadAbort();

  return {
    call: axios.get<Request[]>(BASE_URL, { signal: controller.signal }),
    controller,
  };
};

export const newIdea = (newRequest: NewRequest): UseApiCall<UseApiStatusResponse> => {
  const controller = loadAbort();

  return {
    call: axios.post<UseApiStatusResponse>(BASE_URL, newRequest, { signal: controller.signal }),
    controller,
  };
};

export const voteIdea = (vote: Vote): UseApiCall<UseApiStatusResponse> => {
  const controller = loadAbort();

  return {
    call: axios.post<UseApiStatusResponse>(`${BASE_URL}/vote`, vote, { signal: controller.signal }),
    controller,
  };
};

export const getPublicIp = (): UseApiCall<IP> => {
  const controller = loadAbort();

  return {
    call: axios.get<IP>('https://api.ipify.org/?format=json', { signal: controller.signal }),
    controller,
  };
};
